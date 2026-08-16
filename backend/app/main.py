from fastapi import FastAPI
from app.db.database import engine

app = FastAPI(
    title="College Timetable Planner API",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    try:
        with engine.connect():
            return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}