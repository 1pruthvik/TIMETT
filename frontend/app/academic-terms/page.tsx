"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Calendar, CalendarRange, RefreshCw, AlertCircle } from "lucide-react";

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
  const [semName, setSemName] = useState("Semester 1 (Odd)");
  const [selectedYearId, setSelectedYearId] = useState<number | "">("");
  const [submittingSem, setSubmittingSem] = useState(false);
  const [semError, setSemError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const instId = user?.institution_id;

      let yrs: AcademicYear[] = [];
      if (instId) {
        const yrRes = await fetch(`${API_BASE}/academic-years/?institution_id=${instId}`);
        if (yrRes.ok) {
          yrs = await yrRes.json();
        }
      }

      // If no years found with query param, fetch all
      if (yrs.length === 0) {
        const allYrRes = await fetch(`${API_BASE}/academic-years/`);
        if (allYrRes.ok) {
          yrs = await allYrRes.json();
        }
      }

      const semRes = await fetch(`${API_BASE}/semesters/`);
      const sems: Semester[] = semRes.ok ? await semRes.json() : [];

      setAcademicYears(yrs);
      setSemesters(sems);

      if (yrs.length > 0) {
        setSelectedYearId(yrs[0].id);
      }
    } catch (err) {
      console.error("Error fetching academic terms", err);
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
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const instId = user?.institution_id || 1;

      const res = await fetch(`${API_BASE}/academic-years/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution_id: instId,
          name: yearName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create academic year");
      }

      setYearOpen(false);
      setYearName("");
      await fetchData();
    } catch (err) {
      console.error("Error creating academic year", err);
      setYearError(err instanceof Error ? err.message : "Error creating year");
    } finally {
      setSubmittingYear(false);
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semName.trim() || !selectedYearId) {
      setSemError("Please choose an Academic Year and enter a Semester name.");
      return;
    }

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
        const data = await res.json();
        throw new Error(data.detail || "Failed to create semester");
      }

      setSemOpen(false);
      setSemName("");
      await fetchData();
    } catch (err) {
      console.error("Error creating semester", err);
      setSemError(err instanceof Error ? err.message : "Error creating semester");
    } finally {
      setSubmittingSem(false);
    }
  };

  const handleDeleteYear = async (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;

    try {
      await fetch(`${API_BASE}/academic-years/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSemester = async (id: number) => {
    if (!confirm("Are you sure you want to delete this semester?")) return;

    try {
      await fetch(`${API_BASE}/semesters/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Academic Years & Semesters</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Define academic sessions, terms, and active scheduling semesters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            {/* Add Year Button */}
            <Dialog open={yearOpen} onOpenChange={setYearOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="size-4" />
                  Add Academic Year
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add Academic Year</DialogTitle>
                  <DialogDescription>
                    Create a new academic session (e.g. 2026 - 2027).
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddYear} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Academic Year Name *
                    </label>
                    <Input
                      placeholder="e.g. 2026 - 2027"
                      value={yearName}
                      onChange={(e) => setYearName(e.target.value)}
                      required
                    />
                  </div>

                  {yearError && (
                    <div className="flex items-center gap-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{yearError}</span>
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={submittingYear || !yearName.trim()}>
                      {submittingYear ? "Saving..." : "Save Year"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Semester Button */}
            <Dialog open={semOpen} onOpenChange={setSemOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Semester / Term
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Semester</DialogTitle>
                  <DialogDescription>
                    Create a semester term under an academic year.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddSemester} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Academic Year *
                    </label>
                    {academicYears.length === 0 ? (
                      <p className="text-xs text-destructive">
                        Please add an Academic Year first before adding a semester.
                      </p>
                    ) : (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={selectedYearId}
                        onChange={(e) => setSelectedYearId(Number(e.target.value))}
                        required
                      >
                        {academicYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Semester Name *
                    </label>
                    <Input
                      placeholder="e.g. Semester 1 (Odd), Fall 2026"
                      value={semName}
                      onChange={(e) => setSemName(e.target.value)}
                      required
                    />
                  </div>

                  {semError && (
                    <div className="flex items-center gap-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{semError}</span>
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={submittingSem || !semName.trim() || !selectedYearId || academicYears.length === 0}
                    >
                      {submittingSem ? "Saving..." : "Save Semester"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 2-Column Grid: Academic Years & Semesters */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Academic Years Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarRange className="size-4 text-primary" />
                    Academic Years
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {academicYears.length} academic {academicYears.length === 1 ? "session" : "sessions"} configured
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading years...</div>
              ) : academicYears.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No academic years added yet. Click "Add Academic Year" above.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicYears.map((yr, index) => (
                        <TableRow key={yr.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground font-semibold">#{index + 1}</TableCell>
                          <TableCell className="font-medium">{yr.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteYear(yr.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Semesters Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    Semesters / Terms
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {semesters.length} {semesters.length === 1 ? "semester" : "semesters"} available for timetable runs
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading semesters...</div>
              ) : semesters.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No semesters added yet. Click "Add Semester / Term" above.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Semester Name</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semesters.map((sem, index) => {
                        const yr = academicYears.find((y) => y.id === sem.academic_year_id);
                        return (
                          <TableRow key={sem.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground font-semibold">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{sem.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {yr?.name || `Year #${sem.academic_year_id}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteSemester(sem.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
