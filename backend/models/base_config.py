from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class BaseModelConfig(BaseModel):
    """Classe base para todos os modelos Pydantic do sistema"""
    id: Optional[str] = Field(default=None)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
        validate_assignment = True
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
        
    def to_dict(self):
        """Converte o modelo para dicionário, formatando datas para ISO"""
        return {
            key: (value.isoformat() if isinstance(value, datetime) else value)
            for key, value in self.dict().items()
            if value is not None
        }