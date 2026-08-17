from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.timetable import Timetable
from app.schemas.timetable import TimetableCreate, TimetableResponse

router = APIRouter(prefix="/timetables", tags=["Timetables"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TimetableResponse, status_code=201)
def create(data: TimetableCreate, db: Session = Depends(get_db)):
    item = Timetable(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[TimetableResponse])
def get_all(semester_id: int | None = None, db: Session = Depends(get_db)):
    if semester_id:
        return db.query(Timetable).filter(Timetable.semester_id == semester_id).all()
    return db.query(Timetable).all()


@router.get("/{item_id}", response_model=TimetableResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Timetable).filter(Timetable.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Timetable not found")

    return item


@router.put("/{item_id}", response_model=TimetableResponse)
def update(item_id: int, data: TimetableCreate, db: Session = Depends(get_db)):
    item = db.query(Timetable).filter(Timetable.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Timetable not found")

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Timetable).filter(Timetable.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Timetable not found")

    db.delete(item)
    db.commit()
