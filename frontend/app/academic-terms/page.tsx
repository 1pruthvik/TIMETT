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
import { Plus, Trash2, Pencil, Calendar, CalendarRange, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { WizardFooter } from "@/components/ui/wizard-footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface AcademicYear {
  id: number;
  institution_id: number;
  name: string;
}

interface Semester {
  id: number;
  academic_year_id: number;
  name: string;
}

export default function AcademicTermsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<number>(1);

  // Year Modal
  const [yearOpen, setYearOpen] = useState(false);
  const [yearName, setYearName] = useState("2026 - 2027");
  const [submittingYear, setSubmittingYear] = useState(false);
  const [yearError, setYearError] = useState("");

  // Edit Year Modal
  const [editYearOpen, setEditYearOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [submittingEditYear, setSubmittingEditYear] = useState(false);
  const [editYearError, setEditYearError] = useState("");

  // Semester Modal
  const [semOpen, setSemOpen] = useState(false);
  const [semName, setSemName] = useState("Semester 1");
  const [selectedYearId, setSelectedYearId] = useState<number | "">("");
  const [submittingSem, setSubmittingSem] = useState(false);
  const [semError, setSemError] = useState("");

  // Edit Semester Modal
  const [editSemOpen, setEditSemOpen] = useState(false);
  const [editingSem, setEditingSem] = useState<Semester | null>(null);
  const [editSemName, setEditSemName] = useState("");
  const [editSemYearId, setEditSemYearId] = useState<number | "">("");
  const [submittingEditSem, setSubmittingEditSem] = useState(false);
  const [editSemError, setEditSemError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      let instId = 1;
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.institution_id) instId = user.institution_id;
        } catch {
          // ignore
        }
      }
      setInstitutionId(instId);

      const yrPromise = fetch(`${API_BASE}/academic-years/?institution_id=${instId}`).catch(() => null);
      const semPromise = fetch(`${API_BASE}/semesters/?institution_id=${instId}`).catch(() => null);

      const [yrRes, semRes] = await Promise.all([yrPromise, semPromise]);

      const yrs: AcademicYear[] = (yrRes && yrRes.ok) ? await yrRes.json() : [];
      const sems: Semester[] = (semRes && semRes.ok) ? await semRes.json() : [];

      setAcademicYears(yrs);
      setSemesters(sems);
      if (yrs.length > 0) {
        setSelectedYearId(yrs[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch academic terms data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) return;
    setSubmittingYear(true);
    setYearError("");
    try {
      const res = await fetch(`${API_BASE}/academic-years/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution_id: institutionId, name: yearName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create academic year");
      }
      setYearOpen(false);
      await fetchData();
    } catch (err) {
      setYearError(err instanceof Error ? err.message : "Error creating year");
    } finally {
      setSubmittingYear(false);
    }
  };

  const openEditYearModal = (yr: AcademicYear) => {
    setEditingYear(yr);
    setEditYearName(yr.name);
    setEditYearError("");
    setEditYearOpen(true);
  };

  const handleUpdateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear || !editYearName.trim()) return;
    setSubmittingEditYear(true);
    setEditYearError("");
    try {
      const res = await fetch(`${API_BASE}/academic-years/${editingYear.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution_id: editingYear.institution_id || institutionId,
          name: editYearName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update academic year");
      }
      setEditYearOpen(false);
      await fetchData();
    } catch (err) {
      setEditYearError(err instanceof Error ? err.message : "Error updating year");
    } finally {
      setSubmittingEditYear(false);
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semName.trim() || !selectedYearId) return;
    setSubmittingSem(true);
    setSemError("");
    try {
      const res = await fetch(`${API_BASE}/semesters/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academic_year_id: Number(selectedYearId),
          name: semName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create semester");
      }
      setSemOpen(false);
      await fetchData();
    } catch (err) {
      setSemError(err instanceof Error ? err.message : "Error creating semester");
    } finally {
      setSubmittingSem(false);
    }
  };

  const openEditSemesterModal = (sem: Semester) => {
    setEditingSem(sem);
    setEditSemName(sem.name);
    setEditSemYearId(sem.academic_year_id);
    setEditSemError("");
    setEditSemOpen(true);
  };

  const handleUpdateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSem || !editSemName.trim() || !editSemYearId) return;
    setSubmittingEditSem(true);
    setEditSemError("");
    try {
      const res = await fetch(`${API_BASE}/semesters/${editingSem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academic_year_id: Number(editSemYearId),
          name: editSemName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update semester");
      }
      setEditSemOpen(false);
      await fetchData();
    } catch (err) {
      setEditSemError(err instanceof Error ? err.message : "Error updating semester");
    } finally {
      setSubmittingEditSem(false);
    }
  };

  const handleDeleteYear = async (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    try {
      const res = await fetch(`${API_BASE}/academic-years/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAcademicYears((prev) => prev.filter((y) => y.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSemester = async (id: number) => {
    if (!confirm("Are you sure you want to delete this semester?")) return;
    try {
      const res = await fetch(`${API_BASE}/semesters/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSemesters((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Academic Terms & Semesters"
          icon={CalendarRange}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground cursor-pointer"
            title="Refresh academic terms"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          {/* Add Year Dialog */}
          <Dialog open={yearOpen} onOpenChange={setYearOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] px-5 text-sm font-bold text-foreground cursor-pointer gap-2 transition-all hover:scale-105">
                <Plus className="size-4" /> Add Year
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Academic Session</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">Create Academic Year</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">e.g. 2026 - 2027 or 2027 - 2028</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddYear} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Year Label *</label>
                  <Input
                    placeholder="2026 - 2027"
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    required
                    className="h-11 px-4 rounded-xl bg-muted/40 border-0"
                  />
                </div>
                {yearError && <p className="text-xs text-red-500">{yearError}</p>}
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={submittingYear || !yearName.trim()} className="tt-gradient-btn h-11 rounded-2xl px-6 font-bold">
                    {submittingYear ? "Saving..." : "Save Year"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Semester Dialog */}
          <Dialog open={semOpen} onOpenChange={setSemOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-11 rounded-2xl gap-2 font-bold px-5 text-sm cursor-pointer shadow-lg hover:scale-105 transition-all">
                <Plus className="size-4" /> Add Semester
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Term Partition</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">Add Semester</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Select parent academic year and enter semester title.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSemester} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Academic Year *</label>
                  <select
                    className="w-full h-11 rounded-xl bg-muted/40 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 border-0"
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(Number(e.target.value))}
                    required
                  >
                    {academicYears.map((yr) => (
                      <option key={yr.id} value={yr.id}>
                        {yr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Semester Name *</label>
                  <Input
                    placeholder="e.g. Semester 1, Odd Sem"
                    value={semName}
                    onChange={(e) => setSemName(e.target.value)}
                    required
                    className="h-11 px-4 rounded-xl bg-muted/40 border-0"
                  />
                </div>
                {semError && <p className="text-xs text-red-500">{semError}</p>}
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={submittingSem || !semName.trim() || !selectedYearId} className="tt-gradient-btn h-11 rounded-2xl px-6 font-bold">
                    {submittingSem ? "Saving..." : "Save Semester"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Year Dialog */}
        <Dialog open={editYearOpen} onOpenChange={setEditYearOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Session</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">Edit Academic Year</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateYear} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Year Label *</label>
                <Input
                  value={editYearName}
                  onChange={(e) => setEditYearName(e.target.value)}
                  required
                  className="h-11 px-4 rounded-xl bg-muted/40 border-0"
                />
              </div>
              {editYearError && <p className="text-xs text-red-500">{editYearError}</p>}
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={submittingEditYear || !editYearName.trim()} className="tt-gradient-btn h-11 rounded-2xl px-6 font-bold">
                  {submittingEditYear ? "Updating..." : "Update Year"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Semester Dialog */}
        <Dialog open={editSemOpen} onOpenChange={setEditSemOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Term</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">Edit Semester</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSemester} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Academic Year *</label>
                <select
                  className="w-full h-11 rounded-xl bg-muted/40 px-4 text-sm text-foreground focus:outline-none border-0"
                  value={editSemYearId}
                  onChange={(e) => setEditSemYearId(Number(e.target.value))}
                  required
                >
                  {academicYears.map((yr) => (
                    <option key={yr.id} value={yr.id}>
                      {yr.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Semester Name *</label>
                <Input
                  value={editSemName}
                  onChange={(e) => setEditSemName(e.target.value)}
                  required
                  className="h-11 px-4 rounded-xl bg-muted/40 border-0"
                />
              </div>
              {editSemError && <p className="text-xs text-red-500">{editSemError}</p>}
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={submittingEditSem || !editSemName.trim() || !editSemYearId} className="tt-gradient-btn h-11 rounded-2xl px-6 font-bold">
                  {submittingEditSem ? "Updating..." : "Update Semester"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Unboxed, Spread Dual Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-2">
          {/* Academic Years Division */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
              <h3 className="text-lg font-bold text-foreground">Academic Years</h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {academicYears.length} Years
              </span>
            </div>

            <div>
              {loading ? (
                <LoadingState text="Loading academic years..." />
              ) : academicYears.length === 0 ? (
                <EmptyState icon={CalendarRange} title="No academic years found" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-black/[0.06] dark:border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-center text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-center text-xs font-bold text-muted-foreground">Year Range</TableHead>
                      <TableHead className="text-center text-xs font-bold text-muted-foreground w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears.map((yr, index) => (
                      <TableRow key={yr.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground py-4">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="text-center font-bold text-foreground py-4">{yr.name}</TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => openEditYearModal(yr)}
                              title="Edit year"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDeleteYear(yr.id)}
                              title="Delete year"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Semesters Division */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
              <h3 className="text-lg font-bold text-foreground">Semesters</h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {semesters.length} Semesters
              </span>
            </div>

            <div>
              {loading ? (
                <LoadingState text="Loading semesters..." />
              ) : semesters.length === 0 ? (
                <EmptyState icon={CalendarRange} title="No semesters found" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-black/[0.06] dark:border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-center text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-center text-xs font-bold text-muted-foreground">Semester Term</TableHead>
                      <TableHead className="text-center text-xs font-bold text-muted-foreground w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesters.map((sem, index) => (
                      <TableRow key={sem.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground py-4">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="text-center font-bold text-foreground py-4">{sem.name}</TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => openEditSemesterModal(sem)}
                              title="Edit semester"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDeleteSemester(sem.id)}
                              title="Delete semester"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
        <WizardFooter nextHref="/departments" />
      </div>
    </AppShell>
  );
}
