from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.faculty_availability import FacultyAvailability
from app.schemas.faculty_availability import (
    FacultyAvailabilityCreate,
    FacultyAvailabilityResponse,
)

router = APIRouter(
    prefix="/faculty-availability",
    tags=["Faculty Availability"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=FacultyAvailabilityResponse, status_code=201)
def create_availability(
    data: FacultyAvailabilityCreate,
    db: Session = Depends(get_db),
):
    item = FacultyAvailability(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[FacultyAvailabilityResponse])
def get_availability(db: Session = Depends(get_db)):
    return db.query(FacultyAvailability).all()


@router.get("/{availability_id}", response_model=FacultyAvailabilityResponse)
def get_availability_by_id(
    availability_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(FacultyAvailability)
        .filter(FacultyAvailability.id == availability_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Faculty availability not found",
        )

    return item


@router.put("/{availability_id}", response_model=FacultyAvailabilityResponse)
def update_availability(
    availability_id: int,
    data: FacultyAvailabilityCreate,
    db: Session = Depends(get_db),
):
    item = (
        db.query(FacultyAvailability)
        .filter(FacultyAvailability.id == availability_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Faculty availability not found",
        )

    item.faculty_id = data.faculty_id
    item.day_of_week = data.day_of_week
    item.start_time = data.start_time
    item.end_time = data.end_time

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{availability_id}", status_code=204)
def delete_availability(
    availability_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(FacultyAvailability)
        .filter(FacultyAvailability.id == availability_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Faculty availability not found",
        )

    db.delete(item)
    db.commit()
