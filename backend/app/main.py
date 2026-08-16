from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.institutions import router as institution_router
from app.api.routes.departments import router as department_router
from app.api.routes.faculty import router as faculty_router
from app.api.routes.subjects import router as subject_router
from app.api.routes.sections import router as section_router
from app.api.routes.rooms import router as room_router
from app.api.routes.time_slots import router as time_slot_router
from app.api.routes.faculty_availability import router as faculty_availability_router


app = FastAPI(
    title="TIMETT API",
    version="1.0.0",
)


app.include_router(health_router)
app.include_router(institution_router)
app.include_router(department_router)
app.include_router(faculty_router)
app.include_router(subject_router)
app.include_router(section_router)
app.include_router(room_router)
app.include_router(time_slot_router)
app.include_router(faculty_availability_router)
