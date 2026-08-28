import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.batch import Batch
from app.models.section import Section
from app.schemas.batch import BatchCreate, BatchUpdate, BatchResponse

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("/", response_model=list[BatchResponse])
def get_batches(section_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Batch)
    if section_id is not None:
        query = query.filter(Batch.section_id == section_id)
    return query.all()


@router.post("/calculate-for-section/{section_id}", response_model=list[BatchResponse])
def calculate_batches_for_section(
    section_id: int,
    lab_capacity: int = 30,
    db: Session = Depends(get_db),
):
    """
    Deterministic Batch Division:
    Batches = ceil(Section Students / Lab Capacity) -> B1, B2, B3...
    """
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    student_count = section.student_count or 60
    num_batches = max(1, math.ceil(student_count / lab_capacity))

    # Clear existing batches for this section
    db.query(Batch).filter(Batch.section_id == section_id).delete()

    created_batches = []
    students_per_batch = math.ceil(student_count / num_batches)

    for i in range(1, num_batches + 1):
        batch = Batch(
            section_id=section_id,
            name=f"B{i}",
            student_count=min(students_per_batch, student_count - (i - 1) * students_per_batch),
            batch_index=i,
        )
        db.add(batch)
        created_batches.append(batch)

    section.batch_count = num_batches
    db.commit()

    for b in created_batches:
        db.refresh(b)

    return created_batches


@router.post("/", response_model=BatchResponse)
def create_custom_batch(batch_in: BatchCreate, db: Session = Depends(get_db)):
    batch = Batch(**batch_in.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    db.delete(batch)
    db.commit()
    return {"message": "Batch deleted successfully"}
