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
from database import (
    init_db,
    formatar_data,
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
    DATABASE_FILE,
)
import sqlite3
from pydantic import BaseModel, ValidationError
import re
from math import ceil
from auditoria import realizar_auditoria
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

print("Iniciando o servidor...")
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
    if not init_db():
        raise Exception("Falha ao inicializar o banco de dados!")
    print("Banco de dados inicializado com sucesso!")


def formatar_data(data):
    """Formata uma data para o padrão DD/MM/YYYY"""
    try:
        if isinstance(data, str):
            # Se já estiver no formato DD/MM/YYYY, retorna como está
            if re.match(r"^\d{2}/\d{2}/\d{4}$", data):
                return data

        # Converter para timestamp se não for
        if not isinstance(data, pd.Timestamp):
            data = pd.to_datetime(data)

        # Formatar para DD/MM/YYYY
        return data.strftime("%d/%m/%Y")
    except Exception as e:
        print(f"Erro ao formatar data: {str(e)}")
        return str(data)


class Registro(BaseModel):
    data_execucao: str
    numero_carteira: str
    paciente_nome: str
    numero_guia_principal: str
    possui_assinatura: bool


class DadosGuia(BaseModel):
    codigo_ficha: str
    registros: list[Registro]


class AtendimentoUpdate(BaseModel):
    data_execucao: str
    numero_carteira: str
    paciente_nome: str
    numero_guia_principal: str
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

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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
                                    "data_execucao": string,         // Campo 2 no formato DD/MM/YYYY
                                    "numero_carteira": string,          // Campo 3
                                    "paciente_nome": string,        // Campo 4
                                    "numero_guia_principal": string,    // Campo 5
                                    "possui_assinatura": boolean        // Campo 6
                                }
                            ]
                        }

                        Regras de extração:
                        1. Extraia as informações somente dentro dos retangulos vermelhos. 
                        2. Inclua uma linha nos registros se a linha tiver o campo 2 (DATA) OU o campo 6 (ASSINATURA) preenchido.
                        3. No campo 6 (assinatura), não considere como assinado quando a assinatura se parece com um pequeno "x", pois essa marca é para indicar onde é que o paciente deve assinar e não para indicar que ele ja assinou.
                        4. IMPORTANTE: Todas as datas DEVEM estar no formato DD/MM/YYYY (com 4 dígitos no ano). Se encontrar uma data no formato DD/MM/YY, converta para DD/MM/YYYY.
                        5. Retorne APENAS o JSON, sem texto adicional
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
                novo_nome = f"{registro['numero_guia_principal']}-{data_atual}-{registro['paciente_nome']}.pdf"
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


@app.post("/upload-excel/")
async def upload_excel(file: UploadFile = File(...)):
    """Processa o upload de arquivo Excel"""
    if not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .xls ou .xlsx")

    try:
        print(f"Iniciando processamento do arquivo: {file.filename}")

        # Criar diretório temporário para salvar o arquivo
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=Path(file.filename).suffix
        ) as temp_file:
            # Copiar conteúdo do arquivo para arquivo temporário
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
            print(f"Arquivo temporário criado: {temp_path}")

        # Ler a planilha Excel
        try:
            print("Tentando ler a planilha Excel...")
            df = pd.read_excel(temp_path, sheet_name="Protocolo")
            print(
                f"Planilha lida com sucesso. Colunas encontradas: {', '.join(df.columns)}"
            )
        except ValueError as e:
            if "Protocolo" in str(e):
                raise HTTPException(
                    status_code=400, detail="Aba 'Protocolo' não encontrada na planilha"
                )
            raise HTTPException(
                status_code=400, detail=f"Erro ao ler planilha: {str(e)}"
            )

        # Mapear possíveis variações dos nomes das colunas
        mapeamento_colunas = {
            "idGuia": ["idguia", "id_guia", "id guia", "guia", "numero guia"],
            "nomePaciente": [
                "nomepaciente",
                "nome_paciente",
                "nome paciente",
                "paciente",
                "nome",
            ],
            "DataExec": [
                "dataexec",
                "data_exec",
                "data exec",
                "data",
                "dt_exec",
                "dtexec",
            ],
            "Carteirinha": [
                "carteirinha",
                "numero_carteirinha",
                "num_carteirinha",
                "carteira",
            ],
            "Id_Paciente": [
                "id_paciente",
                "idpaciente",
                "id paciente",
                "codigo_paciente",
            ],
        }

        print("Normalizando nomes das colunas...")
        # Normalizar nomes das colunas (remover espaços, converter para minúsculo)
        df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
        print(f"Colunas normalizadas: {', '.join(df.columns)}")

        # Encontrar as colunas correspondentes
        colunas_encontradas = {}
        colunas_faltantes = []

        for col_desejada, variantes in mapeamento_colunas.items():
            encontrada = False
            for variante in [col_desejada.lower()] + variantes:
                if variante in df.columns:
                    colunas_encontradas[col_desejada] = variante
                    encontrada = True
                    print(f"Coluna '{col_desejada}' encontrada como '{variante}'")
                    break
            if not encontrada:
                colunas_faltantes.append(col_desejada)
                print(f"Coluna '{col_desejada}' não encontrada")

        if colunas_faltantes:
            raise HTTPException(
                status_code=400,
                detail=f"Colunas não encontradas na planilha: {', '.join(colunas_faltantes)}",
            )

        print("Renomeando colunas...")
        # Renomear as colunas encontradas para os nomes padrão
        df = df.rename(columns={v: k for k, v in colunas_encontradas.items()})
        print(f"Colunas após renomeação: {', '.join(df.columns)}")

        try:
            print("Processando dados...")
            # Selecionar apenas as colunas desejadas
            df = df[list(mapeamento_colunas.keys())]
            print(f"Número de linhas antes da limpeza: {len(df)}")

            # Remover linhas com valores nulos
            df = df.dropna(subset=list(mapeamento_colunas.keys()))
            print(f"Número de linhas após limpeza: {len(df)}")

            if df.empty:
                raise HTTPException(
                    status_code=400, detail="Nenhum dado válido encontrado na planilha"
                )

            # Formatar as datas no DataFrame
            df["DataExec"] = df["DataExec"].apply(formatar_data)

            # Verificar se há alguma data inválida
            datas_invalidas = df[~df["DataExec"].str.match(r"^\d{2}/\d{2}/\d{4}$")]
            if not datas_invalidas.empty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Encontradas {len(datas_invalidas)} datas em formato inválido. Todas as datas devem estar no formato DD/MM/YYYY",
                )

            # Converter DataFrame para lista de dicionários
            registros = df.to_dict("records")
            print(f"Convertido para {len(registros)} registros")

            # Salvar no banco de dados
            if salvar_dados_excel(registros):
                return {
                    "message": f"Arquivo processado com sucesso. {len(registros)} registros importados."
                }
            else:
                raise HTTPException(
                    status_code=500, detail="Erro ao salvar dados no banco de dados"
                )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Erro ao processar dados: {str(e)}"
            )

        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/atendimentos/")
async def list_files(
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    paciente_nome: str = Query(None, description="Filtro por nome do beneficiário"),
):
    try:
        print(f"\n=== Requisição list-files ===")
        print(f"Página: {page}")
        print(f"Por página: {per_page}")
        print(f"Nome beneficiário: '{paciente_nome}'")

        offset = (page - 1) * per_page
        result = listar_guias(
            limit=per_page, offset=offset, paciente_nome=paciente_nome
        )

        response_data = {
            "success": True,
            "data": {
                "atendimentos": result["atendimentos"],
                "pagination": {
                    "total": result["total"],
                    "page": page,
                    "per_page": per_page,
                    "total_pages": ceil(result["total"] / per_page),
                },
            },
        }
        return response_data
    except Exception as e:
        print(f"Erro na API: {str(e)}")
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
        from database import limpar_protocolos_excel

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
        return resultado
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
                atendimento.numero_carteira,
                atendimento.paciente_nome,
                atendimento.numero_guia_principal,
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
                    paciente_carteirinha= ?,
                    paciente_nome= ?,
                    guia_id= ?,
                    possui_assinatura = ?,
                    codigo_ficha = ?
                WHERE codigo_ficha = ?
            """,
                (
                    atendimento.data_execucao,
                    atendimento.numero_carteira,
                    atendimento.paciente_nome,
                    atendimento.numero_guia_principal,
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


# @app.get("/atendimentos/")
# async def list_atendimentos(
#     page: int = Query(1, ge=1, description="Página atual"),
#     per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
#     paciente_nome: str = Query(None, description="Filtro por nome do beneficiário"),
# ):
#     """Endpoint para listar atendimentos - redireciona para list-files"""
#     return await list_files(
#         page=page, per_page=per_page, paciente_nome=paciente_nome
#     )


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
