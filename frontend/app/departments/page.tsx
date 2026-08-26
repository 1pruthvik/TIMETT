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
  Building2,
  RefreshCw,
  Sparkles,
  GraduationCap,
  FlaskConical,
  CalendarRange,
  ArrowRight,
} from "lucide-react";
import { WizardFooter } from "@/components/ui/wizard-footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Department {
  id: number;
  name: string;
  institution_id: number;
}

interface Section {
  id: number;
  name: string;
  department_id: number;
  student_count?: number;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  room_type?: string;
  institution_id: number;
}

interface AcademicSemester {
  id: number;
  name: string;
  academic_year_id: number;
}

interface SemesterSectionConfig {
  semesterId: number;
  semesterName: string;
  sectionCount: number;
}

function getDeptAcronym(name: string): string {
  if (!name.trim()) return "SEC";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].toUpperCase().slice(0, 4);
  }
  return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
}

function getDeptLabs(dept: Department, allRooms: Room[]): Room[] {
  const acronym = getDeptAcronym(dept.name).toLowerCase();
  const fullName = dept.name.toLowerCase();

  return allRooms.filter((r) => {
    if (r.room_type !== "Lab") return false;
    const roomName = r.name.toLowerCase();
    return (
      roomName.includes(fullName) ||
      roomName.startsWith(acronym) ||
      roomName.includes(` ${acronym} `) ||
      roomName.includes(`${acronym}-`) ||
      roomName.includes(`${acronym} `)
    );
  });
}

function isSectionForSemester(secName: string, semName: string): boolean {
  const normSec = secName.trim().toLowerCase();
  const normSem = semName.trim().toLowerCase();

  // If full sem name is contained
  if (normSec.includes(normSem)) return true;

  // Extract digits from semName e.g. "Semester 1" -> "1"
  const digits = normSem.match(/\d+/);
  if (digits) {
    const d = digits[0];
    const pattern = new RegExp(`(^|\\s|Sem|sem|[A-Za-z])${d}([A-Za-z]|\\s|$)`, "i");
    return pattern.test(normSec);
  }

  return false;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Create Department Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deptLabCount, setDeptLabCount] = useState("3");
  const [createConfigs, setCreateConfigs] = useState<SemesterSectionConfig[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Department Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeptLabCount, setEditDeptLabCount] = useState("0");
  const [editConfigs, setEditConfigs] = useState<SemesterSectionConfig[]>([]);
  const [customSectionName, setCustomSectionName] = useState("");
  const [customLabName, setCustomLabName] = useState("");
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

      const [deptRes, secRes, roomRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/semesters/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        setDepartments(await deptRes.json());
      }
      if (secRes && secRes.ok) {
        setSections(await secRes.json());
      }
      if (roomRes && roomRes.ok) {
        setRooms(await roomRes.json());
      }

      let sems: AcademicSemester[] = [];
      if (semRes && semRes.ok) {
        sems = await semRes.json();
        setAcademicSemesters(sems);
      }

      // Initialize createConfigs from academic terms
      if (sems.length > 0) {
        setCreateConfigs(
          sems.map((s) => ({
            semesterId: s.id,
            semesterName: s.name,
            sectionCount: 2,
          }))
        );
      } else {
        // Fallback only if no terms are added yet
        setCreateConfigs([
          { semesterId: 1, semesterName: "Semester 1", sectionCount: 2 },
          { semesterId: 3, semesterName: "Semester 3", sectionCount: 2 },
          { semesterId: 5, semesterName: "Semester 5", sectionCount: 2 },
          { semesterId: 7, semesterName: "Semester 7", sectionCount: 2 },
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

  const handleUpdateConfig = (
    index: number,
    val: number,
    isEdit = false
  ) => {
    const updater = isEdit ? setEditConfigs : setCreateConfigs;
    updater((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], sectionCount: Math.max(0, Math.min(10, val)) };
      return next;
    });
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/departments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          institution_id: institutionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create department");
      }

      const newDept: Department = await res.json();

      // Automatically generate Sections for only the active semesters configured in Academic Terms
      const deptShort = getDeptAcronym(newDept.name);
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

      for (const conf of createConfigs) {
        const semDigit = conf.semesterName.match(/\d+/)?.[0] || conf.semesterName;
        for (let i = 0; i < conf.sectionCount; i++) {
          const secLabel = `${deptShort} ${semDigit}${letters[i] || i + 1}`;
          await fetch(`${API_BASE}/sections/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: secLabel,
              department_id: newDept.id,
              student_count: 60,
            }),
          }).catch(() => null);
        }
      }

      // Provision department-wide physical laboratories
      const numLabs = parseInt(deptLabCount) || 0;
      for (let j = 1; j <= numLabs; j++) {
        const labName = `${deptShort} Lab ${j}`;
        await fetch(`${API_BASE}/rooms/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: labName,
            capacity: 35,
            room_type: "Lab",
            institution_id: institutionId,
          }),
        }).catch(() => null);
      }

      setName("");
      setDeptLabCount("3");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating department");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);

    const deptSections = sections.filter((s) => s.department_id === dept.id);

    // Populate semester list strictly from Academic Terms
    const activeSems = academicSemesters.length > 0
      ? academicSemesters
      : [
          { id: 1, name: "Semester 1", academic_year_id: 1 },
          { id: 3, name: "Semester 3", academic_year_id: 1 },
          { id: 5, name: "Semester 5", academic_year_id: 1 },
          { id: 7, name: "Semester 7", academic_year_id: 1 },
        ];

    const updatedConfigs: SemesterSectionConfig[] = activeSems.map((sem) => {
      const matchingSecs = deptSections.filter((s) => isSectionForSemester(s.name, sem.name));
      return {
        semesterId: sem.id,
        semesterName: sem.name,
        sectionCount: matchingSecs.length, // Exact count from database
      };
    });

    const deptLabs = getDeptLabs(dept, rooms);
    setEditDeptLabCount(deptLabs.length.toString());

    setEditConfigs(updatedConfigs);
    setCustomSectionName("");
    setCustomLabName("");
    setEditError("");
    setEditOpen(true);
  };

  const handleAddCustomSectionToDept = async () => {
    if (!editingDept || !customSectionName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/sections/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customSectionName.trim(),
          department_id: editingDept.id,
          student_count: 60,
        }),
      });

      if (res.ok) {
        const newSec: Section = await res.json();
        const updatedSecs = [...sections, newSec];
        setSections(updatedSecs);
        setCustomSectionName("");

        // Update editConfigs in real-time
        setEditConfigs((prev) =>
          prev.map((sem) => {
            const matching = updatedSecs.filter(
              (s) => s.department_id === editingDept.id && isSectionForSemester(s.name, sem.semesterName)
            );
            return { ...sem, sectionCount: matching.length };
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomLabToDept = async () => {
    if (!editingDept || !customLabName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/rooms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customLabName.trim(),
          capacity: 35,
          room_type: "Lab",
          institution_id: institutionId,
        }),
      });

      if (res.ok) {
        const newRoom: Room = await res.json();
        const updatedRooms = [...rooms, newRoom];
        setRooms(updatedRooms);
        setCustomLabName("");

        const newDeptLabs = getDeptLabs(editingDept, updatedRooms);
        setEditDeptLabCount(newDeptLabs.length.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSectionFromDept = async (secId: number) => {
    try {
      const res = await fetch(`${API_BASE}/sections/${secId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedSecs = sections.filter((s) => s.id !== secId);
        setSections(updatedSecs);

        if (editingDept) {
          setEditConfigs((prev) =>
            prev.map((sem) => {
              const matching = updatedSecs.filter(
                (s) => s.department_id === editingDept.id && isSectionForSemester(s.name, sem.semesterName)
              );
              return { ...sem, sectionCount: matching.length };
            })
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLabFromDept = async (roomId: number) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedRooms = rooms.filter((r) => r.id !== roomId);
        setRooms(updatedRooms);

        if (editingDept) {
          const remainingLabs = getDeptLabs(editingDept, updatedRooms);
          setEditDeptLabCount(remainingLabs.length.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editName.trim()) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      // 1. Update department name
      const res = await fetch(`${API_BASE}/departments/${editingDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          institution_id: institutionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update department");
      }

      // 2. Sync sections for the academic terms semesters (both increasing and decreasing)
      const deptShort = getDeptAcronym(editName.trim());
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

      for (const conf of editConfigs) {
        const currentSemSecs = sections.filter(
          (s) => s.department_id === editingDept.id && isSectionForSemester(s.name, conf.semesterName)
        );

        if (conf.sectionCount > currentSemSecs.length) {
          // Increase sections
          const needed = conf.sectionCount - currentSemSecs.length;
          const semDigit = conf.semesterName.match(/\d+/)?.[0] || conf.semesterName;
          for (let i = 0; i < needed; i++) {
            const letterIdx = currentSemSecs.length + i;
            const secLabel = `${deptShort} ${semDigit}${letters[letterIdx] || letterIdx + 1}`;
            await fetch(`${API_BASE}/sections/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: secLabel,
                department_id: editingDept.id,
                student_count: 60,
              }),
            }).catch(() => null);
          }
        } else if (conf.sectionCount < currentSemSecs.length) {
          // Decrease sections by removing excess
          const toRemoveCount = currentSemSecs.length - conf.sectionCount;
          const secsToRemove = currentSemSecs.slice(currentSemSecs.length - toRemoveCount);
          for (const sec of secsToRemove) {
            await fetch(`${API_BASE}/sections/${sec.id}`, {
              method: "DELETE",
            }).catch(() => null);
          }
        }
      }

      // 3. Sync department labs (both increasing and decreasing)
      const targetNumLabs = Math.max(0, parseInt(editDeptLabCount) || 0);
      const currentDeptLabs = getDeptLabs(editingDept, rooms);

      if (targetNumLabs > currentDeptLabs.length) {
        // Increase labs
        const neededLabs = targetNumLabs - currentDeptLabs.length;
        for (let j = 1; j <= neededLabs; j++) {
          const labIdx = currentDeptLabs.length + j;
          const labName = `${deptShort} Lab ${labIdx}`;
          await fetch(`${API_BASE}/rooms/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: labName,
              capacity: 35,
              room_type: "Lab",
              institution_id: institutionId,
            }),
          }).catch(() => null);
        }
      } else if (targetNumLabs < currentDeptLabs.length) {
        // Decrease labs by removing excess
        const toRemoveLabCount = currentDeptLabs.length - targetNumLabs;
        const labsToRemove = currentDeptLabs.slice(currentDeptLabs.length - toRemoveLabCount);
        for (const lab of labsToRemove) {
          await fetch(`${API_BASE}/rooms/${lab.id}`, {
            method: "DELETE",
          }).catch(() => null);
        }
      }

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating department");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department? All child sections, faculty, and subjects will be removed.")) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDepartments((prev) => prev.filter((d) => d.id !== id));
        await fetchData();
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.detail || "Failed to delete department");
      }
    } catch (err) {
      console.error("Failed to delete department", err);
      alert("Error connecting to server. Please try again.");
    }
  };

  const activeDeptSections = editingDept ? sections.filter((s) => s.department_id === editingDept.id) : [];
  const activeDeptLabs = editingDept ? getDeptLabs(editingDept, rooms) : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Departments & Structure"
          icon={Building2}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground cursor-pointer"
            title="Refresh departments"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
          </Button>

          <Link href="/academic-terms">
            <Button variant="outline" className="h-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] px-5 text-sm font-bold text-foreground cursor-pointer gap-2 transition-all hover:scale-105">
              <CalendarRange className="size-4 text-[#0070F3]" />
              Academic Terms ({academicSemesters.length} Semesters)
            </Button>
          </Link>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-11 rounded-2xl gap-2 font-bold px-5 text-sm cursor-pointer shadow-lg hover:scale-105 transition-all">
                <Plus className="size-4" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Academic Department Setup</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Department Structure
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Specify department title, department labs, and section counts for semesters active in Academic Terms.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddDepartment} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Department Title *
                    </label>
                    <Input
                      placeholder="e.g. Computer Science & Engineering"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-xl border-border bg-muted/40 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                      <FlaskConical className="size-3.5 text-amber-500" />
                      Department Labs
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="3"
                      value={deptLabCount}
                      onChange={(e) => setDeptLabCount(e.target.value)}
                      required
                      className="rounded-xl border-border bg-muted/40 font-mono text-center font-bold"
                    />
                  </div>
                </div>

                {/* Semester Section Structure Table from Academic Terms */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="size-4 text-[#0070F3]" />
                      Active Academic Semesters ({createConfigs.length})
                    </label>
                    <Link
                      href="/academic-terms"
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      Manage Terms <ArrowRight className="size-3" />
                    </Link>
                  </div>

                  {createConfigs.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
                      No active semesters found in Academic Terms.{" "}
                      <Link href="/academic-terms" className="text-primary underline font-bold">
                        Add Semesters in Academic Terms
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                      {createConfigs.map((sem, idx) => (
                        <div
                          key={sem.semesterId || idx}
                          className="p-2.5 rounded-xl bg-card border border-border text-xs text-center space-y-1.5"
                        >
                          <span className="font-bold text-foreground block truncate" title={sem.semesterName}>
                            {sem.semesterName}
                          </span>

                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={sem.sectionCount}
                              onChange={(e) =>
                                handleUpdateConfig(idx, parseInt(e.target.value) || 0)
                              }
                              className="w-14 h-8 text-center font-bold text-xs rounded-lg"
                            />
                            <span className="text-[11px] text-muted-foreground">secs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="tt-gradient-btn rounded-xl font-bold w-full"
                  >
                    {submitting ? "Provisioning Department..." : "Create Department Structure"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Department Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Department & Structure</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Department Structure
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update department title, department labs, and section counts for semesters active in Academic Terms.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateDepartment} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Department Title *
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <FlaskConical className="size-3.5 text-amber-500" />
                    Department Labs
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={editDeptLabCount}
                    onChange={(e) => setEditDeptLabCount(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 font-mono text-center font-bold"
                  />
                </div>
              </div>

              {/* Semester Sections Matrix from Academic Terms */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-[#0070F3]" />
                    Academic Terms Semesters ({editConfigs.length})
                  </label>
                  <Link
                    href="/academic-terms"
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Manage Terms <ArrowRight className="size-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                  {editConfigs.map((sem, idx) => (
                    <div
                      key={sem.semesterId || idx}
                      className="p-2.5 rounded-xl bg-card border border-border text-xs text-center space-y-1.5"
                    >
                      <span className="font-bold text-foreground block truncate" title={sem.semesterName}>
                        {sem.semesterName}
                      </span>

                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={sem.sectionCount}
                          onChange={(e) =>
                            handleUpdateConfig(idx, parseInt(e.target.value) || 0, true)
                          }
                          className="w-14 h-8 text-center font-bold text-xs rounded-lg"
                        />
                        <span className="text-[11px] text-muted-foreground">secs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Department Laboratories List */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FlaskConical className="size-4 text-amber-500" />
                  Department Physical Laboratories ({activeDeptLabs.length})
                </label>

                {activeDeptLabs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-card/60">
                    {activeDeptLabs.map((lab) => (
                      <div
                        key={lab.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold"
                      >
                        <span>{lab.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLabFromDept(lab.id)}
                          className="text-muted-foreground hover:text-red-500 ml-1 cursor-pointer"
                          title="Remove lab space"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No specialized labs registered yet.</p>
                )}

                {/* Add Custom Lab */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="e.g. Advanced AI Lab or CAD/CAM Lab"
                    value={customLabName}
                    onChange={(e) => setCustomLabName(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomLabToDept}
                    disabled={!customLabName.trim()}
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold px-3 shrink-0"
                  >
                    <Plus className="size-3.5 mr-1" /> Add Lab
                  </Button>
                </div>
              </div>

              {/* Current Active Sections in this Department */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-[#0070F3]" />
                  Active Student Sections ({activeDeptSections.length})
                </label>

                {activeDeptSections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-card/60 max-h-32 overflow-y-auto">
                    {activeDeptSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0070F3]/10 border border-[#0070F3]/30 text-[#0070F3] dark:text-[#38BDF8] text-xs font-semibold"
                      >
                        <span>{sec.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSectionFromDept(sec.id)}
                          className="text-muted-foreground hover:text-red-500 ml-1 cursor-pointer"
                          title="Remove section"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No sections provisioned yet.</p>
                )}

                {/* Quick Add Custom Section */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="e.g. CSE 8A or Special Cohort"
                    value={customSectionName}
                    onChange={(e) => setCustomSectionName(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomSectionToDept}
                    disabled={!customSectionName.trim()}
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold px-3 shrink-0"
                  >
                    <Plus className="size-3.5 mr-1" /> Add Section
                  </Button>
                </div>
              </div>

              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingEdit || !editName.trim()}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingEdit ? "Updating Structure..." : "Update Department & Sync Structure"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Unboxed, Spread Departments Layout ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
            <h3 className="text-lg font-bold text-foreground">Institutional Departments</h3>
            <span className="text-xs font-semibold text-muted-foreground">
              {departments.length} Departments
            </span>
          </div>

          <div>
            {loading ? (
              <LoadingState text="Loading departments and academic term structure..." />
            ) : departments.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No departments found"
                description='Click "Add Department" above to create departments with labs and semester sections.'
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-black/[0.06] dark:border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-center text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Department Title</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Department Labs</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">Semester Sections</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept, index) => {
                    const deptSections = sections.filter((s) => s.department_id === dept.id);
                    const deptLabs = getDeptLabs(dept, rooms);

                    return (
                      <TableRow key={dept.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground py-4">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="text-center font-bold text-foreground text-sm py-4">
                          {dept.name}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <FlaskConical className="size-3.5 text-amber-500" />
                            <span>{deptLabs.length} Labs</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <GraduationCap className="size-3.5 text-[#0070F3]" />
                            <span>{deptSections.length} Sections</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => openEditModal(dept)}
                              title="Edit department, labs, and sections"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDelete(dept.id)}
                              title="Delete department"
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
        <WizardFooter
          prevHref="/academic-terms"
          nextHref="/rooms"
        />
      </div>
    </AppShell>
  );
}
