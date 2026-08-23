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


@router.get("/latest", response_model=TimetableResponse)
def get_latest(
    semester_id: int | None = None,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Timetable)
    if semester_id:
        query = query.filter(Timetable.semester_id == semester_id)
    if institution_id:
        from app.models.timetable_entry import TimetableEntry
        from app.models.subject_offering import SubjectOffering
        from app.models.subject import Subject
        from app.models.department import Department
        from app.models.semester import Semester
        from app.models.academic_year import AcademicYear

        inst_tt = (
            db.query(Timetable)
            .join(TimetableEntry, Timetable.id == TimetableEntry.timetable_id)
            .join(SubjectOffering, TimetableEntry.subject_offering_id == SubjectOffering.id)
            .join(Subject, SubjectOffering.subject_id == Subject.id)
            .join(Department, Subject.department_id == Department.id)
            .filter(Department.institution_id == institution_id)
            .order_by(Timetable.id.desc())
            .first()
        )
        if inst_tt:
            return inst_tt

        ay_tt = (
            db.query(Timetable)
            .join(Semester, Timetable.semester_id == Semester.id)
            .join(AcademicYear, Semester.academic_year_id == AcademicYear.id)
            .filter(AcademicYear.institution_id == institution_id)
            .order_by(Timetable.id.desc())
            .first()
        )
        if ay_tt:
            return ay_tt

    item = query.order_by(Timetable.id.desc()).first()

    if not item:
        raise HTTPException(status_code=404, detail="No generated timetable found")

    return item


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

    from app.models.timetable_entry import TimetableEntry
    from app.models.timetable_version import TimetableVersion
    from app.models.generation_run import GenerationRun

    db.query(TimetableEntry).filter(TimetableEntry.timetable_id == item_id).delete()
    db.query(TimetableVersion).filter(TimetableVersion.timetable_id == item_id).delete()
    db.query(GenerationRun).filter(GenerationRun.timetable_id == item_id).delete()

    db.delete(item)
    db.commit()
