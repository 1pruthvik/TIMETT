from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.solver.service import generate_timetable, generate_joint_timetable

router = APIRouter(prefix="/generator", tags=["generator"])


class GenerateRequest(BaseModel):
    semester_id: int | None = None
    institution_id: int | None = 1
    generation_type: str = "single"  # single or joint_first_year
    joint_semester_ids: list[int] | None = None


@router.post("/generate")
def run_generator(
    semester_id: int | None = None,
    institution_id: int | None = 1,
    generation_type: str = "single",
    req: GenerateRequest | None = None,
    db: Session = Depends(get_db),
):
    """
    Triggers Chronon CP-SAT deterministic scheduler.
    Supports single semester (2nd-4th year) or joint mirrored first-year cycles.
    """
    sem_id = req.semester_id if req and req.semester_id else semester_id
    inst_id = req.institution_id if req and req.institution_id else institution_id
    gen_type = req.generation_type if req and req.generation_type else generation_type
    joint_sems = req.joint_semester_ids if req and req.joint_semester_ids else None

    return generate_timetable(
        db,
        semester_id=sem_id,
        institution_id=inst_id,
        generation_type=gen_type,
        joint_semester_ids=joint_sems,
    )


@router.post("/generate-joint")
def generate_joint(
    sem1_id: int,
    sem2_id: int,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    return generate_joint_timetable(db, sem1_id=sem1_id, sem2_id=sem2_id, institution_id=institution_id)
