from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import Optional

class FichaPresencaUpdate(BaseModel):
    data_atendimento: str
    data_execucao: str
    paciente_carteirinha: str
    paciente_nome: str
    numero_guia: str
    codigo_ficha: str
    possui_assinatura: bool = False
    arquivo_digitalizado: Optional[str] = None
