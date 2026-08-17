from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.institution import Institution
from app.schemas.institution import InstitutionCreate, InstitutionResponse

router = APIRouter(prefix="/institutions", tags=["Institutions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=InstitutionResponse, status_code=201)
def create_institution(
    institution: InstitutionCreate,
    db: Session = Depends(get_db),
):
    new_institution = Institution(name=institution.name)

    db.add(new_institution)
    db.commit()
    db.refresh(new_institution)

    return new_institution


@router.get("/", response_model=list[InstitutionResponse])
def get_institutions(db: Session = Depends(get_db)):
    return db.query(Institution).all()


@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution(
    institution_id: int,
    db: Session = Depends(get_db),
):
    institution = (
        db.query(Institution)
        .filter(Institution.id == institution_id)
        .first()
    )

    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    return institution


@router.put("/{institution_id}", response_model=InstitutionResponse)
def update_institution(
    institution_id: int,
    data: InstitutionCreate,
    db: Session = Depends(get_db),
):
    institution = (
        db.query(Institution)
        .filter(Institution.id == institution_id)
        .first()
    )

    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    institution.name = data.name

    db.commit()
    db.refresh(institution)

    return institution


@router.delete("/{institution_id}", status_code=204)
def delete_institution(
    institution_id: int,
    db: Session = Depends(get_db),
):
    institution = (
        db.query(Institution)
        .filter(Institution.id == institution_id)
        .first()
    )

    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    db.delete(institution)
    db.commit()