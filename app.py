from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import os
import pandas as pd
import tempfile
import shutil
from pathlib import Path
import json
from datetime import datetime
import uvicorn
import asyncio
import base64
import anthropic
from database_supabase import (
    salvar_guia,
    salvar_dados_excel,
    listar_guias,
    buscar_guia,
    limpar_banco,
    limpar_protocolos_excel,
    listar_dados_excel,
    registrar_divergencia,
    contar_protocolos,
    listar_divergencias,
    atualizar_status_divergencia,
)
from pydantic import BaseModel, ValidationError
import re
from math import ceil
from auditoria import realizar_auditoria
import logging

api_key = os.environ["ANTHROPIC_API_KEY"]

logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Processor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
    try:
        logger.info("Conectando ao Supabase...")
        # Teste a conexão
        total = contar_protocolos()
        logger.info(f"Conectado ao Supabase. Total de protocolos: {total}")
    except Exception as e:
        logger.error(f"Erro ao conectar ao Supabase: {e}")
        raise e


def formatar_data(data):
    """Formata uma data para o padrão DD/MM/YYYY"""
    try:
        if isinstance(data, str):
            # Tenta diferentes formatos de entrada
            formatos = [
                "%Y-%m-%d",  # ISO format
                "%d/%m/%Y",  # Brazilian format
                "%Y/%m/%d",  # Alternative format
                "%d-%m-%Y",  # Alternative format
            ]

            for formato in formatos:
                try:
                    data_obj = datetime.strptime(data, formato)
                    return data_obj.strftime("%d/%m/%Y")
                except ValueError:
                    continue

            raise ValueError(f"Formato de data inválido: {data}")

        elif isinstance(data, datetime):
            return data.strftime("%d/%m/%Y")

        else:
            raise ValueError(f"Tipo de data inválido: {type(data)}")

    except Exception as e:
        logger.error(f"Erro ao formatar data: {e}")
        raise ValueError(f"Erro ao formatar data: {e}")


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
                        3. Retorne APENAS o JSON, sem texto adicional
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


@app.post("/upload-pdf/")
async def upload_pdf(
    files: list[UploadFile] = File(description="Múltiplos arquivos PDF"),
):
    """
    Recebe um ou mais arquivos PDF, extrai informações e salva no banco de dados.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")

    results = []
    for file in files:
        if not file.filename.endswith(".pdf"):
            results.append(
                {
                    "message": "Apenas arquivos PDF são permitidos",
                    "status": "error",
                    "filename": file.filename,
                }
            )
            continue

        # Salvar o arquivo temporariamente
        temp_pdf_path = os.path.join(TEMP_DIR, file.filename)
        try:
            with open(temp_pdf_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Extrair informações do PDF
            atendimentos = await extract_info_from_pdf(temp_pdf_path)

            if atendimentos.get("status_validacao") == "falha":
                raise Exception(
                    atendimentos.get("erro", "Erro desconhecido ao processar PDF")
                )

            # Salvar cada atendimento no banco de dados
            saved_ids = []
            dados_guia = atendimentos["json"]
            for registro in dados_guia["registros"]:
                # Adicionar codigo_ficha ao registro
                registro["codigo_ficha"] = dados_guia["codigo_ficha"]
                atendimento_id = salvar_guia(registro)
                saved_ids.append(atendimento_id)

                # Criar uma cópia do PDF original com o novo nome
                data_atual = datetime.now().strftime("%d-%m-%Y")
                novo_nome = f"{registro['guia_id']}-{data_atual}-{registro['paciente_nome']}.pdf"
                novo_nome = re.sub(
                    r'[<>:"/\\|?*]', "", novo_nome
                )  # Remove caracteres inválidos para nome de arquivo
                novo_caminho = os.path.join(GUIAS_RENOMEADAS_DIR, novo_nome)

                # Se ainda não salvamos uma cópia deste PDF, salvar agora
                if not os.path.exists(novo_caminho):
                    shutil.copy2(temp_pdf_path, novo_caminho)

            results.append(
                {
                    "message": "Arquivo processado com sucesso",
                    "atendimentos": dados_guia["registros"],
                    "status": "success",
                    "filename": file.filename,
                    "saved_ids": saved_ids,
                }
            )

        except Exception as e:
            results.append(
                {"message": str(e), "status": "error", "filename": file.filename}
            )

        finally:
            # Limpar arquivos temporários
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)

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
                "Número da Guia",
                "Nome do Beneficiário",
                "Data de Execução",
                "Carteirinha",
                "Código do Beneficiário",
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
                    data_execucao = formatar_data(row["Data de Execução"])

                    registro = {
                        "idGuia": str(row["Número da Guia"]).strip(),
                        "nomePaciente": str(row["Nome do Beneficiário"])
                        .strip()
                        .upper(),
                        "dataExec": data_execucao,
                        "carteirinha": str(row["Carteirinha"]).strip(),
                        "idPaciente": str(row["Código do Beneficiário"]).strip(),
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
                    "message": f"Arquivo processado com sucesso. {len(registros)} registros importados."
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
async def atualizar_atendimento(codigo_ficha: str, atendimento: AtendimentoUpdate):
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

        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        try:
            # First check if the record exists
            cursor.execute(
                "SELECT 1 FROM atendimentos WHERE codigo_ficha = ?", (codigo_ficha,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404, detail="Atendimento não encontrado"
                )

            # Check if the new codigo_ficha already exists (if it's being changed)
            if codigo_ficha != atendimento.codigo_ficha:
                cursor.execute(
                    "SELECT 1 FROM atendimentos WHERE codigo_ficha = ? AND codigo_ficha != ?",
                    (atendimento.codigo_ficha, codigo_ficha),
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=400, detail="O novo código da ficha já existe"
                    )

            # Update the record
            cursor.execute(
                """
                UPDATE atendimentos 
                SET data_execucao = ?,
                    paciente_carteirinha = ?,
                    paciente_nome = ?,
                    guia_id = ?,
                    possui_assinatura = ?,
                    codigo_ficha = ?
                WHERE codigo_ficha = ?
            """,
                (
                    atendimento.data_execucao,
                    atendimento.paciente_carteirinha,
                    atendimento.paciente_nome,
                    atendimento.guia_id,
                    atendimento.possui_assinatura,
                    atendimento.codigo_ficha,
                    codigo_ficha,
                ),
            )

            conn.commit()
            return {"message": "Atendimento atualizado com sucesso"}

        except sqlite3.Error as e:
            conn.rollback()
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
    finally:
        if "conn" in locals():
            conn.close()


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
