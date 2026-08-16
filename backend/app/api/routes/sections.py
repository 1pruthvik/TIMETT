from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.section import Section
from app.schemas.section import SectionCreate, SectionResponse

router = APIRouter(prefix="/sections", tags=["Sections"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SectionResponse, status_code=201)
def create_section(data: SectionCreate, db: Session = Depends(get_db)):
    item = Section(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[SectionResponse])
def get_sections(db: Session = Depends(get_db)):
    return db.query(Section).all()


@router.get("/{section_id}", response_model=SectionResponse)
def get_section(section_id: int, db: Session = Depends(get_db)):
    item = db.query(Section).filter(Section.id == section_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Section not found")

    return item


@router.put("/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    data: SectionCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Section).filter(Section.id == section_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Section not found")

    item.department_id = data.department_id
    item.name = data.name

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{section_id}", status_code=204)
def delete_section(section_id: int, db: Session = Depends(get_db)):
    item = db.query(Section).filter(Section.id == section_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Section not found")

    db.delete(item)
    db.commit()
