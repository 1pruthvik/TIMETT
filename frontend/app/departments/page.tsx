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
} from "lucide-react";

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

interface SemesterConfig {
  semNumber: number;
  sectionCount: number;
}

const DEFAULT_SEMESTERS: SemesterConfig[] = [
  { semNumber: 1, sectionCount: 2 },
  { semNumber: 2, sectionCount: 2 },
  { semNumber: 3, sectionCount: 2 },
  { semNumber: 4, sectionCount: 2 },
  { semNumber: 5, sectionCount: 2 },
  { semNumber: 6, sectionCount: 2 },
  { semNumber: 7, sectionCount: 2 },
  { semNumber: 8, sectionCount: 2 },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Create Department Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deptLabCount, setDeptLabCount] = useState("3");
  const [semesterConfigs, setSemesterConfigs] = useState<SemesterConfig[]>(DEFAULT_SEMESTERS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Department Modal (Title + Total Dept Labs + Semester Section Counts)
  const [editOpen, setEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeptLabCount, setEditDeptLabCount] = useState("3");
  const [editConfigs, setEditConfigs] = useState<SemesterConfig[]>(DEFAULT_SEMESTERS);
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

      const [deptRes, secRes, roomRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
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

  const handleUpdateSemConfig = (
    index: number,
    val: number,
    isEdit = false
  ) => {
    const updater = isEdit ? setEditConfigs : setSemesterConfigs;
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

      // Automatically generate Sections for the department
      const deptShort = newDept.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "SEC";
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

      for (const conf of semesterConfigs) {
        for (let i = 0; i < conf.sectionCount; i++) {
          const secLabel = `${deptShort} ${conf.semNumber}${letters[i] || i + 1}`;
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
      setSemesterConfigs(DEFAULT_SEMESTERS);
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

    // Compute existing sections count per semester for this department
    const deptSections = sections.filter((s) => s.department_id === dept.id);
    const updatedConfigs: SemesterConfig[] = DEFAULT_SEMESTERS.map((sem) => {
      const semSecs = deptSections.filter((s) => s.name.includes(`${sem.semNumber}`));
      return {
        semNumber: sem.semNumber,
        sectionCount: semSecs.length > 0 ? semSecs.length : 2,
      };
    });

    // Compute department labs count
    const deptShort = dept.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4);
    const deptLabs = rooms.filter((r) => r.room_type === "Lab" && (r.name.startsWith(deptShort) || r.name.includes(dept.name)));
    setEditDeptLabCount(deptLabs.length > 0 ? deptLabs.length.toString() : "3");

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
        setCustomSectionName("");
        await fetchData();
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
        setCustomLabName("");
        await fetchData();
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
        setSections((prev) => prev.filter((s) => s.id !== secId));
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
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
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

      // 2. Sync sections for the department
      const deptShort = editName.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "SEC";
      const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

      for (const conf of editConfigs) {
        for (let i = 0; i < conf.sectionCount; i++) {
          const secLabel = `${deptShort} ${conf.semNumber}${letters[i] || i + 1}`;
          const exists = sections.find((s) => s.department_id === editingDept.id && s.name === secLabel);
          if (!exists) {
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
        }
      }

      // 3. Sync department labs
      const numLabs = parseInt(editDeptLabCount) || 0;
      for (let j = 1; j <= numLabs; j++) {
        const labName = `${deptShort} Lab ${j}`;
        const exists = rooms.find((r) => r.name === labName && r.room_type === "Lab");
        if (!exists) {
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
      }
    } catch (err) {
      console.error("Failed to delete department", err);
    }
  };

  const activeDeptSections = editingDept ? sections.filter((s) => s.department_id === editingDept.id) : [];
  const editingDeptShort = editingDept ? editingDept.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4) : "";
  const activeDeptLabs = editingDept ? rooms.filter((r) => r.room_type === "Lab" && (r.name.startsWith(editingDeptShort) || r.name.includes(editingDept.name))) : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Departments & Structure"
          description="Create academic departments, define total department laboratories, and set student section counts per semester."
          icon={Building2}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh departments"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Academic Department Setup</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Department Structure
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Specify department title, total department labs, and number of student sections per semester.
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

                {/* Semester Section Structure Table */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-[#8B5CF6]" />
                    Semester Sections Provisioning
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                    {semesterConfigs.map((sem, idx) => (
                      <div
                        key={sem.semNumber}
                        className="p-2.5 rounded-xl bg-card border border-border text-xs text-center space-y-1.5"
                      >
                        <span className="font-bold text-foreground block">
                          Sem {sem.semNumber}
                        </span>

                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={sem.sectionCount}
                            onChange={(e) =>
                              handleUpdateSemConfig(idx, parseInt(e.target.value) || 0)
                            }
                            className="w-14 h-8 text-center font-bold text-xs rounded-lg"
                          />
                          <span className="text-[11px] text-muted-foreground">secs</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Department & Structure</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Department Structure
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update department title, total department labs, and section counts per semester.
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

              {/* Semester Sections Matrix inside Edit Modal */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-[#8B5CF6]" />
                  Configure Sections per Semester
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                  {editConfigs.map((sem, idx) => (
                    <div
                      key={sem.semNumber}
                      className="p-2.5 rounded-xl bg-card border border-border text-xs text-center space-y-1.5"
                    >
                      <span className="font-bold text-foreground block">
                        Sem {sem.semNumber}
                      </span>

                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={sem.sectionCount}
                          onChange={(e) =>
                            handleUpdateSemConfig(idx, parseInt(e.target.value) || 0, true)
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
                  <GraduationCap className="size-4 text-[#8B5CF6]" />
                  Active Student Sections ({activeDeptSections.length})
                </label>

                {activeDeptSections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-card/60 max-h-32 overflow-y-auto">
                    {activeDeptSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-semibold"
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

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Institutional Departments</h3>
              <p className="text-xs text-muted-foreground">
                {departments.length} {departments.length === 1 ? "department" : "departments"} registered with configured laboratories and semester sections
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading departments and semester structure..." />
            ) : departments.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No departments found"
                description='Click "Add Department" above to create departments with labs and semester sections.'
              />
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Department Title</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Department Labs</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Semester Sections</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept, index) => {
                      const deptSections = sections.filter((s) => s.department_id === dept.id);
                      const deptShort = dept.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4);
                      const deptLabs = rooms.filter((r) => r.room_type === "Lab" && (r.name.startsWith(deptShort) || r.name.includes(dept.name)));

                      return (
                        <TableRow key={dept.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-sm">
                            {dept.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 font-semibold gap-1">
                              <FlaskConical className="size-3" />
                              {deptLabs.length} Labs
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 font-semibold gap-1">
                              <GraduationCap className="size-3" />
                              {deptSections.length} Sections
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
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
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
