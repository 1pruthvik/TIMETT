from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.department import Department
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
    item = Department(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
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

    db.delete(item)
    db.commit()
