from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.generation_run import GenerationRun
from app.schemas.generation_run import (
    GenerationRunCreate,
    GenerationRunResponse,
)

router = APIRouter(
    prefix="/generation-runs",
    tags=["Generation Runs"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        


@router.post("/", response_model=GenerationRunResponse, status_code=201)
def create(data: GenerationRunCreate, db: Session = Depends(get_db)):
    item = GenerationRun(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[GenerationRunResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(GenerationRun).all()


@router.get("/{item_id}", response_model=GenerationRunResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(GenerationRun)
        .filter(GenerationRun.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Generation run not found",
        )

    return item


@router.put("/{item_id}", response_model=GenerationRunResponse)
def update(
    item_id: int,
    data: GenerationRunCreate,
    db: Session = Depends(get_db),
):
    item = (
        db.query(GenerationRun)
        .filter(GenerationRun.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Generation run not found",
        )

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(GenerationRun)
        .filter(GenerationRun.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Generation run not found",
        )

    db.delete(item)
    db.commit()
