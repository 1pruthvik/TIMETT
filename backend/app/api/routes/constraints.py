from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.constraint import Constraint
from app.schemas.constraint import ConstraintCreate, ConstraintResponse

router = APIRouter(prefix="/constraints", tags=["Constraints"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ConstraintResponse, status_code=201)
def create(data: ConstraintCreate, db: Session = Depends(get_db)):
    item = Constraint(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[ConstraintResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(Constraint).all()


@router.get("/{item_id}", response_model=ConstraintResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Constraint).filter(Constraint.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Constraint not found")

    return item


@router.put("/{item_id}", response_model=ConstraintResponse)
def update(item_id: int, data: ConstraintCreate, db: Session = Depends(get_db)):
    item = db.query(Constraint).filter(Constraint.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Constraint not found")

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Constraint).filter(Constraint.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Constraint not found")

    db.delete(item)
    db.commit()
