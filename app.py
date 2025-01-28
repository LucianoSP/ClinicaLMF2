from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import database_supabase
from auditoria import realizar_auditoria, realizar_auditoria_fichas_execucoes
from pydantic import BaseModel, ValidationError, validator
import os
import pandas as pd
import tempfile
import shutil
from datetime import datetime, date, timezone
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
    listar_planos,
    criar_plano,
    atualizar_plano,
    deletar_plano,
    criar_paciente,
    atualizar_paciente,
    deletar_paciente,
    listar_pacientes,
    buscar_paciente,
)
from auditoria_repository import (
    registrar_divergencia,
    listar_divergencias,
    atualizar_status_divergencia,
    obter_ultima_auditoria,
    limpar_divergencias_db,
    atualizar_ficha_ids_divergencias,  # Movido para cá
)
from config import supabase  # Importar o cliente Supabase já inicializado
from storage_r2 import storage  # Nova importação do R2
import json
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
import uuid  # Adicionar esta importação

from google import genai
from google.genai import types

claude_api_key = os.environ["ANTHROPIC_API_KEY"]
gemini_api_key = os.environ["GEMINI_API_KEY"]

logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Processor API")

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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


# Modelo para Paciente
class Paciente(BaseModel):
    id: Optional[str] = None
    nome: str
    nome_responsavel: str
    data_nascimento: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Carteirinha(BaseModel):
    id: Optional[str] = None
    numero_carteirinha: str
    paciente_id: str
    plano_saude_id: str
    data_validade: Optional[str] = None
    paciente: Optional[Dict] = None
    plano_saude: Optional[Dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status: str = None
    motivo_inativacao: str = None
    created_by: Optional[str] = None

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None,
        }
    }

    @validator("data_validade")
    def parse_data_validade(cls, v):
        if not v:
            return None
        try:
            # Tenta converter a data para o formato correto
            if isinstance(v, str):
                # Se já é uma string ISO, retorna como está
                if "T" in v or "-" in v:
                    return v
                # Caso contrário, tenta converter de DD/MM/YYYY para YYYY-MM-DD
                dia, mes, ano = v.split("/")
                return f"{ano}-{mes.zfill(2)}-{dia.zfill(2)}"
            return v
        except Exception as e:
            logging.error(f"Erro ao converter data: {e}")
            return v


# Rotas para Pacientes
@app.get("/pacientes")
def listar_pacientes_route(
    limit: int = Query(10, ge=1, le=100, description="Itens por página"),
    offset: int = Query(0, ge=0, description="Número de itens para pular"),
    search: str = Query(None, description="Buscar por nome do paciente ou responsável"),
):
    try:
        return database_supabase.listar_pacientes(
            limit=limit, offset=offset, search=search
        )
    except Exception as e:
        logging.error(f"Erro ao listar pacientes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/pacientes/")
def criar_paciente_route(paciente: Paciente):
    try:
        return criar_paciente(paciente.model_dump(exclude_unset=True))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pacientes/{paciente_id}")
def buscar_paciente_route(paciente_id: str):
    try:
        paciente = buscar_paciente(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")
        return paciente
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/pacientes/{paciente_id}")
def atualizar_paciente_route(paciente_id: str, paciente: Paciente):
    try:
        paciente_atual = buscar_paciente(paciente_id)
        if not paciente_atual:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")

        return atualizar_paciente(paciente_id, paciente.model_dump(exclude_unset=True))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/pacientes/{paciente_id}")
def deletar_paciente_route(paciente_id: str):
    try:
        paciente = buscar_paciente(paciente_id)
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")

        deletar_paciente(paciente_id)
        return {"message": "Paciente excluído com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Modelo para Plano de Saúde
class Plano(BaseModel):
    id: Optional[str] = None  # UUID é armazenado como string
    nome: str
    codigo: str
    ativo: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Rotas para Planos de Saúde
@app.get("/planos", response_model=List[Plano])
async def listar_planos_route():
    try:
        return database_supabase.listar_planos()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/planos", response_model=Plano)
async def criar_plano_route(plano: Plano):
    try:
        data = {"nome": plano.nome, "codigo": plano.codigo, "ativo": plano.ativo}
        result = criar_plano(data)
        if not result:
            raise HTTPException(status_code=400, detail="Erro ao criar plano")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/planos/{plano_id}", response_model=Plano)
async def atualizar_plano_route(plano_id: str, plano: Plano):  # Mudado para str
    try:
        data = {"nome": plano.nome, "codigo": plano.codigo, "ativo": plano.ativo}
        return database_supabase.atualizar_plano(plano_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/planos/{plano_id}")
async def deletar_plano_route(plano_id: str):  # Mudado para str
    try:
        database_supabase.deletar_plano(plano_id)
        return {"message": "Plano excluído com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


class Sessao(BaseModel):
    data_sessao: str
    tipo_terapia: str | None = None
    profissional_executante: str | None = None
    possui_assinatura: bool = False
    valor_sessao: float | None = None
    observacoes_sessao: str | None = None
    status: str = "pendente"


class FichaPresenca(BaseModel):
    paciente_carteirinha: str
    paciente_nome: str
    numero_guia: str
    codigo_ficha: str
    sessoes: List[Sessao] | None = None
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
                            "codigo_ficha": string,  // Campo 2 no canto superior direito, formato XX-XXXXXXXX (Diferente do campo 3 - Código na Operadora.)
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
                        3. IMPORTANTE: Todas as datas DEVEM estar no formato DD/MM/YYYY (com 4 dígitos no ano). 
                        4. Todas as datas devem ser válidas (30/02/2024 seria uma data inválida). As datas preenchidas numa ficha são sempre a mesma para todas as linhas. 
                        5. Mantenha o número da carteirinha EXATAMENTE como está no documento, incluindo pontos e hífens
                        6. Assinale se houver assinaturas válidas. Para considerar uma linha com assinatura válida, basta verificar um pequeno quadrado no final da linha. Caso este quadrado esteja marcado ou pintado, é um campo que deveria ter uma assinatura na linha à esquerda. 
                        7. Retorne APENAS o JSON, sem texto adicional
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
                response.content[0].text if "response" in locals() else None,
            ),
        }


# Configuração de logging detalhado
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
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
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Arquivo deve ser PDF")

        # Ler o conteúdo do arquivo
        content = await file.read()
        logging.info(
            f"Arquivo lido com sucesso: {file.filename} ({len(content)} bytes)"
        )

        # Verificar se o arquivo está vazio
        if not content:
            raise HTTPException(status_code=400, detail="Arquivo PDF vazio")

        # Converter para base64 de forma segura
        try:
            pdf_base64 = base64.b64encode(content).decode("utf-8")
            logging.info(
                f"Arquivo convertido para base64 ({len(pdf_base64)} caracteres)"
            )
        except Exception as e:
            logging.error(f"Erro na conversão base64: {str(e)}")
            raise HTTPException(status_code=500, detail="Erro na conversão do arquivo")

        # Verificar API key
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500, detail="GOOGLE_API_KEY não configurada"
            )

        # Inicializar cliente Gemini com tratamento de erro
        try:
            client = genai.Client(api_key=api_key)
            logging.info("Cliente Gemini inicializado com sucesso")
        except Exception as e:
            logging.error(f"Erro ao inicializar cliente Gemini: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Erro ao inicializar Gemini API"
            )

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
                                    "data": pdf_data,
                                }
                            },
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
                config=config,
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
                    "raw_response": response_text,
                }

            except json.JSONDecodeError as e:
                logging.error(f"Erro ao fazer parse do JSON: {str(e)}")
                return {
                    "status": "error",
                    "message": "Erro ao fazer parse do JSON",
                    "error_details": str(e),
                    "raw_response": response.text,
                }

        except Exception as e:
            logging.error(f"Erro na comunicação com Gemini: {str(e)}")
            logging.error(traceback.format_exc())
            return {
                "status": "error",
                "message": "Erro na comunicação com Gemini",
                "error_details": str(e),
            }

    except Exception as e:
        logging.error(f"Erro ao processar PDF: {str(e)}")
        logging.error(traceback.format_exc())
        return {
            "status": "error",
            "message": "Erro ao processar PDF",
            "error_details": str(e),
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
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY não configurada nas variáveis de ambiente",
        )

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
            response_mime_type="application/json",
            temperature=0.1,  # Baixa temperatura para respostas mais consistentes
            candidate_count=1,
            max_output_tokens=2048,  # Limite máximo de tokens para a resposta
        )

        # Faz a requisição ao Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",  # Usando o modelo mais rápido do Gemini
            contents=[
                types.Part.from_data(mime_type="application/pdf", data=pdf_data),
                types.Part.from_text(prompt),
            ],
            config=config,
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
            "resposta_raw": response.text if "response" in locals() else None,
        }
    except ValidationError as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": response.text if "response" in locals() else None,
        }
    except Exception as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": response.text if "response" in locals() else None,
        }


@app.post("/upload-pdf")
async def upload_pdf(
    files: list[UploadFile] = File(description="Múltiplos arquivos PDF"),
):
    """Processa PDFs de fichas de presença e cria registros com sessões"""
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")

    results = []
    processed_files = set()

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

        if file.filename in processed_files:
            continue
        processed_files.add(file.filename)

        try:
            # Salvar o arquivo temporariamente
            temp_pdf_path = os.path.join(TEMP_DIR, file.filename)
            with open(temp_pdf_path, "wb") as temp_file:
                content = await file.read()
                temp_file.write(content)

            logger.info(f"Iniciando processamento do arquivo {file.filename}")

            # Extrair informações do PDF
            info = await extract_info_from_pdf(temp_pdf_path)

            if info.get("status_validacao") == "falha":
                raise Exception(info.get("erro", "Erro desconhecido ao processar PDF"))

            result = {
                "status": "success",
                "filename": file.filename,
                "ficha_id": None,
                "uploaded_file": None,
                "num_sessoes": 0,
            }

            dados_guia = info["json"]
            if not dados_guia["registros"]:
                raise Exception("Nenhum registro encontrado no PDF")

            # Upload do arquivo PDF
            primeira_linha = dados_guia["registros"][0]
            data_formatada = primeira_linha["data_execucao"].replace("/", "-")
            nome_paciente = primeira_linha["paciente_nome"].strip()
            nome_paciente = "".join(
                c for c in nome_paciente if c.isalnum() or c.isspace()
            )
            nome_paciente = nome_paciente.replace(" ", "-")

            novo_nome = (
                f"{dados_guia['codigo_ficha']}-{nome_paciente}-{data_formatada}.pdf"
            )
            arquivo_url = storage.upload_file(temp_pdf_path, novo_nome)

            if arquivo_url:
                result["uploaded_file"] = {"nome": novo_nome, "url": arquivo_url}

            # Preparar dados da ficha e sessões
            ficha_data = {
                "codigo_ficha": dados_guia["codigo_ficha"],
                "numero_guia": primeira_linha["guia_id"],
                "paciente_nome": primeira_linha["paciente_nome"],
                "paciente_carteirinha": primeira_linha["paciente_carteirinha"],
                "arquivo_digitalizado": arquivo_url,
                "data_atendimento": primeira_linha["data_execucao"],
                "status": "pendente",
                "sessoes": [],
            }

            # Criar sessões para cada registro
            for registro in dados_guia["registros"]:
                data_sessao = datetime.strptime(
                    registro["data_execucao"], "%d/%m/%Y"
                ).strftime("%Y-%m-%d")

                sessao = {
                    "data_sessao": data_sessao,
                    "possui_assinatura": registro["possui_assinatura"],
                    "status": "pendente",
                    "tipo_terapia": None,
                    "profissional_executante": None,
                    "valor_sessao": None,
                    "observacoes_sessao": None,
                }

                ficha_data["sessoes"].append(sessao)

            ficha_id = salvar_ficha_presenca(ficha_data)
            if not ficha_id:
                raise Exception("Erro ao criar ficha de presença")

            result["ficha_id"] = ficha_id
            result["num_sessoes"] = len(ficha_data["sessoes"])

            results.append(result)

        except Exception as e:
            logger.error(f"Erro ao processar arquivo {file.filename}: {str(e)}")
            results.append(
                {
                    "status": "error",
                    "filename": file.filename,
                    "message": str(e),
                }
            )
        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)

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
async def list_excel(
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

        # Verifica se a busca foi bem sucedida
        if not resultado["success"]:
            raise HTTPException(
                status_code=500, detail="Erro ao buscar dados das execuções"
            )

        return resultado

    except Exception as e:
        logger.error(f"Erro ao listar execuções: {e}")
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

        # Remover a conversão de datas aqui - elas devem permanecer em YYYY-MM-DD
        data_inicial = request.data_inicio
        data_final = request.data_fim

        # Realizar a auditoria com as datas no formato do banco
        resultado = realizar_auditoria_fichas_execucoes(data_inicial, data_final)

        if not resultado.get("success"):
            raise HTTPException(
                status_code=500,
                detail=resultado.get("error", "Erro ao realizar auditoria"),
            )

        # Atualiza os ficha_ids das divergências
        atualizar_ficha_ids_divergencias()

        ultima_auditoria = obter_ultima_auditoria()
        return {
            "success": True,
            "message": "Auditoria realizada com sucesso",
            "data": ultima_auditoria,
        }

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
    search: str = Query(None, description="Buscar por nome do paciente"),
    status: str = Query(
        "pendente", description="Filtrar por status (pendente, conferida, todas)"
    ),
    order: str = Query("created_at.desc", description="Ordenação dos resultados"),
):
    """Lista todas as fichas de presença com suporte a paginação e filtros"""
    try:
        result = listar_fichas_presenca(
            limit=limit,
            offset=offset,
            search=search,  # Changed from paciente_nome to search
            status=status,
            order=order,
        )
        return result
    except Exception as e:
        logger.error(f"Erro ao listar fichas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao listar fichas de presença")


@app.post("/fichas-presenca")
async def criar_ficha(ficha: FichaPresenca):
    """Cria uma nova ficha de presença"""
    try:
        # Prepare data for saving
        ficha_data = ficha.dict()

        # If no sessions provided, create default session
        if not ficha_data.get("sessoes"):
            ficha_data["sessoes"] = [
                {
                    "data_sessao": datetime.now().strftime("%Y-%m-%d"),
                    "possui_assinatura": False,
                    "status": "pendente",
                }
            ]

        result = salvar_ficha_presenca(ficha_data)

        if not result:
            raise HTTPException(
                status_code=400, detail="Erro ao criar ficha de presença"
            )
        return {"id": result, "message": "Ficha criada com sucesso"}
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


@app.get("/pacientes/{paciente_id}/guias")
async def listar_guias_paciente_endpoint(paciente_id: str):
    """Busca as guias e informações do plano de um paciente específico"""
    try:
        resultado = listar_guias_paciente(paciente_id)
        if not resultado or not resultado["items"]:  # Corrigido aqui: || -> or
            raise HTTPException(
                status_code=404, detail="Paciente não encontrado ou sem guias"
            )
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
            status_code=500, detail=f"Erro ao listar tipos de divergência: {str(e)}"
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


@app.get("/verificar-datas")
async def verificar_datas():
    """Endpoint para verificar formato das datas no banco"""
    try:
        from database_supabase import verificar_formatos_data_banco

        resultado = verificar_formatos_data_banco()
        return {"success": True, "amostras": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)

from auditoria import router as auditoria_router

# Add the router from auditoria.py
app.include_router(auditoria_router, prefix="/auditoria")


class SessaoUpdate(BaseModel):
    data_sessao: str
    tipo_terapia: str | None = None
    profissional_executante: str | None = None
    possui_assinatura: bool = False
    valor_sessao: float | None = None
    observacoes_sessao: str | None = None


@app.put("/sessoes/{sessao_id}")
async def atualizar_sessao(sessao_id: str, sessao: SessaoUpdate):
    """Atualiza os dados de uma sessão específica"""
    try:
        response = (
            supabase.table("sessoes")
            .update(
                {
                    "data_sessao": sessao.data_sessao,
                    "tipo_terapia": sessao.tipo_terapia,
                    "profissional_executante": sessao.profissional_executante,
                    "possui_assinatura": sessao.possui_assinatura,
                    "valor_sessao": sessao.valor_sessao,
                    "observacoes_sessao": sessao.observacoes_sessao,
                }
            )
            .eq("id", sessao_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        return {"message": "Sessão atualizada com sucesso", "data": response.data[0]}

    except Exception as e:
        logger.error(f"Erro ao atualizar sessão: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao atualizar sessão: {str(e)}"
        )


@app.put("/sessoes/{sessao_id}/conferir")
async def conferir_sessao(sessao_id: str):
    """Marca uma sessão como conferida"""
    try:
        response = (
            supabase.table("sessoes")
            .update({"status": "conferida"})
            .eq("id", sessao_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        return {"message": "Sessão conferida com sucesso", "data": response.data[0]}

    except Exception as e:
        logger.error(f"Erro ao conferir sessão: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao conferir sessão: {str(e)}"
        )


@app.delete("/sessoes/{sessao_id}")
# Rotas para Carteirinhas
@app.get("/carteirinhas/")
def listar_carteirinhas_route(
    limit: int = Query(10, ge=1, le=100, description="Itens por página"),
    offset: int = Query(0, ge=0, description="Número de itens para pular"),
    search: str = Query(None, description="Buscar por número da carteirinha"),
    paciente_id: str = Query(None, description="Filtrar por paciente"),
):
    try:
        response = supabase.table("carteirinhas").select(
            "*, pacientes!carteirinhas_paciente_id_fkey(*), planos_saude!carteirinhas_plano_saude_id_fkey(*)"
        )

        if search:
            response = response.or_(f"numero_carteirinha.ilike.%{search}%")

        if paciente_id:
            response = response.eq("paciente_id", paciente_id)

        # Get total count before pagination
        total = len(response.execute().data)

        # Apply pagination
        response = response.range(offset, offset + limit - 1)

        result = response.execute()

        # Format data for frontend
        formatted_data = [
            {
                "id": item["id"],
                "numero_carteirinha": item["numero_carteirinha"],
                "data_validade": item["data_validade"],
                "status": item["status"],
                "motivo_inativacao": item["motivo_inativacao"],
                "paciente_id": item["paciente_id"],
                "plano_saude_id": item["plano_saude_id"],
                "paciente": item["pacientes"],
                "plano_saude": item["planos_saude"],
                "created_by": item.get("created_by"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            }
            for item in result.data
        ]

        return {"items": formatted_data, "total": total, "pages": ceil(total / limit)}
    except Exception as e:
        logging.error(f"Erro ao listar carteirinhas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/carteirinhas/")
def criar_carteirinha_route(carteirinha: Carteirinha, request: Request):
    try:
        # Pega o usuário da requisição
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID não fornecido")

        # Prepara os dados para inserção
        carteirinha_data = carteirinha.model_dump(exclude_unset=True)
        carteirinha_data["created_by"] = user_id
        carteirinha_data["created_at"] = datetime.now()
        carteirinha_data["updated_at"] = datetime.now()

        # Insere no banco de dados
        response = supabase.table("carteirinhas").insert(carteirinha_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao criar carteirinha")

        return response.data[0]
    except Exception as e:
        logging.error(f"Erro ao criar carteirinha: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/carteirinhas/{carteirinha_id}")
def buscar_carteirinha_route(carteirinha_id: str):
    try:
        response = (
            supabase.table("carteirinhas")
            .select(
                "*, pacientes!carteirinhas_paciente_id_fkey(*), planos_saude!carteirinhas_plano_saude_id_fkey(*)"
            )
            .eq("id", carteirinha_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Carteirinha não encontrada")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Erro ao buscar carteirinha: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/carteirinhas/{carteirinha_id}")
async def atualizar_carteirinha_route(carteirinha_id: str, carteirinha: Carteirinha):
    try:
        logging.info(f"Atualizando carteirinha ID: {carteirinha_id}")
        logging.info(f"Dados recebidos: {carteirinha.dict()}")

        # Format data for database
        data = {
            "numero_carteirinha": carteirinha.numero_carteirinha,
            "data_validade": carteirinha.data_validade,
            "plano_saude_id": carteirinha.plano_saude_id,
            "paciente_id": carteirinha.paciente_id,
            "status": carteirinha.status,
            "motivo_inativacao": carteirinha.motivo_inativacao,
            "updated_at": datetime.now(
                timezone.utc
            ).isoformat(),  # Convertendo para string ISO
        }

        # Handle data_validade conversion properly
        if carteirinha.data_validade:
            if isinstance(carteirinha.data_validade, date):
                data["data_validade"] = carteirinha.data_validade.isoformat()

        logging.info(f"Dados formatados para atualização: {data}")

        # Check if carteirinha exists
        existing = (
            supabase.table("carteirinhas")
            .select("*")
            .eq("id", carteirinha_id)
            .execute()
        )

        if not existing.data:
            raise HTTPException(status_code=404, detail="Carteirinha não encontrada")

        # Update carteirinha
        response = (
            supabase.table("carteirinhas")
            .update(data)
            .eq("id", carteirinha_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Erro ao atualizar carteirinha no banco de dados",
            )

        updated_data = response.data[0]
        logging.info(f"Dados atualizados com sucesso: {updated_data}")

        # Format response
        return {
            "id": updated_data["id"],
            "numero": updated_data["numero_carteirinha"],
            "dataValidade": updated_data["data_validade"],
            "status": updated_data["status"],
            "motivo_inativacao": updated_data["motivo_inativacao"],
            "pacienteId": updated_data["paciente_id"],
        }

    except HTTPException as http_ex:
        logging.error(f"HTTP Exception: {http_ex}")
        raise
    except Exception as e:
        logging.error(f"Erro ao atualizar carteirinha: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/carteirinhas/{carteirinha_id}")
def deletar_carteirinha_route(carteirinha_id: str):
    try:
        # Check if carteirinha exists
        existing = (
            supabase.table("carteirinhas")
            .select("*")
            .eq("id", carteirinha_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Carteirinha não encontrada")

        # Delete carteirinha
        supabase.table("carteirinhas").delete().eq("id", carteirinha_id).execute()

        return {"message": "Carteirinha excluída com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Erro ao deletar carteirinha: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def deletar_sessao(sessao_id: str):
    """Deleta uma sessão específica e suas execuções relacionadas"""
    try:
        # Primeiro deleta as execuções relacionadas
        supabase.table("execucoes").delete().eq("sessao_id", sessao_id).execute()

        # Depois deleta a sessão
        response = supabase.table("sessoes").delete().eq("id", sessao_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        return {"message": "Sessão deletada com sucesso"}

    except Exception as e:
        logger.error(f"Erro ao deletar sessão: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar sessão: {str(e)}")


@app.get("/pacientes/{paciente_id}/estatisticas")
async def get_patient_stats(paciente_id: str):
    """Retorna estatísticas detalhadas de um paciente específico"""
    try:
        stats = database_supabase.obter_estatisticas_paciente(paciente_id)
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        return stats
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do paciente: {e}")
        raise HTTPException(
            status_code=500, detail=f"Erro ao obter estatísticas do paciente: {str(e)}"
        )


@app.post("/pacientes/{paciente_id}/guias")
async def criar_guia_endpoint(paciente_id: str, dados_guia: dict = Body(...)):
    """Criar uma nova guia para um paciente"""
    try:
        resultado = database_supabase.criar_guia(paciente_id, dados_guia)
        if resultado:
            return {"message": "Guia criada com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Falha ao criar guia")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/pacientes/{paciente_id}/guias/{guia_id}")
async def atualizar_guia_endpoint(
    paciente_id: str, guia_id: str, dados_guia: dict = Body(...)
):
    """Atualizar uma guia existente"""
    try:
        resultado = database_supabase.atualizar_guia(guia_id, dados_guia)
        if resultado:
            return {"message": "Guia atualizada com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Falha ao atualizar guia")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class Procedimento(BaseModel):
    id: Optional[str] = None
    codigo: str
    nome: str
    descricao: Optional[str] = None
    ativo: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class Guia(BaseModel):
    id: Optional[str] = None
    numero_guia: str
    data_emissao: Optional[str] = None
    data_validade: Optional[str] = None
    tipo: str
    status: str = "pendente"
    carteirinha_id: str
    paciente_id: str
    quantidade_autorizada: int
    quantidade_executada: int = 0
    procedimento_id: str
    profissional_solicitante: Optional[str] = None
    profissional_executante: Optional[str] = None
    observacoes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    carteirinha: Optional[dict] = None
    paciente: Optional[dict] = None
    procedimento: Optional[dict] = None

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None,
        }
    }


# Rota para listar procedimentos
@app.get("/procedimentos/")
def listar_procedimentos_route():
    try:
        response = (
            supabase.table("procedimentos").select("*").eq("ativo", True).execute()
        )
        return response.data
    except Exception as e:
        logging.error(f"Erro ao listar procedimentos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Rota para listar guias
@app.get("/guias")
def listar_guias_route(
    limit: int = Query(10, ge=1, le=100, description="Itens por página"),
    offset: int = Query(0, ge=0, description="Número de itens para pular"),
    search: str = Query(
        None, description="Buscar por número da guia ou nome do paciente"
    ),
):
    try:
        # Inicia a query base
        query = supabase.table("guias").select("*")

        # Adiciona busca se fornecida
        if search:
            query = query.or_(f"numero_guia.ilike.%{search}%")

        # Conta total de registros
        count_response = query.execute()
        total_count = len(count_response.data)

        # Adiciona paginação
        query = query.limit(limit).offset(offset)

        # Executa a query
        response = query.execute()

        if not response.data:
            return {"items": [], "total": 0, "pages": 0}

        # Para cada guia, busca os dados relacionados
        guias_completas = []
        for guia in response.data:
            # Busca dados da carteirinha
            if guia.get("carteirinha_id"):
                carteirinha = (
                    supabase.table("carteirinhas")
                    .select("*")
                    .eq("id", guia["carteirinha_id"])
                    .execute()
                )
                if carteirinha.data:
                    guia["carteirinha"] = carteirinha.data[0]

            # Busca dados do paciente
            if guia.get("paciente_id"):
                paciente = (
                    supabase.table("pacientes")
                    .select("*")
                    .eq("id", guia["paciente_id"])
                    .execute()
                )
                if paciente.data:
                    guia["paciente"] = paciente.data[0]

            # Busca dados do procedimento
            if guia.get("procedimento_id"):
                procedimento = (
                    supabase.table("procedimentos")
                    .select("*")
                    .eq("id", guia["procedimento_id"])
                    .execute()
                )
                if procedimento.data:
                    guia["procedimento"] = procedimento.data[0]

            guias_completas.append(guia)

        return {
            "items": guias_completas,
            "total": total_count,
            "pages": ceil(total_count / limit),
        }

    except Exception as e:
        logging.error(f"Erro ao listar guias: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/guias/")
def criar_guia_route(guia: Guia, request: Request):
    try:
        # Pega o usuário da requisição
        auth_user_id = request.headers.get("user-id")
        if not auth_user_id:
            raise HTTPException(status_code=401, detail="User ID não fornecido")

        # Busca o ID do usuário na tabela usuarios
        usuario = (
            supabase.table("usuarios")
            .select("id")
            .eq("auth_user_id", auth_user_id)
            .execute()
        )
        if not usuario.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        user_id = usuario.data[0]["id"]

        # Prepara os dados para inserção
        guia_data = guia.model_dump(exclude_unset=True)
        guia_data["created_by"] = user_id
        guia_data["updated_by"] = user_id

        # Converte as datas para string ISO
        current_time = datetime.now().isoformat()
        guia_data["created_at"] = current_time
        guia_data["updated_at"] = current_time

        # Valida se a carteirinha existe
        carteirinha = (
            supabase.table("carteirinhas")
            .select("*")
            .eq("id", guia_data["carteirinha_id"])
            .execute()
        )
        if not carteirinha.data:
            raise HTTPException(status_code=404, detail="Carteirinha não encontrada")
        carteirinha_data = carteirinha.data[0]

        # Valida se o paciente existe
        paciente = (
            supabase.table("pacientes")
            .select("*")
            .eq("id", guia_data["paciente_id"])
            .execute()
        )
        if not paciente.data:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")
        paciente_data = paciente.data[0]

        # Busca dados do procedimento se houver
        procedimento_data = None
        if guia_data.get("procedimento_id"):
            procedimento = (
                supabase.table("procedimentos")
                .select("*")
                .eq("id", guia_data["procedimento_id"])
                .execute()
            )
            if procedimento.data:
                procedimento_data = procedimento.data[0]

        # Remove campos que não existem na tabela
        campos_para_remover = ["carteirinha", "paciente", "procedimento"]
        for campo in campos_para_remover:
            if campo in guia_data:
                del guia_data[campo]

        # Insere no banco de dados
        response = supabase.table("guias").insert(guia_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Erro ao criar guia")

        # Adiciona os dados relacionados na resposta
        guia_criada = response.data[0]
        guia_criada["carteirinha"] = carteirinha_data
        guia_criada["paciente"] = paciente_data
        if procedimento_data:
            guia_criada["procedimento"] = procedimento_data

        return guia_criada
    except Exception as e:
        logging.error(f"Erro ao criar guia: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/guias/{guia_id}")
def atualizar_guia_route(guia_id: str, guia: Guia, request: Request):
    try:
        # Pega o usuário da requisição
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID não fornecido")

        # Prepara os dados para atualização
        guia_data = guia.model_dump(exclude_unset=True)
        guia_data["updated_by"] = user_id
        guia_data["updated_at"] = datetime.now()

        # Remove campos que não devem ser atualizados
        guia_data.pop("id", None)
        guia_data.pop("created_at", None)
        guia_data.pop("created_by", None)

        # Atualiza no banco de dados
        response = supabase.table("guias").update(guia_data).eq("id", guia_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Guia não encontrada")

        return response.data[0]
    except Exception as e:
        logging.error(f"Erro ao atualizar guia: {e}")
        raise HTTPException(status_code=500, detail=str(e))
