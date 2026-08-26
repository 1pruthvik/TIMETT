import re
import io
from typing import Any


class DocumentExtractionService:
    """
    Chronon Document Ingestion & Candidate Extraction Service.
    Extracts candidate branches, curriculum subjects, and faculty rosters
    from uploaded VTU syllabi, scheme documents, and department PDFs/DOCX files.
    """

    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        text = ""
        filename_lower = filename.lower()

        if filename_lower.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    text += page.extract_text() or ""
            except Exception:
                try:
                    import fitz  # PyMuPDF
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    for page in doc:
                        text += page.get_text()
                except Exception:
                    text = file_bytes.decode("utf-8", errors="ignore")
        elif filename_lower.endswith(".docx"):
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                text = "\n".join([p.text for p in doc.paragraphs])
            except Exception:
                text = file_bytes.decode("utf-8", errors="ignore")
        else:
            text = file_bytes.decode("utf-8", errors="ignore")

        return text

    @classmethod
    def parse_candidates(cls, text: str, doc_type: str = "syllabus") -> dict[str, Any]:
        """
        Parses raw text into candidate structured data for Human Review.
        """
        candidates: dict[str, Any] = {
            "branches": [],
            "subjects": [],
            "faculty": [],
        }

        lines = [line.strip() for line in text.split("\n") if line.strip()]

        # 1. Extract Subjects (Pattern: Code like 21CS32, BCS301, MAT101, etc.)
        subject_pattern = re.compile(
            r"\b([0-9]{2}[A-Z]{2,4}[0-9]{2,3}|[A-Z]{2,4}[0-9]{3}[A-Z]?)\b\s*[-–—:]?\s*([A-Za-z0-9\s&,/()-]{4,50})",
            re.IGNORECASE,
        )

        seen_codes = set()
        for line in lines:
            match = subject_pattern.search(line)
            if match:
                code = match.group(1).upper()
                name = match.group(2).strip()
                if code not in seen_codes and len(name) > 3:
                    seen_codes.add(code)
                    is_lab = bool(re.search(r"\b(lab|laboratory|practical)\b", name, re.IGNORECASE))
                    weekly_hours = 3 if is_lab else 4
                    cycle_group = None
                    if "physics" in name.lower():
                        cycle_group = "Physics"
                    elif "chemistry" in name.lower():
                        cycle_group = "Chemistry"

                    candidates["subjects"].append({
                        "code": code,
                        "name": name,
                        "is_lab": is_lab,
                        "subject_type": "Lab" if is_lab else "Theory",
                        "weekly_hours": weekly_hours,
                        "cycle_group": cycle_group,
                        "confidence": 0.85,
                    })

        # 2. Extract Faculty (Pattern: Dr. / Prof. / Name with Designation)
        faculty_pattern = re.compile(
            r"\b(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+([A-Za-z\s.]{3,35})\b",
            re.IGNORECASE,
        )

        seen_faculty = set()
        for line in lines:
            match = faculty_pattern.search(line)
            if match:
                title = match.group(1).strip()
                name = match.group(2).strip()
                full_name = f"{title} {name}"
                if full_name.lower() not in seen_faculty and len(name) > 3:
                    seen_faculty.add(full_name.lower())
                    designation = "Associate Professor" if "dr" in title.lower() else "Assistant Professor"
                    candidates["faculty"].append({
                        "name": full_name,
                        "designation": designation,
                        "confidence": 0.90,
                    })

        # 3. Extract Engineering Branches
        branch_keywords = [
            ("Computer Science & Engineering", "CSE"),
            ("Information Science & Engineering", "ISE"),
            ("Artificial Intelligence & Machine Learning", "AIML"),
            ("Artificial Intelligence & Data Science", "AIDS"),
            ("Electronics & Communication Engineering", "ECE"),
            ("Electrical & Electronics Engineering", "EEE"),
            ("Mechanical Engineering", "ME"),
            ("Civil Engineering", "CV"),
        ]

        text_lower = text.lower()
        for b_name, b_code in branch_keywords:
            if b_name.lower() in text_lower or b_code.lower() in text_lower:
                candidates["branches"].append({
                    "name": b_name,
                    "code": b_code,
                    "student_count": 60,
                })

        return candidates
