from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.subject_offering import SubjectOffering
from app.schemas.subject_offering import SubjectOfferingCreate, SubjectOfferingResponse

router = APIRouter(prefix="/subject-offerings", tags=["Subject Offerings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SubjectOfferingResponse, status_code=201)
def create(data: SubjectOfferingCreate, db: Session = Depends(get_db)):
    item = SubjectOffering(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[SubjectOfferingResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(SubjectOffering).all()


@router.get("/{item_id}", response_model=SubjectOfferingResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = db.query(SubjectOffering).filter(SubjectOffering.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject offering not found")

    return item


@router.put("/{item_id}", response_model=SubjectOfferingResponse)
def update(item_id: int, data: SubjectOfferingCreate, db: Session = Depends(get_db)):
    item = db.query(SubjectOffering).filter(SubjectOffering.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject offering not found")

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = db.query(SubjectOffering).filter(SubjectOffering.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject offering not found")

    db.delete(item)
    db.commit()
