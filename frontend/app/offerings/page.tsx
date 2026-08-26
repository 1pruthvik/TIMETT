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
          icon={Layers}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground cursor-pointer"
            title="Refresh offerings"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-11 rounded-2xl gap-2 font-bold px-5 text-sm cursor-pointer shadow-lg hover:scale-105 transition-all">
                <Plus className="size-4" /> Add Course Offering
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Curriculum Allocation</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Map Course Offering
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Assign a subject and section to an instructor for a semester term.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddOffering} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Subject Course *
                  </label>
                  <select
                    className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                      className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                      className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                      className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                      className="h-11 px-4 rounded-xl bg-muted/40 font-mono border-0 text-center"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !subjectId || !facultyId || !sectionId}
                    className="tt-gradient-btn h-11 rounded-2xl font-bold w-full"
                  >
                    {submitting ? "Adding..." : "Add Offering"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Offering Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[480px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
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
                  className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                    className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                    className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                    className="w-full h-11 rounded-xl bg-muted/40 px-3 text-sm text-foreground focus:outline-none cursor-pointer border-0"
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
                    className="h-11 px-4 rounded-xl bg-muted/40 font-mono border-0 text-center"
                  />
                </div>
              </div>              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="h-11 rounded-2xl px-5 border-0"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingEdit || !editSubjectId || !editFacultyId || !editSectionId}
                  className="tt-gradient-btn h-11 rounded-2xl px-6 font-bold"
                >
                  {submittingEdit ? "Updating..." : "Update Offering"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Unboxed, Spread Offerings Layout ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
            <h3 className="text-lg font-bold text-foreground">Active Subject Offerings</h3>
            <span className="text-xs font-semibold text-muted-foreground">
              {offerings.length} Offerings
            </span>
          </div>

          <div>
            {loading ? (
              <LoadingState text="Loading course mappings..." />
            ) : offerings.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No course offerings found"
                description='Click "Add Course Offering" above to map subjects and sections to faculty members.'
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-black/[0.06] dark:border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-center text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Subject</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Assigned Faculty</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Section</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Load (Hrs/Wk)</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offerings.map((off, index) => {
                    const sub = subjects.find((s) => s.id === off.subject_id);
                    const fac = faculty.find((f) => f.id === off.faculty_id);
                    const sec = sections.find((s) => s.id === off.section_id);

                    return (
                      <TableRow key={off.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground py-4">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-foreground">
                            <span className="text-[#0070F3]">{sub?.code || `Sub #${off.subject_id}`}</span>
                            <span className="text-muted-foreground font-normal">· {sub?.name}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-foreground text-sm py-4">
                          {fac?.name || `Faculty #${off.faculty_id}`}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="inline-flex items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.05] px-2.5 py-0.5 text-xs font-bold text-[#0070F3]">
                            {sec?.name || `Section #${off.section_id}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm font-semibold text-foreground py-4">
                          {off.weekly_hours} hrs
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center gap-1.5">
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
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
