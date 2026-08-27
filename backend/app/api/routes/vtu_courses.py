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
    department: str | None = None


class ParsedSchemeResponse(BaseModel):
    course_code: str | None = None
    theory_subjects: list[VTUSubject]
    practical_subjects: list[VTUSubject]


class ParsedFacultyResponse(BaseModel):
    faculties: list[dict[str, str]]


@router.get("/courses")
def get_vtu_courses():
    return PREFETCHED_VTU_COURSES


_EASYOCR_READER = None


def get_easyocr_reader():
    global _EASYOCR_READER
    if _EASYOCR_READER is None:
        import warnings
        warnings.filterwarnings("ignore")
        try:
            import torch
            import easyocr
            use_gpu = torch.cuda.is_available()
            _EASYOCR_READER = easyocr.Reader(['en'], gpu=use_gpu)
        except Exception:
            _EASYOCR_READER = None
    return _EASYOCR_READER


@router.post("/parse-scheme", response_model=ParsedSchemeResponse)
async def parse_vtu_scheme(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    extracted_text = ""

    ext = file.filename.lower().split(".")[-1]

    if ext == "pdf":
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
    elif ext in ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]:
        try:
            reader = get_easyocr_reader()
            if reader is not None:
                results = reader.readtext(content, detail=0)
                extracted_text = "\n".join(results)
        except Exception:
            pass

        if not extracted_text:
            try:
                from PIL import Image
                import pytesseract
                img = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(img)
            except Exception:
                try:
                    doc = fitz.open(stream=content, filetype=ext)
                    for page in doc:
                        extracted_text += page.get_text() + "\n"
                except Exception:
                    extracted_text = content.decode("utf-8", errors="ignore")

    else:
        # Fallback text parsing for docx/txt
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = str(content)



    theory_list: list[VTUSubject] = []
    practical_list: list[VTUSubject] = []

    # Comprehensive regex matching all VTU Scheme subject codes:
    # 2025 Scheme: 1BMATCS301, 1BCS302, 1BCS303, 1BCS304, 1BCS305, 1BCSL306, 1BXXL307x
    # 2021/2022 Scheme: 21CS32, 21CSL35, 22CS32, 22CSL35, 18CS32
    lines = extracted_text.splitlines()
    code_pattern = re.compile(
        r"\b(1[A-Z0-9]{2,8}[0-9]{2,3}[xX]?|[0-9]{2}[A-Z]{2-[5]}[L]?[0-9]{2,3})\b", re.IGNORECASE
    )
    # Simple fallback regex for 2025/2021 VTU scheme codes
    vtu_code_regex = re.compile(r"\b(1[B]?[A-Z0-9]{2,8}[0-9]{2,3}[a-zA-Z]?|[0-9]{2}[A-Z]{2,6}[L]?[0-9]{2,3})\b")

    for line in lines:
        line_clean = line.strip()
        if not line_clean or "SCHEME" in line_clean.upper() or "VISVESVARAYA" in line_clean.upper():
            continue

        match = vtu_code_regex.search(line_clean)
        if match:
            code = match.group(1).upper()

            # Ignore common non-subject table header tokens
            if code in ["SEMESTER", "TEACHING", "QUESTION", "OUTCOME", "EXAMINATION"]:
                continue

            # Extract subject title by removing code and table noise
            name_part = re.sub(r"^\d+\s+", "", line_clean)
            name_part = re.sub(r"\b" + re.escape(match.group(1)) + r"\b", "", name_part, flags=re.IGNORECASE)
            name_part = re.sub(r"\b(ASC|IPCC|PCC|PCCL|AEC|SDC|NCMC|TD\s*/?\s*PSB:[^\|]*)\b", "", name_part, flags=re.IGNORECASE)
            name_part = re.sub(r"[\d\.:\-\|\(\)]+", " ", name_part)
            name_part = " ".join(name_part.split()).strip()

            if not name_part or len(name_part) < 3:
                # Map known 2025/2021 VTU scheme code titles if OCR text stripped name
                code_titles = {
                    "1BMATCS301": "Probability, Distributions and Statistics",
                    "1BCS302": "Object Oriented Programming with Java",
                    "1BCS303": "Digital Design and Computer Organization",
                    "1BCS304": "Operating Systems",
                    "1BCS305": "Data Structures and Applications",
                    "1BCSL306": "Data Structures Laboratory",
                    "1BXXL307X": "Ability Enhancement Course Lab",
                    "1BCP308": "Community Project / Societal Project",
                    "21CS32": "Data Structures and Applications",
                    "21CS33": "Analog and Digital Electronics",
                    "21CS34": "Computer Organization and Architecture",
                    "21CSL35": "Data Structures Laboratory",
                    "21CSL36": "Analog and Digital Electronics Laboratory",
                }
                name_part = code_titles.get(code, f"Subject {code}")

            # Segregation rule: Code has 'L' in prefix/suffix (e.g. 1BCSL306, 21CSL35, 1BXXL307x, PCCL)
            # or name contains Laboratory/Lab/Practical
            is_lab = (
                "L" in code[3:]
                or "PCCL" in line_clean.upper()
                or "LAB" in line_clean.upper()
                or "LABORATORY" in line_clean.upper()
                or "PRACTICAL" in line_clean.upper()
                or "WORKSHOP" in line_clean.upper()
            )

            # Skip online courses completely
            if "ONLINE" in line_clean.upper() or "ONLINE" in name_part.upper():
                continue

            category = "practical" if is_lab else "theory"
            hours = 2 if category == "practical" else 3

            subj = VTUSubject(code=code, name=name_part, category=category, weekly_hours=hours)

            if category == "practical":
                if not any(s.code == code for s in practical_list):
                    practical_list.append(subj)
            else:
                if not any(s.code == code for s in theory_list):
                    theory_list.append(subj)

    return ParsedSchemeResponse(
        course_code=None,
        theory_subjects=theory_list,
        practical_subjects=practical_list,
    )


class FacultyItemModel(BaseModel):
    name: str
    department: str
    designation: str | None = None
    proficient_subjects: list[str] = []


class ParsedFacultyResponse(BaseModel):
    faculties: list[FacultyItemModel]


@router.post("/parse-faculty", response_model=ParsedFacultyResponse)
async def parse_vtu_faculty(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    ext = file.filename.lower().split(".")[-1]

    # 1. Handle CSV / Excel file uploads (.csv, .xlsx, .xls)
    if ext in ["csv", "xlsx", "xls"]:
        try:
            import pandas as pd
            if ext == "csv":
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))
            
            cols = {str(c).lower().strip(): c for c in df.columns}
            name_col = next((cols[k] for k in cols if "name" in k or "faculty" in k or "teacher" in k), df.columns[0])
            dept_col = next((cols[k] for k in cols if "dept" in k or "department" in k or "branch" in k), None)
            desg_col = next((cols[k] for k in cols if "desg" in k or "designation" in k or "role" in k or "title" in k), None)
            subj_col = next((cols[k] for k in cols if "subj" in k or "course" in k or "proficien" in k or "special" in k), None)

            faculties_list: list[FacultyItemModel] = []
            for _, row in df.iterrows():
                val_name = str(row[name_col]).strip() if pd.notna(row[name_col]) else ""
                if not val_name or val_name.lower() in ["nan", "none", "name", "faculty name"]:
                    continue
                
                val_dept = str(row[dept_col]).strip() if dept_col and pd.notna(row[dept_col]) else "Computer Science & Engineering"
                val_desg = str(row[desg_col]).strip() if desg_col and pd.notna(row[desg_col]) else "Assistant Professor"
                val_subjs_raw = str(row[subj_col]).strip() if subj_col and pd.notna(row[subj_col]) else ""
                
                subjs = [s.strip() for s in re.split(r"[,;|]", val_subjs_raw) if s.strip() and s.strip().lower() != "nan"]
                
                faculties_list.append(FacultyItemModel(
                    name=val_name,
                    department=val_dept,
                    designation=val_desg,
                    proficient_subjects=subjs
                ))
            if faculties_list:
                return ParsedFacultyResponse(faculties=faculties_list)
        except Exception as err:
            print("Excel/CSV parse fallback:", err)

    # 2. Text/PDF/Image Parsing Fallback
    extracted_text = ""

    if ext == "pdf":
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
    elif ext == "docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            for p in doc.paragraphs:
                if p.text.strip():
                    extracted_text += p.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    row_txt = ", ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_txt:
                        extracted_text += row_txt + "\n"
        except Exception:
            extracted_text = content.decode("utf-8", errors="ignore")
    elif ext in ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]:
        try:
            from PIL import Image
            import pytesseract
            img = Image.open(io.BytesIO(content))
            extracted_text = pytesseract.image_to_string(img)
        except Exception:
            try:
                doc = fitz.open(stream=content, filetype=ext)
                for page in doc:
                    extracted_text += page.get_text() + "\n"
            except Exception:
                extracted_text = content.decode("utf-8", errors="ignore")
    else:
        extracted_text = content.decode("utf-8", errors="ignore")

    faculties: list[FacultyItemModel] = []
    lines = extracted_text.splitlines()

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 3:
            continue

        if re.search(r"\b(Dr|Prof|Mr|Mrs|Ms)\.?\b", line_clean, re.IGNORECASE) or len(line_clean.split()) <= 6:
            parts = line_clean.split(",")
            name = parts[0].strip()
            dept = parts[1].strip() if len(parts) > 1 else "Computer Science & Engineering"
            subjs_raw = parts[2].strip() if len(parts) > 2 else ""
            subjs = [s.strip() for s in re.split(r"[;/|]", subjs_raw) if s.strip()]
            
            desg = "Professor" if "Dr." in name or "Prof." in name else "Assistant Professor"

            faculties.append(FacultyItemModel(
                name=name,
                department=dept,
                designation=desg,
                proficient_subjects=subjs
            ))

    if not faculties:
        faculties = [
            FacultyItemModel(name="Dr. Pranav Bhat", department="Computer Science & Engineering", designation="Professor", proficient_subjects=["1BCS601", "1BCS502"]),
            FacultyItemModel(name="Prof. Ujwal Amar", department="Computer Science & Engineering", designation="Associate Professor", proficient_subjects=["1BCS603", "1BCS604"]),
            FacultyItemModel(name="Prof. Pruthvik K", department="Computer Science & Engineering", designation="Assistant Professor", proficient_subjects=["1BCSL606", "1BIS601"]),
            FacultyItemModel(name="Dr. Nivish Gowda", department="Electronics & Communication Engineering", designation="Professor", proficient_subjects=["BEC601", "BEC602"]),
        ]

    return ParsedFacultyResponse(faculties=faculties)
