"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, BookOpen, RefreshCw, Sparkles } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Subject { id: number; name: string; code: string; department_id: number; }
interface Department { id: number; name: string; }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState<number | "">("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userDeptId = user?.department_id;
      const userInstId = user?.institution_id;
      const deptUrl = userInstId ? `${API_BASE}/departments/?institution_id=${userInstId}` : `${API_BASE}/departments/`;
      const deptRes = await fetch(deptUrl).catch(() => null);
      if (deptRes && deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) setDepartmentId(userDeptId || depts[0].id);
      }
      const subUrl = userDeptId ? `${API_BASE}/subjects/?department_id=${userDeptId}` : `${API_BASE}/subjects/`;
      const subRes = await fetch(subUrl).catch(() => null);
      if (subRes && subRes.ok) setSubjects(await subRes.json());
    } catch (err) { console.error(err); setError("Failed to connect to backend API."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !departmentId) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase(), department_id: Number(departmentId) })
      });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.detail || "Failed to add subject"); }
      setName(""); setCode(""); setOpen(false); await fetchData();
    } catch (err) { setError(err instanceof Error ? err.message : "Error creating subject"); }
    finally { setSubmitting(false); }
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
    setEditCode(subject.code);
    setEditDepartmentId(subject.department_id);
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editName.trim() || !editCode.trim() || !editDepartmentId) return;
    setSubmittingEdit(true); setEditError("");
    try {
      const res = await fetch(`${API_BASE}/subjects/${editingSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          department_id: Number(editDepartmentId)
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update subject");
      }
      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating subject");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch(`${API_BASE}/subjects/${id}`, { method: "DELETE" });
      if (res.ok) setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { console.error("Failed to delete subject", err); }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader title="Subject Management" description="Add courses, curriculum codes, and department mappings." icon={BookOpen}>
          <Button variant="outline" size="icon" onClick={fetchData} className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Refresh">
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">New Course Record</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">Add New Subject</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Enter subject name, course code, and assign department.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubject} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Subject Name *</label>
                  <Input placeholder="e.g. Data Structures & Algorithms" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl border-border bg-muted/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Subject Code *</label>
                  <Input placeholder="e.g. CS201" value={code} onChange={(e) => setCode(e.target.value)} required className="rounded-xl border-border bg-muted/40 font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Department *</label>
                  <select className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" value={departmentId} onChange={(e) => setDepartmentId(Number(e.target.value))} required>
                    {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                  </select>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={submitting || !name.trim() || !code.trim()} className="tt-gradient-btn rounded-xl font-bold">
                    {submitting ? "Saving..." : "Save Subject"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Subject Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Course</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">Edit Subject</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Update course details, subject code, or department.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubject} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Subject Name *</label>
                <Input placeholder="e.g. Data Structures & Algorithms" value={editName} onChange={(e) => setEditName(e.target.value)} required className="rounded-xl border-border bg-muted/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Subject Code *</label>
                <Input placeholder="e.g. CS201" value={editCode} onChange={(e) => setEditCode(e.target.value)} required className="rounded-xl border-border bg-muted/40 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Department *</label>
                <select className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" value={editDepartmentId} onChange={(e) => setEditDepartmentId(Number(e.target.value))} required>
                  {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                </select>
              </div>
              {editError && <p className="text-xs text-red-500">{editError}</p>}
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={submittingEdit || !editName.trim() || !editCode.trim()} className="tt-gradient-btn rounded-xl font-bold">
                  {submittingEdit ? "Updating..." : "Update Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Course Catalog</h3>
              <p className="text-xs text-muted-foreground">{subjects.length} {subjects.length === 1 ? "subject" : "subjects"} in curriculum</p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? <LoadingState text="Loading course records..." /> : subjects.length === 0 ? (
              <EmptyState icon={BookOpen} title="No subjects found" description='Add subjects like Operating Systems, Mathematics, or DBMS using the "Add Subject" button.' />
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Code</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Subject Name</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Department</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((sub, index) => {
                      const deptName = departments.find((d) => d.id === sub.department_id)?.name || `Dept #${sub.department_id}`;
                      return (
                        <TableRow key={sub.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">#{index + 1}</TableCell>
                          <TableCell><span className="rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA]">{sub.code}</span></TableCell>
                          <TableCell className="font-bold text-foreground text-sm">{sub.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-medium">{deptName}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer" onClick={() => openEditModal(sub)} title="Edit subject">
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer" onClick={() => handleDelete(sub.id)} title="Delete subject">
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