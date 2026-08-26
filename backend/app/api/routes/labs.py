from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.lab import Lab
from app.models.lab_subject_mapping import LabSubjectMapping
from app.schemas.lab import LabCreate, LabUpdate, LabResponse
from app.schemas.lab_subject_mapping import LabSubjectMappingCreate, LabSubjectMappingResponse

router = APIRouter(prefix="/labs", tags=["labs"])


@router.get("/", response_model=list[LabResponse])
def get_labs(db: Session = Depends(get_db)):
    return db.query(Lab).all()


@router.post("/", response_model=LabResponse)
def create_lab(lab_in: LabCreate, db: Session = Depends(get_db)):
    lab = Lab(**lab_in.model_dump())
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


@router.put("/{lab_id}", response_model=LabResponse)
def update_lab(lab_id: int, lab_in: LabUpdate, db: Session = Depends(get_db)):
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    for field, value in lab_in.model_dump(exclude_unset=True).items():
        setattr(lab, field, value)
    db.commit()
    db.refresh(lab)
    return lab


@router.delete("/{lab_id}")
def delete_lab(lab_id: int, db: Session = Depends(get_db)):
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    db.delete(lab)
    db.commit()
    return {"message": "Lab deleted successfully"}


# ── Lab Subject Mappings ──

@router.get("/mappings", response_model=list[LabSubjectMappingResponse])
def get_lab_subject_mappings(db: Session = Depends(get_db)):
    return db.query(LabSubjectMapping).all()


@router.post("/mappings", response_model=LabSubjectMappingResponse)
def map_subject_to_lab(mapping_in: LabSubjectMappingCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(LabSubjectMapping)
        .filter(
            LabSubjectMapping.subject_id == mapping_in.subject_id,
            LabSubjectMapping.lab_id == mapping_in.lab_id,
        )
        .first()
    )
    if existing:
        return existing

    mapping = LabSubjectMapping(**mapping_in.model_dump())
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping


@router.delete("/mappings/{mapping_id}")
def delete_lab_subject_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = db.query(LabSubjectMapping).filter(LabSubjectMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    db.delete(mapping)
    db.commit()
    return {"message": "Mapping removed successfully"}
