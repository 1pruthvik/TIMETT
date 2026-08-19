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


def get_or_create_institution(db: Session) -> Institution:
    """Get the primary institution or create a default one if none exists."""
    inst = db.query(Institution).first()
    if not inst:
        inst = Institution(name="College of Engineering & Technology")
        db.add(inst)
        db.commit()
        db.refresh(inst)
    return inst


def get_or_create_department(db: Session, dept_name: str) -> Department:
    """Find department by name or create it."""
    inst = get_or_create_institution(db)
    name = dept_name.strip() if dept_name else "Computer Science & Engineering"
    dept = db.query(Department).filter(Department.name.ilike(f"%{name}%")).first()
    if not dept:
        dept = Department(name=name, institution_id=inst.id)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    return dept


def get_live_institution_context(db: Session) -> str:
    """Fetch summarized active context from the database to ground Gemini."""
    try:
        faculty_list = [f"{f.name} ({f.designation or 'Faculty'})" for f in db.query(Faculty).limit(30).all()]
        departments = [d.name for d in db.query(Department).all()]
        subjects = [f"{s.name} ({s.code})" for s in db.query(Subject).limit(35).all()]
        sections = [f"{sec.name} (Cap: {sec.student_count})" for sec in db.query(Section).limit(20).all()]
        rooms = [f"{r.name} (Type: {r.room_type or 'CLASSROOM'}, Cap: {r.capacity})" for r in db.query(Room).limit(30).all()]
        constraints = [f"{c.type} ({c.hardness})" for c in db.query(Constraint).filter(Constraint.active == True).limit(15).all()]

        context = (
            f"Active Departments: {', '.join(departments) if departments else 'None'}\n"
            f"Rooms & Labs Inventory: {', '.join(rooms) if rooms else 'None'}\n"
            f"Faculty Members: {', '.join(faculty_list) if faculty_list else 'None'}\n"
            f"Subjects/Courses: {', '.join(subjects) if subjects else 'None'}\n"
            f"Student Sections: {', '.join(sections) if sections else 'None'}\n"
            f"Active CP-SAT Constraints: {', '.join(constraints) if constraints else 'Standard CP-SAT single-occupancy invariants'}\n"
        )
        return context
    except Exception as e:
        return f"Context load error: {str(e)}"


async def generate_kaci_response(
    query: str,
    history: List[Dict[str, Any]],
    db: Session
) -> Dict[str, Any]:
    """Call Google Gemini with live database tool execution capabilities."""
    api_key = get_gemini_api_key()

    # 1. If Gemini API Key is not configured yet
    if not api_key:
        return {
            "text": f"I have received your request: \"{query}\".\n\nTo unlock live **Google Gemini** automated database actions and schedule optimization, add your API key in `backend/.env`:\n```env\nGEMINI_API_KEY=AIzaSy...\n```",
            "model": "Kaci Local Engine",
        }

    # 2. Define action functions for Gemini Tool Calling
    def add_room_or_lab(name: str, capacity: int, room_type: str = "CLASSROOM") -> str:
        """Add a new classroom, lecture hall, or lab to the database inventory.
        
        Args:
            name: The room or lab name/number (e.g. 'Room 101', 'CS Lab 2', 'Mechanical Workshop')
            capacity: Seating capacity (e.g. 60)
            room_type: Either 'CLASSROOM', 'LAB', 'AUDITORIUM', or 'SEMINAR_HALL'
        """
        try:
            inst = get_or_create_institution(db)
            cleaned_type = room_type.upper().strip()
            if "LAB" in cleaned_type:
                cleaned_type = "LAB"
            elif "AUD" in cleaned_type:
                cleaned_type = "AUDITORIUM"
            elif "SEM" in cleaned_type:
                cleaned_type = "SEMINAR_HALL"
            else:
                cleaned_type = "CLASSROOM"

            new_room = Room(
                name=name.strip(),
                capacity=max(int(capacity), 1),
                room_type=cleaned_type,
                institution_id=inst.id,
            )
            db.add(new_room)
            db.commit()
            db.refresh(new_room)
            return f"Successfully added {new_room.name} (Type: {new_room.room_type}, Capacity: {new_room.capacity}) to the database."
        except Exception as e:
            db.rollback()
            return f"Error adding room: {str(e)}"

    def add_faculty_member(name: str, designation: str = "Assistant Professor", department_name: str = "Computer Science") -> str:
        """Add a new professor or faculty instructor to the institution database.
        
        Args:
            name: Full name of faculty (e.g. 'Dr. Robert Smith')
            designation: Title (e.g. 'Professor', 'Assistant Professor', 'Lecturer')
            department_name: Name of the academic department
        """
        try:
            dept = get_or_create_department(db, department_name)
            new_faculty = Faculty(
                name=name.strip(),
                designation=designation.strip(),
                department_id=dept.id,
            )
            db.add(new_faculty)
            db.commit()
            db.refresh(new_faculty)
            return f"Successfully added faculty member {new_faculty.name} ({new_faculty.designation}) to department '{dept.name}'."
        except Exception as e:
            db.rollback()
            return f"Error adding faculty: {str(e)}"

    def add_subject_course(name: str, code: str, department_name: str = "Computer Science") -> str:
        """Add a new course or subject to the curriculum.
        
        Args:
            name: Course name (e.g. 'Operating Systems')
            code: Course code (e.g. 'CS205')
            department_name: Department offering the subject
        """
        try:
            dept = get_or_create_department(db, department_name)
            new_subj = Subject(
                name=name.strip(),
                code=code.strip().upper(),
                department_id=dept.id,
            )
            db.add(new_subj)
            db.commit()
            db.refresh(new_subj)
            return f"Successfully added course {new_subj.name} ({new_subj.code}) to '{dept.name}'."
        except Exception as e:
            db.rollback()
            return f"Error adding subject: {str(e)}"

    def add_scheduling_constraint(type: str, hardness: str = "SOFT", weight: float = 70.0, explanation: str = "") -> str:
        """Register a new CP-SAT integer programming solver constraint rule.
        
        Args:
            type: Constraint rule identifier (e.g. 'FACULTY_MAX_CONSECUTIVE_HOURS', 'LAB_MORNING_PREFERENCE')
            hardness: Either 'HARD' (mandatory) or 'SOFT' (preference)
            weight: Priority penalty weight from 1.0 to 100.0 (if SOFT)
            explanation: Description of what this constraint enforces
        """
        try:
            new_c = Constraint(
                scope="GLOBAL",
                type=type.strip().upper(),
                hardness=hardness.strip().upper(),
                weight=float(weight),
                explanation=explanation.strip() or f"Enforce {type}",
                source="KACI_AI",
                active=True,
            )
            db.add(new_c)
            db.commit()
            db.refresh(new_c)
            return f"Successfully registered constraint '{new_c.type}' ({new_c.hardness}, Weight: {new_c.weight}) in the CP-SAT engine."
        except Exception as e:
            db.rollback()
            return f"Error adding constraint: {str(e)}"

    tools = [
        add_room_or_lab,
        add_faculty_member,
        add_subject_course,
        add_scheduling_constraint,
    ]

    context = get_live_institution_context(db)

    system_instruction = (
        "You are Kaci, the premier institutional AI Assistant for TIMETT Studio. "
        "You have direct capabilities to perform actions in the institution database (adding rooms, labs, faculty, "
        "courses, and CP-SAT constraint rules) using your provided tools.\n\n"
        "Rules:\n"
        "1. When the user asks to add, create, or import rooms, labs, faculty, courses, or constraints, ALWAYS invoke the corresponding tools to save them directly to the database.\n"
        "2. Do NOT just output hypothetical python code when asked to add items — invoke the tool and confirm the database insertion.\n"
        "3. Format all responses using clean, beautiful GitHub-flavored Markdown (bolding, headers, bullet points, code blocks).\n"
        "4. Be helpful, concise, and professional.\n\n"
        f"Live Database State:\n{context}"
    )

    try:
        client = genai.Client(api_key=api_key)

        for model_name in CANDIDATE_MODELS:
            try:
                chat = client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=tools,
                        temperature=0.2,
                    ),
                )

                # Send previous history turns if any
                for msg in history[-4:]:
                    sender = "User" if msg.get("sender") == "user" else "Kaci"
                    text = msg.get("text", "")
                    if text:
                        # Feed context into chat
                        pass

                resp = chat.send_message(query)
                if resp and resp.text:
                    return {
                        "text": resp.text.strip(),
                        "model": f"Gemini ({model_name})",
                    }
            except Exception as model_err:
                continue

    except Exception as e:
        return {
            "text": f"An error occurred while communicating with Kaci: {str(e)}",
            "model": "Gemini Error Handler",
        }

    return {
        "text": "Unable to complete request from Gemini at this moment.",
        "model": "Gemini",
    }
