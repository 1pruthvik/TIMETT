from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.department import Department
from app.models.faculty import Faculty
from app.models.institution import Institution
from app.models.section import Section
from app.models.subject import Subject
from app.models.subject_offering import SubjectOffering
from app.models.timetable_entry import TimetableEntry
from app.schemas.department import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=DepartmentResponse, status_code=201)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == data.institution_id).first()
    if not inst:
        inst = Institution(name="College Workspace")
        db.add(inst)
        db.commit()
        db.refresh(inst)
        data.institution_id = inst.id

    item = Department(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[DepartmentResponse])
def get_departments(institution_id: int | None = None, db: Session = Depends(get_db)):
    if institution_id:
        return db.query(Department).filter(Department.institution_id == institution_id).all()
    return db.query(Department).all()


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(department_id: int, db: Session = Depends(get_db)):
    item = db.query(Department).filter(Department.id == department_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Department not found")

    return item


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    data: DepartmentCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Department).filter(Department.id == department_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Department not found")

    item.institution_id = data.institution_id
    item.name = data.name

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    item = db.query(Department).filter(Department.id == department_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Department not found")

    # 1. Fetch all child IDs under this department
    section_ids = [s.id for s in db.query(Section.id).filter(Section.department_id == department_id).all()]
    faculty_ids = [f.id for f in db.query(Faculty.id).filter(Faculty.department_id == department_id).all()]
    subject_ids = [sub.id for sub in db.query(Subject.id).filter(Subject.department_id == department_id).all()]

    # 2. Find all subject offerings tied to any of these entities
    offering_query = db.query(SubjectOffering)
    offering_conditions = []
    if section_ids:
        offering_conditions.append(SubjectOffering.section_id.in_(section_ids))
    if faculty_ids:
        offering_conditions.append(SubjectOffering.faculty_id.in_(faculty_ids))
    if subject_ids:
        offering_conditions.append(SubjectOffering.subject_id.in_(subject_ids))

    if offering_conditions:
        from sqlalchemy import or_
        offerings = db.query(SubjectOffering.id).filter(or_(*offering_conditions)).all()
        offering_ids = [o.id for o in offerings]

        if offering_ids:
            # Delete timetable entries for these offerings
            db.query(TimetableEntry).filter(TimetableEntry.subject_offering_id.in_(offering_ids)).delete(synchronize_session=False)
            # Delete offerings
            db.query(SubjectOffering).filter(SubjectOffering.id.in_(offering_ids)).delete(synchronize_session=False)

    # 3. Delete sections, faculty, subjects
    if section_ids:
        db.query(Section).filter(Section.id.in_(section_ids)).delete(synchronize_session=False)
    if faculty_ids:
        db.query(Faculty).filter(Faculty.id.in_(faculty_ids)).delete(synchronize_session=False)
    if subject_ids:
        db.query(Subject).filter(Subject.id.in_(subject_ids)).delete(synchronize_session=False)

    # 4. Delete the department itself
    db.delete(item)
    db.commit()
