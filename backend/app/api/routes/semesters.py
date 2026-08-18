from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.semester import Semester
from app.schemas.semester import SemesterCreate, SemesterResponse

router = APIRouter(
    prefix="/semesters",
    tags=["Semesters"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.academic_year import AcademicYear
from app.models.institution import Institution

@router.post("/", response_model=SemesterResponse, status_code=201)
def create_semester(
    data: SemesterCreate,
    db: Session = Depends(get_db),
):
    yr = db.query(AcademicYear).filter(AcademicYear.id == data.academic_year_id).first()
    if not yr:
        inst = db.query(Institution).first()
        if not inst:
            inst = Institution(name="College Workspace")
            db.add(inst)
            db.commit()
            db.refresh(inst)
        yr = AcademicYear(name="2026 - 2027", institution_id=inst.id)
        db.add(yr)
        db.commit()
        db.refresh(yr)
        data.academic_year_id = yr.id

    item = Semester(**data.model_dump())

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/", response_model=list[SemesterResponse])
def get_semesters(
    institution_id: int | None = None,
    academic_year_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Semester)
    if academic_year_id:
        query = query.filter(Semester.academic_year_id == academic_year_id)
    elif institution_id:
        query = query.join(AcademicYear).filter(AcademicYear.institution_id == institution_id)
    return query.all()


@router.get("/{semester_id}", response_model=SemesterResponse)
def get_semester(
    semester_id: int,
    db: Session = Depends(get_db),
):
    item = db.query(Semester).filter(Semester.id == semester_id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Semester not found",
        )

    return item


@router.put("/{semester_id}", response_model=SemesterResponse)
def update_semester(
    semester_id: int,
    data: SemesterCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Semester).filter(Semester.id == semester_id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Semester not found",
        )

    item.academic_year_id = data.academic_year_id
    item.name = data.name

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{semester_id}", status_code=204)
def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
):
    item = db.query(Semester).filter(Semester.id == semester_id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Semester not found",
        )

    db.delete(item)
    db.commit()
