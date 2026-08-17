from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.faculty import Faculty
from app.schemas.faculty import FacultyCreate, FacultyResponse

router = APIRouter(prefix="/faculty", tags=["Faculty"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.department import Department
from app.models.institution import Institution

@router.post("/", response_model=FacultyResponse, status_code=201)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        inst = db.query(Institution).first()
        if not inst:
            inst = Institution(name="College Workspace")
            db.add(inst)
            db.commit()
            db.refresh(inst)
        dept = Department(name="Computer Science & Engineering", institution_id=inst.id)
        db.add(dept)
        db.commit()
        db.refresh(dept)
        data.department_id = dept.id

    item = Faculty(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[FacultyResponse])
def get_faculty(department_id: int | None = None, db: Session = Depends(get_db)):
    if department_id:
        return db.query(Faculty).filter(Faculty.department_id == department_id).all()
    return db.query(Faculty).all()


@router.get("/{faculty_id}", response_model=FacultyResponse)
def get_faculty_by_id(faculty_id: int, db: Session = Depends(get_db)):
    item = db.query(Faculty).filter(Faculty.id == faculty_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Faculty not found")

    return item


@router.put("/{faculty_id}", response_model=FacultyResponse)
def update_faculty(
    faculty_id: int,
    data: FacultyCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Faculty).filter(Faculty.id == faculty_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Faculty not found")

    item.department_id = data.department_id
    item.name = data.name
    item.designation = data.designation

    db.commit()
    db.refresh(item)

    return item


from app.models.subject_offering import SubjectOffering
from app.models.faculty_availability import FacultyAvailability
from app.models.timetable_entry import TimetableEntry

@router.delete("/{faculty_id}", status_code=204)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    item = db.query(Faculty).filter(Faculty.id == faculty_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Faculty not found")

    # 1. Find all offerings for this faculty
    offering_ids = [o.id for o in db.query(SubjectOffering.id).filter(SubjectOffering.faculty_id == faculty_id).all()]

    # 2. Delete any timetable entries referencing those offerings
    if offering_ids:
        db.query(TimetableEntry).filter(TimetableEntry.subject_offering_id.in_(offering_ids)).delete(synchronize_session=False)

    # 3. Delete offerings and availability
    db.query(SubjectOffering).filter(SubjectOffering.faculty_id == faculty_id).delete(synchronize_session=False)
    db.query(FacultyAvailability).filter(FacultyAvailability.faculty_id == faculty_id).delete(synchronize_session=False)

    # 4. Delete the faculty member
    db.delete(item)
    db.commit()
