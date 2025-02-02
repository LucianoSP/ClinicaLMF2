from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from models.paciente import PacienteModel
from database_supabase import supabase, formatar_data

router = APIRouter(prefix="/pacientes", tags=["pacientes"])

@router.post("", response_model=PacienteModel)
async def criar_paciente(paciente: PacienteModel):
    try:
        dados = paciente.to_dict()
        response = supabase.table("pacientes").insert(dados).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[PacienteModel])
async def listar_pacientes(
    nome: Optional[str] = None,
    carteirinha: Optional[str] = None,
    ativo: Optional[bool] = True
):
    try:
        query = supabase.table("pacientes")
        
        if nome:
            query = query.ilike("nome", f"%{nome}%")
        if carteirinha:
            query = query.eq("carteirinha", carteirinha)
        if ativo is not None:
            query = query.eq("ativo", ativo)
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=PacienteModel)
async def obter_paciente(id: str):
    try:
        response = supabase.table("pacientes").select("*").eq("id", id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=PacienteModel)
async def atualizar_paciente(id: str, paciente: PacienteModel):
    try:
        dados = paciente.to_dict()
        dados["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("pacientes").update(dados).eq("id", id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def deletar_paciente(id: str):
    try:
        # Soft delete - apenas marca como inativo
        response = supabase.table("pacientes").update({
            "ativo": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Paciente não encontrado")
        return {"message": "Paciente desativado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
