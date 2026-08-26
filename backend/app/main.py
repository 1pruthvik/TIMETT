from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.institutions import router as institution_router
from app.api.routes.departments import router as department_router
from app.api.routes.academic_years import router as academic_year_router
from app.api.routes.semesters import router as semester_router
from app.api.routes.faculty import router as faculty_router
from app.api.routes.subjects import router as subject_router
from app.api.routes.sections import router as section_router
from app.api.routes.rooms import router as room_router
from app.api.routes.time_slots import router as time_slot_router
from app.api.routes.faculty_availability import router as faculty_availability_router
from app.api.routes.subject_offerings import router as subject_offering_router
from app.api.routes.timetables import router as timetable_router
from app.api.routes.timetable_entries import router as timetable_entry_router
from app.api.routes.constraints import router as constraint_router
from app.api.routes.timetable_versions import router as timetable_version_router
from app.api.routes.generation_runs import router as generation_run_router
from app.api.routes.generator import router as generator_router
from app.api.routes.kaci import router as kaci_router
from app.api.routes.streams import router as stream_router
from app.api.routes.cycle_groups import router as cycle_group_router
from app.api.routes.vtu_courses import router as vtu_router


app = FastAPI(
    title="TIMETT API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(institution_router)
app.include_router(department_router)
app.include_router(academic_year_router)
app.include_router(semester_router)
app.include_router(faculty_router)
app.include_router(subject_router)
app.include_router(section_router)
app.include_router(room_router)
app.include_router(time_slot_router)
app.include_router(faculty_availability_router)
app.include_router(subject_offering_router)
app.include_router(timetable_router)
app.include_router(timetable_entry_router)
app.include_router(constraint_router)
app.include_router(timetable_version_router)
app.include_router(generation_run_router)
app.include_router(generator_router)
app.include_router(kaci_router)
app.include_router(stream_router)
app.include_router(cycle_group_router)
app.include_router(vtu_router)




