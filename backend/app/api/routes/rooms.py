from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomResponse

router = APIRouter(prefix="/rooms", tags=["Rooms"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.institution import Institution

@router.post("/", response_model=RoomResponse, status_code=201)
def create_room(data: RoomCreate, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == data.institution_id).first()
    if not inst:
        inst = Institution(name="College Workspace")
        db.add(inst)
        db.commit()
        db.refresh(inst)
        data.institution_id = inst.id

    item = Room(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[RoomResponse])
def get_rooms(institution_id: int | None = None, db: Session = Depends(get_db)):
    if institution_id:
        return db.query(Room).filter(Room.institution_id == institution_id).all()
    return db.query(Room).all()


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    item = db.query(Room).filter(Room.id == room_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Room not found")

    return item


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    data: RoomCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Room).filter(Room.id == room_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Room not found")

    item.institution_id = data.institution_id
    item.name = data.name
    item.capacity = data.capacity
    item.room_type = data.room_type

    db.commit()
    db.refresh(item)

    return item


from app.models.timetable_entry import TimetableEntry

@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    item = db.query(Room).filter(Room.id == room_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Room not found")

    db.query(TimetableEntry).filter(TimetableEntry.room_id == room_id).delete(synchronize_session=False)

    db.delete(item)
    db.commit()
