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
  Layers,
  GraduationCap,
  DoorOpen,
  CheckCircle2,
  Sliders,
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

interface SemesterConfig {
  semNumber: number;
  sectionCount: number;
  labCount: number;
}

const DEFAULT_SEMESTERS: SemesterConfig[] = [
  { semNumber: 1, sectionCount: 2, labCount: 2 },
  { semNumber: 3, sectionCount: 2, labCount: 2 },
  { semNumber: 5, sectionCount: 2, labCount: 2 },
  { semNumber: 7, sectionCount: 2, labCount: 2 },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Create Department Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [semesterConfigs, setSemesterConfigs] = useState<SemesterConfig[]>(DEFAULT_SEMESTERS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Manage Department Sections Modal
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [manageConfigs, setManageConfigs] = useState<SemesterConfig[]>(DEFAULT_SEMESTERS);
  const [submittingManage, setSubmittingManage] = useState(false);
  const [manageSuccess, setManageSuccess] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
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

      const [deptRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        setDepartments(await deptRes.json());
      }
      if (secRes && secRes.ok) {
        setSections(await secRes.json());
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
    field: "sectionCount" | "labCount",
    val: number,
    isManage = false
  ) => {
    const updater = isManage ? setManageConfigs : setSemesterConfigs;
    updater((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: Math.max(0, Math.min(10, val)) };
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

      // Automatically generate Sections and Labs for the department
      const deptShort = newDept.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "SEC";
      const letters = ["A", "B", "C", "D", "E", "F", "G"];

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

        for (let j = 0; j < conf.labCount; j++) {
          const labLabel = `${deptShort} Sem ${conf.semNumber} Lab ${j + 1}`;
          await fetch(`${API_BASE}/sections/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: labLabel,
              department_id: newDept.id,
              student_count: 30,
            }),
          }).catch(() => null);
        }
      }

      setName("");
      setSemesterConfigs(DEFAULT_SEMESTERS);
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating department");
    } finally {
      setSubmitting(false);
    }
  };

  const openManageModal = (dept: Department) => {
    setSelectedDept(dept);
    setManageConfigs(DEFAULT_SEMESTERS);
    setManageSuccess("");
    setManageOpen(true);
  };

  const handleSaveDepartmentSections = async () => {
    if (!selectedDept) return;
    setSubmittingManage(true);
    setManageSuccess("");

    try {
      const deptShort = selectedDept.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "SEC";
      const letters = ["A", "B", "C", "D", "E", "F", "G"];

      for (const conf of manageConfigs) {
        for (let i = 0; i < conf.sectionCount; i++) {
          const secLabel = `${deptShort} ${conf.semNumber}${letters[i] || i + 1}`;
          // Check if already exists
          const exists = sections.find((s) => s.department_id === selectedDept.id && s.name === secLabel);
          if (!exists) {
            await fetch(`${API_BASE}/sections/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: secLabel,
                department_id: selectedDept.id,
                student_count: 60,
              }),
            }).catch(() => null);
          }
        }

        for (let j = 0; j < conf.labCount; j++) {
          const labLabel = `${deptShort} Sem ${conf.semNumber} Lab ${j + 1}`;
          const exists = sections.find((s) => s.department_id === selectedDept.id && s.name === labLabel);
          if (!exists) {
            await fetch(`${API_BASE}/sections/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: labLabel,
                department_id: selectedDept.id,
                student_count: 30,
              }),
            }).catch(() => null);
          }
        }
      }

      await fetchData();
      setManageSuccess("Successfully generated and updated semester sections and lab cohorts!");
      setTimeout(() => setManageOpen(false), 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingManage(false);
    }
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editName.trim()) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Departments & Semester Section Hierarchy"
          description="Create academic departments and configure the number of theory sections and practical labs in each semester."
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
            <DialogContent className="sm:max-w-[540px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Academic Department Setup</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Department & Semester Structure
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Enter department name and specify number of sections & labs for each semester.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddDepartment} className="space-y-4 pt-2">
                <div>
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

                {/* Semester Section & Lab Structure Table */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-[#8B5CF6]" />
                    Semester Sections & Labs Provisioning
                  </label>
                  <div className="rounded-2xl border border-border bg-muted/20 p-3 space-y-2.5">
                    {semesterConfigs.map((sem, idx) => (
                      <div
                        key={sem.semNumber}
                        className="flex items-center justify-between gap-4 p-2 rounded-xl bg-card border border-border text-xs"
                      >
                        <span className="font-bold text-foreground w-20">
                          Sem {sem.semNumber}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Sections:</span>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={sem.sectionCount}
                            onChange={(e) =>
                              handleUpdateSemConfig(idx, "sectionCount", parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-8 text-center font-bold text-xs rounded-lg"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Labs:</span>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={sem.labCount}
                            onChange={(e) =>
                              handleUpdateSemConfig(idx, "labCount", parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-8 text-center font-bold text-xs rounded-lg"
                          />
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
                    {submitting ? "Provisioning Department..." : "Create Department & Cohorts"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Manage Sections & Labs Modal */}
        <Dialog open={manageOpen} onOpenChange={setManageOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Sliders className="size-4" />
                <span className="tt-eyebrow">Cohort Structure</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Manage {selectedDept?.name} Sections
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Adjust section and lab generation counts per semester.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="rounded-2xl border border-border bg-muted/20 p-3 space-y-2">
                {manageConfigs.map((sem, idx) => (
                  <div
                    key={sem.semNumber}
                    className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-card border border-border text-xs"
                  >
                    <span className="font-bold text-foreground w-20">
                      Semester {sem.semNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Sections:</span>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={sem.sectionCount}
                        onChange={(e) =>
                          handleUpdateSemConfig(idx, "sectionCount", parseInt(e.target.value) || 0, true)
                        }
                        className="w-16 h-8 text-center font-bold text-xs rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Labs:</span>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={sem.labCount}
                        onChange={(e) =>
                          handleUpdateSemConfig(idx, "labCount", parseInt(e.target.value) || 0, true)
                        }
                        className="w-16 h-8 text-center font-bold text-xs rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {manageSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="size-4" /> {manageSuccess}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={handleSaveDepartmentSections}
                disabled={submittingManage}
                className="tt-gradient-btn rounded-xl font-bold w-full"
              >
                {submittingManage ? "Updating Cohorts..." : "Generate & Sync Sections"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Department Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Department</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Department
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateDepartment} className="space-y-4 pt-2">
              <div>
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

              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingEdit || !editName.trim()}
                  className="tt-gradient-btn rounded-xl font-bold"
                >
                  {submittingEdit ? "Updating..." : "Update Title"}
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
                {departments.length} {departments.length === 1 ? "department" : "departments"} with configured semester cohorts
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
                description='Click "Add Department" above to create departments and provision sections & labs.'
              />
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Department Title</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Active Cohorts</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Cohort Management</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept, index) => {
                      const deptSections = sections.filter((s) => s.department_id === dept.id);
                      const theoryCount = deptSections.filter((s) => !s.name.toLowerCase().includes("lab")).length;
                      const labCount = deptSections.filter((s) => s.name.toLowerCase().includes("lab")).length;

                      return (
                        <TableRow key={dept.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-sm">
                            {dept.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30">
                                {theoryCount} Sections
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30">
                                {labCount} Labs
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openManageModal(dept)}
                              className="rounded-xl text-xs font-bold gap-1.5 border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                            >
                              <Sliders className="size-3.5" />
                              Configure Semesters
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                onClick={() => openEditModal(dept)}
                                title="Edit department title"
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
