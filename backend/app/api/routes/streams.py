from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.stream import Stream
from app.schemas.stream import StreamCreate, StreamUpdate, StreamResponse

router = APIRouter(
    prefix="/streams",
    tags=["Streams"],
)


@router.get("/", response_model=list[StreamResponse])
def get_streams(institution_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Stream)
    if institution_id is not None:
        query = query.filter(Stream.institution_id == institution_id)
    return query.all()


@router.get("/{stream_id}", response_model=StreamResponse)
def get_stream(stream_id: int, db: Session = Depends(get_db)):
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    return stream


@router.post("/", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
def create_stream(stream_in: StreamCreate, db: Session = Depends(get_db)):
    existing = db.query(Stream).filter(Stream.code == stream_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stream code already exists")
    stream = Stream(**stream_in.model_dump())
    db.add(stream)
    db.commit()
    db.refresh(stream)
    return stream


@router.put("/{stream_id}", response_model=StreamResponse)
def update_stream(stream_id: int, stream_in: StreamUpdate, db: Session = Depends(get_db)):
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    for field, value in stream_in.model_dump(exclude_unset=True).items():
        setattr(stream, field, value)
    db.commit()
    db.refresh(stream)
    return stream


@router.delete("/{stream_id}")
def delete_stream(stream_id: int, db: Session = Depends(get_db)):
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    db.delete(stream)
    db.commit()
    return {"message": "Stream deleted successfully"}

