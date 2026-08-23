from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.subject_offering import SubjectOffering
from app.schemas.subject_offering import SubjectOfferingCreate, SubjectOfferingResponse

router = APIRouter(prefix="/subject-offerings", tags=["Subject Offerings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SubjectOfferingResponse, status_code=201)
def create(data: SubjectOfferingCreate, db: Session = Depends(get_db)):
    item = SubjectOffering(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


from app.models.subject import Subject
from app.models.semester import Semester
from app.models.academic_year import AcademicYear
from app.models.department import Department

@router.get("/", response_model=list[SubjectOfferingResponse])
def get_all(
    semester_id: int | None = None,
    department_id: int | None = None,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(SubjectOffering)
    if semester_id:
        query = query.filter(SubjectOffering.semester_id == semester_id)
    if department_id:
        query = query.join(Subject, SubjectOffering.subject_id == Subject.id).filter(Subject.department_id == department_id)
    elif institution_id:
        query = query.outerjoin(Semester, SubjectOffering.semester_id == Semester.id)\
                     .outerjoin(AcademicYear, Semester.academic_year_id == AcademicYear.id)\
                     .outerjoin(Subject, SubjectOffering.subject_id == Subject.id)\
                     .outerjoin(Department, Subject.department_id == Department.id)\
                     .filter(
                         (AcademicYear.institution_id == institution_id) |
                         (Department.institution_id == institution_id)
                     )
    return query.all()


@router.get("/{item_id}", response_model=SubjectOfferingResponse)
def get_one(item_id: int, db: Session = Depends(get_db)):
    item = db.query(SubjectOffering).filter(SubjectOffering.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject offering not found")

    return item


@router.put("/{item_id}", response_model=SubjectOfferingResponse)
def update(item_id: int, data: SubjectOfferingCreate, db: Session = Depends(get_db)):
    item = db.query(SubjectOffering).filter(SubjectOffering.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject offering not found")

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete(item_id: int, db: Session = Depends(get_db)):
    item = db.query(SubjectOffering).filter(SubjectOffering.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Subject offering not found")

    db.delete(item)
    db.commit()
