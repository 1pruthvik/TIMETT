"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  RefreshCw,
  CalendarClock,
  Check,
  X,
  BookOpen,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

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
}

interface Section {
  id: number;
  name: string;
}

interface SubjectOffering {
  id: number;
  subject_id: number;
  faculty_id: number;
  section_id: number;
  weekly_hours: number;
}

interface AvailabilityRecord {
  id?: number;
  faculty_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface SubjectAssignmentInput {
  subject_id: number | "";
  section_id: number | "";
  weekly_hours: number;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states for Add Faculty
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [assignments, setAssignments] = useState<SubjectAssignmentInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Availability Modal states
  const [availOpen, setAvailOpen] = useState(false);
  const [activeFaculty, setActiveFaculty] = useState<FacultyMember | null>(null);
  const [availMap, setAvailMap] = useState<Record<string, boolean>>({});
  const [savingAvail, setSavingAvail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userDeptId = user?.department_id;
      const userInstId = user?.institution_id;

      let depts: Department[] = [];
      const deptUrl = userInstId ? `${API_BASE}/departments/?institution_id=${userInstId}` : `${API_BASE}/departments/`;
      const deptRes = await fetch(deptUrl);
      if (deptRes.ok) {
        depts = await deptRes.json();
      }

      if (depts.length === 0) {
        const allDeptRes = await fetch(`${API_BASE}/departments/`);
        if (allDeptRes.ok) { depts = await allDeptRes.json(); }
      }

      setDepartments(depts);
      const currentDeptId = userDeptId || (depts.length > 0 ? depts[0].id : null);
      if (currentDeptId) {
        setDepartmentId(currentDeptId);
      }

      const facUrl = currentDeptId ? `${API_BASE}/faculty/?department_id=${currentDeptId}` : `${API_BASE}/faculty/`;
      const subUrl = currentDeptId ? `${API_BASE}/subjects/?department_id=${currentDeptId}` : `${API_BASE}/subjects/`;
      const secUrl = currentDeptId ? `${API_BASE}/sections/?department_id=${currentDeptId}` : `${API_BASE}/sections/`;

      const [facRes, subRes, secRes, offRes] = await Promise.all([
        fetch(facUrl),
        fetch(subUrl),
        fetch(secUrl),
        fetch(`${API_BASE}/subject-offerings/`),
      ]);

      const facs: FacultyMember[] = facRes.ok ? await facRes.json() : [];
      const subs: Subject[] = subRes.ok ? await subRes.json() : [];
      const secs: Section[] = secRes.ok ? await secRes.json() : [];
      const offs: SubjectOffering[] = offRes.ok ? await offRes.json() : [];

      setFaculty(facs);
      setSubjects(subs);
      setSections(secs);
      setOfferings(offs);

      if (subs.length > 0 && secs.length > 0 && assignments.length === 0) {
        setAssignments([
          { subject_id: subs[0].id, section_id: secs[0].id, weekly_hours: 3 },
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

  const addAssignmentRow = () => {
    setAssignments((prev) => [
      ...prev,
      {
        subject_id: subjects.length > 0 ? subjects[0].id : "",
        section_id: sections.length > 0 ? sections[0].id : "",
        weekly_hours: 3,
      },
    ]);
  };

  const removeAssignmentRow = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof SubjectAssignmentInput, value: any) => {
    setAssignments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddFacultyWithSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a faculty name.");
      return;
    }

    const validAssignments = assignments.filter((a) => a.subject_id && a.section_id);
    if (validAssignments.length === 0) {
      setError("At least one Subject and Section assignment is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let validDeptId = departmentId;
      if (!validDeptId) {
        if (departments.length > 0) {
          validDeptId = departments[0].id;
        } else {
          const createDept = await fetch(`${API_BASE}/departments/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Computer Science & Engineering", institution_id: 1 }),
          });
          const newDept = await createDept.json();
          validDeptId = newDept.id;
        }
      }

      const facRes = await fetch(`${API_BASE}/faculty/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          designation: designation.trim() || "Assistant Professor",
          department_id: Number(validDeptId),
        }),
      });

      if (!facRes.ok) {
        const errData = await facRes.json();
        throw new Error(errData.detail || "Failed to add faculty member");
      }

      const newFaculty = await facRes.json();

      let semesterId = 1;
      const semRes = await fetch(`${API_BASE}/semesters/`);
      if (semRes.ok) {
        const sems = await semRes.json();
        if (sems.length > 0) { semesterId = sems[0].id; }
      }

      for (const item of validAssignments) {
        await fetch(`${API_BASE}/subject-offerings/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject_id: Number(item.subject_id),
            faculty_id: newFaculty.id,
            section_id: Number(item.section_id),
            semester_id: semesterId,
            weekly_hours: Number(item.weekly_hours) || 3,
          }),
        });
      }

      setName("");
      setOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error creating faculty member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this faculty member?")) return;
    try {
      const res = await fetch(`${API_BASE}/faculty/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFaculty((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete faculty", err);
    }
  };

  const openAvailabilityDialog = async (fac: FacultyMember) => {
    setActiveFaculty(fac);
    setAvailOpen(true);
    try {
      const res = await fetch(`${API_BASE}/faculty-availability/?faculty_id=${fac.id}`);
      const initialMap: Record<string, boolean> = {};
      if (res.ok) {
        const records: AvailabilityRecord[] = await res.json();
        if (records.length === 0) {
          DAYS.forEach((d) => {
            PERIODS.forEach((p) => { initialMap[`${d}-${p.start}`] = true; });
          });
        } else {
          records.forEach((r) => { initialMap[`${r.day_of_week}-${r.start_time}`] = true; });
        }
      }
      setAvailMap(initialMap);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSlot = (day: string, startTime: string) => {
    const key = `${day}-${startTime}`;
    setAvailMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveAvailability = async () => {
    if (!activeFaculty) return;
    setSavingAvail(true);
    try {
      const existingRes = await fetch(`${API_BASE}/faculty-availability/?faculty_id=${activeFaculty.id}`);
      if (existingRes.ok) {
        const existing: AvailabilityRecord[] = await existingRes.json();
        for (const item of existing) {
          if (item.id) {
            await fetch(`${API_BASE}/faculty-availability/${item.id}`, { method: "DELETE" });
          }
        }
      }

      for (const day of DAYS) {
        for (const p of PERIODS) {
          if (availMap[`${day}-${p.start}`]) {
            await fetch(`${API_BASE}/faculty-availability/`, {
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
      console.error("Failed to save faculty availability", err);
    } finally {
      setSavingAvail(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Faculty & Subject Assignments"
          description="Manage instructors, assign curriculum course loads, and configure active time-availability constraints."
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
                <Plus className="size-4" />
                Add Faculty & Subjects
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">New Academic Registration</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Add Faculty & Assign Course Loads
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Provide instructor details and select which subjects & sections they teach.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddFacultyWithSubjects} className="space-y-5 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Dr. Rajesh Kumar"
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
                      placeholder="e.g. Associate Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="rounded-xl border-border bg-muted/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Department *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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

                {/* Course Allocations */}
                <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Assigned Subjects & Sections
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Choose which batch and subject this instructor handles
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg gap-1 text-xs font-semibold"
                      onClick={addAssignmentRow}
                    >
                      <Plus className="size-3.5" />
                      Add Row
                    </Button>
                  </div>

                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-card p-3 rounded-xl border border-border">
                      No subjects available yet. You can add subjects in the Subjects tab first.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {assignments.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-xl border border-border bg-card/80 p-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Subject</label>
                            <select
                              className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground"
                              value={item.subject_id}
                              onChange={(e) => updateAssignment(idx, "subject_id", Number(e.target.value))}
                            >
                              <option value="">-- Choose Subject --</option>
                              {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.code} - {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-28">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Section</label>
                            <select
                              className="w-full rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs text-foreground"
                              value={item.section_id}
                              onChange={(e) => updateAssignment(idx, "section_id", Number(e.target.value))}
                            >
                              <option value="">-- Section --</option>
                              {sections.map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                  {sec.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-20">
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Hrs/Wk</label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              className="h-8 text-xs rounded-lg border-border bg-muted/40"
                              value={item.weekly_hours}
                              onChange={(e) => updateAssignment(idx, "weekly_hours", parseInt(e.target.value, 10) || 1)}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 mt-4 cursor-pointer"
                            onClick={() => removeAssignmentRow(idx)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Saving..." : "Save Faculty Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Directory Table */}
        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Registered Faculty Roster</h3>
              <p className="text-xs text-muted-foreground">
                {faculty.length} {faculty.length === 1 ? "instructor" : "instructors"} with assigned subject courses
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading faculty directory..." />
            ) : faculty.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No faculty members found"
                description='Click "Add Faculty & Subjects" above to register faculty and assign their courses.'
              />
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground">#</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Instructor Name</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Designation</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Allocated Courses</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Availability</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faculty.map((member, index) => {
                      const memberOfferings = offerings.filter((o) => o.faculty_id === member.id);

                      return (
                        <TableRow key={member.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            {member.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium text-xs border-border bg-card">
                              {member.designation || "Faculty"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {memberOfferings.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">No courses assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {memberOfferings.map((off) => {
                                  const sub = subjects.find((s) => s.id === off.subject_id);
                                  const sec = sections.find((s) => s.id === off.section_id);
                                  return (
                                    <span
                                      key={off.id}
                                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300"
                                    >
                                      <span>{sub?.code || `Sub #${off.subject_id}`}</span>
                                      <span className="text-muted-foreground text-[10px]">({sec?.name || "Sec"}, {off.weekly_hours}h)</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/30 cursor-pointer"
                              onClick={() => openAvailabilityDialog(member)}
                            >
                              <CalendarClock className="size-3.5" />
                              Working Slots
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDelete(member.id)}
                              title="Delete faculty"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Availability Matrix Modal */}
        <Dialog open={availOpen} onOpenChange={setAvailOpen}>
          <DialogContent className="sm:max-w-[650px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <CalendarClock className="size-5 text-emerald-500" />
                <span>Working Availability Matrix: {activeFaculty?.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Click any slot block to toggle availability. The solver will strictly avoid scheduling classes in unavailable slots.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="size-3 rounded bg-emerald-500" />
                    Available (Green)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                    <span className="size-3 rounded bg-red-500/20 border border-red-500/40" />
                    Unavailable (Red)
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs font-semibold rounded-lg"
                    onClick={() => {
                      const allOn: Record<string, boolean> = {};
                      DAYS.forEach((d) => PERIODS.forEach((p) => (allOn[`${d}-${p.start}`] = true)));
                      setAvailMap(allOn);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs font-semibold rounded-lg"
                    onClick={() => setAvailMap({})}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Grid Matrix */}
              <div className="overflow-x-auto rounded-2xl border border-border overflow-hidden">
                <div className="grid min-w-[500px]" style={{ gridTemplateColumns: "110px repeat(5, 1fr)" }}>
                  <div className="border-b border-r border-border bg-muted/40 p-2.5 text-center text-xs font-bold text-muted-foreground">
                    Period
                  </div>
                  {DAYS.map((d) => (
                    <div key={d} className="border-b border-r border-border bg-muted/40 p-2.5 text-center text-xs font-bold text-muted-foreground last:border-r-0">
                      {d.slice(0, 3)}
                    </div>
                  ))}

                  {PERIODS.map((p) => (
                    <div key={p.start} className="contents">
                      <div className="flex items-center justify-center border-b border-r border-border bg-muted/20 p-2 font-mono text-[11px] font-semibold text-muted-foreground">
                        {p.start}
                      </div>

                      {DAYS.map((d) => {
                        const key = `${d}-${p.start}`;
                        const isAvailable = !!availMap[key];

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleSlot(d, p.start)}
                            className={`flex h-11 items-center justify-center border-b border-r border-border text-xs transition-all last:border-r-0 cursor-pointer ${
                              isAvailable
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 font-bold"
                                : "bg-red-500/10 text-red-500/40 hover:bg-red-500/20"
                            }`}
                          >
                            {isAvailable ? <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> : <X className="size-4 text-red-400" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={() => setAvailOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={saveAvailability} disabled={savingAvail} className="rounded-xl font-semibold bg-primary text-primary-foreground">
                {savingAvail ? "Saving..." : "Save Availability"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}