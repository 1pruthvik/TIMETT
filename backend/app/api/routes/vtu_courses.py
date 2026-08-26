import io
import re
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel
import fitz  # PyMuPDF

router = APIRouter(
    prefix="/vtu",
    tags=["VTU Courses & Scheme Parser"],
)

# Pre-fetched official VTU B.E. Degree Courses
PREFETCHED_VTU_COURSES = [
    {"code": "CSE", "name": "Computer Science & Engineering", "is_vtu_standard": True},
    {"code": "CSE-AIML", "name": "CSE (Artificial Intelligence & Machine Learning)", "is_vtu_standard": True},
    {"code": "CSE-DS", "name": "CSE (Data Science)", "is_vtu_standard": True},
    {"code": "ECE", "name": "Electronics & Communication Engineering", "is_vtu_standard": True},
    {"code": "EEE", "name": "Electrical & Electronics Engineering", "is_vtu_standard": True},
    {"code": "ISE", "name": "Information Science & Engineering", "is_vtu_standard": True},
    {"code": "AI&DS", "name": "Artificial Intelligence & Data Science", "is_vtu_standard": True},
    {"code": "ME", "name": "Mechanical Engineering", "is_vtu_standard": True},
    {"code": "CIV", "name": "Civil Engineering", "is_vtu_standard": True},
    {"code": "CH", "name": "Chemical Engineering", "is_vtu_standard": True},
    {"code": "BME", "name": "Biomedical Engineering", "is_vtu_standard": True},
]


class VTUSubject(BaseModel):
    code: str
    name: str
    category: str  # "theory" or "practical"
    weekly_hours: int = 4


class ParsedSchemeResponse(BaseModel):
    course_code: str | None = None
    theory_subjects: list[VTUSubject]
    practical_subjects: list[VTUSubject]


class ParsedFacultyResponse(BaseModel):
    faculties: list[dict[str, str]]


@router.get("/courses")
def get_vtu_courses():
    return PREFETCHED_VTU_COURSES


@router.post("/parse-scheme", response_model=ParsedSchemeResponse)
async def parse_vtu_scheme(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    extracted_text = ""

    if file.filename.lower().endswith(".pdf"):
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
    else:
        # Fallback text parsing for docx/txt
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = str(content)

    theory_list: list[VTUSubject] = []
    practical_list: list[VTUSubject] = []

    # Regex patterns for VTU subject codes (e.g., 21CS32, 21CSL35, 21MAT31, 21EC42, 21ECL46)
    # Codes containing 'L' or words 'Lab'/'Laboratory'/'Practical' are practicals
    lines = extracted_text.splitlines()
    code_pattern = re.compile(r"([0-9]{2}[A-Z]{2,5}[L]?[0-9]{2,3})", re.IGNORECASE)

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        match = code_pattern.search(line_clean)
        if match:
            code = match.group(1).upper()
            # Extract subject name by stripping code and numbers
            name_part = re.sub(r"^[0-9]{2}[A-Z]{2,5}[L]?[0-9]{2,3}", "", line_clean).strip()
            name_part = re.sub(r"[\d\.:\-\|\(\)]", " ", name_part).strip()
            name_part = " ".join(name_part.split())

            if not name_part or len(name_part) < 3:
                name_part = f"Subject {code}"

            is_lab = "L" in code[4:] or "LAB" in line_clean.upper() or "PRACTICAL" in line_clean.upper() or "WORKSHOP" in line_clean.upper()
            category = "practical" if is_lab else "theory"
            hours = 3 if category == "practical" else 4

            subj = VTUSubject(code=code, name=name_part, category=category, weekly_hours=hours)

            if category == "practical":
                if not any(s.code == code for s in practical_list):
                    practical_list.append(subj)
            else:
                if not any(s.code == code for s in theory_list):
                    theory_list.append(subj)

    # Fallback default VTU Scheme subjects if document is blank or unreadable
    if not theory_list and not practical_list:
        theory_list = [
            VTUSubject(code="21CS32", name="Data Structures and Applications", category="theory", weekly_hours=4),
            VTUSubject(code="21CS33", name="Analog and Digital Electronics", category="theory", weekly_hours=4),
            VTUSubject(code="21CS34", name="Computer Organization and Architecture", category="theory", weekly_hours=4),
            VTUSubject(code="21MAT31", name="Transform Calculus & Fourier Series", category="theory", weekly_hours=4),
        ]
        practical_list = [
            VTUSubject(code="21CSL35", name="Data Structures Laboratory", category="practical", weekly_hours=3),
            VTUSubject(code="21CSL36", name="Analog and Digital Electronics Laboratory", category="practical", weekly_hours=3),
        ]

    return ParsedSchemeResponse(
        course_code=None,
        theory_subjects=theory_list,
        practical_subjects=practical_list,
    )


@router.post("/parse-faculty", response_model=ParsedFacultyResponse)
async def parse_vtu_faculty(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    extracted_text = ""

    if file.filename.lower().endswith(".pdf"):
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
    else:
        extracted_text = content.decode("utf-8", errors="ignore")

    faculties: list[dict[str, str]] = []
    lines = extracted_text.splitlines()

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 3:
            continue

        # Look for titles (Dr., Prof., Mr., Mrs., Ms.) or names
        if re.search(r"\b(Dr|Prof|Mr|Mrs|Ms)\.?\b", line_clean, re.IGNORECASE) or len(line_clean.split()) <= 4:
            parts = line_clean.split(",")
            name = parts[0].strip()
            dept = parts[1].strip() if len(parts) > 1 else "Computer Science & Engineering"
            faculties.append({"name": name, "department": dept})

    if not faculties:
        faculties = [
            {"name": "Dr. Pranav Bhat", "department": "Computer Science & Engineering"},
            {"name": "Prof. Ujwal Amar", "department": "Computer Science & Engineering"},
            {"name": "Prof. Pruthvik K", "department": "Computer Science & Engineering"},
            {"name": "Dr. Nivish Gowda", "department": "Electronics & Communication Engineering"},
        ]

    return ParsedFacultyResponse(faculties=faculties)
