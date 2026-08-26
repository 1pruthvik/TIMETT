from app.schemas.institution import InstitutionBase, InstitutionCreate, InstitutionResponse
from app.schemas.department import DepartmentCreate, DepartmentResponse
from app.schemas.stream import StreamBase, StreamCreate, StreamUpdate, StreamResponse
from app.schemas.branch import BranchBase, BranchCreate, BranchUpdate, BranchResponse
from app.schemas.academic_year import AcademicYearCreate, AcademicYearResponse
from app.schemas.semester import SemesterCreate, SemesterResponse
from app.schemas.faculty import FacultyCreate, FacultyResponse
from app.schemas.subject import SubjectBase, SubjectCreate, SubjectUpdate, SubjectResponse
from app.schemas.section import SectionBase, SectionCreate, SectionUpdate, SectionResponse
from app.schemas.batch import BatchBase, BatchCreate, BatchUpdate, BatchResponse
from app.schemas.room import RoomCreate, RoomResponse
from app.schemas.lab import LabBase, LabCreate, LabUpdate, LabResponse
from app.schemas.lab_subject_mapping import (
    LabSubjectMappingBase,
    LabSubjectMappingCreate,
    LabSubjectMappingResponse,
)
from app.schemas.time_slot import TimeSlotCreate, TimeSlotResponse
from app.schemas.faculty_availability import (
    FacultyAvailabilityCreate,
    FacultyAvailabilityResponse,
)
from app.schemas.subject_offering import (
    SubjectOfferingCreate,
    SubjectOfferingResponse,
)
from app.schemas.timetable import TimetableCreate, TimetableResponse
from app.schemas.timetable_entry import (
    TimetableEntryBase,
    TimetableEntryCreate,
    TimetableEntryUpdate,
    TimetableEntryResponse,
)
from app.schemas.constraint import ConstraintCreate, ConstraintResponse
from app.schemas.timetable_version import (
    TimetableVersionCreate,
    TimetableVersionResponse,
)
from app.schemas.generation_run import (
    GenerationRunBase,
    GenerationRunCreate,
    GenerationRunResponse,
)
from app.schemas.document import (
    DocumentBase,
    DocumentCreate,
    DocumentConfirmRequest,
    DocumentResponse,
)
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    OAuthRequest,
    UserResponse,
    AuthResponse,
)

__all__ = [
    "InstitutionBase", "InstitutionCreate", "InstitutionResponse",
    "DepartmentCreate", "DepartmentResponse",
    "StreamBase", "StreamCreate", "StreamUpdate", "StreamResponse",
    "BranchBase", "BranchCreate", "BranchUpdate", "BranchResponse",
    "AcademicYearCreate", "AcademicYearResponse",
    "SemesterCreate", "SemesterResponse",
    "FacultyCreate", "FacultyResponse",
    "SubjectBase", "SubjectCreate", "SubjectUpdate", "SubjectResponse",
    "SectionBase", "SectionCreate", "SectionUpdate", "SectionResponse",
    "BatchBase", "BatchCreate", "BatchUpdate", "BatchResponse",
    "RoomCreate", "RoomResponse",
    "LabBase", "LabCreate", "LabUpdate", "LabResponse",
    "LabSubjectMappingBase", "LabSubjectMappingCreate", "LabSubjectMappingResponse",
    "TimeSlotCreate", "TimeSlotResponse",
    "FacultyAvailabilityCreate", "FacultyAvailabilityResponse",
    "SubjectOfferingCreate", "SubjectOfferingResponse",
    "TimetableCreate", "TimetableResponse",
    "TimetableEntryBase", "TimetableEntryCreate", "TimetableEntryUpdate", "TimetableEntryResponse",
    "ConstraintCreate", "ConstraintResponse",
    "TimetableVersionCreate", "TimetableVersionResponse",
    "GenerationRunBase", "GenerationRunCreate", "GenerationRunResponse",
    "DocumentBase", "DocumentCreate", "DocumentConfirmRequest", "DocumentResponse",
    "RegisterRequest", "LoginRequest", "OAuthRequest", "UserResponse", "AuthResponse",
]
