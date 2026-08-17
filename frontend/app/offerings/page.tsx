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
import { Plus, Trash2, BookOpen, Users, GraduationCap, Clock, RefreshCw, Layers } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface SubjectOffering {
  id: number;
  subject_id: number;
  faculty_id: number;
  section_id: number;
  semester_id: number;
  weekly_hours: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Faculty {
  id: number;
  name: string;
  designation?: string;
}

interface Section {
  id: number;
  name: string;
}

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | "">("");
  const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
  const [weeklyHours, setWeeklyHours] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userDeptId = user?.department_id;

      const subUrl = userDeptId ? `${API_BASE}/subjects/?department_id=${userDeptId}` : `${API_BASE}/subjects/`;
      const facUrl = userDeptId ? `${API_BASE}/faculty/?department_id=${userDeptId}` : `${API_BASE}/faculty/`;
      const secUrl = userDeptId ? `${API_BASE}/sections/?department_id=${userDeptId}` : `${API_BASE}/sections/`;

      const [offRes, subRes, facRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/subject-offerings/`),
        fetch(subUrl),
        fetch(facUrl),
        fetch(secUrl),
      ]);

      const offData = offRes.ok ? await offRes.json() : [];
      const subData = subRes.ok ? await subRes.json() : [];
      const facData = facRes.ok ? await facRes.json() : [];
      const secData = secRes.ok ? await secRes.json() : [];

      setOfferings(offData);
      setSubjects(subData);
      setFaculty(facData);
      setSections(secData);

      if (subData.length > 0 && !selectedSubjectId) setSelectedSubjectId(subData[0].id);
      if (facData.length > 0 && !selectedFacultyId) setSelectedFacultyId(facData[0].id);
      if (secData.length > 0 && !selectedSectionId) setSelectedSectionId(secData[0].id);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch teaching assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedFacultyId || !selectedSectionId || weeklyHours < 1) return;

    setSubmitting(true);
    setError("");

    try {
      // Ensure Semester exists first
      let semesterId = 1;
      const semRes = await fetch(`${API_BASE}/semesters/`);
      if (semRes.ok) {
        const sems = await semRes.json();
        if (sems.length > 0) {
          semesterId = sems[0].id;
        } else {
          // Create default Academic Year and Semester
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

      const res = await fetch(`${API_BASE}/subject-offerings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: Number(selectedSubjectId),
          faculty_id: Number(selectedFacultyId),
          section_id: Number(selectedSectionId),
          semester_id: semesterId,
          weekly_hours: Number(weeklyHours),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create teaching assignment");
      }

      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this teaching assignment?")) return;

    try {
      const res = await fetch(`${API_BASE}/subject-offerings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOfferings((prev) => prev.filter((o) => o.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete offering", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teaching Assignments (Offerings)</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Map subjects and weekly credit hours to faculty members and student sections.
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
                  Assign Subject to Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>New Teaching Assignment</DialogTitle>
                  <DialogDescription>
                    Assign a subject to a faculty member for a specific student section.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddOffering} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Select Subject *
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                      required
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code} — {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Assigned Faculty Member *
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                      required
                    >
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.designation || "Faculty"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Target Section *
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                        required
                      >
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Weekly Hours / Periods *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={weeklyHours}
                        onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10) || 1)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting || !selectedSubjectId || !selectedFacultyId || !selectedSectionId}
                    >
                      {submitting ? "Saving..." : "Create Assignment"}
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
                <CardTitle>Active Teaching Requirements</CardTitle>
                <CardDescription>
                  {offerings.length} teaching {offerings.length === 1 ? "assignment" : "assignments"} configured for timetable optimization
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading teaching assignments from database...</p>
              </div>
            ) : offerings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Layers className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No teaching assignments found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click "Assign Subject to Faculty" above to define who teaches what before generating the timetable.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Assigned Faculty</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Weekly Hours</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {offerings.map((off) => {
                      const sub = subjects.find((s) => s.id === off.subject_id);
                      const fac = faculty.find((f) => f.id === off.faculty_id);
                      const sec = sections.find((s) => s.id === off.section_id);

                      return (
                        <TableRow key={off.id}>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {sub?.code || `SUB-${off.subject_id}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {sub?.name || `Subject #${off.subject_id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Users className="size-3.5 text-muted-foreground" />
                              <span>{fac?.name || `Faculty #${off.faculty_id}`}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {sec?.name || `Section #${off.section_id}`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
                              <Clock className="size-3.5" />
                              <span>{off.weekly_hours} hrs/week</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(off.id)}
                              title="Remove assignment"
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
      </div>
    </AppShell>
  );
}
