"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  CheckCircle2,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

interface VTUCourse {
  code: string;
  name: string;
  is_vtu_standard: boolean;
  selected: boolean;
  studentCount: number;
}

export default function DepartmentsPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const saveCoursesToStorage = (updatedCourses: VTUCourse[]) => {
    try {
      localStorage.setItem("vtu_college_offered_courses", JSON.stringify(updatedCourses));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem("vtu_college_offered_courses");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCourses(parsed);
        const selectedOne = parsed.find((c: any) => c.selected);
        if (selectedOne) setActiveCourseCode(selectedOne.code);
        setLoading(false);
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/vtu/courses");
      if (res.ok) {
        const data = await res.json();
        const initial = data.map((c: any) => ({
          ...c,
          selected: c.code === "CSE" || c.code === "ECE" || c.code === "ME" || c.code === "ISE",
          studentCount: c.code === "CSE" ? 180 : c.code === "ECE" ? 120 : 60,
        }));
        setCourses(initial);
        saveCoursesToStorage(initial);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCourse = (code: string) => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.code === code ? { ...c, selected: !c.selected } : c));
      saveCoursesToStorage(updated);
      return updated;
    });
  };

  const handleUpdateStudentCount = (code: string, count: number) => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.code === code ? { ...c, studentCount: Math.max(0, count) } : c));
      saveCoursesToStorage(updated);
      return updated;
    });
  };

  const handleAddCustomCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode || !newCourseName) return;
    const newCourse: VTUCourse = {
      code: newCourseCode.toUpperCase().trim(),
      name: newCourseName.trim(),
      is_vtu_standard: false,
      selected: true,
      studentCount: 60,
    };
    setCourses((prev) => {
      const updated = [newCourse, ...prev];
      saveCoursesToStorage(updated);
      return updated;
    });
    setNewCourseCode("");
    setNewCourseName("");
    setShowAddCustom(false);
  };

  const selectedCourses = courses.filter((c) => c.selected);
  const totalStudents = selectedCourses.reduce((sum, c) => sum + c.studentCount, 0);

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 tt-animate-fade">
        <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card/85 backdrop-blur-xl shadow-2xl overflow-hidden my-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-muted/20">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Automated Timetable Setup Wizard
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Step 2 of 5 — VTU Institutional Flow
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                Total Admitted: {totalStudents} Students
              </span>
            </div>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full bg-muted/40 h-1">
            <div
              className="bg-gradient-to-r from-primary to-[#00A3FF] h-full transition-all duration-500 shadow-[0_0_12px_rgba(0,102,255,0.8)]"
              style={{ width: "40%" }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  2. Pre-Fetched VTU B.E. Degree Courses & Student Intake
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select courses offered by your college, enter student counts, and select the target course.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustom(!showAddCustom)}
                className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary text-xs font-bold flex items-center space-x-1.5 self-start cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Branch</span>
              </button>
            </div>

            {/* Custom Course Form */}
            {showAddCustom && (
              <form
                onSubmit={handleAddCustomCourse}
                className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 tt-animate-fade"
              >
                <p className="text-xs font-bold text-primary">Add Custom Department / Branch</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Branch Code (e.g. AI-ML)"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="h-10 px-3 text-xs rounded-lg border bg-background"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Branch Name (e.g. Robotics & AI)"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="h-10 px-3 text-xs rounded-lg border bg-background"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-lg"
                  >
                    Save Branch
                  </button>
                </div>
              </form>
            )}

            {/* Search Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search VTU courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-border bg-background/60 focus:ring-1 focus:ring-primary outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="flex items-center justify-center p-12 space-x-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span>Loading pre-fetched VTU courses...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[42vh] overflow-y-auto pr-1">
                {filteredCourses.map((c) => {
                  const isActiveTarget = activeCourseCode === c.code;
                  return (
                    <div
                      key={c.code}
                      onClick={() => {
                        if (c.selected) setActiveCourseCode(c.code);
                      }}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between space-x-3 cursor-pointer ${
                        isActiveTarget && c.selected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-[0_0_16px_rgba(0,102,255,0.2)]"
                          : c.selected
                          ? "border-border bg-card/90 hover:border-primary/40 shadow-xs"
                          : "opacity-40 bg-muted/20 border-dashed cursor-default"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={c.selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleCourse(c.code);
                          }}
                          className="h-4 w-4 rounded border-primary text-primary focus:ring-primary/40 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                            {isActiveTarget && c.selected && (
                              <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-primary text-primary-foreground shadow-xs">
                                Target
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-primary font-bold">{c.code}</span>
                        </div>
                      </div>

                      {c.selected && (
                        <div
                          className="flex items-center space-x-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-medium text-muted-foreground">Students:</span>
                          <input
                            type="number"
                            value={c.studentCount}
                            onChange={(e) => handleUpdateStudentCount(c.code, Number(e.target.value))}
                            className="w-16 h-8 px-2 text-xs font-mono font-bold rounded-lg border border-border bg-background text-right focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <Link href="/academic-terms">
              <button
                type="button"
                className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background/60 hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous: Academic Terms</span>
              </button>
            </Link>

            <Link href="/documents">
              <button
                type="button"
                className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold rounded-xl tt-gradient-btn text-white shadow-lg hover:scale-105 transition cursor-pointer"
              >
                <span>Next: Document Ingestion</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
