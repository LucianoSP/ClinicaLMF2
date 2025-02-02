from fastapi import APIRouter, HTTPException
from typing import List

from ..models.paciente import Paciente
from ..services.paciente_service import PacienteService

router = APIRouter()
service = PacienteService()

@router.get("/", response_model=List[Paciente])
async def listar_pacientes():
    return await service.listar_pacientes()

@router.post("/", response_model=Paciente)
async def criar_paciente(paciente: Paciente):
    return await service.criar_paciente(paciente)

@router.get("/{paciente_id}", response_model=Paciente)
async def buscar_paciente(paciente_id: str):
    return await service.buscar_paciente(paciente_id)

@router.put("/{paciente_id}", response_model=Paciente)
async def atualizar_paciente(paciente_id: str, paciente: Paciente):
    return await service.atualizar_paciente(paciente_id, paciente)

@router.delete("/{paciente_id}")
async def deletar_paciente(paciente_id: str):
    return await service.deletar_paciente(paciente_id)
