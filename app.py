from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import os
import pandas as pd
import tempfile
import traceback
import shutil
from datetime import datetime
from typing import List, Optional, Dict
from database_supabase import (
    salvar_dados_excel,
    listar_dados_excel,
    limpar_protocolos_excel,
    salvar_guia,
    listar_guias,
    buscar_guia,
    limpar_banco,
    registrar_divergencia,
    listar_divergencias,
    atualizar_status_divergencia,
    atualizar_atendimento,
    salvar_ficha_presenca,
    buscar_ficha_presenca,
    excluir_ficha_presenca,
    listar_fichas_presenca,
)
from storage_r2 import storage  # Nova importação do R2
import json
from datetime import timedelta
import asyncio
import base64
import anthropic
from pathlib import Path
import re
from math import ceil
from auditoria import realizar_auditoria
import logging
import uvicorn
import sqlite3

api_key = os.environ["ANTHROPIC_API_KEY"]

logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Processor API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas as origens em desenvolvimento
    allow_credentials=True,  # Permitir cookies
    allow_methods=["*"],  # Permitir todos os métodos
    allow_headers=["*"],  # Permitir todos os headers
    expose_headers=["*"],  # Expor todos os headers
)

# Criar diretório para arquivos temporários se não existir
TEMP_DIR = "temp"
GUIAS_RENOMEADAS_DIR = "guias_renomeadas"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)
if not os.path.exists(GUIAS_RENOMEADAS_DIR):
    os.makedirs(GUIAS_RENOMEADAS_DIR)


@app.on_event("startup")
async def startup_event():
    """Inicializa o banco de dados na inicialização"""
    logger.info("Iniciando aplicação...")

    # Cria o banco SQLite se não existir
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS atendimentos (
        codigo_ficha TEXT PRIMARY KEY,
        guia_id TEXT,
        paciente_nome TEXT,
        data_execucao TEXT,
        paciente_carteirinha TEXT,
        possui_assinatura INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    )

    conn.commit()
    conn.close()

    logger.info("Banco de dados inicializado com sucesso")


def formatar_data(data):
    """
    Formata uma data para o padrão DD/MM/YYYY, tentando interpretar vários formatos possíveis.
    Como a data é extraída por IA, tentamos ser flexíveis na interpretação.
    """
    try:
        if isinstance(data, str):
            # Remove espaços extras
            data = data.strip()

            # Lista de possíveis formatos, do mais específico para o mais genérico
            formatos = [
                "%d/%m/%Y",  # 31/12/2024
                "%Y-%m-%d",  # 2024-12-31
                "%d-%m-%Y",  # 31-12-2024
                "%Y/%m/%d",  # 2024/12/31
                "%d.%m.%Y",  # 31.12.2024
                "%Y.%m.%d",  # 2024.12.31
                "%d %m %Y",  # 31 12 2024
                "%Y %m %d",  # 2024 12 31
            ]

            # Se a data tem 8 dígitos seguidos, pode ser DDMMYYYY ou YYYYMMDD
            if data.isdigit() and len(data) == 8:
                # Tenta interpretar como DDMMYYYY
                try:
                    data_obj = datetime.strptime(data, "%d%m%Y")
                    if data_obj.year >= 2000 and data_obj.year <= 2100:
                        return data_obj.strftime("%d/%m/%Y")
                except ValueError:
                    pass

                # Tenta interpretar como YYYYMMDD
                try:
                    data_obj = datetime.strptime(data, "%Y%m%d")
                    if data_obj.year >= 2000 and data_obj.year <= 2100:
                        return data_obj.strftime("%d/%m/%Y")
                except ValueError:
                    pass

            # Tenta todos os formatos conhecidos
            for formato in formatos:
                try:
                    data_obj = datetime.strptime(data, formato)
                    # Verifica se o ano está em um intervalo razoável
                    if data_obj.year >= 2000 and data_obj.year <= 2100:
                        return data_obj.strftime("%d/%m/%Y")
                except ValueError:
                    continue

            # Se chegou aqui, tenta trocar dia/mês se a data parece inválida
            partes = re.split(r"[/\-\. ]", data)
            if len(partes) == 3:
                # Se parece ser DD/MM/YYYY mas é inválida, tenta MM/DD/YYYY
                try:
                    data_obj = datetime.strptime(
                        f"{partes[1]}/{partes[0]}/{partes[2]}", "%d/%m/%Y"
                    )
                    if data_obj.year >= 2000 and data_obj.year <= 2100:
                        return data_obj.strftime("%d/%m/%Y")
                except ValueError:
                    pass

            raise ValueError(f"Não foi possível interpretar a data: {data}")

        elif isinstance(data, datetime):
            return data.strftime("%d/%m/%Y")
        else:
            raise ValueError(f"Tipo de data inválido: {type(data)}")

    except Exception as e:
        logger.error(f"Erro ao formatar data: {e}")
        raise ValueError(str(e))


class Registro(BaseModel):
    data_execucao: str
    paciente_carteirinha: str
    paciente_nome: str
    guia_id: str
    possui_assinatura: bool


class DadosGuia(BaseModel):
    codigo_ficha: str
    registros: list[Registro]


class AtendimentoUpdate(BaseModel):
    data_execucao: str
    paciente_carteirinha: str
    paciente_nome: str
    guia_id: str
    possui_assinatura: bool
    codigo_ficha: str


class FichaPresenca(BaseModel):
    data_atendimento: str
    paciente_carteirinha: str
    paciente_nome: str
    numero_guia: str
    codigo_ficha: str
    possui_assinatura: bool = False
    arquivo_digitalizado: Optional[str] = None


class FichaPresencaUpdate(FichaPresenca):
    pass


async def extract_info_from_pdf(pdf_path: str):
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    pdf_data = None
    try:
        with open(pdf_path, "rb") as pdf_file:
            pdf_data = base64.b64encode(pdf_file.read()).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler PDF: {str(e)}")

    if not pdf_data:
        raise HTTPException(status_code=500, detail="Erro ao ler PDF: arquivo vazio")

    client = anthropic.Anthropic(api_key=api_key)

    try:
        response = client.beta.messages.create(
            model="claude-3-5-sonnet-20241022",
            betas=["pdfs-2024-09-25"],
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": """
                        Analise este documento PDF e extraia as seguintes informações em JSON válido:

                        {
                            "codigo_ficha": string,  // Campo 1 - FICHA no canto superior direito, formato XX-XXXXXXXX...
                            "registros": [
                                {
                                    "data_execucao": string,         // Data de Atendimento no formato DD/MM/YYYY
                                    "paciente_carteirinha": string,          // Número da Carteira
                                    "paciente_nome": string,        // Nome do Beneficiário
                                    "guia_id": string,    // Número da Guia Principal
                                    "possui_assinatura": boolean        // Indica se o atendimento possui assinatura (marcado com x)
                                }
                            ]
                        }

                        Regras de extração:
                        1. Inclua uma linha nos registros se a linha tiver o campo Data de Atendimento OU o campo Assinatura tiver o quadrado preenchido por um "x"
                        2. IMPORTANTE: Todas as datas DEVEM estar no formato DD/MM/YYYY (com 4 dígitos no ano). Se encontrar uma data no formato DD/MM/YY, converta para DD/MM/YYYY. 
                        3. Todas as datas no campo Data de Atendimento devem ser válidas (30/02/2024 seria uma data inválida) e iguais para todas as linhas.   
                        4. Retorne APENAS o JSON, sem texto adicional
                    """,
                        },
                    ],
                }
            ],
        )

        # Parse a resposta JSON
        dados_extraidos = json.loads(response.content[0].text)

        # Garantir que todas as datas estejam no formato correto
        for registro in dados_extraidos["registros"]:
            registro["data_execucao"] = formatar_data(registro["data_execucao"])

        # Validar usando Pydantic
        dados_validados = DadosGuia(**dados_extraidos)

        # Criar DataFrame dos registros
        df = pd.DataFrame([registro.dict() for registro in dados_validados.registros])

        return {
            "json": dados_validados.dict(),
            "dataframe": df,
            "status_validacao": "sucesso",
        }

    except json.JSONDecodeError as e:
        return {
            "erro": f"Erro ao processar JSON: {str(e)}",
            "status_validacao": "falha",
            "resposta_raw": (
                response.content[0].text if "response" in locals() else None
            ),
        }
    except ValidationError as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": (
                response.content[0].text if "response" in locals() else None
            ),
        }
    except Exception as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": (
                response.content[0].text if "response" in locals() else None
            ),
        }


@app.post("/upload-pdf")
async def upload_pdf(
    files: list[UploadFile] = File(description="Múltiplos arquivos PDF"),
):
    """
    Recebe um ou mais arquivos PDF, extrai informações e salva no banco de dados.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")

    results = []
    processed_files = set()  # Para evitar processar o mesmo arquivo mais de uma vez

    for file in files:
        if not file.filename.endswith(".pdf"):
            results.append(
                {
                    "status": "error",
                    "filename": file.filename,
                    "message": "Apenas arquivos PDF são permitidos",
                }
            )
            continue

        # Evita processar o mesmo arquivo mais de uma vez
        if file.filename in processed_files:
            continue
        processed_files.add(file.filename)

        try:
            # Salvar o arquivo temporariamente
            temp_pdf_path = os.path.join(TEMP_DIR, file.filename)
            try:
                with open(temp_pdf_path, "wb") as temp_file:
                    content = await file.read()
                    temp_file.write(content)

                print(f"Iniciando upload do arquivo {file.filename}")
                print(f"Arquivo lido com sucesso. Tamanho: {len(content)} bytes")

                # Extrair informações do PDF
                info = await extract_info_from_pdf(temp_pdf_path)

                if info.get("status_validacao") == "falha":
                    raise Exception(
                        info.get("erro", "Erro desconhecido ao processar PDF")
                    )

                # Gera o novo nome do arquivo com o padrão: Guia-Data-Paciente
                data_formatada = info["json"]["registros"][0]["data_execucao"].replace(
                    "/", "-"
                )
                paciente_nome = info["json"]["registros"][0]["paciente_nome"]
                novo_nome = f"{info['json']['codigo_ficha']}-{data_formatada}-{paciente_nome}.pdf"

                # Faz upload do arquivo para o Storage
                arquivo_url = storage.upload_file(temp_pdf_path, novo_nome)

                # Prepara o resultado
                result = {
                    "status": "success",
                    "filename": file.filename,
                    "saved_ids": [],
                    "uploaded_files": [],
                }

                if arquivo_url:
                    result["uploaded_files"].append(
                        {"nome": novo_nome, "url": arquivo_url}
                    )

                # Processa os registros do PDF
                dados_guia = info["json"]
                if dados_guia["registros"]:
                    saved_ids = []
                    for registro in dados_guia["registros"]:
                        registro["codigo_ficha"] = dados_guia["codigo_ficha"]
                        if arquivo_url:
                            registro["arquivo_url"] = arquivo_url

                        # Salvar registro no banco
                        ficha_id = salvar_ficha_presenca(
                            {
                                "data_atendimento": registro["data_execucao"],
                                "paciente_carteirinha": registro[
                                    "paciente_carteirinha"
                                ],
                                "paciente_nome": registro["paciente_nome"],
                                "numero_guia": registro["guia_id"],
                                "codigo_ficha": dados_guia["codigo_ficha"],
                                "possui_assinatura": registro["possui_assinatura"],
                                "arquivo_digitalizado": arquivo_url,
                            }
                        )
                        if ficha_id:
                            saved_ids.append(ficha_id)

                    if saved_ids:
                        result["saved_ids"] = saved_ids
                    else:
                        result["status"] = "error"
                        result["message"] = (
                            "Erro ao salvar atendimentos no banco de dados"
                        )

                results.append(result)

            finally:
                # Limpa o arquivo temporário
                if os.path.exists(temp_pdf_path):
                    os.remove(temp_pdf_path)

        except Exception as e:
            print(f"Erro ao processar {file.filename}: {str(e)}")
            results.append(
                {"status": "error", "filename": file.filename, "message": str(e)}
            )

    return results


@app.post("/upload/excel/")
async def upload_excel(file: UploadFile = File(...)):
    """Processa o upload de arquivo Excel"""
    try:
        if not file.filename.endswith((".xlsx", ".xls")):
            raise HTTPException(
                status_code=400, detail="Arquivo deve ser um Excel (.xlsx ou .xls)"
            )

        # Salva o arquivo temporariamente
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=Path(file.filename).suffix
        ) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        try:
            # Lê o arquivo Excel
            df = pd.read_excel(tmp_path)

            # Verifica se as colunas necessárias existem
            colunas_necessarias = [
                "idGuia",
                "nomePaciente",
                "DataExec",
                "Carteirinha",
            ]
            colunas_faltantes = [
                col for col in colunas_necessarias if col not in df.columns
            ]
            if colunas_faltantes:
                raise HTTPException(
                    status_code=400,
                    detail=f"Colunas faltantes no arquivo: {', '.join(colunas_faltantes)}",
                )

            # Prepara os dados para salvar
            registros = []
            for _, row in df.iterrows():
                try:
                    # Formata a data
                    data_execucao = formatar_data(row["DataExec"])

                    # Mapeamento dos campos do Excel para os campos padronizados do banco
                    registro = {
                        "guia_id": str(row["idGuia"]).strip(),
                        "paciente_nome": str(row["nomePaciente"]).strip().upper(),
                        "data_execucao": data_execucao,
                        "paciente_carteirinha": str(row["Carteirinha"]).strip(),
                    }
                    registros.append(registro)
                except Exception as e:
                    logger.error(f"Erro ao processar linha do Excel: {e}")
                    continue

            # Salva os dados no banco
            if not registros:
                raise HTTPException(
                    status_code=400, detail="Nenhum registro válido encontrado no Excel"
                )

            if salvar_dados_excel(registros):
                return {
                    "success": True,
                    "message": f"Arquivo processado com sucesso. {len(registros)} registros importados.",
                }
            else:
                raise HTTPException(
                    status_code=500, detail="Erro ao salvar dados no banco"
                )

        finally:
            # Remove o arquivo temporário
            tmp_path.unlink()

    except Exception as e:
        logger.error(f"Erro ao processar arquivo Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/atendimentos/")
async def list_atendimentos(
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    paciente_nome: str = Query(None, description="Filtrar por nome do paciente"),
):
    """Lista todos os atendimentos com suporte a paginação e filtro"""
    try:
        logger.info(
            f"Buscando atendimentos com: page={page}, per_page={per_page}, paciente_nome={paciente_nome}"
        )
        offset = (page - 1) * per_page
        resultado = listar_guias(
            limit=per_page, offset=offset, paciente_nome=paciente_nome
        )

        return {
            "success": True,
            "data": {
                "atendimentos": resultado["atendimentos"],
                "pagination": {
                    "total": resultado["total"],
                    "total_pages": ceil(resultado["total"] / per_page),
                    "current_page": page,
                    "per_page": per_page,
                },
            },
        }
    except Exception as e:
        logger.error(f"Erro ao listar atendimentos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/guia/{numero_guia}")
async def get_guia(numero_guia: str):
    """Busca atendimentos específicos pelo número da guia"""
    atendimentos = buscar_guia(numero_guia)
    if not atendimentos:
        raise HTTPException(status_code=404, detail="Guia não encontrada")
    return atendimentos


@app.get("/excel/")
async def list_excel(
    page: int = Query(1, description="Página atual"),
    per_page: int = Query(10, description="Itens por página"),
    paciente_nome: str = Query(None, description="Filtrar por nome do beneficiário"),
):
    """Lista os dados importados do Excel com suporte a paginação e filtro"""
    try:
        offset = (page - 1) * per_page

        print(
            f"Buscando dados com: page={page}, per_page={per_page}, paciente_nome={paciente_nome}"
        )
        resultado = listar_dados_excel(
            limit=per_page, offset=offset, paciente_nome=paciente_nome
        )

        return {
            "success": True,
            "data": {
                "registros": resultado["registros"],
                "pagination": {
                    "total": resultado["total"],
                    "total_pages": resultado["total_pages"],
                    "current_page": page,
                    "per_page": per_page,
                },
            },
        }
    except Exception as e:
        print(f"Erro ao listar dados do Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear-database/")
async def clear_database():
    """Limpa o banco de dados"""
    limpar_banco()
    return {"message": "Banco de dados limpo com sucesso"}


@app.post("/sync-database/")
async def sync_database():
    """Sincroniza o banco de dados limpando todos os registros"""
    limpar_banco()
    return {"message": "Banco de dados sincronizado com sucesso"}


@app.post("/clear-excel-data")
async def clear_excel_data():
    """Limpa todos os dados da tabela de protocolos do Excel"""
    try:
        from database_supabase import limpar_protocolos_excel

        success = limpar_protocolos_excel()
        if success:
            return {"success": True, "message": "Dados do Excel limpos com sucesso"}
        else:
            raise HTTPException(status_code=500, detail="Erro ao limpar dados do Excel")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/auditoria/divergencias/")
async def get_divergencias(
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    status: str = Query(None, description="Filtrar por status (Pendente/Resolvido)"),
):
    """Lista as divergências encontradas na auditoria"""
    try:
        print(
            f"Buscando divergências - página: {page}, por página: {per_page}, status: {status}"
        )
        resultado = listar_divergencias(
            limit=per_page, offset=(page - 1) * per_page, status=status
        )
        print(f"Resultado obtido: {resultado}")
        if resultado is None:
            raise HTTPException(status_code=500, detail="Erro ao buscar divergências")
        return {
            "success": True,
            "divergencias": resultado["divergencias"],
            "total": resultado["total"],
            "paginas": resultado["paginas"],
        }
    except Exception as e:
        print(f"Erro ao buscar divergências: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auditoria/iniciar")
async def iniciar_auditoria(
    data_inicial: str = Query(None, description="Data inicial (DD/MM/YYYY)"),
    data_final: str = Query(None, description="Data final (DD/MM/YYYY)"),
):
    """Inicia o processo de auditoria"""
    try:
        resultado = realizar_auditoria(data_inicial, data_final)
        return {
            "status": "success",
            "message": "Auditoria realizada com sucesso",
            "data": resultado,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/auditoria/divergencia/{divergencia_id}")
async def atualizar_divergencia(
    divergencia_id: int, status: str = Body(..., embed=True)
):
    try:
        logger.info(f"Atualizando divergência {divergencia_id} para status: {status}")

        if not atualizar_status_divergencia(divergencia_id, status):
            raise HTTPException(status_code=404, detail="Divergência não encontrada")

        return {"message": "Status atualizado com sucesso"}
    except Exception as e:
        logger.error(f"Erro ao atualizar divergência: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/atendimento/{codigo_ficha}")
async def atualizar_atendimento_endpoint(
    codigo_ficha: str, atendimento: AtendimentoUpdate
):
    try:
        # Validate the data format
        if not all(
            [
                atendimento.data_execucao,
                atendimento.paciente_carteirinha,
                atendimento.paciente_nome,
                atendimento.guia_id,
                atendimento.codigo_ficha,
            ]
        ):
            raise HTTPException(
                status_code=400, detail="Todos os campos são obrigatórios"
            )

        # Validate date format
        try:
            # Expecting date in YYYY-MM-DD format
            datetime.strptime(atendimento.data_execucao, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Data em formato inválido. Use YYYY-MM-DD"
            )

        # Convert the model to a dictionary
        dados = {
            "data_execucao": atendimento.data_execucao,
            "paciente_carteirinha": atendimento.paciente_carteirinha,
            "paciente_nome": atendimento.paciente_nome,
            "guia_id": atendimento.guia_id,
            "possui_assinatura": atendimento.possui_assinatura,
            "codigo_ficha": atendimento.codigo_ficha,
        }

        # Update in Supabase
        try:
            from database_supabase import atualizar_atendimento

            success = atualizar_atendimento(codigo_ficha, dados)
            if not success:
                raise HTTPException(
                    status_code=404, detail="Atendimento não encontrado"
                )
            return {"message": "Atendimento atualizado com sucesso"}
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao atualizar atendimento no banco de dados: {str(e)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro interno ao atualizar atendimento: {str(e)}"
        )


@app.delete("/atendimento/{codigo_ficha}")
async def excluir_atendimento(codigo_ficha: str):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Exclui o atendimento
        cursor.execute(
            """
            DELETE FROM atendimentos 
            WHERE codigo_ficha = ?
        """,
            (codigo_ficha,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Atendimento não encontrado")

        conn.commit()
        return {"message": "Atendimento excluído com sucesso"}

    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao excluir atendimento: {str(e)}"
        )
    finally:
        conn.close()


@app.delete("/delete-files/")
async def delete_files(files: list[str]):
    """
    Deleta arquivos do Storage do Supabase
    """
    try:
        success = storage.delete_files(files)
        if success:
            return {"message": "Arquivos deletados com sucesso"}
        else:
            raise HTTPException(status_code=500, detail="Erro ao deletar arquivos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/storage-files/")
async def list_storage_files_endpoint():
    """
    Lista todos os arquivos no storage.
    """
    try:
        files = storage.list_files()
        return files
    except Exception as e:
        logger.error(f"Erro ao listar arquivos do storage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/storage-files/")
async def delete_all_storage_files():
    """
    Deleta todos os arquivos do storage.
    """
    try:
        # Primeiro lista todos os arquivos
        files = storage.list_files()
        if not files:
            return {"message": "Nenhum arquivo para deletar"}

        # Pega os nomes dos arquivos
        file_names = [f["nome"] for f in files]

        # Deleta todos os arquivos
        success = storage.delete_files(file_names)
        if not success:
            raise HTTPException(
                status_code=500, detail="Erro ao deletar alguns arquivos"
            )

        return {"message": f"{len(file_names)} arquivos deletados com sucesso"}

    except Exception as e:
        logger.error(f"Erro ao deletar todos os arquivos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/storage-files/{file_name}")
async def delete_storage_file(file_name: str):
    """
    Deleta um arquivo específico do storage
    """
    try:
        success = storage.delete_files([file_name])
        if not success:
            raise HTTPException(
                status_code=500, detail=f"Erro ao deletar arquivo {file_name}"
            )
        return {"message": f"Arquivo {file_name} deletado com sucesso"}

    except Exception as e:
        logger.error(f"Erro ao deletar arquivo {file_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download-all-files")
async def download_all_files():
    """
    Endpoint para baixar todos os arquivos do storage em um único arquivo ZIP
    """
    try:
        # Gerar o arquivo ZIP
        zip_content = storage.download_all_files_as_zip()

        if not zip_content:
            raise HTTPException(status_code=500, detail="Erro ao gerar arquivo ZIP")

        # Retornar o arquivo ZIP como resposta
        from fastapi.responses import Response

        return Response(
            content=zip_content,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="fichas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip"'
            },
        )
    except Exception as e:
        logger.error(f"Erro ao baixar arquivos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fichas-presenca")
async def listar_fichas(
    limit: int = Query(10, ge=1, le=100, description="Itens por página"),
    offset: int = Query(0, ge=0, description="Número de itens para pular"),
    paciente_nome: str = Query(None, description="Filtrar por nome do paciente"),
):
    """Lista todas as fichas de presença com suporte a paginação e filtro"""
    try:
        result = listar_fichas_presenca(
            limit=limit, offset=offset, paciente_nome=paciente_nome
        )
        return result
    except Exception as e:
        logger.error(f"Erro ao listar fichas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao listar fichas de presença")


@app.post("/fichas-presenca")
async def criar_ficha(ficha: FichaPresenca):
    """Cria uma nova ficha de presença"""
    try:
        result = salvar_ficha_presenca(ficha.dict())
        if not result:
            raise HTTPException(
                status_code=400, detail="Erro ao criar ficha de presença"
            )
        return {"id": result}
    except Exception as e:
        logger.error(f"Erro ao criar ficha: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar ficha de presença")


@app.get("/fichas-presenca/{ficha_id}")
async def buscar_ficha(ficha_id: str):
    """Busca uma ficha de presença específica"""
    try:
        ficha = buscar_ficha_presenca(ficha_id, tipo_busca="id")
        if not ficha:
            raise HTTPException(status_code=404, detail="Ficha não encontrada")
        return ficha
    except Exception as e:
        logger.error(f"Erro ao buscar ficha: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar ficha de presença")


@app.put("/fichas-presenca/{ficha_id}")
async def atualizar_ficha(ficha_id: str, ficha: FichaPresencaUpdate):
    """Atualiza uma ficha de presença"""
    try:
        # Primeiro verifica se a ficha existe
        existing = buscar_ficha_presenca(ficha_id, tipo_busca="id")
        if not existing:
            raise HTTPException(status_code=404, detail="Ficha não encontrada")

        # Atualiza a ficha
        result = salvar_ficha_presenca({**ficha.dict(), "id": ficha_id})
        if not result:
            raise HTTPException(
                status_code=400, detail="Erro ao atualizar ficha de presença"
            )
        return {"id": result}
    except Exception as e:
        logger.error(f"Erro ao atualizar ficha: {e}")
        raise HTTPException(
            status_code=500, detail="Erro ao atualizar ficha de presença"
        )


@app.delete("/fichas-presenca/{ficha_id}")
async def excluir_ficha(ficha_id: str):
    """Exclui uma ficha de presença"""
    try:
        result = excluir_ficha_presenca(ficha_id)
        if not result:
            raise HTTPException(status_code=404, detail="Ficha não encontrada")
        return {"success": True}
    except Exception as e:
        logger.error(f"Erro ao excluir ficha: {e}")
        raise HTTPException(status_code=500, detail="Erro ao excluir ficha de presença")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
