import io
import math
import re
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import Response
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


class SectionAllocationModel(BaseModel):
    no: int | None = None
    course: str
    sem: int | str
    sections: dict[str, str] = {}


class FacultyItemModel(BaseModel):
    name: str
    department: str
    designation: str | None = None
    cadre: str | None = None
    s1: str | None = None
    s2: str | None = None
    sem_handling: str | None = None
    proficient_subjects: list[str] = []


class ParsedFacultyResponse(BaseModel):
    faculties: list[FacultyItemModel]
    allocations: list[SectionAllocationModel] = []


class BranchIntakeInput(BaseModel):
    code: str
    name: str
    selected: bool = True
    student_count: int = 60
    sections_count: int | None = None
    class_capacity: int | None = None
    cycle: str | None = None


class SectionItem(BaseModel):
    letter: str
    branch_code: str
    branch_name: str
    label: str
    student_count: int


class BranchSectionBreakdown(BaseModel):
    branch_code: str
    branch_name: str
    student_count: int
    class_capacity: int
    num_sections: int
    sections: list[SectionItem]


class CalculateSectionsRequest(BaseModel):
    branches: list[BranchIntakeInput]
    default_capacity: int = 60
    save_to_db: bool = True


class CalculateSectionsResponse(BaseModel):
    total_students: int
    total_sections: int
    sections: list[SectionItem]
    breakdown: list[BranchSectionBreakdown]


def get_section_letter(index: int) -> str:
    """Generate continuous Excel-style section letter: 0 -> A, 1 -> B, ... 25 -> Z, 26 -> AA, etc."""
    result = ""
    while True:
        result = chr(ord('A') + (index % 26)) + result
        index = (index // 26) - 1
        if index < 0:
            break
    return result


# Global in-memory cache for latest continuous sections layout
LATEST_SECTIONS_LAYOUT: list[SectionItem] = [
    SectionItem(letter="A", branch_code="CSE", branch_name="Computer Science & Engineering", label="A (CSE)", student_count=60),
    SectionItem(letter="B", branch_code="CSE", branch_name="Computer Science & Engineering", label="B (CSE)", student_count=60),
    SectionItem(letter="C", branch_code="CSE", branch_name="Computer Science & Engineering", label="C (CSE)", student_count=60),
    SectionItem(letter="D", branch_code="CSE-AIML", branch_name="CSE (Artificial Intelligence & Machine Learning)", label="D (CSE-AIML)", student_count=60),
    SectionItem(letter="E", branch_code="CSE-AIML", branch_name="CSE (Artificial Intelligence & Machine Learning)", label="E (CSE-AIML)", student_count=60),
    SectionItem(letter="F", branch_code="ECE", branch_name="Electronics & Communication Engineering", label="F (ECE)", student_count=60),
]


def compute_continuous_sections(
    branches: list[BranchIntakeInput],
    default_capacity: int = 60,
) -> tuple[list[SectionItem], list[BranchSectionBreakdown]]:
    active_branches = [b for b in branches if b.selected]
    if not active_branches:
        active_branches = branches

    all_sections: list[SectionItem] = []
    breakdowns: list[BranchSectionBreakdown] = []
    curr_idx = 0

    for b_idx, b in enumerate(active_branches):
        intake = max(0, b.student_count)
        if b.sections_count and b.sections_count > 0:
            num_sec = b.sections_count
            cap = max(1, math.ceil(intake / num_sec)) if intake > 0 else 60
        else:
            cap = max(1, b.class_capacity or default_capacity or 60)
            num_sec = max(1, math.ceil(intake / cap)) if intake > 0 else 1

        branch_secs: list[SectionItem] = []
        for s_idx in range(num_sec):
            letter = get_section_letter(curr_idx)
            curr_idx += 1
            # Every branch includes its branch identifier as per inputs: "A (CSE)", "D (CSE-AIML)", "F (ECE)"
            label = f"{letter} ({b.code})" if b.code else letter

            base_count = intake // num_sec if intake > 0 else cap
            extra = (intake % num_sec) if intake > 0 else 0
            sec_count = base_count + (1 if s_idx < extra else 0)

            sec_item = SectionItem(
                letter=letter,
                branch_code=b.code,
                branch_name=b.name,
                label=label,
                student_count=sec_count,
            )
            branch_secs.append(sec_item)
            all_sections.append(sec_item)

        breakdowns.append(
            BranchSectionBreakdown(
                branch_code=b.code,
                branch_name=b.name,
                student_count=intake,
                class_capacity=cap,
                num_sections=num_sec,
                sections=branch_secs,
            )
        )

    return all_sections, breakdowns


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



CADRE_DESG_MAP = {
    "dean": "Dean",
    "hod": "Head of Department (HOD)",
    "asp": "Associate Professor",
    "ap": "Assistant Professor",
    "pop": "Professor of Practice",
    "prof": "Professor",
    "professor": "Professor",
    "assoc prof": "Associate Professor",
    "asst prof": "Assistant Professor",
    "lecturer": "Lecturer",
}


def resolve_cadre_designation(cadre: str | None) -> str:
    if not cadre:
        return "Assistant Professor"
    clean = cadre.strip().lower()
    return CADRE_DESG_MAP.get(clean, cadre.strip())


def infer_dept_from_string(text: str) -> str:
    up = text.upper()
    if "(AIML)" in up or "AIML" in up:
        return "Artificial Intelligence & Machine Learning"
    if "(ECE)" in up or "ECE" in up:
        return "Electronics & Communication Engineering"
    if "(ISE)" in up or "ISE" in up:
        return "Information Science & Engineering"
    if "(ME)" in up or "MECH" in up:
        return "Mechanical Engineering"
    if "(EEE)" in up or "EEE" in up:
        return "Electrical & Electronics Engineering"
    if "(CV)" in up or "CIVIL" in up:
        return "Civil Engineering"
    if "(CSE)" in up or "CSE" in up:
        return "Computer Science & Engineering"
    if "MATH" in up:
        return "Mathematics"
    if "PHY" in up:
        return "Physics"
    if "CHEM" in up:
        return "Chemistry"
    return "Computer Science & Engineering"


@router.post("/calculate-sections", response_model=CalculateSectionsResponse)
def calculate_and_save_sections(payload: CalculateSectionsRequest):
    global LATEST_SECTIONS_LAYOUT
    all_sections, breakdowns = compute_continuous_sections(payload.branches, payload.default_capacity)
    LATEST_SECTIONS_LAYOUT = all_sections

    if payload.save_to_db:
        try:
            from app.db.database import SessionLocal
            from app.models.institution import Institution
            from app.models.department import Department
            from app.models.section import Section

            db = SessionLocal()
            try:
                inst = db.query(Institution).first()
                if not inst:
                    inst = Institution(name="College Workspace")
                    db.add(inst)
                    db.commit()
                    db.refresh(inst)

                for b in breakdowns:
                    dept = db.query(Department).filter(
                        Department.institution_id == inst.id,
                        (Department.name.ilike(f"%{b.branch_name}%")) | (Department.name.ilike(f"%{b.branch_code}%"))
                    ).first()
                    if not dept:
                        dept = Department(name=b.branch_name, institution_id=inst.id)
                        db.add(dept)
                        db.commit()
                        db.refresh(dept)

                    # Delete existing sections for this department to re-generate continuous sections
                    db.query(Section).filter(Section.department_id == dept.id).delete()

                    for sec in b.sections:
                        new_sec = Section(
                            department_id=dept.id,
                            name=f"Section {sec.letter}",
                            student_count=sec.student_count,
                        )
                        db.add(new_sec)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"Error saving sections to DB: {e}")

    total_std = sum(b.student_count for b in breakdowns)
    return CalculateSectionsResponse(
        total_students=total_std,
        total_sections=len(all_sections),
        sections=all_sections,
        breakdown=breakdowns,
    )


@router.get("/calculated-sections", response_model=CalculateSectionsResponse)
def get_calculated_sections():
    global LATEST_SECTIONS_LAYOUT
    branch_map: dict[str, list[SectionItem]] = {}
    for s in LATEST_SECTIONS_LAYOUT:
        branch_map.setdefault(s.branch_code, []).append(s)

    breakdowns = []
    for b_code, secs in branch_map.items():
        breakdowns.append(BranchSectionBreakdown(
            branch_code=b_code,
            branch_name=secs[0].branch_name,
            student_count=sum(s.student_count for s in secs),
            class_capacity=max((s.student_count for s in secs), default=60),
            num_sections=len(secs),
            sections=secs
        ))

    return CalculateSectionsResponse(
        total_students=sum(s.student_count for s in LATEST_SECTIONS_LAYOUT),
        total_sections=len(LATEST_SECTIONS_LAYOUT),
        sections=LATEST_SECTIONS_LAYOUT,
        breakdown=breakdowns
    )


@router.get("/download-faculty-template")
def download_faculty_template(sections: str | None = None):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Faculty Allocation"

    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    sec_fill = PatternFill(start_color="0284C7", end_color="0284C7", fill_type="solid")
    border_side = Side(border_style="thin", color="CCCCCC")
    border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    center_align = Alignment(horizontal="center", vertical="center")

    # Table 1: Faculty Allocation Headers (Cols A - E)
    t1_headers = ["Name", "Cadre", "S1", "S2", "Sem handling"]
    for col_idx, h in enumerate(t1_headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = border

    # Determine Section subheaders (continuous A (CSE), B (CSE), C (CSE), D (CSE-AIML), E (CSE-AIML)...)
    if sections:
        sec_subheaders = [s.strip() for s in sections.split(",") if s.strip()]
    elif LATEST_SECTIONS_LAYOUT:
        sec_subheaders = [s.label for s in LATEST_SECTIONS_LAYOUT]
    else:
        sec_subheaders = ["A (CSE)", "B (CSE)", "C (CSE)", "D (CSE-AIML)", "E (CSE-AIML)", "F (ECE)"]

    num_secs = max(1, len(sec_subheaders))
    sec_start_col = 10  # Column J
    sec_end_col = sec_start_col + num_secs - 1
    sec_start_letter = get_column_letter(sec_start_col)
    sec_end_letter = get_column_letter(sec_end_col)

    # Table 2: Course & Section Matrix (Cols G, H, I, and J onwards)
    ws.cell(row=1, column=7, value="No").fill = sec_fill
    ws.cell(row=1, column=7).font = header_font
    ws.cell(row=1, column=7).alignment = center_align
    ws.cell(row=1, column=7).border = border

    ws.cell(row=1, column=8, value="Course").fill = sec_fill
    ws.cell(row=1, column=8).font = header_font
    ws.cell(row=1, column=8).alignment = center_align
    ws.cell(row=1, column=8).border = border

    ws.cell(row=1, column=9, value="Sem").fill = sec_fill
    ws.cell(row=1, column=9).font = header_font
    ws.cell(row=1, column=9).alignment = center_align
    ws.cell(row=1, column=9).border = border

    if sec_start_col == sec_end_col:
        sec_merge = ws.cell(row=1, column=sec_start_col, value="Section")
        sec_merge.fill = sec_fill
        sec_merge.font = header_font
        sec_merge.alignment = center_align
        sec_merge.border = border
    else:
        ws.merge_cells(f"{sec_start_letter}1:{sec_end_letter}1")
        sec_merge = ws.cell(row=1, column=sec_start_col, value="Section")
        sec_merge.fill = sec_fill
        sec_merge.font = header_font
        sec_merge.alignment = center_align
        for c in range(sec_start_col, sec_end_col + 1):
            ws.cell(row=1, column=c).border = border

    # Subheaders for row 2
    for c in range(1, 6):
        ws.cell(row=2, column=c).border = border

    for idx, sh in enumerate(sec_subheaders):
        col_c = sec_start_col + idx
        cell = ws.cell(row=2, column=col_c, value=sh)
        cell.fill = PatternFill(start_color="E0F2FE", end_color="E0F2FE", fill_type="solid")
        cell.font = Font(name="Calibri", size=10, bold=True, color="0369A1")
        cell.alignment = center_align
        cell.border = border
        ws.column_dimensions[get_column_letter(col_c)].width = max(12, len(sh) + 4)

    # Add empty starter template rows
    total_cols = sec_end_col
    for r in range(3, 30):
        for c in range(1, total_cols + 1):
            if c != 6:
                ws.cell(row=r, column=c).border = border

    ws.column_dimensions['A'].width = 24
    ws.column_dimensions['B'].width = 12
    ws.column_dimensions['C'].width = 16
    ws.column_dimensions['D'].width = 16
    ws.column_dimensions['E'].width = 16
    ws.column_dimensions['F'].width = 4
    ws.column_dimensions['G'].width = 6
    ws.column_dimensions['H'].width = 18
    ws.column_dimensions['I'].width = 8

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)

    return Response(
        content=out.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=VTU_Faculty_Allocation_Template.xlsx"}
    )


@router.post("/parse-faculty", response_model=ParsedFacultyResponse)
async def parse_vtu_faculty(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    ext = file.filename.lower().split(".")[-1]

    faculties_list: list[FacultyItemModel] = []
    allocations_list: list[SectionAllocationModel] = []

    # 1. Handle Excel files (.xlsx, .xls)
    if ext in ["xlsx", "xls"]:
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            for sheet in wb.worksheets:
                rows = list(sheet.iter_rows(values_only=True))
                if not rows:
                    continue

                # Locate Table 1: Header row with Name and Cadre
                t1_header_row_idx = None
                col_name = None
                col_cadre = None
                col_s1 = None
                col_s2 = None
                col_sem = None

                # Locate Table 2: Header row with Course and Sem
                t2_header_row_idx = None
                col_no = None
                col_course = None
                col_t2_sem = None
                sec_cols: dict[str, int] = {}

                for r_idx, r in enumerate(rows):
                    row_strs = [str(c).strip().lower() if c is not None else "" for c in r]
                    if t1_header_row_idx is None:
                        for c_idx, val in enumerate(row_strs):
                            if val == "name" or "faculty name" in val:
                                col_name = c_idx
                            elif val in ["cadre", "designation", "desg"]:
                                col_cadre = c_idx
                            elif val in ["s1", "subject 1", "sub 1", "subj 1"]:
                                col_s1 = c_idx
                            elif val in ["s2", "subject 2", "sub 2", "subj 2"]:
                                col_s2 = c_idx
                            elif "sem" in val and "handling" in val:
                                col_sem = c_idx

                        if col_name is not None and col_cadre is not None:
                            t1_header_row_idx = r_idx

                    # Check for Table 2 headers (Course / Sem)
                    if t2_header_row_idx is None:
                        for c_idx, val in enumerate(row_strs):
                            if val in ["no", "sl.no", "sl no", "s.no"]:
                                col_no = c_idx
                            elif val in ["course", "subject", "sub"]:
                                col_course = c_idx
                            elif val in ["sem", "semester"]:
                                col_t2_sem = c_idx

                        if col_course is not None and col_t2_sem is not None:
                            t2_header_row_idx = r_idx
                            sec_candidates = []
                            if r_idx < len(rows):
                                sec_candidates.append(rows[r_idx])
                            if r_idx + 1 < len(rows):
                                sec_candidates.append(rows[r_idx + 1])

                            for s_row in sec_candidates:
                                for c_idx, cell_val in enumerate(s_row):
                                    if cell_val is not None:
                                        cv = str(cell_val).strip()
                                        if cv and (
                                            re.match(r'^(SEC(TION)?\s*)?[A-Z]+(\s*\(.*\))?$', cv.strip(), re.IGNORECASE)
                                            or cv.upper() in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]
                                        ):
                                            if cv not in sec_cols:
                                                sec_cols[cv] = c_idx

                # Extract Table 1 Rows
                if t1_header_row_idx is not None and col_name is not None:
                    for r_idx in range(t1_header_row_idx + 1, len(rows)):
                        r = rows[r_idx]
                        if not r or col_name >= len(r) or r[col_name] is None:
                            continue
                        raw_name = str(r[col_name]).strip()
                        if not raw_name or raw_name.lower() in ["name", "none", "nan", "total"]:
                            continue

                        raw_cadre = str(r[col_cadre]).strip() if col_cadre is not None and col_cadre < len(r) and r[col_cadre] is not None else ""
                        raw_s1 = str(r[col_s1]).strip() if col_s1 is not None and col_s1 < len(r) and r[col_s1] is not None else ""
                        raw_s2 = str(r[col_s2]).strip() if col_s2 is not None and col_s2 < len(r) and r[col_s2] is not None else ""
                        raw_sem = str(r[col_sem]).strip() if col_sem is not None and col_sem < len(r) and r[col_sem] is not None else ""

                        desg = resolve_cadre_designation(raw_cadre)
                        dept = infer_dept_from_string(f"{raw_s1} {raw_s2}")

                        prof_subjs = []
                        for s in [raw_s1, raw_s2]:
                            if s and s.lower() not in ["none", "nan", "-"]:
                                prof_subjs.append(s)
                                clean_code = re.sub(r"\(.*?\)", "", s).strip()
                                if clean_code and clean_code != s:
                                    prof_subjs.append(clean_code)

                        faculties_list.append(FacultyItemModel(
                            name=raw_name,
                            department=dept,
                            designation=desg,
                            cadre=raw_cadre or "AP",
                            s1=raw_s1,
                            s2=raw_s2,
                            sem_handling=raw_sem,
                            proficient_subjects=list(dict.fromkeys(prof_subjs))
                        ))

                # Extract Table 2 Rows (Section Allocations)
                if t2_header_row_idx is not None and col_course is not None and col_t2_sem is not None:
                    start_r = t2_header_row_idx + (2 if sec_cols else 1)
                    for r_idx in range(start_r, len(rows)):
                        r = rows[r_idx]
                        if not r or col_course >= len(r) or r[col_course] is None:
                            continue
                        course_val = str(r[col_course]).strip()
                        if not course_val or course_val.lower() in ["none", "nan", "course", "subject"]:
                            continue

                        sem_val = str(r[col_t2_sem]).strip() if col_t2_sem < len(r) and r[col_t2_sem] is not None else ""
                        no_val = None
                        if col_no is not None and col_no < len(r) and r[col_no] is not None:
                            try:
                                no_val = int(str(r[col_no]).strip())
                            except Exception:
                                pass

                        sec_map: dict[str, str] = {}
                        for sec_name, sc_idx in sec_cols.items():
                            if sc_idx < len(r) and r[sc_idx] is not None:
                                fac_code = str(r[sc_idx]).strip()
                                if fac_code and fac_code.lower() not in ["none", "nan", "-"]:
                                    sec_map[sec_name] = fac_code

                        allocations_list.append(SectionAllocationModel(
                            no=no_val,
                            course=course_val,
                            sem=sem_val,
                            sections=sec_map
                        ))
        except Exception as e:
            print(f"Error parsing Excel workbook: {e}")

    # 2. Handle CSV file uploads (.csv)
    elif ext == "csv":
        try:
            import csv
            csv_text = content.decode("utf-8", errors="ignore")
            reader = list(csv.reader(csv_text.splitlines()))
            if reader:
                header = [str(c).strip().lower() for c in reader[0]]
                col_name = next((i for i, h in enumerate(header) if "name" in h), 0)
                col_cadre = next((i for i, h in enumerate(header) if "cadre" in h or "desg" in h), None)
                col_s1 = next((i for i, h in enumerate(header) if "s1" in h or "subject 1" in h), None)
                col_s2 = next((i for i, h in enumerate(header) if "s2" in h or "subject 2" in h), None)
                col_sem = next((i for i, h in enumerate(header) if "sem" in h), None)

                for r in reader[1:]:
                    if not r or col_name >= len(r):
                        continue
                    name = r[col_name].strip()
                    if not name or name.lower() in ["name", "faculty name"]:
                        continue

                    cadre = r[col_cadre].strip() if col_cadre is not None and col_cadre < len(r) else "AP"
                    s1 = r[col_s1].strip() if col_s1 is not None and col_s1 < len(r) else ""
                    s2 = r[col_s2].strip() if col_s2 is not None and col_s2 < len(r) else ""
                    sem_val = r[col_sem].strip() if col_sem is not None and col_sem < len(r) else ""

                    prof_subjs = []
                    for s in [s1, s2]:
                        if s:
                            prof_subjs.append(s)
                            clean_c = re.sub(r"\(.*?\)", "", s).strip()
                            if clean_c:
                                prof_subjs.append(clean_c)

                    faculties_list.append(FacultyItemModel(
                        name=name,
                        department=infer_dept_from_string(f"{s1} {s2}"),
                        designation=resolve_cadre_designation(cadre),
                        cadre=cadre,
                        s1=s1,
                        s2=s2,
                        sem_handling=sem_val,
                        proficient_subjects=list(dict.fromkeys(prof_subjs))
                    ))
        except Exception as e:
            print(f"Error parsing CSV file: {e}")

    # 3. Text / Image OCR Fallback
    elif ext in ["png", "jpg", "jpeg", "webp", "pdf"]:
        extracted_text = ""
        if ext == "pdf":
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                for page in doc:
                    extracted_text += page.get_text() + "\n"
            except Exception:
                pass
        else:
            try:
                from PIL import Image
                import pytesseract
                img = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(img)
            except Exception:
                pass

        lines = extracted_text.splitlines()
        for line in lines:
            line_clean = line.strip()
            if not line_clean or len(line_clean) < 3 or not is_valid_faculty_string(line_clean):
                continue
            parts = [p.strip() for p in re.split(r"[,|\t]", line_clean) if p.strip()]
            if parts:
                name = parts[0]
                if not is_valid_faculty_string(name) or name.lower() in ["name", "faculty name"]:
                    continue
                cadre = parts[1] if len(parts) > 1 else "AP"
                s1 = parts[2] if len(parts) > 2 else ""
                s2 = parts[3] if len(parts) > 3 else ""
                sem = parts[4] if len(parts) > 4 else ""

                faculties_list.append(FacultyItemModel(
                    name=name,
                    department=infer_dept_from_string(f"{s1} {s2}"),
                    designation=resolve_cadre_designation(cadre),
                    cadre=cadre,
                    s1=s1,
                    s2=s2,
                    sem_handling=sem,
                    proficient_subjects=[s for s in [s1, s2] if s]
                ))

    # Return pure parsed records - no fake mock defaults!
    return ParsedFacultyResponse(faculties=faculties_list, allocations=allocations_list)
