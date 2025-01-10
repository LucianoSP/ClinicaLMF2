from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import database_supabase
from auditoria import realizar_auditoria, realizar_auditoria_fichas_execucoes
from pydantic import BaseModel, ValidationError
import os
import pandas as pd
import tempfile
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
    atualizar_execucao,
    salvar_ficha_presenca,
    buscar_ficha_presenca,
    excluir_ficha_presenca,
    listar_fichas_presenca,
    limpar_fichas_presenca,
    listar_guias_paciente,
    atualizar_ficha_ids_divergencias
)
from auditoria_repository import (
    registrar_divergencia,
    listar_divergencias,
    atualizar_status_divergencia,
    obter_ultima_auditoria,  # Moved from database_supabase
    limpar_divergencias_db,
    atualizar_ficha_ids_divergencias  # Adicione esta importação
)
from config import supabase  # Importar o cliente Supabase já inicializado
from storage_r2 import storage  # Nova importação do R2
import json
from datetime import timedelta
import asyncio
import base64
import anthropic
from pathlib import Path
import re
from math import ceil
import logging
import uvicorn
import sqlite3  # Adicionando importação do sqlite3
import traceback

from google import genai
from google.genai import types

claude_api_key = os.environ["ANTHROPIC_API_KEY"]
gemini_api_key = os.environ["GEMINI_API_KEY"]



logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Processor API")

# Configuração do CORS - totalmente permissivo para desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Debug: Verificar variáveis do Supabase
from config import SUPABASE_URL, SUPABASE_KEY

print("DEBUG - SUPABASE_URL:", SUPABASE_URL)
print("DEBUG - SUPABASE_KEY:", SUPABASE_KEY[:10] + "..." if SUPABASE_KEY else None)

# Criar diretório para arquivos temporários se não existir
TEMP_DIR = "temp"
GUIAS_RENOMEADAS_DIR = "guias_renomeadas"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)
if not os.path.exists(GUIAS_RENOMEADAS_DIR):
    os.makedirs(GUIAS_RENOMEADAS_DIR)


@app.on_event("startup")
async def startup_event():
    """Inicializa recursos necessários para a aplicação"""
    try:
        logger.info("Iniciando aplicação...")

        # Cria diretórios necessários se não existirem
        os.makedirs(TEMP_DIR, exist_ok=True)
        os.makedirs(GUIAS_RENOMEADAS_DIR, exist_ok=True)

        # Verifica conexão com Supabase
        if not supabase:
            logger.error("Erro: Cliente Supabase não inicializado")
            raise Exception("Cliente Supabase não inicializado")

    except Exception as e:
        logger.error(f"Erro na inicialização: {str(e)}")
        raise e


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


class ExecucaoUpdate(BaseModel):
    data_execucao: str
    paciente_carteirinha: str
    paciente_nome: str
    guia_id: str
    possui_assinatura: bool
    codigo_ficha: str


class FichaPresenca(BaseModel):
    paciente_carteirinha: str
    paciente_nome: str
    numero_guia: str
    codigo_ficha: str
    possui_assinatura: bool = False
    arquivo_digitalizado: Optional[str] = None


class FichaPresencaUpdate(BaseModel):
    data_atendimento: str
    paciente_carteirinha: str
    paciente_nome: str
    numero_guia: str
    codigo_ficha: str
    possui_assinatura: bool = False
    arquivo_digitalizado: Optional[str] = None


class DivergenciaResponse(BaseModel):
    """Modelo para resposta de divergências com informações detalhadas"""

    id: str
    tipo_divergencia: str
    prioridade: str
    descricao: str
    status: str
    data_identificacao: str
    data_resolucao: str | None = None
    resolvido_por: str | None = None
    observacoes: str | None = None
    numero_guia: str
    data_execucao: str
    codigo_ficha: str
    paciente_nome: str
    detalhes: dict | None = None


class DivergenciasListResponse(BaseModel):
    """Modelo para resposta da listagem de divergências"""

    success: bool
    divergencias: list[DivergenciaResponse]
    total: int
    paginas: int
    resumo: dict[str, int]  # Contagem por tipo e prioridade


class AuditoriaRequest(BaseModel):
    data_inicio: str | None = None
    data_fim: str | None = None


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

    client = anthropic.Anthropic(api_key=claude_api_key)

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
                                    "data_execucao": string,         // Campo 11 - Data do atendimento no formato DD/MM/YYYY
                                    "paciente_carteirinha": string,  // Campo 12 - Número da carteira
                                    "paciente_nome": string,         // Campo 13 - Nome/Nome Social do Beneficiário
                                    "guia_id": string,              // Campo 14 - Número da Guia Principal
                                    "possui_assinatura": boolean     // Campo 15 - Indica se tem assinatura na linha
                                }
                            ]
                        }

                        Regras de extração:
                        1. Cada linha numerada (1-, 2-, 3-, etc) representa uma sessão diferente do mesmo paciente
                        2. Inclua TODAS as linhas que têm data de atendimento preenchida, mesmo que não tenham assinatura
                        3. IMPORTANTE: Todas as datas DEVEM estar no formato DD/MM/YYYY (com 4 dígitos no ano)
                        4. Todas as datas devem ser válidas (30/02/2024 seria uma data inválida)
                        5. Mantenha o número da carteirinha EXATAMENTE como está no documento, incluindo pontos e hífens
                        6. Retorne APENAS o JSON, sem texto adicional
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

# Configuração de logging detalhado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

@app.post("/test-pdf-extraction")
async def test_pdf_extraction(
    file: UploadFile = File(..., description="Arquivo PDF para teste")
):
    """
    Endpoint de teste que apenas extrai as informações do PDF usando o Gemini.
    """
    try:
        # Validação inicial do arquivo
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Arquivo deve ser PDF")

        # Ler o conteúdo do arquivo
        content = await file.read()
        logging.info(f"Arquivo lido com sucesso: {file.filename} ({len(content)} bytes)")

        # Verificar se o arquivo está vazio
        if not content:
            raise HTTPException(status_code=400, detail="Arquivo PDF vazio")

        # Converter para base64 de forma segura
        try:
            pdf_base64 = base64.b64encode(content).decode('utf-8')
            logging.info(f"Arquivo convertido para base64 ({len(pdf_base64)} caracteres)")
        except Exception as e:
            logging.error(f"Erro na conversão base64: {str(e)}")
            raise HTTPException(status_code=500, detail="Erro na conversão do arquivo")

        # Verificar API key
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GOOGLE_API_KEY não configurada")

        # Inicializar cliente Gemini com tratamento de erro
        try:
            client = genai.Client(api_key=api_key)
            logging.info("Cliente Gemini inicializado com sucesso")
        except Exception as e:
            logging.error(f"Erro ao inicializar cliente Gemini: {str(e)}")
            raise HTTPException(status_code=500, detail="Erro ao inicializar Gemini API")

        # Preparar o prompt
        prompt = """
        Analise este documento PDF e extraia as informações no seguinte formato JSON:

        {
            "codigo_ficha": "XX-XXXXXXXX",
            "registros": [
                {
                    "data_execucao": "DD/MM/YYYY",
                    "paciente_carteirinha": "XXXXX",
                    "paciente_nome": "NOME",
                    "guia_id": "XXXXX",
                    "possui_assinatura": true/false
                }
            ]
        }

        Importante:
        1. Cada linha numerada é uma sessão diferente
        2. Inclua linhas com data preenchida mesmo sem assinatura
        3. Datas devem estar no formato DD/MM/YYYY
        4. Mantenha números de carteirinha exatos
        5. Retorne apenas o JSON
        """

        try:
            # Criar a mensagem para o modelo
            message = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": "application/pdf",
                                    "data": pdf_base64
                                }
                            }
                        ]
                    }
                ]
            }

            # Configuração do modelo
            config = types.GenerateContentConfig(
                temperature=0.1,
                candidate_count=1,
                max_output_tokens=2048,
            )

            logging.info("Enviando requisição para o Gemini...")

            # Fazer a requisição ao modelo
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=message["contents"],
                config=config
            )

            logging.info("Resposta recebida do Gemini")
            logging.debug(f"Resposta raw: {response.text}")

            # Tentar extrair JSON da resposta
            try:
                # Limpar a resposta para garantir que é um JSON válido
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:-3]  # Remove ```json e ```
                elif response_text.startswith("```"):
                    response_text = response_text[3:-3]  # Remove ``` e ```

                extracted_data = json.loads(response_text)
                logging.info("JSON extraído com sucesso")

                return {
                    "status": "success",
                    "filename": file.filename,
                    "file_size": len(content),
                    "extracted_data": extracted_data,
                    "num_registros": len(extracted_data.get("registros", [])),
                    "raw_response": response_text
                }

            except json.JSONDecodeError as e:
                logging.error(f"Erro ao fazer parse do JSON: {str(e)}")
                return {
                    "status": "error",
                    "message": "Erro ao fazer parse do JSON",
                    "error_details": str(e),
                    "raw_response": response.text
                }

        except Exception as e:
            logging.error(f"Erro na comunicação com Gemini: {str(e)}")
            logging.error(traceback.format_exc())
            return {
                "status": "error",
                "message": "Erro na comunicação com Gemini",
                "error_details": str(e)
            }

    except Exception as e:
        logging.error(f"Erro ao processar PDF: {str(e)}")
        logging.error(traceback.format_exc())
        return {
            "status": "error",
            "message": "Erro ao processar PDF",
            "error_details": str(e)
        }

async def extract_info_from_pdf_gemini(pdf_path: str):
    """
    Extrai informações de um arquivo PDF usando o Google Gemini.

    Args:
        pdf_path: Caminho do arquivo PDF

    Returns:
        Dict contendo as informações extraídas em formato JSON

    Raises:
        HTTPException: Se houver erro ao ler o arquivo ou processar o PDF
    """
    # Verifica se a chave da API está configurada
    api_key = gemini_api_key
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY não configurada nas variáveis de ambiente")

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

    try:
        # Inicializa o cliente do Gemini
        client = genai.Client(api_key=api_key)

        # Prepara o prompt com as instruções específicas
        prompt = """
        Analise este documento PDF e extraia as seguintes informações em JSON válido:

        {
            "codigo_ficha": string,  // Campo 1 - FICHA no canto superior direito, formato XX-XXXXXXXX...
            "registros": [
                {
                    "data_execucao": string,         // Campo 11 - Data do atendimento no formato DD/MM/YYYY
                    "paciente_carteirinha": string,  // Campo 12 - Número da carteira
                    "paciente_nome": string,         // Campo 13 - Nome/Nome Social do Beneficiário
                    "guia_id": string,              // Campo 14 - Número da Guia Principal
                    "possui_assinatura": boolean     // Campo 15 - Indica se tem assinatura na linha
                }
            ]
        }

        Regras de extração:
        1. Cada linha numerada (1-, 2-, 3-, etc) representa uma sessão diferente do mesmo paciente
        2. Inclua TODAS as linhas que têm data de atendimento preenchida, mesmo que não tenham assinatura
        3. IMPORTANTE: Todas as datas DEVEM estar no formato DD/MM/YYYY (com 4 dígitos no ano)
        4. Todas as datas devem ser válidas (30/02/2024 seria uma data inválida)
        5. Mantenha o número da carteirinha EXATAMENTE como está no documento, incluindo pontos e hífens
        6. Retorne APENAS o JSON, sem texto adicional
        """

        # Configuração para garantir resposta em JSON
        config = types.GenerateContentConfig(
            response_mime_type='application/json',
            temperature=0.1,  # Baixa temperatura para respostas mais consistentes
            candidate_count=1,
            max_output_tokens=2048  # Limite máximo de tokens para a resposta
        )

        # Faz a requisição ao Gemini
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',  # Usando o modelo mais rápido do Gemini
            contents=[
                types.Part.from_data(mime_type='application/pdf', data=pdf_data),
                types.Part.from_text(prompt)
            ],
            config=config
        )

        # Parse da resposta JSON
        dados_extraidos = json.loads(response.text)

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
            "resposta_raw": response.text if 'response' in locals() else None,
        }
    except ValidationError as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": response.text if 'response' in locals() else None,
        }
    except Exception as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": response.text if 'response' in locals() else None,
        }


## Endpoints Fast API
@app.post("/upload-pdf")
async def upload_pdf(
    files: list[UploadFile] = File(description="Múltiplos arquivos PDF"),
):
    """
    Recebe um ou mais arquivos PDF, extrai informações e salva no banco de dados.
    Para cada linha assinada/datada da ficha, cria um registro separado.
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

                # Prepara o resultado
                result = {
                    "status": "success",
                    "filename": file.filename,
                    "saved_ids": [],
                    "uploaded_files": [],
                }

                # Faz upload do arquivo para o Storage apenas se tiver pelo menos uma linha válida
                dados_guia = info["json"]
                if dados_guia["registros"]:
                    # Gera o novo nome do arquivo com o padrão: Guia-Data-Paciente usando dados da primeira linha
                    primeira_linha = dados_guia["registros"][0]
                    data_formatada = primeira_linha["data_execucao"].replace("/", "-")
                    paciente_nome = primeira_linha["paciente_nome"]
                    novo_nome = f"{dados_guia['codigo_ficha']}-{data_formatada}-{paciente_nome}.pdf"

                    # Faz upload do arquivo
                    arquivo_url = storage.upload_file(temp_pdf_path, novo_nome)
                    if arquivo_url:
                        result["uploaded_files"].append(
                            {"nome": novo_nome, "url": arquivo_url}
                        )

                    # Para cada linha do PDF que tem data e assinatura, cria um registro
                    saved_ids = []
                    for i, registro in enumerate(dados_guia["registros"], 1):
                        # Só cria registro se tiver data de atendimento
                        if registro["data_execucao"]:
                            # Usa o código da ficha exatamente como extraído, sem adicionar sufixo
                            codigo_ficha_linha = dados_guia["codigo_ficha"]

                            # Salvar registro no banco
                            ficha_id = salvar_ficha_presenca(
                                {
                                    "data_atendimento": registro["data_execucao"],
                                    "paciente_carteirinha": registro["paciente_carteirinha"],
                                    "paciente_nome": registro["paciente_nome"],
                                    "numero_guia": registro["guia_id"],
                                    "codigo_ficha": codigo_ficha_linha,  # Usa o mesmo código para todas as sessões
                                    "possui_assinatura": registro["possui_assinatura"],
                                    "arquivo_url": arquivo_url if arquivo_url else None,
                                }
                            )
                            if ficha_id:
                                saved_ids.append(ficha_id)

                    result["saved_ids"] = saved_ids

                results.append(result)

            finally:
                # Limpar arquivo temporário
                if os.path.exists(temp_pdf_path):
                    os.remove(temp_pdf_path)

        except Exception as e:
            results.append(
                {
                    "status": "error",
                    "filename": file.filename,
                    "message": str(e),
                }
            )
            continue

    return results


@app.post("/excel/upload")
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
                "Id_Paciente",
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
                        "paciente_id": str(row["Id_Paciente"]).strip(),
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


@app.get("/execucoes/")
async def list_execucoes(
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: int = Query(10, ge=1, le=100, description="Itens por página"),
    paciente_nome: str = Query(None, description="Filtrar por nome do paciente"),
):
    """Lista todos os execucaos com suporte a paginação e filtro"""
    try:
        logger.info(
            f"Buscando execucaos com: page={page}, per_page={per_page}, paciente_nome={paciente_nome}"
        )
        offset = (page - 1) * per_page
        resultado = listar_guias(
            limit=per_page, offset=offset, paciente_nome=paciente_nome
        )

        return {
            "success": True,
            "data": {
                "execucaos": resultado["execucaos"],
                "pagination": {
                    "total": resultado["total"],
                    "total_pages": ceil(resultado["total"] / per_page),
                    "current_page": page,
                    "per_page": per_page,
                },
            },
        }
    except Exception as e:
        logger.error(f"Erro ao listar execucaos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/guia/{numero_guia}")
async def get_guia(numero_guia: str):
    """Busca execucaos específicos pelo número da guia"""
    execucaos = buscar_guia(numero_guia)
    if not execucaos:
        raise HTTPException(status_code=404, detail="Guia não encontrada")
    return execucaos


@app.get("/excel")
def list_excel(
    page: int = Query(1, description="Página atual"),
    per_page: int = Query(10, description="Itens por página"),
    paciente_nome: str = Query(None, description="Filtrar por nome do beneficiário"),
):
    """Lista os dados importados do Excel com suporte a paginação e filtro"""
    try:
        # Calcula o offset baseado na página atual
        offset = (page - 1) * per_page

        # Busca os dados no banco
        resultado = listar_dados_excel(
            limit=per_page, offset=offset, paciente_nome=paciente_nome
        )

        # Retorna o resultado diretamente, pois já está no formato esperado
        return resultado

    except Exception as e:
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


@app.post("/clear-execucoes")
async def clear_execucoes():
    """Limpa todos os dados da tabela de execuções"""
    try:
        from database_supabase import limpar_protocolos_excel
        import logging

        # Configura o logger
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)

        logger.info("Iniciando limpeza dos dados de execuções...")
        success = limpar_protocolos_excel()

        if success:
            logger.info("Dados de execuções limpos com sucesso")
            return {"success": True, "message": "Dados de execuções limpos com sucesso"}
        else:
            logger.error("Erro ao limpar dados de execuções: operação retornou False")
            raise HTTPException(
                status_code=500,
                detail="Erro ao limpar dados de execuções: operação não foi concluída com sucesso",
            )
    except Exception as e:
        logger.error(f"Erro ao limpar dados de execuções: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao limpar dados de execuções: {str(e)}"
        )


@app.post("/auditoria/iniciar")
async def iniciar_auditoria(request: AuditoriaRequest = Body(...)):
    try:
        logger.info(
            f"Iniciando auditoria com data_inicial={request.data_inicio}, data_final={request.data_fim}"
        )
        # Converte as datas para o formato correto se necessário
        data_inicial = request.data_inicio
        data_final = request.data_fim
        if data_inicial and "/" not in data_inicial:
            data_inicial = datetime.strptime(data_inicial, "%Y-%m-%d").strftime("%d/%m/%Y")
        if data_final and "/" not in data_final:
            data_final = datetime.strptime(data_final, "%Y-%m-%d").strftime("%d/%m/%Y")

        # Realiza a auditoria
        realizar_auditoria_fichas_execucoes(data_inicial, data_final)
        
        # Atualiza os ficha_ids das divergências usando a função do auditoria_repository
        atualizar_ficha_ids_divergencias()
        
        ultima_auditoria = obter_ultima_auditoria()
        return {"message": "Auditoria realizada com sucesso", "data": ultima_auditoria}
    except Exception as e:
        logger.error(f"Erro ao realizar auditoria: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auditoria/fichas")
async def iniciar_auditoria_fichas(
    data_inicial: str = Query(None, description="Data inicial (DD/MM/YYYY)"),
    data_final: str = Query(None, description="Data final (DD/MM/YYYY)"),
):
    """
    Inicia o processo de auditoria cruzando fichas de presença com execuções
    """
    try:
        resultado = realizar_auditoria_fichas_execucoes(data_inicial, data_final)
        return resultado
    except Exception as e:
        logging.error(f"Erro ao iniciar auditoria: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/auditoria/divergencia/{divergencia_id}")
async def atualizar_divergencia(
    divergencia_id: str, status: str = Body(..., embed=True)
):
    try:
        logger.info(f"Atualizando divergência {divergencia_id} para status: {status}")

        if not atualizar_status_divergencia(divergencia_id, status):
            raise HTTPException(status_code=404, detail="Divergência não encontrada")

        return {"message": "Status atualizado com sucesso"}
    except Exception as e:
        logger.error(f"Erro ao atualizar divergência: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/execucao/{codigo_ficha}")
async def atualizar_execucao_endpoint(codigo_ficha: str, execucao: ExecucaoUpdate):
    try:
        # Validate the data format
        if not all(
            [
                execucao.data_execucao,
                execucao.paciente_carteirinha,
                execucao.paciente_nome,
                execucao.guia_id,
                execucao.codigo_ficha,
            ]
        ):
            raise HTTPException(
                status_code=400, detail="Todos os campos são obrigatórios"
            )

        # Validate date format
        try:
            # Expecting date in YYYY-MM-DD format
            datetime.strptime(execucao.data_execucao, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Data em formato inválido. Use YYYY-MM-DD"
            )

        # Convert the model to a dictionary
        dados = {
            "data_execucao": execucao.data_execucao,
            "paciente_carteirinha": execucao.paciente_carteirinha,
            "paciente_nome": execucao.paciente_nome,
            "guia_id": execucao.guia_id,
            "possui_assinatura": execucao.possui_assinatura,
            "codigo_ficha": execucao.codigo_ficha,
        }

        # Update in Supabase
        try:
            from database_supabase import atualizar_execucao

            success = atualizar_execucao(codigo_ficha, dados)
            if not success:
                raise HTTPException(status_code=404, detail="execucao não encontrado")
            return {"message": "execucao atualizado com sucesso"}
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao atualizar execucao no banco de dados: {str(e)}",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro interno ao atualizar execucao: {str(e)}"
        )


@app.delete("/execucao/{codigo_ficha}")
async def excluir_execucao(codigo_ficha: str):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        # Exclui o execucao
        cursor.execute(
            """
            DELETE FROM execucaos 
            WHERE codigo_ficha = ?
        """,
            (codigo_ficha,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="execucao não encontrado")

        conn.commit()
        return {"message": "execucao excluído com sucesso"}

    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao excluir execucao: {str(e)}"
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
    status: str = Query("pendente", description="Filtrar por status (pendente, conferida, todas)")
):
    """Lista todas as fichas de presença com suporte a paginação e filtros"""
    try:
        result = listar_fichas_presenca(
            limit=limit, 
            offset=offset, 
            paciente_nome=paciente_nome,
            status=status
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


@app.get("/auditoria/ultima")
async def obter_ultima_auditoria_endpoint():
    try:
        ultima_auditoria = obter_ultima_auditoria()
        if ultima_auditoria:
            return {"message": "Última auditoria encontrada", "data": ultima_auditoria}
        return {"message": "Nenhuma auditoria encontrada", "data": None}
    except Exception as e:
        logger.error(f"Erro ao obter última auditoria: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auditoria/limpar-divergencias")
async def limpar_divergencias():
    """Limpa todas as divergências da tabela e retorna a lista atualizada"""
    try:
        from database_supabase import limpar_divergencias_db, listar_divergencias
        import logging

        # Configura o logger
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)

        logger.info("Iniciando limpeza das divergências...")
        success = limpar_divergencias_db()

        if success:
            logger.info("Divergências limpas com sucesso")
            # Busca a lista atualizada de divergências
            dados_atualizados = listar_divergencias(limit=100, offset=0)
            return {
                "success": True,
                "message": "Divergências limpas com sucesso",
                "dados": dados_atualizados,
            }
        else:
            logger.error("Erro ao limpar divergências: operação retornou False")
            raise HTTPException(
                status_code=500,
                detail="Erro ao limpar divergências: operação não foi concluída com sucesso",
            )
    except Exception as e:
        logger.error(f"Erro ao limpar divergências: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao limpar divergências: {str(e)}"
        )


@app.post("/fichas_presenca/limpar")
async def clear_fichas_presenca():
    """Limpa todos os registros da tabela fichas_presenca"""
    try:
        success = limpar_fichas_presenca()
        if success:
            return {"success": True, "message": "Registros limpos com sucesso"}
        else:
            raise HTTPException(status_code=500, detail="Erro ao limpar registros")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao limpar registros: {str(e)}"
        )


@app.get("/pacientes")
async def listar_pacientes(
    limit: int = Query(10, ge=1, le=100, description="Itens por página"),
    offset: int = Query(0, ge=0, description="Número de itens para pular"),
    paciente_nome: str = Query(None, description="Filtrar por nome do paciente"),
):
    """Lista todos os pacientes com suporte a paginação e filtro"""
    try:
        from database_supabase import listar_pacientes

        result = listar_pacientes(
            limit=limit, offset=offset, paciente_nome=paciente_nome
        )
        return result
    except Exception as e:
        logger.error(f"Erro ao listar pacientes: {e}")
        raise HTTPException(status_code=500, detail="Erro ao listar pacientes")


@app.get("/pacientes/{paciente_id}/guias")
async def listar_guias_paciente_endpoint(paciente_id: str):
    """Busca as guias e informações do plano de um paciente específico"""
    try:
        resultado = listar_guias_paciente(paciente_id)
        if not resultado or not resultado["items"]:
            raise HTTPException(status_code=404, detail="Paciente não encontrado ou sem guias")
        return resultado
    except Exception as e:
        logger.error(f"Erro ao buscar guias do paciente: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar guias do paciente")


@app.get("/tipos-divergencia")
def listar_tipos_divergencia_route():
    """Lista os tipos de divergência disponíveis"""
    try:
        tipos = database_supabase.listar_tipos_divergencia()
        return {"tipos": tipos}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar tipos de divergência: {str(e)}"
        )


@app.put("/fichas-presenca/{ficha_id}/conferir")
async def conferir_ficha(ficha_id: str):
    """Marca uma ficha como conferida"""
    try:
        result = database_supabase.atualizar_status_ficha(ficha_id, "conferida")
        if result:
            return {"message": "Ficha marcada como conferida com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Falha ao conferir ficha")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)

from auditoria import router as auditoria_router

# Add the router from auditoria.py
app.include_router(auditoria_router, prefix="/auditoria")
