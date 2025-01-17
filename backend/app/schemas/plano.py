from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PlanoBase(BaseModel):
    nome: str
    codigo_operadora: str
    ativo: bool = True

class PlanoCreate(PlanoBase):
    pass

class PlanoUpdate(PlanoBase):
    nome: Optional[str] = None
    codigo_operadora: Optional[str] = None
    ativo: Optional[bool] = None

class PlanoInDB(PlanoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
