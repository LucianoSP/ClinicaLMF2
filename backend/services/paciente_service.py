from typing import List
from fastapi import HTTPException

from ..models.paciente import Paciente
from ..database import Database

class PacienteService:
    def __init__(self):
        self.db = Database()
    
    async def listar_pacientes(self) -> List[Paciente]:
        query = "SELECT * FROM pacientes WHERE deleted_at IS NULL"
        result = await self.db.fetch_all(query)
        return [Paciente(**row) for row in result]
    
    async def criar_paciente(self, paciente: Paciente) -> Paciente:
        query = """
            INSERT INTO pacientes (nome, nome_responsavel, data_nascimento, cpf, 
            telefone, email, endereco, observacoes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING *
        """
        values = (paciente.nome, paciente.nome_responsavel, paciente.data_nascimento,
                 paciente.cpf, paciente.telefone, paciente.email, paciente.endereco,
                 paciente.observacoes)
                 
        result = await self.db.fetch_one(query, *values)
        return Paciente(**result)

    # ...existing code...
