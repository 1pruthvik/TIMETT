from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.department import Department
from app.models.institution import Institution

@router.post("/", response_model=SubjectResponse, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
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

    item = Subject(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[SubjectResponse])
def get_subjects(
    department_id: int | None = None,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    elif institution_id:
        query = query.join(Department).filter(Department.institution_id == institution_id)
    return query.all()


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    item = db.query(Subject).filter(Subject.id == subject_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject not found")

    return item


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    data: SubjectCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Subject).filter(Subject.id == subject_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject not found")

    item.department_id = data.department_id
    item.name = data.name
    item.code = data.code

    db.commit()
    db.refresh(item)

    return item


from app.models.subject_offering import SubjectOffering
from app.models.timetable_entry import TimetableEntry

@router.delete("/{subject_id}", status_code=204)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    item = db.query(Subject).filter(Subject.id == subject_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject not found")

    offering_ids = [o.id for o in db.query(SubjectOffering.id).filter(SubjectOffering.subject_id == subject_id).all()]
    if offering_ids:
        db.query(TimetableEntry).filter(TimetableEntry.subject_offering_id.in_(offering_ids)).delete(synchronize_session=False)

    db.query(SubjectOffering).filter(SubjectOffering.subject_id == subject_id).delete(synchronize_session=False)

    db.delete(item)
    db.commit()
