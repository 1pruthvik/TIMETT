# TIMETT — Conversation Change Log / Handoff

## 1. Project
- Project: **TIMETT — College Timetable Planner**
- Repository/workspace: `TIMETT`
- Main development branches discussed: `pranav`, `dev`
- Current work described in this conversation is primarily on the **`pranav` branch**.
- Friend is working on authentication on the **`dev` branch** to avoid conflicts with CRUD/API work.

## 2. User working style / collaboration preferences
- User prefers **short, direct, step-by-step instructions**.
- When doing implementation/debugging, give **one concrete next step at a time** and wait for the user to confirm completion before moving on.
- User often prefers direct code/commands that can be pasted into VS Code/PowerShell rather than lengthy explanations.
- User wants honest status assessments rather than blindly agreeing.

## 3. Stack / architecture established
- Backend: **FastAPI**
- ORM/database layer: **SQLAlchemy**
- Migrations: **Alembic**
- Database: **PostgreSQL**
- Timetable solver: **OR-Tools CP-SAT**
- Frontend: Next.js
- API documentation/testing: FastAPI Swagger/OpenAPI at `http://127.0.0.1:8000/docs`
- Backend runs with Uvicorn, e.g.:
  `uvicorn app.main:app --reload`

## 4. Database setup
PostgreSQL database/user:
- Database: `timetable_db`
- User: `timetable_user`
- Local host: `localhost`
- The user's PostgreSQL password was stated as `2026`. DO NOT repeat or expose this unnecessarily.

The environment problem was fixed:
- `DATABASE_URL` was initially missing.
- `.env` was configured and database connectivity eventually worked.
- Alembic initially failed because `env.py` had no `MetaData` object.
- That was fixed and migrations/autogeneration subsequently worked.

## 5. Database schema / tables
The database reached 17 tables:

1. `academic_years`
2. `alembic_version`
3. `constraints`
4. `departments`
5. `faculty`
6. `faculty_availability`
7. `generation_runs`
8. `institutions`
9. `rooms`
10. `sections`
11. `semesters`
12. `subject_offerings`
13. `subjects`
14. `time_slots`
15. `timetable_entries`
16. `timetable_versions`
17. `timetables`

The user verified the tables with PostgreSQL `\dt`.

## 6. API status
Swagger/OpenAPI is working and currently exposes:

### Basic
- `GET /health`

### Institutions
- `GET /institutions/`
- `POST /institutions/`
- `GET /institutions/{institution_id}`
- `PUT /institutions/{institution_id}`
- `DELETE /institutions/{institution_id}`

### Departments
- `GET /departments/`
- `POST /departments/`
- `GET /departments/{department_id}`
- `PUT /departments/{department_id}`
- `DELETE /departments/{department_id}`

### Academic Years
- `GET /academic-years/`
- `POST /academic-years/`
- `GET /academic-years/{academic_year_id}`
- `PUT /academic-years/{academic_year_id}`
- `DELETE /academic-years/{academic_year_id}`

### Faculty
- `GET /faculty/`
- `POST /faculty/`
- `GET /faculty/{faculty_id}`
- `PUT /faculty/{faculty_id}`
- `DELETE /faculty/{faculty_id}`

### Subjects
- `GET /subjects/`
- `POST /subjects/`
- `GET /subjects/{subject_id}`
- `PUT /subjects/{subject_id}`
- `DELETE /subjects/{subject_id}`

### Sections
- `GET /sections/`
- `POST /sections/`
- `GET /sections/{section_id}`
- `PUT /sections/{section_id}`
- `DELETE /sections/{section_id}`

### Rooms
- `GET /rooms/`
- `POST /rooms/`
- `GET /rooms/{room_id}`
- `PUT /rooms/{room_id}`
- `DELETE /rooms/{room_id}`

### Time Slots
- `GET /time-slots/`
- `POST /time-slots/`
- `GET /time-slots/{time_slot_id}`
- `PUT /time-slots/{time_slot_id}`
- `DELETE /time-slots/{time_slot_id}`

### Faculty Availability
- `GET /faculty-availability/`
- `POST /faculty-availability/`
- `GET /faculty-availability/{availability_id}`
- `PUT /faculty-availability/{availability_id}`
- `DELETE /faculty-availability/{availability_id}`

### Subject Offerings
- `GET /subject-offerings/`
- `POST /subject-offerings/`
- `GET /subject-offerings/{item_id}`
- `PUT /subject-offerings/{item_id}`
- `DELETE /subject-offerings/{item_id}`

### Timetables
- `GET /timetables/`
- `POST /timetables/`
- `GET /timetables/{item_id}`
- `PUT /timetables/{item_id}`
- `DELETE /timetables/{item_id}`

### Timetable Entries
- `GET /timetable-entries/`
- `POST /timetable-entries/`
- `GET /timetable-entries/{item_id}`
- `PUT /timetable-entries/{item_id}`
- `DELETE /timetable-entries/{item_id}`

### Constraints
- `GET /constraints/`
- `POST /constraints/`
- `GET /constraints/{item_id}`
- `PUT /constraints/{item_id}`
- `DELETE /constraints/{item_id}`

### Timetable Versions
- `GET /timetable-versions/`
- `POST /timetable-versions/`
- `GET /timetable-versions/{item_id}`
- `PUT /timetable-versions/{item_id}`
- `DELETE /timetable-versions/{item_id}`

### Generation Runs
- `GET /generation-runs/`
- `POST /generation-runs/`
- `GET /generation-runs/{item_id}`
- `PUT /generation-runs/{item_id}`
- `DELETE /generation-runs/{item_id}`

### Generator
- `POST /generator/generate`

## 7. Important schema additions
Academic year and semester APIs were initially missing from Swagger, then added successfully.

Confirmed Academic Year creation:
```json
{
  "institution_id": 3,
  "name": "2026-27"
}
```
Response:
```json
{
  "institution_id": 3,
  "name": "2026-27",
  "id": 1
}
```

Confirmed Semester creation:
```json
{
  "academic_year_id": 1,
  "name": "Semester 1"
}
```
Response:
```json
{
  "academic_year_id": 1,
  "name": "Semester 1",
  "id": 1
}
```

## 8. Test data currently created
The user successfully created the following records:

- Institution:
  - ID `3`
  - Name: `Test University`

- Department:
  - ID `2`
  - Name: `Computer Science`
  - Institution ID `3`

- Academic Year:
  - ID `1`
  - Name: `2026-27`
  - Institution ID `3`

- Semester:
  - ID `1`
  - Name: `Semester 1`
  - Academic Year ID `1`

- Faculty:
  - ID `1`
  - Name: `Test Faculty`
  - Designation: `Professor`
  - Department ID `2`

- Subject:
  - ID `1`
  - Name: `Data Structures`
  - Code: `CS201`
  - Department ID `2`

- Section:
  - ID `1`
  - Name: `CSE-A`
  - Department ID `2`

- Room:
  - ID `1`
  - Name: `Room 101`
  - Capacity: `60`
  - Room type: `Classroom`
  - Institution ID `3`

- Time Slots:
  - ID `1`: Monday 09:00–10:00
  - ID `2`: Monday 10:00–11:00

- Subject Offering:
  - ID `1`
  - Subject ID `1`
  - Faculty ID `1`
  - Section ID `1`
  - Semester ID `1`
  - Weekly hours: `1`

## 9. Solver status — major milestone
OR-Tools timetable generation is **actually working**.

The user ran:
`POST /generator/generate`

Successful response:
```json
{
  "status": "success",
  "timetable_id": 1,
  "entries": [
    {
      "subject_offering_id": 1,
      "room_id": 1,
      "time_slot_id": 2
    }
  ]
}
```

This proves the current pipeline can:
1. Read scheduling data from PostgreSQL.
2. Run the solver.
3. Produce a valid assignment.
4. Create a timetable.
5. Create/save timetable entries.
6. Return the generated result through FastAPI.

The user also checked PostgreSQL with:
```sql
SELECT * FROM timetables;
SELECT * FROM timetable_entries;
```
and confirmed the generated data was being persisted.

## 10. Existing solver files
The backend has:
```text
backend/app/solver/
    __init__.py
    constraints.py
    model.py
    service.py
```

At one point these files were empty; solver functionality was subsequently implemented and the generator began working.

## 11. Important distinction: current solver vs database APIs
The database has a `faculty_availability` table and CRUD endpoints, but merely storing availability does NOT mean the solver respects it.

This is the next solver task:
- Make `service.py` load faculty availability from the DB.
- Add the appropriate CP-SAT restrictions.
- Ensure a faculty member is only assigned to permitted day/time slots.

A test availability record should be:
```json
{
  "faculty_id": 1,
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

Expected behavior:
- Slot 1 (Monday 09:00–10:00) is allowed.
- Slot 2 (Monday 10:00–11:00) is allowed.
- Any slot outside that availability should be disallowed for that faculty member.

The previous assistant instructed the user to create this availability record next. The user then asked for a change log instead, so this is the point to resume from.

## 12. Generator-related entities and their intended roles
These exist but are not yet fully integrated into generation:

- `Faculty Availability`: availability windows for faculty.
- `Timetable`: generated timetable container; currently generator creates one.
- `Timetable Entries`: actual subject offering/room/time assignments; currently generator creates them.
- `Constraints`: configurable hard/soft scheduling rules; API exists but solver integration needs to be expanded.
- `Timetable Versions`: version history/snapshots; API exists but generation flow does not yet fully automate version creation.
- `Generation Runs`: execution history/status/metrics/errors; API exists but generation flow does not yet fully automate run records.

Do NOT manually create Timetable or Timetable Entries for normal generation testing if the generator is supposed to create them.

## 13. Known previous error/fix
A route import error occurred:
`ModuleNotFoundError: No module named 'app.api.routes.subject_offerings'`

Cause: files were missing from routes.

The missing route/schema files were created and the API then worked.

## 14. Friend/authentication collaboration
Friend asked:
> "I'm integrating authentication on the dev branch. Are you planning to implement auth/user models on the pranav branch, or should I add the FastAPI authentication layer? I want to avoid conflicting with your CRUD/API work."

Decision was to let the friend proceed with authentication on `dev`, while `pranav` continues CRUD/solver work.

Do not duplicate authentication implementation unless coordination changes.

## 15. Git status / checkpoint
The user had modified/untracked files including:
- `README.md`
- `.gitignore`
- `backend/`

The user was instructed to checkpoint the working generator with:
```powershell
git status
git add .
git commit -m "feat: implement working timetable generator"
git push origin pranav
```

Need to verify actual commit success if continuing; the conversation does not explicitly show the final command output after the instruction.

## 16. Major completed milestones
- Project/backend setup
- PostgreSQL setup
- SQLAlchemy + Alembic
- Database schema
- FastAPI setup
- Core CRUD APIs
- Academic Year + Semester APIs
- Timetable APIs
- Constraint APIs
- OR-Tools integration
- Basic scheduling constraints
- Timetable generation
- PostgreSQL persistence
- Git/branch setup

## 17. Major pending milestones
1. Faculty Availability Constraint
2. Room Capacity Constraint
3. Weekly Hours Constraint
4. Advanced hard constraints
5. Soft constraints
6. Optimization objective
7. Generation Run integration
8. Timetable Version integration
9. Authentication integration/merge
10. Frontend integration
11. Timetable UI
12. End-to-end testing
13. Deployment
14. Final documentation/polish

## 18. Approximate overall status
Previous rough assessment was **~55–60% overall**, but this is only a project-management estimate, not a measured percentage.

A useful status view:
- Database: essentially complete for current schema
- Backend CRUD/API: essentially complete for current scope
- Basic solver: working
- Full optimization/constraint intelligence: incomplete
- Authentication: friend-owned/in progress on `dev`
- Frontend: still substantially pending
- Testing/deployment: substantially pending

## 19. Immediate next step
Resume with exactly this task:

### Faculty Availability integration into the solver
First ensure this DB record exists:
```json
{
  "faculty_id": 1,
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

Then inspect the current `backend/app/solver/service.py` and implement availability-aware scheduling.

IMPORTANT: Before giving replacement code for `service.py`, inspect the actual current file contents if available in the workspace/repository. Do not assume its exact implementation.

After implementation:
1. Restart Uvicorn if needed.
2. Run `/generator/generate`.
3. Verify generated assignments respect availability.
4. Test an intentionally unavailable slot/window to prove the constraint is enforced.
5. Commit the checkpoint.

## 20. Next solver roadmap
After faculty availability:
1. Room capacity
2. Weekly hours
3. Faculty/section/room clash prevention robustness
4. Hard vs soft constraints
5. Optimization objective
6. Infeasibility/conflict reporting
7. GenerationRun creation/update
8. TimetableVersion creation
9. Solver metrics
10. Frontend integration

## 21. Useful commands
Start backend:
```powershell
cd backend
uvicorn app.main:app --reload
```

Open Swagger:
`http://127.0.0.1:8000/docs`

Connect PostgreSQL:
```powershell
psql -U timetable_user -d timetable_db -h localhost
```

List tables:
```sql
\dt
```

Check generated timetable:
```sql
SELECT * FROM timetables;
```

Check generated entries:
```sql
SELECT * FROM timetable_entries;
```

Exit psql:
```sql
\q
```

## 22. Important continuity instruction
The user prefers a guided workflow:
- Give one actionable step at a time.
- Wait for confirmation/result.
- Then provide the next step.
- Keep explanations concise unless the user asks for detail.
- When the user asks for direct code, provide paste-ready code.
- Do not make them manually type lots of repetitive data when an automated/scripted approach is practical.

## 23. Current stopping point
The last active task before this handoff request was:
**Make the OR-Tools solver actually respect Faculty Availability.**

The user had already proven basic timetable generation works and had successfully persisted generated timetable/timetable-entry data.

The next response in a new ChatGPT instance should acknowledge the current checkpoint and proceed with the Faculty Availability task, ideally asking for/inspecting the current `backend/app/solver/service.py` before replacing it.
