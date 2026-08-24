import os
import json
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.models.faculty import Faculty
from app.models.department import Department
from app.models.subject import Subject
from app.models.section import Section
from app.models.room import Room
from app.models.constraint import Constraint
from app.models.institution import Institution

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

CANDIDATE_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


def get_gemini_api_key() -> str:
    """Dynamically reload .env to ensure fresh API keys are read immediately."""
    if ENV_PATH.exists():
        load_dotenv(dotenv_path=ENV_PATH, override=True)
    else:
        load_dotenv(override=True)

    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    return key.strip().strip("'").strip('"')


def get_or_create_institution(db: Session, institution_id: Optional[int] = None) -> Institution:
    """Get the user's active institution or fallback gracefully."""
    if institution_id:
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if inst:
            return inst

    inst = db.query(Institution).order_by(Institution.id.desc()).first()
    if not inst:
        inst = Institution(name="College of Engineering & Technology")
        db.add(inst)
        db.commit()
        db.refresh(inst)
    return inst


def get_or_create_department(db: Session, dept_name: str, institution_id: Optional[int] = None) -> Department:
    """Find department by name in active institution or create it."""
    inst = get_or_create_institution(db, institution_id)
    name = dept_name.strip() if dept_name else "Computer Science & Engineering"
    dept = db.query(Department).filter(
        Department.institution_id == inst.id,
        Department.name.ilike(f"%{name}%")
    ).first()
    if not dept:
        dept = Department(name=name, institution_id=inst.id)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    return dept


def get_live_institution_context(db: Session, institution_id: Optional[int] = None) -> str:
    """Fetch summarized active context from the database for the current tenant to ground Gemini."""
    try:
        inst = get_or_create_institution(db, institution_id)
        rooms = [f"{r.name} (Type: {r.room_type or 'CLASSROOM'}, Cap: {r.capacity})" for r in db.query(Room).filter(Room.institution_id == inst.id).limit(50).all()]
        departments = [d.name for d in db.query(Department).filter(Department.institution_id == inst.id).all()]
        dept_ids = [d.id for d in db.query(Department).filter(Department.institution_id == inst.id).all()]
        faculty_list = [f"{f.name} ({f.designation or 'Faculty'})" for f in db.query(Faculty).filter(Faculty.department_id.in_(dept_ids)).limit(40).all()] if dept_ids else []
        subjects = [f"{s.name} ({s.code})" for s in db.query(Subject).filter(Subject.department_id.in_(dept_ids)).limit(40).all()] if dept_ids else []
        sections = [f"{sec.name} (Cap: {sec.student_count})" for sec in db.query(Section).filter(Section.department_id.in_(dept_ids)).limit(25).all()] if dept_ids else []
        constraints = [f"{c.type} ({c.hardness})" for c in db.query(Constraint).filter(Constraint.active == True).limit(15).all()]

        context = (
            f"Active Institution: {inst.name} (ID: {inst.id})\n"
            f"Rooms & Labs Inventory: {', '.join(rooms) if rooms else 'None'}\n"
            f"Active Departments: {', '.join(departments) if departments else 'None'}\n"
            f"Faculty Members: {', '.join(faculty_list) if faculty_list else 'None'}\n"
            f"Subjects/Courses: {', '.join(subjects) if subjects else 'None'}\n"
            f"Student Sections: {', '.join(sections) if sections else 'None'}\n"
            f"Active CP-SAT Constraints: {', '.join(constraints) if constraints else 'Standard single-occupancy invariants'}\n"
        )
        return context
    except Exception as e:
        return f"Context load error: {str(e)}"


async def generate_kaci_response(
    query: str,
    history: List[Dict[str, Any]],
    db: Session,
    institution_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Call Google Gemini with full multi-turn conversation memory and live database upsert tools."""
    api_key = get_gemini_api_key()

    if not api_key:
        return {
            "text": f"I received your request: \"{query}\".\n\nTo unlock live **Google Gemini** automated database actions and schedule optimization, add your API key in `backend/.env`:\n```env\nGEMINI_API_KEY=AIzaSy...\n```",
            "model": "Kaci Local Engine",
        }

    # --- Live Database Action Tools ---

    def add_or_update_room(name: str, capacity: int, room_type: str = "CLASSROOM", update_if_exists: bool = True) -> str:
        """Add a new room/lab or update an existing room in the database.
        
        Args:
            name: Room or Lab name (e.g. 'Room 101', 'CS Lab 2', 'Embedded Systems Lab')
            capacity: Seating/workstation capacity (e.g. 60)
            room_type: Either 'CLASSROOM', 'LAB', 'AUDITORIUM', or 'SEMINAR_HALL'
            update_if_exists: If True, updates existing room with new capacity/type; if False, alerts about conflict
        """
        try:
            inst = get_or_create_institution(db, institution_id)
            cleaned_type = room_type.upper().strip()
            if "LAB" in cleaned_type:
                cleaned_type = "LAB"
            elif "AUD" in cleaned_type:
                cleaned_type = "AUDITORIUM"
            elif "SEM" in cleaned_type:
                cleaned_type = "SEMINAR_HALL"
            else:
                cleaned_type = "CLASSROOM"

            cleaned_name = name.strip()
            cap = max(int(capacity), 1)

            existing = db.query(Room).filter(
                Room.institution_id == inst.id,
                Room.name.ilike(cleaned_name)
            ).first()
            if existing:
                if update_if_exists:
                    old_cap = existing.capacity
                    old_type = existing.room_type
                    existing.capacity = cap
                    existing.room_type = cleaned_type
                    db.commit()
                    db.refresh(existing)
                    return f"UPDATED: Room '{existing.name}' in institution {inst.name} updated from (Type: {old_type}, Cap: {old_cap}) to (Type: {cleaned_type}, Cap: {cap})."
                else:
                    return f"EXISTING: Room '{existing.name}' already exists in database with Type: {existing.room_type}, Capacity: {existing.capacity}."

            new_room = Room(
                name=cleaned_name,
                capacity=cap,
                room_type=cleaned_type,
                institution_id=inst.id,
            )
            db.add(new_room)
            db.commit()
            db.refresh(new_room)
            return f"CREATED: Added new room '{new_room.name}' (Type: {new_room.room_type}, Capacity: {new_room.capacity}) to {inst.name}."
        except Exception as e:
            db.rollback()
            return f"ERROR adding/updating room '{name}': {str(e)}"

    def add_or_update_faculty(name: str, designation: str = "Assistant Professor", department_name: str = "Computer Science", update_if_exists: bool = True) -> str:
        """Add a new faculty member or update their department/designation.
        
        Args:
            name: Full name of faculty member (e.g. 'Dr. Alan Turing')
            designation: Academic rank (e.g. 'Professor', 'Assistant Professor', 'Associate Professor')
            department_name: Academic department
            update_if_exists: If True, updates existing faculty
        """
        try:
            dept = get_or_create_department(db, department_name, institution_id)
            cleaned_name = name.strip()
            existing = db.query(Faculty).filter(
                Faculty.department_id == dept.id,
                Faculty.name.ilike(cleaned_name)
            ).first()
            if existing:
                if update_if_exists:
                    existing.designation = designation.strip()
                    existing.department_id = dept.id
                    db.commit()
                    db.refresh(existing)
                    return f"UPDATED: Faculty '{existing.name}' updated to {existing.designation} in department '{dept.name}'."
                else:
                    return f"EXISTING: Faculty '{existing.name}' already exists ({existing.designation})."

            new_f = Faculty(
                name=cleaned_name,
                designation=designation.strip(),
                department_id=dept.id,
            )
            db.add(new_f)
            db.commit()
            db.refresh(new_f)
            return f"CREATED: Added faculty member '{new_f.name}' ({new_f.designation}) to department '{dept.name}'."
        except Exception as e:
            db.rollback()
            return f"ERROR adding/updating faculty '{name}': {str(e)}"

    def add_or_update_subject(name: str, code: str, department_name: str = "Computer Science", update_if_exists: bool = True) -> str:
        """Add a new subject course or update its details.
        
        Args:
            name: Subject/Course name (e.g. 'Machine Learning')
            code: Course code (e.g. 'CS401')
            department_name: Department offering the course
            update_if_exists: If True, updates existing subject
        """
        try:
            dept = get_or_create_department(db, department_name, institution_id)
            cleaned_code = code.strip().upper()
            cleaned_name = name.strip()

            existing = db.query(Subject).filter(
                Subject.department_id == dept.id,
                (Subject.code == cleaned_code) | (Subject.name.ilike(cleaned_name))
            ).first()

            if existing:
                if update_if_exists:
                    existing.name = cleaned_name
                    existing.code = cleaned_code
                    existing.department_id = dept.id
                    db.commit()
                    db.refresh(existing)
                    return f"UPDATED: Course '{existing.name}' ({existing.code}) in department '{dept.name}'."
                else:
                    return f"EXISTING: Course '{existing.name}' ({existing.code}) already exists."

            new_s = Subject(
                name=cleaned_name,
                code=cleaned_code,
                department_id=dept.id,
            )
            db.add(new_s)
            db.commit()
            db.refresh(new_s)
            return f"CREATED: Added course '{new_s.name}' ({new_s.code}) to department '{dept.name}'."
        except Exception as e:
            db.rollback()
            return f"ERROR adding/updating subject '{name}': {str(e)}"

    def add_or_update_section(name: str, student_count: int = 60, department_name: str = "Computer Science", update_if_exists: bool = True) -> str:
        """Add or update a student cohort section in the database.
        
        Args:
            name: Section name (e.g. 'CSE-A', 'ME-2nd-Year')
            student_count: Number of students in section
            department_name: Academic department
            update_if_exists: If True, updates existing section capacity
        """
        try:
            dept = get_or_create_department(db, department_name, institution_id)
            cleaned_name = name.strip()
            count = max(int(student_count), 1)

            existing = db.query(Section).filter(
                Section.department_id == dept.id,
                Section.name.ilike(cleaned_name)
            ).first()
            if existing:
                if update_if_exists:
                    existing.student_count = count
                    existing.department_id = dept.id
                    db.commit()
                    db.refresh(existing)
                    return f"UPDATED: Section '{existing.name}' capacity updated to {count} students."
                else:
                    return f"EXISTING: Section '{existing.name}' already exists (Capacity: {existing.student_count})."

            new_sec = Section(
                name=cleaned_name,
                student_count=count,
                department_id=dept.id,
            )
            db.add(new_sec)
            db.commit()
            db.refresh(new_sec)
            return f"CREATED: Added section '{new_sec.name}' with capacity {count}."
        except Exception as e:
            db.rollback()
            return f"ERROR adding section '{name}': {str(e)}"

    def add_or_update_constraint(type: str, hardness: str = "SOFT", weight: float = 70.0, explanation: str = "") -> str:
        """Register or update a CP-SAT solver constraint rule.
        
        Args:
            type: Constraint rule identifier (e.g. 'FACULTY_MAX_CONSECUTIVE_HOURS', 'LAB_MORNING_PREFERENCE')
            hardness: 'HARD' (mandatory) or 'SOFT' (preference)
            weight: Priority penalty weight from 1.0 to 100.0 (if SOFT)
            explanation: Description of the constraint
        """
        try:
            cleaned_type = type.strip().upper()
            existing = db.query(Constraint).filter(Constraint.type == cleaned_type).first()
            if existing:
                existing.hardness = hardness.strip().upper()
                existing.weight = float(weight)
                if explanation:
                    existing.explanation = explanation.strip()
                existing.active = True
                db.commit()
                db.refresh(existing)
                return f"UPDATED: Constraint '{existing.type}' updated to {existing.hardness} (Weight: {existing.weight})."

            new_c = Constraint(
                scope="GLOBAL",
                type=cleaned_type,
                hardness=hardness.strip().upper(),
                weight=float(weight),
                explanation=explanation.strip() or f"Enforce {cleaned_type}",
                source="KACI_AI",
                active=True,
            )
            db.add(new_c)
            db.commit()
            db.refresh(new_c)
            return f"CREATED: Registered constraint '{new_c.type}' ({new_c.hardness}, Weight: {new_c.weight})."
        except Exception as e:
            db.rollback()
            return f"ERROR registering constraint '{type}': {str(e)}"

    def get_current_rooms_inventory() -> str:
        """Fetch the current list of all rooms and labs registered in the database for the active workspace."""
        try:
            inst = get_or_create_institution(db, institution_id)
            all_rooms = db.query(Room).filter(Room.institution_id == inst.id).all()
            if not all_rooms:
                return f"No rooms or labs are currently registered in workspace '{inst.name}'."
            return "\n".join([f"- {r.name}: Type={r.room_type}, Capacity={r.capacity}" for r in all_rooms])
        except Exception as e:
            return f"Error retrieving rooms: {str(e)}"

    tools = [
        add_or_update_room,
        add_or_update_faculty,
        add_or_update_subject,
        add_or_update_section,
        add_or_update_constraint,
        get_current_rooms_inventory,
    ]

    context = get_live_institution_context(db)

    system_instruction = (
        "You are Kaci, the premier institutional AI Assistant for TIMETT Studio. "
        "You have direct capabilities to perform actions in the institution database (adding/updating rooms, labs, faculty, "
        "courses, sections, and CP-SAT constraint rules) using your provided tools.\n\n"
        "Crucial Behavioral Rules:\n"
        "1. ALWAYS inspect the entire conversation history to extract items (rooms, labs, faculty, courses, sections) mentioned in previous turns.\n"
        "2. When the user says 'add these', 'add to rooms and labs', 'update if already exists', 'save these', extract EVERY item mentioned in the prior messages or current prompt and invoke the appropriate tool (`add_or_update_room`, `add_or_update_faculty`, etc.) for each one.\n"
        "3. Do NOT ask the user to re-type or re-paste items if they were already discussed or listed earlier in the conversation history.\n"
        "4. If an item already exists and user wants to update it, pass `update_if_exists=True` to the tool.\n"
        "5. After executing the tools, always present a clean, clear Markdown summary table of what was CREATED, what was UPDATED, and what was UNCHANGED.\n"
        "6. If the user asks for scheduling advice or constraint analysis, explain it concisely and offer to formulate it.\n\n"
        f"Live Database State:\n{context}"
    )

    try:
        client = genai.Client(api_key=api_key)

        # Build proper multi-turn history content objects for Gemini
        history_contents = []
        for msg in history[-14:]:  # last 14 messages for rich context
            role = "user" if msg.get("sender") == "user" else "model"
            text = msg.get("text", "").strip()
            if text:
                history_contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=text)]
                ))

        # Ensure history starts with user and alternates properly
        sanitized_history = []
        for i, c in enumerate(history_contents):
            if i == 0 and c.role != "user":
                continue
            if sanitized_history and sanitized_history[-1].role == c.role:
                # Merge consecutive parts of same role
                sanitized_history[-1].parts.extend(c.parts)
            else:
                sanitized_history.append(c)

        for model_name in CANDIDATE_MODELS:
            try:
                chat = client.chats.create(
                    model=model_name,
                    history=sanitized_history,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=tools,
                        temperature=0.1,
                    ),
                )

                resp = chat.send_message(query)
                if resp and resp.text:
                    return {
                        "text": resp.text.strip(),
                        "model": f"Gemini ({model_name})",
                    }
            except Exception as model_err:
                print(f"[Kaci] Model {model_name} error: {model_err}")
                continue

    except Exception as e:
        return {
            "text": f"An error occurred while communicating with Kaci: {str(e)}",
            "model": "Gemini Error Handler",
        }

    return {
        "text": "Unable to complete the request from Gemini at this moment.",
        "model": "Gemini",
    }
