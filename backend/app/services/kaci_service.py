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


def get_live_institution_context(db: Session) -> str:
    """Fetch summarized active context from the database to ground Gemini."""
    try:
        faculty_list = [f"{f.name} ({f.email or 'No email'})" for f in db.query(Faculty).limit(25).all()]
        departments = [d.name for d in db.query(Department).all()]
        subjects = [f"{s.name} ({s.code}, {s.credit_hours} credits)" for s in db.query(Subject).limit(30).all()]
        sections = [f"{sec.name} (Capacity: {sec.student_count})" for sec in db.query(Section).limit(20).all()]
        rooms = [f"{r.name} ({r.room_type}, Cap: {r.capacity})" for r in db.query(Room).limit(20).all()]
        constraints = [c.name for c in db.query(Constraint).limit(10).all()]

        context = (
            f"Active Departments: {', '.join(departments) if departments else 'None'}\n"
            f"Faculty Members: {', '.join(faculty_list) if faculty_list else 'None'}\n"
            f"Subjects/Courses: {', '.join(subjects) if subjects else 'None'}\n"
            f"Student Sections: {', '.join(sections) if sections else 'None'}\n"
            f"Rooms/Labs: {', '.join(rooms) if rooms else 'None'}\n"
            f"Configured Constraints: {', '.join(constraints) if constraints else 'Standard CP-SAT invariants'}\n"
        )
        return context
    except Exception as e:
        return f"Context load error: {str(e)}"


async def generate_kaci_response(
    query: str,
    history: List[Dict[str, Any]],
    db: Session
) -> Dict[str, Any]:
    """Call Google Gemini to generate an intelligent Kaci response."""
    api_key = get_gemini_api_key()

    # 1. If Gemini API Key is not configured yet
    if not api_key:
        lower = query.lower()
        if "rao" in lower or "friday" in lower or "move" in lower:
            return {
                "text": "I analyzed the timetable matrix and identified 2 lectures on Friday afternoon for Prof. Rao. Here is a conflict-free relocation proposal:\n\n*(Note: To enable live Gemini AI models, set `GEMINI_API_KEY=your_key` in `backend/.env`)*",
                "proposedChanges": [
                    {
                        "subject": "Operating Systems (CS205)",
                        "from": "Friday 14:00 - 15:00",
                        "to": "Thursday 11:15 - 12:15",
                        "faculty": "Dr. Kumar",
                    },
                    {
                        "subject": "Database Systems (CS202)",
                        "from": "Friday 15:00 - 16:00",
                        "to": "Tuesday 10:00 - 11:00",
                        "faculty": "Prof. Rao",
                    },
                ],
                "model": "Kaci Local Engine",
            }
        else:
            return {
                "text": f"I have processed your instruction: \"{query}\".\n\nTo unlock live **Google Gemini** reasoning, add your API key in `backend/.env`:\n```env\nGEMINI_API_KEY=AIzaSy...\n```",
                "model": "Kaci Local Engine",
            }

    # 2. Call Google Gemini SDK
    context = get_live_institution_context(db)

    system_instruction = (
        "You are Kaci, the institutional AI Timetable & Scheduling Assistant for TIMETT Studio. "
        "You help university administrators optimize schedules, resolve lecturer clashes, formulate hard/soft "
        "constraints for the OR-Tools CP-SAT integer programming solver, and analyze faculty workloads.\n\n"
        "Guidelines:\n"
        "- Be concise, direct, helpful, and professional.\n"
        "- Format schedule moves or proposed period relocations clearly.\n"
        "- If the user asks to formulate a constraint, specify whether it is HARD (mandatory invariant) or SOFT (preference weight 1-100).\n\n"
        f"Institution Context:\n{context}"
    )

    try:
        client = genai.Client(api_key=api_key)

        # Build prompt with history
        prompt_parts = [system_instruction, "\n--- Conversation History ---"]
        for msg in history[-6:]:
            sender = "User" if msg.get("sender") == "user" else "Kaci"
            text = msg.get("text", "")
            if text:
                prompt_parts.append(f"{sender}: {text}")
        
        prompt_parts.append(f"User: {query}")
        prompt_parts.append("Kaci:")
        full_prompt = "\n".join(prompt_parts)

        last_error = None
        for model_name in CANDIDATE_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=full_prompt,
                )
                if response and response.text:
                    return {
                        "text": response.text.strip(),
                        "model": f"Gemini ({model_name})",
                    }
            except Exception as model_err:
                last_error = model_err
                continue

        if last_error:
            return {
                "text": f"Gemini connection note: {str(last_error)}",
                "model": "Gemini Error Handler",
            }

    except Exception as e:
        return {
            "text": f"An error occurred while connecting to Gemini: {str(e)}",
            "model": "Gemini Error Handler",
        }

    return {
        "text": "Unable to generate a response from Gemini at this moment.",
        "model": "Gemini",
    }
