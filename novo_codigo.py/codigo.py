from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
import json
import pandas as pd
from anthropic import Anthropic
import base64
import re


class RegistroGuia(BaseModel):
    data_execucao: Optional[str] = None
    numero_carteira: Optional[str] = None
    paciente_nome: Optional[str] = None
    numero_guia_principal: Optional[str] = None
    possui_assinatura: bool

    @validator("data_execucao")
    def validar_data(cls, v):
        if v and not re.match(r"\d{2}/\d{2}/\d{4}", v):
            raise ValueError("Data deve estar no formato DD/MM/YYYY")
        return v

    @validator("numero_carteira")
    def validar_numero_carteira(cls, v):
        if v and not re.match(r"\d{4}\.\d{4}\.\d{6}\.\d{2}-\d{1}", v):
            raise ValueError("Formato do número da carteira inválido")
        return v

    @validator("numero_guia_principal")
    def validar_numero_guia(cls, v):
        if v and not re.match(r"\d{8}", v):
            raise ValueError("Número da guia principal deve ter exatamente 8 dígitos")
        return v

    @validator("possui_assinatura", pre=True)
    def validar_linha(cls, v, values):
        tem_data = "data_execucao" in values and values["data_execucao"] is not None
        if not (tem_data or v):
            raise ValueError("Linha deve ter data ou assinatura preenchida")
        return v


class DadosGuia(BaseModel):
    codigo_guia: str
    registros: List[RegistroGuia]

    @validator("codigo_guia")
    def validar_codigo_guia(cls, v):
        if not re.match(r"R\d+-\d+", v):
            raise ValueError("Formato do código da guia inválido")
        return v


def processar_guia_medica(caminho_imagem: str, api_key: str) -> Dict:
    cliente = Anthropic(api_key=api_key)

    with open(caminho_imagem, "rb") as arquivo_imagem:
        imagem_base64 = base64.b64encode(arquivo_imagem.read()).decode("utf-8")

    prompt = """Analise esta imagem de guia médica e extraia as seguintes informações em JSON válido:

    {
    "codigo_guia": string,  // Identificador no canto superior direito, formato XX-XXXXXXXX (pode ter mais dígitos)
    "registros": [
        {
            "data_execucao": string,         // Formato: DD/MM/YYYY
            "numero_carteira": string,          // Formato: XXXX.XXXX.XXXXXX.XX-X
            "paciente_nome": string,
            "numero_guia_principal": string,    // Formato: XXXXXXXX
            "possui_assinatura": boolean
        }
    ]
    }

    Regras de extração:
    1. codigo_guia está localizado no canto superior direito do documento e segue o formato XX-XXXXXXXX (pode ter mais dígitos)
    2. Processe uma linha se ela tiver DATA PREENCHIDA OU ASSINATURA
    3. Se houver data em qualquer linha, use esta mesma data para todas as linhas da guia
    4. Campos podem estar vazios, exceto o critério da regra 2"""

    try:
        resposta = cliente.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": imagem_base64,
                            },
                        },
                    ],
                }
            ],
        )

        dados_extraidos = json.loads(resposta.content[0].text)
        dados_validados = DadosGuia(**dados_extraidos)
        df = pd.DataFrame([registro.dict() for registro in dados_validados.registros])

        return {
            "json": dados_validados.dict(),
            "dataframe": df,
            "status_validacao": "sucesso",
        }

    except Exception as e:
        return {
            "erro": str(e),
            "status_validacao": "falha",
            "resposta_raw": (
                resposta.content[0].text if "resposta" in locals() else None
            ),
        }


if __name__ == "__main__":
    api_key = "sua_chave_api_anthropic"
    caminho_imagem = "caminho_para_sua_imagem.jpg"
    resultados = processar_guia_medica(caminho_imagem, api_key)

    if resultados["status_validacao"] == "sucesso":
        with open("dados_extraidos.json", "w", encoding="utf-8") as f:
            json.dump(resultados["json"], f, ensure_ascii=False, indent=2)
        resultados["dataframe"].to_csv("dados_extraidos.csv", index=False)
