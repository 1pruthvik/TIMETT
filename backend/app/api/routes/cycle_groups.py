from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.cycle_group import CycleGroup
from app.schemas.cycle_group import CycleGroupCreate, CycleGroupResponse, CycleGroupUpdate

router = APIRouter(
    prefix="/cycle-groups",
    tags=["Cycle Groups"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=CycleGroupResponse, status_code=status.HTTP_201_CREATED)
def create_cycle_group(data: CycleGroupCreate, db: Session = Depends(get_db)):
    cycle_group = CycleGroup(**data.model_dump())
    db.add(cycle_group)
    db.commit()
    db.refresh(cycle_group)
    return cycle_group


@router.get("/", response_model=list[CycleGroupResponse])
def get_cycle_groups(stream_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(CycleGroup)
    if stream_id is not None:
        query = query.filter(CycleGroup.stream_id == stream_id)
    return query.all()


@router.get("/{cycle_group_id}", response_model=CycleGroupResponse)
def get_cycle_group(cycle_group_id: int, db: Session = Depends(get_db)):
    cycle_group = db.query(CycleGroup).filter(CycleGroup.id == cycle_group_id).first()
    if not cycle_group:
        raise HTTPException(status_code=404, detail="Cycle group not found")
    return cycle_group


@router.put("/{cycle_group_id}", response_model=CycleGroupResponse)
def update_cycle_group(cycle_group_id: int, data: CycleGroupUpdate, db: Session = Depends(get_db)):
    cycle_group = db.query(CycleGroup).filter(CycleGroup.id == cycle_group_id).first()
    if not cycle_group:
        raise HTTPException(status_code=404, detail="Cycle group not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cycle_group, key, value)
    db.commit()
    db.refresh(cycle_group)
    return cycle_group


@router.delete("/{cycle_group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cycle_group(cycle_group_id: int, db: Session = Depends(get_db)):
    cycle_group = db.query(CycleGroup).filter(CycleGroup.id == cycle_group_id).first()
    if not cycle_group:
        raise HTTPException(status_code=404, detail="Cycle group not found")
    db.delete(cycle_group)
    db.commit()
