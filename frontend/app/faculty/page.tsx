"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Trash2, Users, RefreshCw, CalendarClock, Check, X, BookOpen, AlertCircle } from "lucide-react";

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

      // 1. Fetch departments
      let depts: Department[] = [];
      const deptUrl = userInstId ? `${API_BASE}/departments/?institution_id=${userInstId}` : `${API_BASE}/departments/`;
      const deptRes = await fetch(deptUrl);
      if (deptRes.ok) {
        depts = await deptRes.json();
      }

      // If user institution has no departments yet, fetch all departments or create default
      if (depts.length === 0) {
        const allDeptRes = await fetch(`${API_BASE}/departments/`);
        if (allDeptRes.ok) {
          depts = await allDeptRes.json();
        }
      }

      if (depts.length === 0) {
        const createDept = await fetch(`${API_BASE}/departments/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Computer Science & Engineering",
            institution_id: userInstId || 1,
          }),
        });
        if (createDept.ok) {
          depts = [await createDept.json()];
        }
      }

      setDepartments(depts);
      const currentDeptId = userDeptId || (depts.length > 0 ? depts[0].id : null);
      if (currentDeptId) {
        setDepartmentId(currentDeptId);
      }

      // 2. Fetch department-scoped resources
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

    // Require at least one valid subject assignment
    const validAssignments = assignments.filter((a) => a.subject_id && a.section_id);
    if (validAssignments.length === 0) {
      setError("At least one Subject and Section assignment is required for this faculty member.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Ensure department exists
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

      // 1. Create Faculty Member
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

      // 2. Ensure Semester exists for subject offerings
      let semesterId = 1;
      const semRes = await fetch(`${API_BASE}/semesters/`);
      if (semRes.ok) {
        const sems = await semRes.json();
        if (sems.length > 0) {
          semesterId = sems[0].id;
        } else {
          const yrRes = await fetch(`${API_BASE}/academic-years/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ institution_id: 1, name: "2026-27" }),
          });
          const yr = yrRes.ok ? await yrRes.json() : { id: 1 };
          const newSemRes = await fetch(`${API_BASE}/semesters/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ academic_year_id: yr.id, name: "Semester 1" }),
          });
          if (newSemRes.ok) {
            const newSem = await newSemRes.json();
            semesterId = newSem.id;
          }
        }
      }

      // 3. Create Subject Offerings for each assigned subject
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
      const res = await fetch(`${API_BASE}/faculty/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFaculty((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete faculty", err);
    }
  };

  // Open Availability Matrix
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
            PERIODS.forEach((p) => {
              initialMap[`${d}-${p.start}`] = true;
            });
          });
        } else {
          records.forEach((r) => {
            initialMap[`${r.day_of_week}-${r.start_time}`] = true;
          });
        }
      }
      setAvailMap(initialMap);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSlot = (day: string, startTime: string) => {
    const key = `${day}-${startTime}`;
    setAvailMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Faculty & Teaching Assignments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add faculty members, assign subjects & sections, and configure working availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Faculty & Subjects
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Faculty Member & Assign Subjects</DialogTitle>
                  <DialogDescription>
                    Enter professor details and the subjects & sections they will handle.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFacultyWithSubjects} className="space-y-5 pt-2">
                  {/* Basic Details */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Full Name *
                      </label>
                      <Input
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Designation
                      </label>
                      <Input
                        placeholder="e.g. Associate Professor"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Department *
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

                  {/* Dynamic Subjects Handled Section */}
                  <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          Subjects Handled
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Select which course and section this professor teaches
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={addAssignmentRow}
                      >
                        <Plus className="size-3" />
                        Add Subject
                      </Button>
                    </div>

                    {subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        No subjects found. (You can add subjects in the Subjects tab, or save faculty now and assign later).
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {assignments.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 rounded-md border bg-background p-2.5">
                            <div className="flex-1">
                              <label className="text-[10px] text-muted-foreground block mb-0.5">Subject</label>
                              <select
                                className="w-full rounded border px-2 py-1 text-xs"
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
                              <label className="text-[10px] text-muted-foreground block mb-0.5">Section</label>
                              <select
                                className="w-full rounded border px-2 py-1 text-xs"
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
                              <label className="text-[10px] text-muted-foreground block mb-0.5">Hrs/Wk</label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                className="h-7 text-xs px-2"
                                value={item.weekly_hours}
                                onChange={(e) => updateAssignment(idx, "weekly_hours", parseInt(e.target.value, 10) || 1)}
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive mt-3"
                              onClick={() => removeAssignmentRow(idx)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={submitting || !name.trim()}>
                      {submitting ? "Saving..." : "Save Faculty & Assignments"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Faculty Directory</CardTitle>
                <CardDescription>
                  {faculty.length} {faculty.length === 1 ? "member" : "members"} registered with subject teaching allocations
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading faculty records from database...</p>
              </div>
            ) : faculty.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Users className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No faculty members found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Add faculty members and assign the subjects they will handle using the button above.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Subjects Handled</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {faculty.map((member) => {
                      const memberOfferings = offerings.filter((o) => o.faculty_id === member.id);

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{member.id}
                          </TableCell>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-xs">
                              {member.designation || "Faculty"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {memberOfferings.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">No subjects assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {memberOfferings.map((off) => {
                                  const sub = subjects.find((s) => s.id === off.subject_id);
                                  const sec = sections.find((s) => s.id === off.section_id);
                                  return (
                                    <Badge key={off.id} variant="secondary" className="text-[11px] font-normal py-0.5 px-2">
                                      <span className="font-semibold mr-1">{sub?.code || `Sub #${off.subject_id}`}</span>
                                      <span className="text-muted-foreground">({sec?.name || "Sec"}, {off.weekly_hours}h)</span>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30"
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
                              className="size-8 text-muted-foreground hover:text-destructive"
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
          </CardContent>
        </Card>

        {/* Interactive Availability Matrix Dialog */}
        <Dialog open={availOpen} onOpenChange={setAvailOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="size-5 text-primary" />
                <span>Working Availability: {activeFaculty?.name}</span>
              </DialogTitle>
              <DialogDescription>
                Click any time block to toggle availability. The solver will strictly avoid scheduling classes in unavailable slots.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded bg-emerald-500" />
                    Available (Green)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded bg-red-500/20 border border-red-500/30" />
                    Unavailable (Red)
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
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
                    className="h-7 text-xs"
                    onClick={() => setAvailMap({})}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Grid Matrix */}
              <div className="overflow-x-auto rounded-lg border">
                <div className="grid min-w-[500px]" style={{ gridTemplateColumns: "110px repeat(5, 1fr)" }}>
                  <div className="border-b border-r bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">
                    Period
                  </div>
                  {DAYS.map((d) => (
                    <div key={d} className="border-b border-r bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground last:border-r-0">
                      {d.slice(0, 3)}
                    </div>
                  ))}

                  {PERIODS.map((p) => (
                    <div key={p.start} className="contents">
                      <div className="flex items-center justify-center border-b border-r bg-muted/20 p-2 font-mono text-[11px] text-muted-foreground">
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
                            className={`flex h-10 items-center justify-center border-b border-r text-xs transition last:border-r-0 ${
                              isAvailable
                                ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 font-semibold"
                                : "bg-red-500/5 text-red-500/40 hover:bg-red-500/10"
                            }`}
                          >
                            {isAvailable ? <Check className="size-4 text-emerald-600" /> : <X className="size-4" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={() => setAvailOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveAvailability} disabled={savingAvail}>
                {savingAvail ? "Saving..." : "Save Availability"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}