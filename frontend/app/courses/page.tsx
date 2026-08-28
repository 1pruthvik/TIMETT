"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  RefreshCw,
  Plus,
  Search,
  Zap,
  FlaskConical,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";
import { cn } from "@/lib/utils";

interface VTUCourse {
  code: string;
  name: string;
  is_vtu_standard: boolean;
  selected: boolean;
  studentCount: number;
  cycle?: "physics" | "chemistry";
}

export default function CoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [isFirstYear, setIsFirstYear] = useState(true);

  useEffect(() => {
    try {
      const savedSetup = localStorage.getItem("vtu_academic_setup");
      if (savedSetup) {
        const parsed = JSON.parse(savedSetup);
        setIsFirstYear(parsed.selectedYear === "1" || !parsed.selectedYear);
      }
    } catch (e) {
      console.error(e);
    }
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
        const parsed: VTUCourse[] = JSON.parse(saved);
        // Ensure default cycle if missing
        const withCycles = parsed.map((c, idx) => ({
          ...c,
          cycle: c.cycle || (idx % 2 === 0 ? "physics" : "chemistry"),
        }));
        setCourses(withCycles);
        const selectedOne = withCycles.find((c) => c.selected);
        if (selectedOne) setActiveCourseCode(selectedOne.code);
        setLoading(false);
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/vtu/courses");
      if (res.ok) {
        const data = await res.json();
        const initial = data.map((c: any, idx: number) => ({
          ...c,
          selected: c.code === "CSE" || c.code === "ECE" || c.code === "ME" || c.code === "ISE",
          studentCount: c.code === "CSE" ? 180 : c.code === "ECE" ? 120 : 60,
          cycle: idx % 2 === 0 ? "physics" : "chemistry",
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

  const handleUpdateCycle = (code: string, cycle: "physics" | "chemistry") => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.code === code ? { ...c, cycle } : c));
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
      cycle: "physics",
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            VTU B.E. Degree Courses & Student Intake
          </h1>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Total Students:</span>
              <span className="text-primary font-extrabold">{totalStudents}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Branch</span>
            </button>
          </div>
        </div>

        {/* Custom Branch Creation Form */}
        {showAddCustom && (
          <form
            onSubmit={handleAddCustomCourse}
            className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 tt-animate-fade shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Add Department / Branch</h3>
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Branch Code (e.g. AI-ML)"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                className="h-8.5 px-3 text-xs font-mono rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <input
                type="text"
                placeholder="Branch Name (e.g. Artificial Intelligence & Machine Learning)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="h-8.5 px-3 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="h-8.5 px-4 text-xs font-bold bg-primary text-primary-foreground rounded-lg cursor-pointer"
              >
                Save Branch
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background/80 focus:ring-1 focus:ring-primary outline-none"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Courses Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center p-12 space-x-3 text-xs text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span>Loading pre-fetched VTU courses...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCourses.map((c) => {
              const currentCycle = c.cycle || "physics";

              return (
                <div
                  key={c.code}
                  onClick={() => {
                    handleToggleCourse(c.code);
                    if (!c.selected) {
                      setActiveCourseCode(c.code);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer select-none ${
                    c.selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                      : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={c.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleCourse(c.code);
                        }}
                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary/40 cursor-pointer pointer-events-none"
                      />
                      <div>
                        <span className="text-[11px] font-mono font-bold text-primary">{c.code}</span>
                        <h3 className="text-xs font-bold text-foreground line-clamp-1">{c.name}</h3>
                      </div>
                    </div>

                    {c.selected && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-primary text-primary-foreground">
                        Active
                      </span>
                    )}
                  </div>

                  {c.selected && (
                    <div className="space-y-2 pt-2.5 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                      {/* Students Admitted Intake */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">Students Admitted:</span>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={c.studentCount}
                            onChange={(e) => handleUpdateStudentCount(c.code, Number(e.target.value))}
                            className="w-16 h-7 px-2 text-xs font-mono font-bold rounded-md border border-border bg-background text-right focus:ring-1 focus:ring-primary outline-none"
                          />
                          <span className="text-[10px] text-muted-foreground">std</span>
                        </div>
                      </div>

                      {/* 1st Year Cycle Selection Option */}
                      {isFirstYear && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                          <span className="text-[11px] font-medium text-muted-foreground">Cycle:</span>
                          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-background/80 border border-border/60">
                            <button
                              type="button"
                              onClick={() => handleUpdateCycle(c.code, "physics")}
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center space-x-1",
                                currentCycle === "physics"
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Zap className="h-2.5 w-2.5" />
                              <span>Physics</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCycle(c.code, "chemistry")}
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer flex items-center space-x-1",
                                currentCycle === "chemistry"
                                  ? "bg-[#00A3FF] text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <FlaskConical className="h-2.5 w-2.5" />
                              <span>Chemistry</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Navigation */}
        <WizardFooter
          prevHref="/academic-year"
          nextHref="/documents"
          nextLabel="Next: Scheme & Subjects"
        />

      </div>
    </AppShell>
  );
}
