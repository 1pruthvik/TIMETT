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


@router.post("/", response_model=FacultyResponse, status_code=201)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db)):
    item = Faculty(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[FacultyResponse])
def get_faculty(db: Session = Depends(get_db)):
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


@router.delete("/{faculty_id}", status_code=204)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    item = db.query(Faculty).filter(Faculty.id == faculty_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Faculty not found")

    db.delete(item)
    db.commit()
