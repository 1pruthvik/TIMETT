from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.models.branch import Branch
from app.models.subject import Subject
from app.models.faculty import Faculty
from app.schemas.document import DocumentResponse, DocumentConfirmRequest
from app.ingestion.ocr_service import DocumentExtractionService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/", response_model=list[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("syllabus"),
    institution_id: int = Form(1),
    db: Session = Depends(get_db),
):
    """
    Uploads a syllabus or faculty file, performs candidate parsing,
    and returns extracted candidates for Human Review.
    """
    file_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    file_extension = filename.split(".")[-1].lower() if "." in filename else "txt"

    # Extract text and parse candidates
    raw_text = DocumentExtractionService.extract_text(file_bytes, filename)
    candidates = DocumentExtractionService.parse_candidates(raw_text, doc_type=doc_type)

    doc = Document(
        institution_id=institution_id,
        filename=filename,
        file_type=file_extension,
        doc_type=doc_type,
        status="PENDING_REVIEW",
        extracted_data=candidates,
        raw_text=raw_text[:2000] if raw_text else None,  # Store excerpt
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{document_id}/confirm", response_model=DocumentResponse)
def confirm_document_candidates(
    document_id: int,
    confirm_req: DocumentConfirmRequest,
    db: Session = Depends(get_db),
):
    """
    Human Review Confirmation step:
    Saves approved candidates into the authoritative database tables.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Ingest Confirmed Branches
    if confirm_req.confirmed_branches:
        for b in confirm_req.confirmed_branches:
            existing_b = db.query(Branch).filter(Branch.code == b.get("code")).first()
            if not existing_b:
                new_branch = Branch(
                    institution_id=doc.institution_id or 1,
                    name=b.get("name", "Branch"),
                    code=b.get("code", "BR"),
                    student_count=b.get("student_count", 60),
                )
                db.add(new_branch)

    # 2. Ingest Confirmed Subjects
    if confirm_req.confirmed_subjects:
        for s in confirm_req.confirmed_subjects:
            existing_s = db.query(Subject).filter(Subject.code == s.get("code")).first()
            if not existing_s:
                new_sub = Subject(
                    department_id=s.get("department_id", 1),
                    name=s.get("name", "Subject"),
                    code=s.get("code", "SUB"),
                    is_lab=s.get("is_lab", False),
                    subject_type=s.get("subject_type", "Theory"),
                    weekly_hours=s.get("weekly_hours", 4),
                    cycle_group=s.get("cycle_group"),
                    scheme=s.get("scheme", "2022 Scheme"),
                )
                db.add(new_sub)

    # 3. Ingest Confirmed Faculty
    if confirm_req.confirmed_faculty:
        for f in confirm_req.confirmed_faculty:
            existing_f = db.query(Faculty).filter(Faculty.name == f.get("name")).first()
            if not existing_f:
                new_fac = Faculty(
                    department_id=f.get("department_id", 1),
                    name=f.get("name", "Instructor"),
                    designation=f.get("designation", "Assistant Professor"),
                )
                db.add(new_fac)

    doc.status = "CONFIRMED"
    doc.confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc
