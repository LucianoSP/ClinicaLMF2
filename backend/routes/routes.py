from fastapi import APIRouter, HTTPException
from typing import List
from models.paciente import PacienteModel
from database_supabase import supabase

router = APIRouter()

@router.get("/pacientes", response_model=List[PacienteModel])
async def listar_pacientes():
    try:
        response = supabase.table("pacientes").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))