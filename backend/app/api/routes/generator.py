from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.solver.service import generate_timetable

router = APIRouter(
    prefix="/generator",
    tags=["Timetable Generator"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/generate")
def generate(
    semester_id: int | None = None,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    return generate_timetable(db, semester_id=semester_id, institution_id=institution_id)