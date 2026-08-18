"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Pencil,
  Users,
  RefreshCw,
  CalendarClock,
  Check,
  X,
  BookOpen,
  AlertCircle,
  Sparkles,
  Building2,
  GraduationCap,
  Clock,
  Layers,
  Search,
  BookMarked,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { start: "09:00", end: "10:00", label: "09:00 - 10:00" },
  { start: "10:00", end: "11:00", label: "10:00 - 11:00" },
  { start: "11:15", end: "12:15", label: "11:15 - 12:15" },
  { start: "12:15", end: "01:15", label: "12:15 - 01:15" },
  { start: "14:00", end: "15:00", label: "02:00 - 03:00" },
  { start: "15:00", end: "16:00", label: "03:00 - 04:00" },
];

interface FacultyMember {
  id: number;
  name: string;
  department_id: number;
  designation?: string | null;
}

interface Department {
  id: number;
  name: string;
  institution_id: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  department_id?: number;
}

interface Section {
  id: number;
  name: string;
  department_id?: number;
}

interface AcademicSemester {
  id: number;
  name: string;
  academic_year_id: number;
}

interface SubjectOffering {
  id: number;
  subject_id: number;
  faculty_id: number;
  section_id: number;
  semester_id: number;
  weekly_hours: number;
}

interface AvailabilityRecord {
  id?: number;
  faculty_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface SubjectMeta {
  semesterName: string;
  subjectType: "Theory" | "Lab" | "Elective";
  weeklyHours: number;
}

interface FacultyLoadAssignment {
  handling_department_id: number;
  semester_name: string;
  subject_id: number | "";
  weekly_hours: number;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>([]);
  const [subjectMetaMap, setSubjectMetaMap] = useState<Record<number, SubjectMeta>>({});
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Stored Faculty Workloads: facultyId -> FacultyLoadAssignment[]
  const [facultyLoads, setFacultyLoads] = useState<Record<number, FacultyLoadAssignment[]>>({});

  // Form states for Add Faculty
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [assignments, setAssignments] = useState<FacultyLoadAssignment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Faculty states
  const [editOpen, setEditOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("Assistant Professor");
  const [editDepartmentId, setEditDepartmentId] = useState<number | "">("");
  const [editAssignments, setEditAssignments] = useState<FacultyLoadAssignment[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Availability Modal states
  const [availOpen, setAvailOpen] = useState(false);
  const [activeFaculty, setActiveFaculty] = useState<FacultyMember | null>(null);
  const [availMap, setAvailMap] = useState<Record<string, boolean>>({});
  const [savingAvail, setSavingAvail] = useState(false);

  const getSubjectHours = (subId: number | ""): number => {
    if (!subId) return 4;
    const meta = subjectMetaMap[Number(subId)];
    if (meta?.weeklyHours) return meta.weeklyHours;
    const sub = subjects.find((s) => s.id === Number(subId));
    if (sub?.name.toLowerCase().includes("lab")) return 3;
    return 4;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;

      const [deptRes, facRes, subRes, secRes, semRes, offRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/faculty/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/subjects/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/semesters/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/subject-offerings/?institution_id=${userInstId}`).catch(() => null),
      ]);

      let depts: Department[] = [];
      if (deptRes && deptRes.ok) {
        depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) {
          setDepartmentId(depts[0].id);
        }
      }

      let facs: FacultyMember[] = [];
      if (facRes && facRes.ok) {
        facs = await facRes.json();
        setFaculty(facs);
      }

      let subs: Subject[] = [];
      if (subRes && subRes.ok) {
        subs = await subRes.json();
        setSubjects(subs);
      }

      if (secRes && secRes.ok) {
        setSections(await secRes.json());
      }

      let sems: AcademicSemester[] = [];
      if (semRes && semRes.ok) {
        sems = await semRes.json();
        setAcademicSemesters(sems);
      }

      if (offRes && offRes.ok) {
        setOfferings(await offRes.json());
      }

      // Load subject metadata for periods per week
      let loadedMeta: Record<number, SubjectMeta> = {};
      const savedMeta = localStorage.getItem(`timett_subject_meta_${userInstId}`);
      if (savedMeta) {
        loadedMeta = JSON.parse(savedMeta);
        setSubjectMetaMap(loadedMeta);
      }

      // Load saved teaching loads from localStorage
      const savedLoads = localStorage.getItem(`timett_faculty_loads_${userInstId}`);
      if (savedLoads) {
        setFacultyLoads(JSON.parse(savedLoads));
      }

      // Default initial assignment row
      if (depts.length > 0 && assignments.length === 0) {
        const defaultSem = sems.length > 0 ? sems[0].name : "Semester 1";
        const deptSubs = subs.filter((s) => !s.department_id || s.department_id === depts[0].id);
        const firstSubId = deptSubs.length > 0 ? deptSubs[0].id : (subs.length > 0 ? subs[0].id : "");
        const initHours = loadedMeta[Number(firstSubId)]?.weeklyHours || 4;

        setAssignments([
          {
            handling_department_id: depts[0].id,
            semester_name: defaultSem,
            subject_id: firstSubId,
            weekly_hours: initHours,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableSemesters =
    academicSemesters.length > 0
      ? academicSemesters.map((s) => s.name)
      : ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"];

  const addAssignmentRow = () => {
    const defaultDept = departments.length > 0 ? departments[0].id : 1;
    const defaultSem = availableSemesters[0] || "Semester 1";
    const deptSubs = subjects.filter((s) => !s.department_id || s.department_id === defaultDept);
    const firstSubId = deptSubs.length > 0 ? deptSubs[0].id : (subjects.length > 0 ? subjects[0].id : "");
    const hours = getSubjectHours(firstSubId);

    setAssignments((prev) => [
      ...prev,
      {
        handling_department_id: defaultDept,
        semester_name: defaultSem,
        subject_id: firstSubId,
        weekly_hours: hours,
      },
    ]);
  };

  const removeAssignmentRow = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAssignment = (
    index: number,
    field: keyof FacultyLoadAssignment,
    value: any
  ) => {
    setAssignments((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };

      if (field === "handling_department_id") {
        const deptSubs = subjects.filter((s) => !s.department_id || s.department_id === Number(value));
        const firstSubId = deptSubs.length > 0 ? deptSubs[0].id : "";
        updated.subject_id = firstSubId;
        updated.weekly_hours = getSubjectHours(firstSubId);
      } else if (field === "subject_id") {
        updated.weekly_hours = getSubjectHours(Number(value));
      }

      next[index] = updated;
      return next;
    });
  };

  const addEditAssignmentRow = () => {
    const defaultDept = departments.length > 0 ? departments[0].id : 1;
    const defaultSem = availableSemesters[0] || "Semester 1";
    const deptSubs = subjects.filter((s) => !s.department_id || s.department_id === defaultDept);
    const firstSubId = deptSubs.length > 0 ? deptSubs[0].id : (subjects.length > 0 ? subjects[0].id : "");
    const hours = getSubjectHours(firstSubId);

    setEditAssignments((prev) => [
      ...prev,
      {
        handling_department_id: defaultDept,
        semester_name: defaultSem,
        subject_id: firstSubId,
        weekly_hours: hours,
      },
    ]);
  };

  const removeEditAssignmentRow = (index: number) => {
    setEditAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEditAssignment = (
    index: number,
    field: keyof FacultyLoadAssignment,
    value: any
  ) => {
    setEditAssignments((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };

      if (field === "handling_department_id") {
        const deptSubs = subjects.filter((s) => !s.department_id || s.department_id === Number(value));
        const firstSubId = deptSubs.length > 0 ? deptSubs[0].id : "";
        updated.subject_id = firstSubId;
        updated.weekly_hours = getSubjectHours(firstSubId);
      } else if (field === "subject_id") {
        updated.weekly_hours = getSubjectHours(Number(value));
      }

      next[index] = updated;
      return next;
    });
  };

  const totalAddHours = assignments.reduce((sum, a) => sum + (a.weekly_hours || 0), 0);
  const totalEditHours = editAssignments.reduce((sum, a) => sum + (a.weekly_hours || 0), 0);

  const handleAddFacultyWithSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a faculty name.");
      return;
    }

    const validAssignments = assignments.filter((a) => a.subject_id !== "");
    if (validAssignments.length === 0) {
      setError("Please add at least one subject handling assignment.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const homeDeptId = departmentId || (departments.length > 0 ? departments[0].id : 1);

      // 1. Create Faculty Member under their Home Department
      const facRes = await fetch(`${API_BASE}/faculty/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          designation: designation.trim() || "Assistant Professor",
          department_id: Number(homeDeptId),
        }),
      });

      if (!facRes.ok) {
        const errData = await facRes.json();
        throw new Error(errData.detail || "Failed to create faculty member");
      }

      const createdFaculty: FacultyMember = await facRes.json();

      // 2. Persist Teaching Loads
      const updatedLoads = {
        ...facultyLoads,
        [createdFaculty.id]: validAssignments,
      };
      setFacultyLoads(updatedLoads);
      localStorage.setItem(
        `timett_faculty_loads_1`,
        JSON.stringify(updatedLoads)
      );

      // 3. Create SubjectOfferings in background for the solver
      for (const item of validAssignments) {
        const matchingSec = sections.find((s) => s.department_id === item.handling_department_id) || sections[0];
        const defaultSemId = academicSemesters[0]?.id || 1;

        if (matchingSec) {
          await fetch(`${API_BASE}/subject-offerings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject_id: Number(item.subject_id),
              faculty_id: createdFaculty.id,
              section_id: matchingSec.id,
              semester_id: defaultSemId,
              weekly_hours: item.weekly_hours || 4,
            }),
          }).catch(() => null);
        }
      }

      setName("");
      setDesignation("Assistant Professor");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving faculty");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (fac: FacultyMember) => {
    setEditingFaculty(fac);
    setEditName(fac.name);
    setEditDesignation(fac.designation || "Assistant Professor");
    setEditDepartmentId(fac.department_id);

    const existingLoads = facultyLoads[fac.id] || [];
    if (existingLoads.length > 0) {
      // Ensure hours match subject curriculum
      const syncedLoads = existingLoads.map((l) => ({
        ...l,
        weekly_hours: getSubjectHours(l.subject_id),
      }));
      setEditAssignments(syncedLoads);
    } else {
      const defaultDept = fac.department_id || (departments.length > 0 ? departments[0].id : 1);
      const defaultSem = availableSemesters[0] || "Semester 1";
      const deptSubs = subjects.filter((s) => !s.department_id || s.department_id === defaultDept);
      const firstSubId = deptSubs.length > 0 ? deptSubs[0].id : (subjects.length > 0 ? subjects[0].id : "");
      setEditAssignments([
        {
          handling_department_id: defaultDept,
          semester_name: defaultSem,
          subject_id: firstSubId,
          weekly_hours: getSubjectHours(firstSubId),
        },
      ]);
    }

    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty || !editName.trim() || !editDepartmentId) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/faculty/${editingFaculty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          designation: editDesignation.trim() || "Assistant Professor",
          department_id: Number(editDepartmentId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update faculty");
      }

      // Save updated teaching loads
      const validLoads = editAssignments.filter((a) => a.subject_id !== "");
      const updatedLoads = {
        ...facultyLoads,
        [editingFaculty.id]: validLoads,
      };
      setFacultyLoads(updatedLoads);
      localStorage.setItem(
        `timett_faculty_loads_1`,
        JSON.stringify(updatedLoads)
      );

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating faculty");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this faculty member? All their teaching loads will be removed.")) return;
    try {
      const res = await fetch(`${API_BASE}/faculty/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFaculty((prev) => prev.filter((f) => f.id !== id));
        const updatedLoads = { ...facultyLoads };
        delete updatedLoads[id];
        setFacultyLoads(updatedLoads);
        localStorage.setItem(`timett_faculty_loads_1`, JSON.stringify(updatedLoads));
      }
    } catch (err) {
      console.error("Failed to delete faculty", err);
    }
  };

  // Availability matrix handlers
  const openAvailability = async (fac: FacultyMember) => {
    setActiveFaculty(fac);
    setAvailOpen(true);
    try {
      const res = await fetch(`${API_BASE}/availability/?faculty_id=${fac.id}`);
      if (res.ok) {
        const data: AvailabilityRecord[] = await res.json();
        const map: Record<string, boolean> = {};
        data.forEach((r) => {
          const key = `${r.day_of_week}_${r.start_time.slice(0, 5)}`;
          map[key] = true;
        });
        setAvailMap(map);
      } else {
        setAvailMap({});
      }
    } catch {
      setAvailMap({});
    }
  };

  const toggleSlot = (day: string, startTime: string) => {
    const key = `${day}_${startTime}`;
    setAvailMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveAvailability = async () => {
    if (!activeFaculty) return;
    setSavingAvail(true);
    try {
      for (const day of DAYS) {
        for (const p of PERIODS) {
          const key = `${day}_${p.start}`;
          const isAvailable = availMap[key];
          if (isAvailable) {
            await fetch(`${API_BASE}/availability/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                faculty_id: activeFaculty.id,
                day_of_week: day,
                start_time: p.start,
                end_time: p.end,
              }),
            });
          }
        }
      }
      setAvailOpen(false);
    } catch (err) {
      console.error("Failed to save availability", err);
    } finally {
      setSavingAvail(false);
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.some((f) => f.department_id === d.id && f.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Faculty & Workload Assignments"
          description="Manage institutional faculty categorized by Home Department and assign courses with automatic curriculum hours calculation."
          icon={Users}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh faculty roster"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Faculty
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Instructor Profile</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Add Faculty & Assign Teaching Loads
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Specify the faculty&apos;s home department, and select handling departments, semesters, and subjects. (Hours per week are automatically fetched from the subject curriculum).
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddFacultyWithSubjects} className="space-y-5 pt-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Dr. Rajesh Kumar or Nagabhusana"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-xl border-border bg-muted/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Designation
                    </label>
                    <Input
                      placeholder="e.g. Assistant Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="rounded-xl border-border bg-muted/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Home Department (Faculty Belongs To) *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Handled Course Allocations with Auto-Calculated Hours */}
                <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Handled Teaching Loads
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Select department, semester & subject (Periods/Wk are fixed from subject)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg gap-1 text-xs font-semibold border-border bg-card cursor-pointer"
                      onClick={addAssignmentRow}
                    >
                      <Plus className="size-3.5" /> Add Load
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {assignments.map((item, idx) => {
                      const deptSubjects = subjects.filter(
                        (s) => !s.department_id || s.department_id === item.handling_department_id
                      );

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-border bg-card/80 p-3"
                        >
                          {/* Handling Department */}
                          <div className="w-full sm:w-36">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                              Handling Dept
                            </label>
                            <select
                              className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground cursor-pointer"
                              value={item.handling_department_id}
                              onChange={(e) =>
                                updateAssignment(idx, "handling_department_id", Number(e.target.value))
                              }
                            >
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Semester */}
                          <div className="w-full sm:w-28">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                              Semester
                            </label>
                            <select
                              className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground cursor-pointer"
                              value={item.semester_name}
                              onChange={(e) =>
                                updateAssignment(idx, "semester_name", e.target.value)
                              }
                            >
                              {availableSemesters.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Subject */}
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                              Subject Handled
                            </label>
                            <select
                              className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground cursor-pointer"
                              value={item.subject_id}
                              onChange={(e) =>
                                updateAssignment(idx, "subject_id", Number(e.target.value))
                              }
                            >
                              <option value="">-- Select Subject --</option>
                              {deptSubjects.length > 0 ? (
                                deptSubjects.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.code} - {s.name}
                                  </option>
                                ))
                              ) : (
                                subjects.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.code} - {s.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          {/* Fixed Hours Display (Auto-Fetched) */}
                          <div className="w-full sm:w-28">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                              Periods/Wk
                            </label>
                            <div className="h-8 px-2.5 rounded-lg border border-border bg-muted/60 flex items-center justify-center font-mono font-bold text-xs text-foreground">
                              {item.weekly_hours} hrs/wk
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 sm:mt-4 cursor-pointer shrink-0"
                            onClick={() => removeAssignmentRow(idx)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Hours Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="size-4 text-primary" />
                      Total Cumulative Faculty Workload:
                    </span>
                    <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs px-2.5 py-0.5">
                      {totalAddHours} Hours / Week
                    </Badge>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="tt-gradient-btn rounded-xl font-bold w-full"
                  >
                    {submitting ? "Saving..." : "Save Faculty Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Search & Overview Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search faculty or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-border text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
              {departments.length} Departments
            </Badge>
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
              {faculty.length} Faculty Instructors
            </Badge>
          </div>
        </div>

        {/* Faculty Categorized by Home Department */}
        {loading ? (
          <LoadingState text="Loading faculty members by department..." />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments found"
            description="Create academic departments first to organize faculty members."
          />
        ) : (
          <div className="space-y-8">
            {filteredDepartments.map((dept) => {
              const deptFaculty = faculty.filter((f) => f.department_id === dept.id);

              return (
                <GlassPanel key={dept.id} className="p-0 overflow-hidden border-border shadow-sm">
                  {/* Department Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border bg-card/60">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#6D28D9]/20 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Faculty Instructors & Total Weekly Workloads
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 font-semibold gap-1.5 px-3 py-1">
                      <Users className="size-3.5" />
                      {deptFaculty.length} {deptFaculty.length === 1 ? "Instructor" : "Instructors"}
                    </Badge>
                  </div>

                  {/* Faculty Roster in this Department */}
                  <div className="p-5 bg-card/30">
                    {deptFaculty.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-3">
                        No faculty members currently belong to {dept.name}. Click &ldquo;Add Faculty&rdquo; to register instructors for this department.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {deptFaculty.map((fac) => {
                          const assignedLoads = facultyLoads[fac.id] || [];
                          const totalHours = assignedLoads.reduce((sum, l) => sum + (l.weekly_hours || getSubjectHours(l.subject_id)), 0);

                          return (
                            <div
                              key={fac.id}
                              className="rounded-2xl border border-border bg-card p-4 space-y-3 hover:border-primary/40 transition-colors shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-bold text-sm text-foreground">{fac.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {fac.designation || "Assistant Professor"}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <Badge className="bg-primary/15 text-primary border border-primary/30 font-mono font-bold text-xs px-2.5 py-1">
                                    {totalHours > 0 ? `${totalHours} hrs/week` : "0 hrs/week"}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                                    Total Teaching Load
                                  </span>
                                </div>
                              </div>

                              {/* Handling Course Loads */}
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                  Handled Courses & Fixed Curriculum Hours:
                                </span>
                                {assignedLoads.length === 0 ? (
                                  <span className="text-xs text-muted-foreground italic block">
                                    No teaching loads currently configured.
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {assignedLoads.map((load, lIdx) => {
                                      const sub = subjects.find((s) => s.id === load.subject_id);
                                      const targetDept = departments.find((d) => d.id === load.handling_department_id);
                                      const hours = load.weekly_hours || getSubjectHours(load.subject_id);

                                      return (
                                        <Badge
                                          key={lIdx}
                                          variant="outline"
                                          className="text-[11px] font-medium bg-muted/60 text-foreground border-border px-2.5 py-1 flex items-center gap-1.5"
                                        >
                                          <span className="font-bold text-[#8B5CF6]">
                                            {targetDept?.name || "Dept"}
                                          </span>
                                          <span className="text-muted-foreground">•</span>
                                          <span>{load.semester_name}</span>
                                          <span className="text-muted-foreground">•</span>
                                          <span className="font-semibold">{sub ? `${sub.code} - ${sub.name}` : "Subject"}</span>
                                          <span className="rounded-md bg-primary/10 text-primary font-mono text-[10px] px-1 py-0.2">
                                            {hours} hrs/wk
                                          </span>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Actions Bar */}
                              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-border/40">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAvailability(fac)}
                                  className="h-7 text-xs rounded-lg gap-1 border-border text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <CalendarClock className="size-3.5" /> Availability
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditModal(fac)}
                                  className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                  title="Edit faculty"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(fac.id)}
                                  className="size-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                  title="Delete faculty"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        )}

        {/* Edit Faculty Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Instructor</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Faculty & Teaching Loads
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateFaculty} className="space-y-4 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Full Name *
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Designation
                  </label>
                  <Input
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Home Department *
                </label>
                <select
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(Number(e.target.value))}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Handled Teaching Loads with Fixed Auto-Fetched Hours */}
              <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Handled Teaching Loads
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Handling department, semester & subject (Periods/Wk are fixed from subject)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg gap-1 text-xs font-semibold border-border bg-card cursor-pointer"
                    onClick={addEditAssignmentRow}
                  >
                    <Plus className="size-3.5" /> Add Load
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {editAssignments.map((item, idx) => {
                    const deptSubjects = subjects.filter(
                      (s) => !s.department_id || s.department_id === item.handling_department_id
                    );

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-border bg-card/80 p-3"
                      >
                        {/* Handling Department */}
                        <div className="w-full sm:w-36">
                          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Handling Dept
                          </label>
                          <select
                            className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground cursor-pointer"
                            value={item.handling_department_id}
                            onChange={(e) =>
                              updateEditAssignment(idx, "handling_department_id", Number(e.target.value))
                            }
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Semester */}
                        <div className="w-full sm:w-28">
                          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Semester
                          </label>
                          <select
                            className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground cursor-pointer"
                            value={item.semester_name}
                            onChange={(e) =>
                              updateEditAssignment(idx, "semester_name", e.target.value)
                            }
                          >
                            {availableSemesters.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Subject */}
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Subject Handled
                          </label>
                          <select
                            className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground cursor-pointer"
                            value={item.subject_id}
                            onChange={(e) =>
                              updateEditAssignment(idx, "subject_id", Number(e.target.value))
                            }
                          >
                            <option value="">-- Select Subject --</option>
                            {deptSubjects.length > 0 ? (
                              deptSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.code} - {s.name}
                                </option>
                              ))
                            ) : (
                              subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.code} - {s.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Fixed Hours Display */}
                        <div className="w-full sm:w-28">
                          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                            Periods/Wk
                          </label>
                          <div className="h-8 px-2.5 rounded-lg border border-border bg-muted/60 flex items-center justify-center font-mono font-bold text-xs text-foreground">
                            {item.weekly_hours} hrs/wk
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 sm:mt-4 cursor-pointer shrink-0"
                          onClick={() => removeEditAssignmentRow(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Total Edit Hours Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" />
                    Total Cumulative Faculty Workload:
                  </span>
                  <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs px-2.5 py-0.5">
                    {totalEditHours} Hours / Week
                  </Badge>
                </div>
              </div>

              {editError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingEdit || !editName.trim()}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingEdit ? "Updating..." : "Update Faculty Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Availability Matrix Modal */}
        <Dialog open={availOpen} onOpenChange={setAvailOpen}>
          <DialogContent className="sm:max-w-[700px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <CalendarClock className="size-4" />
                <span className="tt-eyebrow">Weekly Availability Constraints</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {activeFaculty?.name} &mdash; Working Period Schedule
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Click slots to toggle when this instructor is available to teach.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-x-auto py-2">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border border-border bg-muted/40 font-bold text-foreground">
                      Period / Time
                    </th>
                    {DAYS.map((d) => (
                      <th
                        key={d}
                        className="p-2 border border-border bg-muted/40 font-bold text-foreground"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((p) => (
                    <tr key={p.start}>
                      <td className="p-2 border border-border font-mono font-medium text-muted-foreground bg-muted/20">
                        {p.label}
                      </td>
                      {DAYS.map((d) => {
                        const key = `${d}_${p.start}`;
                        const isAvail = availMap[key];
                        return (
                          <td
                            key={d}
                            onClick={() => toggleSlot(d, p.start)}
                            className={`p-2 border border-border cursor-pointer transition-colors ${
                              isAvail
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold hover:bg-emerald-500/30"
                                : "bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20"
                            }`}
                          >
                            {isAvail ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="size-3.5" /> Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <X className="size-3.5" /> Blocked
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setAvailOpen(false)}
                className="rounded-xl border-border bg-card"
              >
                Close
              </Button>
              <Button
                onClick={handleSaveAvailability}
                disabled={savingAvail}
                className="tt-gradient-btn rounded-xl font-bold"
              >
                {savingAvail ? "Saving..." : "Save Availability"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}