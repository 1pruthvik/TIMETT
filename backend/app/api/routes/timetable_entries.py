from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.timetable_entry import TimetableEntry
from app.schemas.timetable_entry import TimetableEntryCreate, TimetableEntryResponse

router = APIRouter(prefix="/timetable-entries", tags=["Timetable Entries"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TimetableEntryResponse, status_code=201)
def create(data: TimetableEntryCreate, db: Session = Depends(get_db)):
    item = TimetableEntry(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[TimetableEntryResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(TimetableEntry).all()


@router.get("/{item_id}", response_model=TimetableEntryResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = db.query(TimetableEntry).filter(TimetableEntry.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    return item


@router.put("/{item_id}", response_model=TimetableEntryResponse)
def update(item_id: int, data: TimetableEntryCreate, db: Session = Depends(get_db)):
    item = db.query(TimetableEntry).filter(TimetableEntry.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = db.query(TimetableEntry).filter(TimetableEntry.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    db.delete(item)
    db.commit()
