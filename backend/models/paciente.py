from datetime import datetime
from typing import Optional
from pydantic import Field

from .base_config import BaseModelConfig

class Paciente(BaseModelConfig):
    """Modelo para a entidade Paciente"""
    nome: str = Field(..., description="Nome completo do paciente")
    nome_responsavel: str = Field(..., description="Nome do responsável, se houver")
    data_nascimento: Optional[str] = Field(None, description="Data de nascimento")
    cpf: Optional[str] = Field(None, description="CPF do paciente")
    telefone: Optional[str] = Field(None, description="Telefone para contato")
    email: Optional[str] = Field(None, description="Email do paciente")
    endereco: Optional[dict] = Field(None, description="Endereço completo")
    observacoes: Optional[str] = Field(None, description="Observações gerais")
