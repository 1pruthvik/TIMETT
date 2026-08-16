from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.time_slot import TimeSlot
from app.schemas.time_slot import TimeSlotCreate, TimeSlotResponse

router = APIRouter(prefix="/time-slots", tags=["Time Slots"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TimeSlotResponse, status_code=201)
def create_time_slot(data: TimeSlotCreate, db: Session = Depends(get_db)):
    item = TimeSlot(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[TimeSlotResponse])
def get_time_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()


@router.get("/{time_slot_id}", response_model=TimeSlotResponse)
def get_time_slot(time_slot_id: int, db: Session = Depends(get_db)):
    item = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Time slot not found")

    return item


@router.put("/{time_slot_id}", response_model=TimeSlotResponse)
def update_time_slot(
    time_slot_id: int,
    data: TimeSlotCreate,
    db: Session = Depends(get_db),
):
    item = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Time slot not found")

    item.day_of_week = data.day_of_week
    item.start_time = data.start_time
    item.end_time = data.end_time

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{time_slot_id}", status_code=204)
def delete_time_slot(time_slot_id: int, db: Session = Depends(get_db)):
    item = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Time slot not found")

    db.delete(item)
    db.commit()
