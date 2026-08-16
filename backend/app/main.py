from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.institutions import router as institution_router

app = FastAPI(
    title="TIMETT API",
    version="1.0.0",
)

app.include_router(health_router)
app.include_router(institution_router)