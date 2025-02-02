from datetime import datetime
from typing import Optional
from .base_config import BaseModelConfig

class PacienteModel(BaseModelConfig):
    nome: str
    nome_responsavel: str
    cpf: Optional[str] = None
    data_nascimento: Optional[datetime] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    carteirinha: Optional[str] = None
    observacoes: Optional[str] = None
    ativo: bool = True
