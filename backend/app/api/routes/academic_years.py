from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.academic_year import AcademicYear
from app.schemas.academic_year import AcademicYearCreate, AcademicYearResponse

router = APIRouter(
    prefix="/academic-years",
    tags=["Academic Years"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.institution import Institution

@router.post("/", response_model=AcademicYearResponse, status_code=201)
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.id == data.institution_id).first()
    if not inst:
        inst = db.query(Institution).first()
        if not inst:
            inst = Institution(name="College Workspace")
            db.add(inst)
            db.commit()
            db.refresh(inst)
        data.institution_id = inst.id

    item = AcademicYear(
        institution_id=data.institution_id,
        name=data.name,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/", response_model=list[AcademicYearResponse])
def get_academic_years(institution_id: int | None = None, db: Session = Depends(get_db)):
    if institution_id:
        return db.query(AcademicYear).filter(AcademicYear.institution_id == institution_id).all()
    return db.query(AcademicYear).all()


@router.get("/{academic_year_id}", response_model=AcademicYearResponse)
def get_academic_year(
    academic_year_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(AcademicYear)
        .filter(AcademicYear.id == academic_year_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Academic year not found",
        )

    return item


@router.put("/{academic_year_id}", response_model=AcademicYearResponse)
def update_academic_year(
    academic_year_id: int,
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
):
    item = (
        db.query(AcademicYear)
        .filter(AcademicYear.id == academic_year_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Academic year not found",
        )

    item.institution_id = data.institution_id
    item.name = data.name

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{academic_year_id}", status_code=204)
def delete_academic_year(
    academic_year_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(AcademicYear)
        .filter(AcademicYear.id == academic_year_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Academic year not found",
        )

    db.delete(item)
    db.commit()
