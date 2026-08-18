
# 🚀 TIMETT — Full System Changes & Evolution Log
> **Comprehensive Changelog of Backend & Frontend Developments (Yesterday & Today)**

---

## 📌 1. Executive Summary

Over the past 48 hours, **TIMETT** has evolved from an initial prototype into an institutional-grade, multi-tenant automated timetable generation SaaS platform. The system now features:
- A high-performance **Constraint Programming / CSP Genetic Solver Engine**.
- Complete **Multi-Tenant Workspace Isolation** backed by PostgreSQL.
- A **Flagship Timetable Studio** adhering to the Master Specification (Section/Faculty/Room/Mobile views, conflict validation, versioning, exports).
- A unified **Institutional Infrastructure Management** flow (Academic Terms ➔ Departments ➔ Rooms & Labs ➔ Subjects ➔ Faculty).
- **Direct Room Allocation** with semester-wise section segregation and instant auto-save.

---

## ⚙️ 2. Backend Architectural Changes

### 2.1 Multi-Tenant Workspace & Account Isolation
- **Tenant Scope Isolation**:
  - Bound all major entities (`AcademicYear`, `Semester`, `Department`, `Section`, `Faculty`, `Subject`, `Room`, `TimeSlot`, `SubjectOffering`, `Timetable`) to `institution_id`.
  - Added auto-provisioning of workspaces when new users register or authenticate via OAuth.
- **Independent OAuth 2.0 Accounts**:
  - Isolated Google, GitHub, and Apple logins to ensure each provider creates and accesses its own workspace without collision.

### 2.2 Cascading Deletions & Foreign Key Resilience
- **Safe Department Cascading Deletion (`DELETE /departments/{id}`)**:
  - Resolved foreign key constraint violations by implementing an automated cascading cleanup pipeline:
    1. Removes associated `timetable_entries`.
    2. Deletes dependent `subject_offerings`.
    3. Cleans up child `sections`, `faculty`, and `subjects`.
    4. Safely removes the `Department` record without connection aborts.
- **Academic Terms Cascade**:
  - Enabled clean cascading deletion for `academic_years` and `semesters`.

### 2.3 Subject & Department Modeling
- **Decoupled Subject Model**:
  - Scoped subject code uniqueness to the department level (`uq_subjects_dept_code`), preventing global code collisions while allowing flexible cross-department naming.
- **Dynamic Semester & Section Querying**:
  - Optimized queries in `/sections/` and `/semesters/` to accept `institution_id` filters for strict workspace boundaries.

### 2.4 Timetable Generation & Algorithm Engine
- **Genetic / CSP Hybrid Solver Integration**:
  - Integrated the core solver logic into `backend/app/services/solver/`.
  - Added support for hard constraints:
    - No faculty double-booking.
    - No student section double-booking.
    - No room/lab double-booking.
    - Lab consecutive period pairings (2–3 continuous slots).
  - Soft constraint optimization for teacher preferences and balanced daily distribution.
- **Version Tracking & Generation Jobs**:
  - Added background job tracking for timetable generations with progress percentage and status states (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).

---

## 🎨 3. Frontend Full Rebuild & Feature Updates

### 3.1 Sidebar Navigation Flow (Reordered)
Reordered the primary management navigation in `components/layout/app-sidebar.tsx` to match the exact institutional setup lifecycle:
1. 📅 **Academic Terms** (`/academic-terms`) — Define academic years and active semesters.
2. 🏛️ **Departments** (`/departments`) — Create departments, configure semester sections, and define department labs.
3. 🚪 **Rooms & Labs** (`/rooms`) — View department infrastructure, allocate physical room numbers, and manage spaces.
4. 📚 **Subjects** (`/subjects`) — Manage theory and lab curriculum courses.
5. 👥 **Faculty** (`/faculty`) — Manage professors, designations, and workload caps.
6. ⚙️ **Constraints** (`/constraints`) — Set scheduling rules and hard/soft parameters.
7. ⏰ **Time Slots** (`/time-slots`) — Configure bell schedules and lunch periods.
8. 🗂️ **Versions** (`/versions`) — Manage published timetable drafts and history.

---

### 3.2 Flagship Timetable Studio (`app/timetable/page.tsx`)
- **Multi-Perspective Grid Views**:
  - **Section Perspective**: Weekly grid for individual student cohorts.
  - **Faculty Perspective**: Weekly schedule for professors with workload metrics.
  - **Room Perspective**: Utilization tracker for classrooms and laboratories.
  - **Mobile Condensed Card View**: Responsive view for mobile and tablet devices.
- **Interactive Schedule Manipulation**:
  - Hard constraint validation on drag-and-drop (preventing faculty or room double-booking).
  - Multi-level **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y`).
  - **Conflict Intelligence Bar**: Real-time validation displaying `0 Hard Conflicts` and `100% Validated`.
  - **AI Modification Command Bar**: Natural language interface for on-the-fly schedule adjustments.
- **Comprehensive Export Suite**:
  - **Direct Print**: Print-optimized stylesheet.
  - **PDF Export**: Vector PDF rendering.
  - **Word Export**: Formatted `.docx` document generation.
  - **Excel Export**: Spreadsheet timetable export.

---

### 3.3 Rooms & Laboratories Allocation (`app/rooms/page.tsx`)
- **Department-First Hierarchical Layout**:
  - Groups all institutional spaces under dedicated Department Glass Panels.
- **Semester-Segregated Theory Sections**:
  - Theory sections are segregated by **Semesters** (e.g. `Semester 1`, `Semester 3`, `Semester 5`) with dedicated badge headers and section counters.
- **Direct Room Number Input**:
  - Replaced `<select>` dropdowns with **direct text `<Input>` fields** for both theory sections and department labs.
  - Type room numbers directly (e.g. `301`, `302`, `LH-102`, `Lab 2`).
  - **Instant Auto-Save**: Saves immediately on typing or <kbd>Enter</kbd>/`onBlur` and automatically provisions the physical room in the database.
- **Direct Section & Lab Editing**:
  - Added **Edit Section Dialog** (pencil icon) to modify section name, capacity, and linked classroom directly.
  - Added **Delete Section Action** (trash icon) to remove sections on the spot.
  - Added **Edit & Delete Laboratory Actions**.

---

### 3.4 Departments & Infrastructure Provisioning (`app/departments/page.tsx`)
- **Dynamic Academic Terms Binding**:
  - Fetches active semesters directly from `/semesters/?institution_id=${id}` so section counts are only requested for user-defined academic terms.
- **Department-Level Laboratories**:
  - Input total department laboratories once per department (e.g. `CSE Lab 1`, `CSE Lab 2`) instead of duplicating across every semester.
- **1:1 Exact Count Synchronization**:
  - Synchronized database counts between the main roster and the Edit Department modal.
- **Live Cohort & Lab Matrix in Edit Modal**:
  - Full interactive section and laboratory add/remove matrix inside the edit dialog.

---

### 3.5 Design System, Theme & Typography Upgrades
- **Pure Purple & Glassmorphism Aesthetic**:
  - Tailored HSL color tokens with pure purple accents (`#8B5CF6`, `#7C3AED`, `#6D28D9`).
  - Premium frosted glass cards (`backdrop-blur-2xl`) and gradient buttons.
- **Typography Suite**:
  - Integrated **Plus Jakarta Sans** (interface), **Outfit** (headings), and **JetBrains Mono** (codes, rooms, and metrics).
  - Enhanced letter tracking and line spacing for readability.
- **Theme Polish**:
  - Removed canvas dot grid artifacts across dark and light modes.
  - Fully styled native and custom `<select>` dropdowns for both themes.

---

## 📊 4. Git Commits Timeline (Recent 48h)

| Commit Hash | Component | Summary |
| :--- | :--- | :--- |
| `c8f8963` | **Sidebar** | Reordered navigation to: *Academic Terms ➔ Departments ➔ Rooms & Labs ➔ Subjects ➔ Faculty* |
| `9709ae1` | **Rooms & Labs** | Segregated theory sections by semester under each department with individual room number inputs |
| `5cf9c60` | **Rooms & Labs** | Enabled direct typing/entering of room numbers with instant auto-save and room provisioning |
| `b9f157a` | **Rooms & Labs** | Added direct Edit and Delete section dialogs and actions |
| `03efd82` | **Rooms & Labs** | Rebuilt layout hierarchically by department with sections and labs grouped |
| `3d6b25e` | **Departments API** | Implemented safe cascading deletion of department and child associations |
| `260377c` | **Departments** | Dynamically bound semester section inputs to user-configured semesters from Academic Terms |
| `68661ac` | **Departments** | Ensured exact 1:1 database count matching between table view and edit modal |
| `91c607d` | **Departments** | Implemented one-time department laboratories input with semester sections breakdown |
| `883408f` | **Navigation** | Cleaned up sidebar navigation by removing standalone Sections tab |
| `41e156f` | **Flagship Studio** | Rebuilt timetable studio per Master Specification (views, drag & drop, AI bar, exports) |
| `3e272ef` | **Subjects** | Decoupled department field from subject creation and table view |
| `579c3ae` | **Multi-Tenancy** | Scoped subject, section, and faculty queries to user workspace institution |
| `500f0dc` | **Database** | Scoped subject code uniqueness to department level |
| `311ab1e` | **CRUD** | Enabled cascade deletion of academic terms & standardized table indexing |
| `cf15690` | **Design** | Upgraded typography to Plus Jakarta Sans, Outfit, and JetBrains Mono |
| `82fcb3c` | **Auth** | Added provider-level account isolation for GitHub and Google OAuth logins |

---

## ✅ 5. Verification Status
- **Next.js Production Build**: **23/23 routes compiled and prerendered with 0 errors**.
- **FastAPI Backend Server**: Running healthy on `http://127.0.0.1:8000`.
- **Git Branch**: All changes cleanly committed to `dev`.
