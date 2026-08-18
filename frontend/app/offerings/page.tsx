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
import { Plus, Trash2, Pencil, BookOpen, Users, GraduationCap, RefreshCw, Layers, Sparkles } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
}

interface Section {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  name: string;
}

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [facultyId, setFacultyId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<SubjectOffering | null>(null);
  const [editSubjectId, setEditSubjectId] = useState<number | "">("");
  const [editFacultyId, setEditFacultyId] = useState<number | "">("");
  const [editSectionId, setEditSectionId] = useState<number | "">("");
  const [editSemesterId, setEditSemesterId] = useState<number | "">("");
  const [editWeeklyHours, setEditWeeklyHours] = useState(3);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      let instId = 1;
      let deptId: number | null = null;
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.institution_id) instId = user.institution_id;
          if (user.department_id) deptId = user.department_id;
        } catch {
          // ignore
        }
      }

      const [offRes, subRes, facRes, secRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/subject-offerings/?institution_id=${instId}${deptId ? `&department_id=${deptId}` : ""}`).catch(() => null),
        fetch(`${API_BASE}/subjects/?institution_id=${instId}${deptId ? `&department_id=${deptId}` : ""}`).catch(() => null),
        fetch(`${API_BASE}/faculty/?institution_id=${instId}${deptId ? `&department_id=${deptId}` : ""}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${instId}${deptId ? `&department_id=${deptId}` : ""}`).catch(() => null),
        fetch(`${API_BASE}/semesters/?institution_id=${instId}`).catch(() => null),
      ]);

      const offs = (offRes && offRes.ok) ? await offRes.json() : [];
      const subs = (subRes && subRes.ok) ? await subRes.json() : [];
      const facs = (facRes && facRes.ok) ? await facRes.json() : [];
      const secs = (secRes && secRes.ok) ? await secRes.json() : [];
      const sems = (semRes && semRes.ok) ? await semRes.json() : [];

      setOfferings(offs);
      setSubjects(subs);
      setFaculty(facs);
      setSections(secs);
      setSemesters(sems);

      if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
      if (facs.length > 0 && !facultyId) setFacultyId(facs[0].id);
      if (secs.length > 0 && !sectionId) setSectionId(secs[0].id);
      if (sems.length > 0 && !semesterId) setSemesterId(sems[0].id);
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

  const handleAddOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !facultyId || !sectionId || !semesterId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/subject-offerings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: Number(subjectId),
          faculty_id: Number(facultyId),
          section_id: Number(sectionId),
          semester_id: Number(semesterId),
          weekly_hours: Number(weeklyHours) || 3,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add course offering");
      }

      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating course offering");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (off: SubjectOffering) => {
    setEditingOffering(off);
    setEditSubjectId(off.subject_id);
    setEditFacultyId(off.faculty_id);
    setEditSectionId(off.section_id);
    setEditSemesterId(off.semester_id);
    setEditWeeklyHours(off.weekly_hours);
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffering || !editSubjectId || !editFacultyId || !editSectionId || !editSemesterId) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/subject-offerings/${editingOffering.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: Number(editSubjectId),
          faculty_id: Number(editFacultyId),
          section_id: Number(editSectionId),
          semester_id: Number(editSemesterId),
          weekly_hours: Number(editWeeklyHours) || 3,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update course offering");
      }

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating course offering");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course offering?")) return;

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
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Subject Offerings"
          description="Map courses to teaching faculty, target student sections, and weekly periods."
          icon={Layers}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh offerings"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" />
                Add Course Offering
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Faculty-Course Mapping</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Subject Offering
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Bind a subject and section cohort to an instructor with weekly credit hours.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddOffering} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Subject Course *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Instructor *
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={facultyId}
                      onChange={(e) => setFacultyId(Number(e.target.value))}
                      required
                    >
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Student Section *
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={sectionId}
                      onChange={(e) => setSectionId(Number(e.target.value))}
                      required
                    >
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Target Semester *
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={semesterId}
                      onChange={(e) => setSemesterId(Number(e.target.value))}
                      required
                    >
                      {semesters.map((sem) => (
                        <option key={sem.id} value={sem.id}>
                          {sem.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Weekly Sessions (Hrs) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10) || 3)}
                      required
                      className="rounded-xl border-border bg-muted/40 focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !subjectId || !facultyId || !sectionId}
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Saving..." : "Save Offering"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Offering Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Mapping</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Course Offering
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update course mapping, assigned instructor, section, or weekly lecture load.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateOffering} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Subject Course *
                </label>
                <select
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(Number(e.target.value))}
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Instructor *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editFacultyId}
                    onChange={(e) => setEditFacultyId(Number(e.target.value))}
                    required
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Student Section *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editSectionId}
                    onChange={(e) => setEditSectionId(Number(e.target.value))}
                    required
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Target Semester *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={editSemesterId}
                    onChange={(e) => setEditSemesterId(Number(e.target.value))}
                    required
                  >
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Weekly Sessions (Hrs) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={editWeeklyHours}
                    onChange={(e) => setEditWeeklyHours(parseInt(e.target.value, 10) || 3)}
                    required
                    className="rounded-xl border-border bg-muted/40 focus:border-primary font-mono"
                  />
                </div>
              </div>

              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingEdit || !editSubjectId || !editFacultyId || !editSectionId}
                  className="tt-gradient-btn rounded-xl font-bold"
                >
                  {submittingEdit ? "Updating..." : "Update Offering"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Active Subject Offerings</h3>
              <p className="text-xs text-muted-foreground">
                {offerings.length} {offerings.length === 1 ? "course mapping" : "course mappings"} configured
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading course mappings..." />
            ) : offerings.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No course offerings found"
                description='Click "Add Course Offering" above to map subjects and sections to faculty members.'
              />
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground">#</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Subject</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Assigned Faculty</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Section</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Load (Hrs/Wk)</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offerings.map((off, index) => {
                      const sub = subjects.find((s) => s.id === off.subject_id);
                      const fac = faculty.find((f) => f.id === off.faculty_id);
                      const sec = sections.find((s) => s.id === off.section_id);

                      return (
                        <TableRow key={off.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6]/12 border border-[#8B5CF6]/30 px-2.5 py-1 text-xs font-bold text-[#8B5CF6] dark:text-[#C084FC]">
                              <span>{sub?.code || `Sub #${off.subject_id}`}</span>
                              <span className="text-muted-foreground font-normal">· {sub?.name}</span>
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-sm">
                            {fac?.name || `Faculty #${off.faculty_id}`}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-lg bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                              {sec?.name || `Section #${off.section_id}`}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-foreground">
                            {off.weekly_hours} hrs
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                onClick={() => openEditModal(off)}
                                title="Edit offering"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => handleDelete(off.id)}
                                title="Delete offering"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
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
      </div>
    </AppShell>
  );
}
