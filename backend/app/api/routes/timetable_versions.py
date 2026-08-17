from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.timetable_version import TimetableVersion
from app.schemas.timetable_version import (
    TimetableVersionCreate,
    TimetableVersionResponse,
)

router = APIRouter(
    prefix="/timetable-versions",
    tags=["Timetable Versions"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TimetableVersionResponse, status_code=201)
def create(data: TimetableVersionCreate, db: Session = Depends(get_db)):
    item = TimetableVersion(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[TimetableVersionResponse])
def get_all(db: Session = Depends(get_db)):
    return db.query(TimetableVersion).all()


@router.get("/{item_id}", response_model=TimetableVersionResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(TimetableVersion)
        .filter(TimetableVersion.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Timetable version not found",
        )

    return item


@router.put("/{item_id}", response_model=TimetableVersionResponse)
def update(
    item_id: int,
    data: TimetableVersionCreate,
    db: Session = Depends(get_db),
):
    item = (
        db.query(TimetableVersion)
        .filter(TimetableVersion.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Timetable version not found",
        )

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(TimetableVersion)
        .filter(TimetableVersion.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Timetable version not found",
        )

    db.delete(item)
    db.commit()
