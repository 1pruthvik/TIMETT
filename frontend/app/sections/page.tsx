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
  GraduationCap,
  RefreshCw,
  Sparkles,
  Building2,
  DoorOpen,
  Sliders,
  Layers,
  FlaskConical,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Section {
  id: number;
  name: string;
  department_id: number;
  student_count?: number;
}

interface Department {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  room_type?: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sectionRoomMap, setSectionRoomMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [studentCount, setStudentCount] = useState("60");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState<number | "">("");
  const [editStudentCount, setEditStudentCount] = useState("60");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;

      const [deptRes, secRes, roomRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) {
          setDepartmentId(depts[0].id);
        }
      }

      if (secRes && secRes.ok) {
        setSections(await secRes.json());
      }

      if (roomRes && roomRes.ok) {
        setRooms(await roomRes.json());
      }

      const savedMap = localStorage.getItem(`timett_room_mapping_${userInstId}`);
      if (savedMap) {
        setSectionRoomMap(JSON.parse(savedMap));
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

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !departmentId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/sections/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department_id: Number(departmentId),
          student_count: parseInt(studentCount) || 60,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add section");
      }

      setName("");
      setStudentCount("60");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating section");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (section: Section) => {
    setEditingSection(section);
    setEditName(section.name);
    setEditDepartmentId(section.department_id);
    setEditStudentCount((section.student_count || 60).toString());
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editName.trim() || !editDepartmentId) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/sections/${editingSection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          department_id: Number(editDepartmentId),
          student_count: parseInt(editStudentCount) || 60,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update section");
      }

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating section");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      const res = await fetch(`${API_BASE}/sections/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete section", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Student Sections & Lab Cohorts"
          icon={GraduationCap}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh sections"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
          </Button>

          <Link href="/departments">
            <Button variant="outline" className="h-10 rounded-xl gap-2 font-semibold border-border bg-card hover:bg-muted text-foreground">
              <Building2 className="size-4 text-[#0070F3]" />
              Manage via Department
            </Button>
          </Link>

          <Link href="/rooms">
            <Button variant="outline" className="h-10 rounded-xl gap-2 font-semibold border-border bg-card hover:bg-muted text-foreground">
              <DoorOpen className="size-4 text-[#0070F3]" />
              Facility Mapping
            </Button>
          </Link>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Custom Cohort
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Cohort Identifier</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Add Section / Cohort
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create a custom division or cohort within a department.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSection} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Section / Cohort Identifier *
                  </label>
                  <Input
                    placeholder="e.g. CSE 6A, ME 4B, or Lab Batch 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Department *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Student Strength / Count
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    className="rounded-xl border-border bg-muted/40 font-mono"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim() || !departmentId}
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Adding..." : "Save Cohort"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Section Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Cohort</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Section
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateSection} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Cohort Identifier *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Department *
                </label>
                <select
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(Number(e.target.value))}
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Student Strength
                </label>
                <Input
                  type="number"
                  min="1"
                  value={editStudentCount}
                  onChange={(e) => setEditStudentCount(e.target.value)}
                  className="rounded-xl border-border bg-muted/40 font-mono"
                />
              </div>

              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingEdit || !editName.trim() || !editDepartmentId}
                  className="tt-gradient-btn rounded-xl font-bold"
                >
                  {submittingEdit ? "Updating..." : "Update Section"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Active Cohort Roster</h3>
              <p className="text-xs text-muted-foreground">
                {sections.length} {sections.length === 1 ? "cohort" : "cohorts"} registered across all departments
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading sections database..." />
            ) : sections.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No sections found"
                description='Use the "Manage via Department" button above to auto-generate sections & labs per semester.'
              />
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Section / Cohort Identifier</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Category</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Department</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Designated Facility</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map((sec, index) => {
                      const deptName =
                        departments.find((d) => d.id === sec.department_id)?.name ||
                        `Dept #${sec.department_id}`;
                      const isLab = sec.name.toLowerCase().includes("lab");
                      const mappedRoomId = sectionRoomMap[sec.id];
                      const mappedRoom = rooms.find((r) => r.id === mappedRoomId);

                      return (
                        <TableRow key={sec.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-sm text-foreground">
                              {sec.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isLab ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                                <FlaskConical className="size-3" /> Practical Lab
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-[#0070F3]/10 border border-[#0070F3]/30 px-2 py-0.5 text-xs font-bold text-[#0070F3] dark:text-[#38BDF8]">
                                <GraduationCap className="size-3" /> Theory Section
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-muted-foreground">
                            {deptName}
                          </TableCell>
                          <TableCell>
                            {mappedRoom ? (
                              <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary bg-primary/10">
                                {mappedRoom.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Dynamic Allocation</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                onClick={() => openEditModal(sec)}
                                title="Edit section"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => handleDelete(sec.id)}
                                title="Delete section"
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