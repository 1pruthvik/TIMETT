from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.section import Section
from app.schemas.section import SectionCreate, SectionResponse

router = APIRouter(prefix="/sections", tags=["Sections"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.department import Department
from app.models.institution import Institution

@router.post("/", response_model=SectionResponse, status_code=201)
def create_section(data: SectionCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        inst = db.query(Institution).first()
        if not inst:
            inst = Institution(name="College Workspace")
            db.add(inst)
            db.commit()
            db.refresh(inst)
        dept = Department(name="Computer Science & Engineering", institution_id=inst.id)
        db.add(dept)
        db.commit()
        db.refresh(dept)
        data.department_id = dept.id

    item = Section(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[SectionResponse])
def get_sections(
    department_id: int | None = None,
    institution_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Section)
    if department_id:
        query = query.filter(Section.department_id == department_id)
    elif institution_id:
        query = query.join(Department).filter(Department.institution_id == institution_id)
    return query.all()


@router.get("/{section_id}", response_model=SectionResponse)
def get_section(section_id: int, db: Session = Depends(get_db)):
    item = db.query(Section).filter(Section.id == section_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Section not found")

    return item


@router.put("/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    data: SectionCreate,
    db: Session = Depends(get_db),
):
    item = db.query(Section).filter(Section.id == section_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Section not found")

    item.department_id = data.department_id
    item.name = data.name
    item.student_count = data.student_count
    item.room_number = data.room_number

    db.commit()
    db.refresh(item)

    return item


from app.models.subject_offering import SubjectOffering
from app.models.timetable_entry import TimetableEntry

@router.delete("/{section_id}", status_code=204)
def delete_section(section_id: int, db: Session = Depends(get_db)):
    item = db.query(Section).filter(Section.id == section_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Section not found")

    offering_ids = [o.id for o in db.query(SubjectOffering.id).filter(SubjectOffering.section_id == section_id).all()]
    if offering_ids:
        db.query(TimetableEntry).filter(TimetableEntry.subject_offering_id.in_(offering_ids)).delete(synchronize_session=False)

    db.query(SubjectOffering).filter(SubjectOffering.section_id == section_id).delete(synchronize_session=False)

    db.delete(item)
    db.commit()
