from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.plano import Plano
from app.schemas.plano import PlanoCreate, PlanoUpdate, PlanoInDB

router = APIRouter(prefix="/api/planos", tags=["planos"])

@router.get("/", response_model=List[PlanoInDB])
def listar_planos(db: Session = Depends(get_db)):
    return db.query(Plano).all()

@router.post("/", response_model=PlanoInDB)
def criar_plano(plano: PlanoCreate, db: Session = Depends(get_db)):
    db_plano = Plano(**plano.model_dump())
    db.add(db_plano)
    db.commit()
    db.refresh(db_plano)
    return db_plano

@router.get("/{plano_id}", response_model=PlanoInDB)
def obter_plano(plano_id: int, db: Session = Depends(get_db)):
    plano = db.query(Plano).filter(Plano.id == plano_id).first()
    if plano is None:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return plano

@router.put("/{plano_id}", response_model=PlanoInDB)
def atualizar_plano(plano_id: int, plano: PlanoUpdate, db: Session = Depends(get_db)):
    db_plano = db.query(Plano).filter(Plano.id == plano_id).first()
    if db_plano is None:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    for key, value in plano.model_dump(exclude_unset=True).items():
        setattr(db_plano, key, value)
    
    db.commit()
    db.refresh(db_plano)
    return db_plano

@router.delete("/{plano_id}")
def deletar_plano(plano_id: int, db: Session = Depends(get_db)):
    plano = db.query(Plano).filter(Plano.id == plano_id).first()
    if plano is None:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    db.delete(plano)
    db.commit()
    return {"message": "Plano deletado com sucesso"}
