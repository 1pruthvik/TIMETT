"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  RefreshCw,
  Sparkles,
  Building2,
  GraduationCap,
  FlaskConical,
  Search,
  BookMarked,
  Clock,
  Layers,
  Info,
} from "lucide-react";
import { WizardFooter } from "@/components/ui/wizard-footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Department {
  id: number;
  name: string;
  institution_id: number;
}

interface AcademicSemester {
  id: number;
  name: string;
  academic_year_id: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  department_id: number;
  subject_type?: string;
  weekly_hours?: number;
}

interface SubjectMeta {
  semesterName: string;
  subjectType: "Theory" | "Lab" | "Elective";
  weeklyHours: number;
}

const SUBJECT_TYPES = [
  { value: "Theory", label: "Theory (Lecture)" },
  { value: "Lab", label: "Practical (Laboratory)" },
  { value: "Elective", label: "Elective Subject" },
];

function isSubjectForSemester(
  subName: string,
  subCode: string,
  semName: string,
  metaSem?: string
): boolean {
  if (metaSem && metaSem.toLowerCase() === semName.toLowerCase()) return true;

  const normSub = (subName + " " + subCode).trim().toLowerCase();
  const normSem = semName.trim().toLowerCase();

  if (normSub.includes(normSem)) return true;

  const digits = normSem.match(/\d+/);
  if (digits) {
    const d = digits[0];
    const codeDigits = subCode.match(/\d+/);
    if (codeDigits && codeDigits[0].startsWith(d)) {
      return true;
    }
    const pattern = new RegExp(`(^|\\s|Sem|sem|[A-Za-z])${d}([A-Za-z]|\\s|$)`, "i");
    return pattern.test(normSub);
  }

  return false;
}

function getSemesterGroupsForDept(
  deptSubjects: Subject[],
  availableSemesters: string[],
  subjectMetaMap: Record<number, SubjectMeta>
): { semTitle: string; subjects: Subject[]; isUnassigned?: boolean }[] {
  const groups: { semTitle: string; subjects: Subject[]; isUnassigned?: boolean }[] = [];
  const assigned = new Set<number>();

  // 1. Check user configured academic semesters
  for (const semName of availableSemesters) {
    const matching = deptSubjects.filter((s) => {
      if (assigned.has(s.id)) return false;
      const meta = subjectMetaMap[s.id];
      return isSubjectForSemester(s.name, s.code, semName, meta?.semesterName);
    });
    matching.forEach((s) => assigned.add(s.id));
    groups.push({ semTitle: semName, subjects: matching });
  }

  // 2. Catch ALL remaining unassigned subjects so NO subject is ever invisible
  const remaining = deptSubjects.filter((s) => !assigned.has(s.id));
  if (remaining.length > 0) {
    groups.push({
      semTitle: "General / Unassigned Curriculum",
      subjects: remaining,
      isUnassigned: true,
    });
  }

  return groups;
}

export default function SubjectsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Subject metadata mapping: subjectId -> { semesterName, subjectType, weeklyHours }
  const [subjectMetaMap, setSubjectMetaMap] = useState<Record<number, SubjectMeta>>({});

  // Create Modal
  const [open, setOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<number | "">("");
  const [selectedSemName, setSelectedSemName] = useState<string>("Semester 1");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subjectType, setSubjectType] = useState<"Theory" | "Lab" | "Elective">("Theory");
  const [weeklyHours, setWeeklyHours] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editDeptId, setEditDeptId] = useState<number | "">("");
  const [editSemName, setEditSemName] = useState<string>("Semester 1");
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSubjectType, setEditSubjectType] = useState<"Theory" | "Lab" | "Elective">("Theory");
  const [editWeeklyHours, setEditWeeklyHours] = useState("4");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;
      setInstitutionId(userInstId);

      const [deptRes, subRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/subjects/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/semesters/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        const depts: Department[] = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && selectedDeptId === "") {
          setSelectedDeptId(depts[0].id);
        }
      }

      if (semRes && semRes.ok) {
        const sems: AcademicSemester[] = await semRes.json();
        setAcademicSemesters(sems);
        if (sems.length > 0) {
          setSelectedSemName(sems[0].name);
        }
      }

      if (subRes && subRes.ok) {
        setSubjects(await subRes.json());
      }

      // Load subject metadata from localStorage
      const savedMeta = localStorage.getItem(`timett_subject_meta_${userInstId}`);
      if (savedMeta) {
        setSubjectMetaMap(JSON.parse(savedMeta));
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

  const openAddForDeptAndSem = (deptId: number, semName: string) => {
    setSelectedDeptId(deptId);
    setSelectedSemName(semName.startsWith("General") ? "Semester 1" : semName);
    setName("");
    setCode("");
    setSubjectType("Theory");
    setWeeklyHours("4");
    setError("");
    setOpen(true);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !selectedDeptId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          department_id: Number(selectedDeptId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add subject");
      }

      const created: Subject = await res.json();

      // Save subject metadata (semester, type, weekly hours)
      const updatedMeta = {
        ...subjectMetaMap,
        [created.id]: {
          semesterName: selectedSemName,
          subjectType,
          weeklyHours: parseInt(weeklyHours) || 4,
        },
      };
      setSubjectMetaMap(updatedMeta);
      localStorage.setItem(
        `timett_subject_meta_${institutionId}`,
        JSON.stringify(updatedMeta)
      );

      setName("");
      setCode("");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating subject");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setEditDeptId(subject.department_id);
    const meta = subjectMetaMap[subject.id];
    setEditSemName(meta?.semesterName || "Semester 1");
    setEditName(subject.name);
    setEditCode(subject.code);
    setEditSubjectType(meta?.subjectType || "Theory");
    setEditWeeklyHours((meta?.weeklyHours || 4).toString());
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim() || !editCode.trim() || !editDeptId) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/subjects/${editingSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          department_id: Number(editDeptId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update subject");
      }

      // Update metadata
      const updatedMeta = {
        ...subjectMetaMap,
        [editingSubject.id]: {
          semesterName: editSemName,
          subjectType: editSubjectType,
          weeklyHours: parseInt(editWeeklyHours) || 4,
        },
      };
      setSubjectMetaMap(updatedMeta);
      localStorage.setItem(
        `timett_subject_meta_${institutionId}`,
        JSON.stringify(updatedMeta)
      );

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating subject");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject? All offerings will be removed.")) return;
    try {
      const res = await fetch(`${API_BASE}/subjects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== id));
        const updatedMeta = { ...subjectMetaMap };
        delete updatedMeta[id];
        setSubjectMetaMap(updatedMeta);
        localStorage.setItem(
          `timett_subject_meta_${institutionId}`,
          JSON.stringify(updatedMeta)
        );
      }
    } catch (err) {
      console.error("Failed to delete subject", err);
    }
  };

  const availableSemesters =
    academicSemesters.length > 0
      ? academicSemesters.map((s) => s.name)
      : ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"];

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Curriculum Subjects & Semesters"
          icon={BookOpen}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-11 rounded-2xl border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white cursor-pointer"
            title="Refresh subjects"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-11 rounded-2xl gap-2 font-bold px-5 text-sm cursor-pointer shadow-lg hover:scale-105 transition-all">
                <Plus className="size-4" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Curriculum Entry</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Add Subject to Semester
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Register a subject under a specific department and academic semester.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSubject} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Department *
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                      required
                      className="w-full h-11 rounded-xl bg-muted/40 px-3 text-xs font-semibold text-foreground focus:outline-none cursor-pointer border-0"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Academic Semester *
                    </label>
                    <select
                      value={selectedSemName}
                      onChange={(e) => setSelectedSemName(e.target.value)}
                      required
                      className="w-full h-11 rounded-xl bg-muted/40 px-3 text-xs font-semibold text-foreground focus:outline-none cursor-pointer border-0"
                    >
                      {availableSemesters.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Subject Name *
                  </label>
                  <Input
                    placeholder="e.g. Operating Systems or Machine Learning"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 px-4 rounded-xl bg-muted/40 border-0"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Subject Code *
                    </label>
                    <Input
                      placeholder="e.g. CS301"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      className="h-11 px-4 rounded-xl bg-muted/40 font-mono border-0 text-center uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Subject Type
                    </label>
                    <select
                      value={subjectType}
                      onChange={(e) => setSubjectType(e.target.value as "Theory" | "Lab" | "Elective")}
                      className="w-full h-11 rounded-xl bg-muted/40 px-3 text-xs font-semibold text-foreground focus:outline-none cursor-pointer border-0"
                    >
                      {SUBJECT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Weekly Periods
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="4"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(e.target.value)}
                      className="h-11 px-4 rounded-xl bg-muted/40 font-mono border-0 text-center"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500 flex items-start gap-2">
                    <Info className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim() || !code.trim() || !selectedDeptId}
                    className="tt-gradient-btn h-11 rounded-2xl font-bold w-full"
                  >
                    {submitting ? "Saving..." : "Save Subject"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Search & Overview Stats with Generous Padding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="relative w-full sm:w-96">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subjects or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-4 rounded-2xl bg-muted/40 border-0 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-11 text-xs font-bold px-4 rounded-2xl bg-muted/50 border-0 flex items-center">
              {departments.length} Departments
            </Badge>
            <Badge variant="outline" className="h-11 text-xs font-bold px-4 rounded-2xl bg-muted/50 border-0 flex items-center">
              {subjects.length} Total Subjects
            </Badge>
          </div>
        </div>

        {/* Hierarchical Departments -> Semesters -> Subjects List (Unboxed) */}
        {loading ? (
          <LoadingState text="Loading department curriculum & semester subjects..." />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments found"
          />
        ) : (
          <div className="space-y-12 pt-2">
            {filteredDepartments.map((dept) => {
              const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
              const semesterGroups = getSemesterGroupsForDept(
                deptSubjects,
                availableSemesters,
                subjectMetaMap
              );

              return (
                <div key={dept.id} className="space-y-4">
                  {/* Department Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <Building2 className="size-5 text-[#0070F3] stroke-[1.75]" />
                      <h3 className="text-lg font-bold text-foreground">{dept.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <BookOpen className="size-4 text-[#0070F3]" />
                        <span>{deptSubjects.length} {deptSubjects.length === 1 ? "Subject" : "Subjects"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Semesters under this Department */}
                  <div className="space-y-8 pt-2">
                    {semesterGroups.map((group) => {
                      return (
                        <div
                          key={group.semTitle}
                          className="space-y-3"
                        >
                          {/* Semester Sub-header with Quick Add Button */}
                          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                            <div className="flex items-center gap-2">
                              {group.isUnassigned ? (
                                <Info className="size-4 text-amber-500" />
                              ) : (
                                <GraduationCap className="size-4 text-[#0070F3]" />
                              )}
                              <span className="text-sm font-bold text-foreground">
                                {group.semTitle}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground">
                                ({group.subjects.length} {group.subjects.length === 1 ? "Subject" : "Subjects"})
                              </span>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddForDeptAndSem(dept.id, group.semTitle)}
                              className="h-8 text-xs rounded-xl px-3 gap-1.5 font-bold border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white cursor-pointer"
                            >
                              <Plus className="size-3.5" /> Add Subject to {group.semTitle}
                            </Button>
                          </div>

                          {/* Subjects in this Semester */}
                          {group.subjects.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2">
                              No subjects registered for {group.semTitle} in this department. Click &ldquo;Add Subject to {group.semTitle}&rdquo; to configure courses.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {group.subjects.map((sub) => {
                                const meta = subjectMetaMap[sub.id];
                                const type = meta?.subjectType || (sub.name.toLowerCase().includes("lab") ? "Lab" : "Theory");
                                const hours = meta?.weeklyHours || 4;

                                return (
                                  <div
                                    key={sub.id}
                                    className="flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors space-y-3 shadow-none"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
                                          {sub.code}
                                        </span>
                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                          {type === "Lab" ? "Practical Lab" : type}
                                        </span>
                                      </div>
                                      <h5 className="font-bold text-sm text-foreground line-clamp-1">
                                        {sub.name}
                                      </h5>
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Clock className="size-3 text-muted-foreground" />
                                        <span>{hours} periods/week</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/[0.04]">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                        onClick={() => openEditModal(sub)}
                                        title="Edit subject details or semester"
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                        onClick={() => handleDelete(sub.id)}
                                        title="Delete subject"
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Subject Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Course</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Subject Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update course name, code, department, and assigned semester.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateSubject} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Department *
                  </label>
                  <select
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Semester *
                  </label>
                  <select
                    value={editSemName}
                    onChange={(e) => setEditSemName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {availableSemesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Subject Name *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Subject Code *
                  </label>
                  <Input
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Subject Type
                  </label>
                  <select
                    value={editSubjectType}
                    onChange={(e) => setEditSubjectType(e.target.value as "Theory" | "Lab" | "Elective")}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {SUBJECT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Periods/Week
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editWeeklyHours}
                    onChange={(e) => setEditWeeklyHours(e.target.value)}
                    className="rounded-xl border-border bg-muted/40 font-mono"
                  />
                </div>
              </div>

              {editError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500 flex items-start gap-2">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingEdit || !editName.trim() || !editCode.trim() || !editDeptId}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingEdit ? "Updating..." : "Update Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <WizardFooter
          prevHref="/rooms"
          nextHref="/faculty"
        />
      </div>
    </AppShell>
  );
}