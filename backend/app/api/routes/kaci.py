from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.db.database import SessionLocal
from app.services.kaci_service import generate_kaci_response

router = APIRouter(prefix="/kaci", tags=["Kaci AI"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []


class ChatResponse(BaseModel):
    text: str
    type: Optional[str] = "text"
    proposedChanges: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = "Gemini"


@router.post("/chat", response_model=ChatResponse)
async def kaci_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Interact with Kaci powered by Google Gemini."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    result = await generate_kaci_response(
        query=request.message.strip(),
        history=request.history or [],
        db=db
    )

    return ChatResponse(
        text=result.get("text", ""),
        type=result.get("type", "text"),
        proposedChanges=result.get("proposedChanges"),
        model=result.get("model", "Gemini")
    )
