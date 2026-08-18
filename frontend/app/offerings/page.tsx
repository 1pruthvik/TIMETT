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
import { Plus, Trash2, BookOpen, Users, GraduationCap, RefreshCw, Layers, Sparkles } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  const [subjectId, setSubjectId] = useState<number | "">("");
  const [facultyId, setFacultyId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");
  const [semesterId, setSemesterId] = useState<number | "">("");
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [offRes, subRes, facRes, secRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/subject-offerings/`),
        fetch(`${API_BASE}/subjects/`),
        fetch(`${API_BASE}/faculty/`),
        fetch(`${API_BASE}/sections/`),
        fetch(`${API_BASE}/semesters/`),
      ]);

      const offs = offRes.ok ? await offRes.json() : [];
      const subs = subRes.ok ? await subRes.json() : [];
      const facs = facRes.ok ? await facRes.json() : [];
      const secs = secRes.ok ? await secRes.json() : [];
      const sems = semRes.ok ? await semRes.json() : [];

      setOfferings(offs);
      setSubjects(subs);
      setFaculty(facs);
      setSections(secs);
      setSemesters(sems);

      if (subs.length > 0) setSubjectId(subs[0].id);
      if (facs.length > 0) setFacultyId(facs[0].id);
      if (secs.length > 0) setSectionId(secs[0].id);
      if (sems.length > 0) setSemesterId(sems[0].id);
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
          title="Subject Offerings & Workloads"
          description="Map courses to designated instructors, student sections, and weekly credit hours."
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
            <DialogContent className="sm:max-w-[460px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Curriculum Load Mapping</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Subject Offering
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Assign a subject to an instructor for a specific section batch and semester.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddOffering} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Subject *</label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Faculty Member *</label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={facultyId}
                    onChange={(e) => setFacultyId(Number(e.target.value))}
                    required
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.designation ? `(${f.designation})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Section *</label>
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

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Hours / Week *</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10) || 1)}
                      required
                      className="rounded-xl border-border bg-muted/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Semester Term *</label>
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

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Saving..." : "Save Course Offering"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Active Curriculum Allocations</h3>
              <p className="text-xs text-muted-foreground">
                {offerings.length} {offerings.length === 1 ? "offering" : "offerings"} mapped for optimization
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading course offerings..." />
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDelete(off.id)}
                              title="Delete offering"
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
      </div>
    </AppShell>
  );
}
