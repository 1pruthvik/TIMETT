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
def get_all(
    timetable_id: int | None = None,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    if timetable_id:
        return db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable_id).all()
    if institution_id:
        from app.models.timetable import Timetable
        from app.models.subject_offering import SubjectOffering
        from app.models.subject import Subject
        from app.models.department import Department
        latest_tt = (
            db.query(Timetable)
            .join(TimetableEntry, Timetable.id == TimetableEntry.timetable_id)
            .join(SubjectOffering, TimetableEntry.subject_offering_id == SubjectOffering.id)
            .join(Subject, SubjectOffering.subject_id == Subject.id)
            .join(Department, Subject.department_id == Department.id)
            .filter(Department.institution_id == institution_id)
            .order_by(Timetable.id.desc())
            .first()
        )
        if not latest_tt:
            latest_tt = db.query(Timetable).order_by(Timetable.id.desc()).first()

        if latest_tt:
            return (
                db.query(TimetableEntry)
                .filter(TimetableEntry.timetable_id == latest_tt.id)
                .all()
            )
        return []
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
