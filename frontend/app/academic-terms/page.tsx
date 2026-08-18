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
import { Plus, Trash2, Calendar, CalendarRange, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

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

  // Year Modal
  const [yearOpen, setYearOpen] = useState(false);
  const [yearName, setYearName] = useState("2026 - 2027");
  const [submittingYear, setSubmittingYear] = useState(false);
  const [yearError, setYearError] = useState("");

  // Semester Modal
  const [semOpen, setSemOpen] = useState(false);
  const [semName, setSemName] = useState("Semester 1");
  const [selectedYearId, setSelectedYearId] = useState<number | "">("");
  const [submittingSem, setSubmittingSem] = useState(false);
  const [semError, setSemError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [yrRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/academic-years/`),
        fetch(`${API_BASE}/semesters/`),
      ]);

      const yrs: AcademicYear[] = yrRes.ok ? await yrRes.json() : [];
      const sems: Semester[] = semRes.ok ? await semRes.json() : [];

      setAcademicYears(yrs);
      setSemesters(sems);
      if (yrs.length > 0) {
        setSelectedYearId(yrs[0].id);
      }
    } catch (err) {
      console.error(err);
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
        body: JSON.stringify({ institution_id: 1, name: yearName.trim() }),
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
          description="Manage academic calendar sessions, annual years, and semester partitions."
          icon={CalendarRange}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh academic terms"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Dialog open={yearOpen} onOpenChange={setYearOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" />
                Add Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">Add Academic Year</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Define an annual academic cycle (e.g. 2026 - 2027).
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddYear} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Year Label *</label>
                  <Input
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>
                {yearError && <p className="text-xs text-red-500">{yearError}</p>}
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={submittingYear} className="tt-gradient-btn rounded-xl font-bold">
                    {submittingYear ? "Saving..." : "Save Academic Year"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={semOpen} onOpenChange={setSemOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" />
                Add Semester
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">Add Semester Term</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create a semester term linked to an academic year.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSemester} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Semester Name *</label>
                  <Input
                    value={semName}
                    onChange={(e) => setSemName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Parent Academic Year *</label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                {semError && <p className="text-xs text-red-500">{semError}</p>}
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={submittingSem} className="tt-gradient-btn rounded-xl font-bold">
                    {submittingSem ? "Saving..." : "Save Semester"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Dual Panels for Years and Semesters */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Academic Years Panel */}
          <GlassPanel glow="indigo" className="overflow-hidden p-0 shadow-sm border-border">
            <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
              <h3 className="text-base font-bold text-foreground">Academic Years</h3>
              <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-xs font-bold border border-indigo-500/20">
                {academicYears.length} Years
              </span>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <LoadingState text="Loading academic years..." />
              ) : academicYears.length === 0 ? (
                <EmptyState icon={Calendar} title="No academic years" description="Create a year like 2026-2027 above." />
              ) : (
                <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs font-bold text-muted-foreground">ID</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Year Range</TableHead>
                        <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicYears.map((yr) => (
                        <TableRow key={yr.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">#{yr.id}</TableCell>
                          <TableCell className="font-bold text-foreground">{yr.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDeleteYear(yr.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Semesters Panel */}
          <GlassPanel glow="cyan" className="overflow-hidden p-0 shadow-sm border-border">
            <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
              <h3 className="text-base font-bold text-foreground">Semesters</h3>
              <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 text-xs font-bold border border-cyan-500/20">
                {semesters.length} Semesters
              </span>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <LoadingState text="Loading semesters..." />
              ) : semesters.length === 0 ? (
                <EmptyState icon={CalendarRange} title="No semesters found" description="Add semesters like Semester 1 or Odd Sem above." />
              ) : (
                <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs font-bold text-muted-foreground">ID</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Semester Term</TableHead>
                        <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semesters.map((sem) => (
                        <TableRow key={sem.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">#{sem.id}</TableCell>
                          <TableCell className="font-bold text-foreground">{sem.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDeleteSemester(sem.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}
