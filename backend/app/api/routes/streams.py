from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.stream import Stream
from app.schemas.stream import StreamCreate, StreamResponse, StreamUpdate

router = APIRouter(
    prefix="/streams",
    tags=["Streams"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
def create_stream(data: StreamCreate, db: Session = Depends(get_db)):
    stream = Stream(**data.model_dump())
    db.add(stream)
    db.commit()
    db.refresh(stream)
    return stream


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


@router.put("/{stream_id}", response_model=StreamResponse)
def update_stream(stream_id: int, data: StreamUpdate, db: Session = Depends(get_db)):
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(stream, key, value)
    db.commit()
    db.refresh(stream)
    return stream


@router.delete("/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stream(stream_id: int, db: Session = Depends(get_db)):
    stream = db.query(Stream).filter(Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    db.delete(stream)
    db.commit()
