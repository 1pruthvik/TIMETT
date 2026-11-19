"use client";

import { useEffect, useState, useMemo } from "react";
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

import { getItemUserScoped, setItemUserScoped } from "@/lib/user-storage";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://tempus-backend-g36k.onrender.com").replace(/\/$/, "");

interface VTUCourse {
  code: string;
  name: string;
  is_vtu_standard: boolean;
  selected: boolean;
  studentCount: number;
  sectionsCount?: number;
  cycle?: "physics" | "chemistry";
}

export interface CalculatedSection {
  letter: string;
  branchCode: string;
  branchName: string;
  label: string;
  studentCount: number;
}

const getSectionLetter = (index: number): string => {
  let result = "";
  let idx = index;
  while (true) {
    result = String.fromCharCode(65 + (idx % 26)) + result;
    idx = Math.floor(idx / 26) - 1;
    if (idx < 0) break;
  }
  return result;
};

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
      const savedSetup = getItemUserScoped<any>("vtu_academic_setup");
      if (savedSetup) {
        setIsFirstYear(savedSetup.selectedYear === "1" || !savedSetup.selectedYear);
      }
    } catch (e) {
      console.error(e);
    }
    fetchCourses();
  }, []);

  const saveCoursesToStorage = (updatedCourses: VTUCourse[]) => {
    try {
      setItemUserScoped("vtu_college_offered_courses", updatedCourses);
    } catch (e) {
      console.error(e);
    }
  };

  const syncSectionsWithBackend = async (updatedCourses: VTUCourse[]) => {
    try {
      const payload = {
        branches: updatedCourses.map((c) => ({
          code: c.code,
          name: c.name,
          selected: c.selected,
          student_count: c.studentCount,
          sections_count: c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1),
          cycle: c.cycle,
        })),
        save_to_db: true,
      };
      await fetch(`${API_BASE}/vtu/calculate-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Backend sync error:", e);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const saved = getItemUserScoped<VTUCourse[]>("vtu_college_offered_courses");
      if (saved && Array.isArray(saved) && saved.length > 0) {
        const withCycles = saved.map((c, idx) => ({
          ...c,
          sectionsCount: c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1),
          cycle: c.cycle || (idx % 2 === 0 ? "physics" : "chemistry"),
        }));
        setCourses(withCycles);
        const selectedOne = withCycles.find((c) => c.selected);
        if (selectedOne) setActiveCourseCode(selectedOne.code);
        syncSectionsWithBackend(withCycles);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/vtu/courses`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data)) {
          const initial = data.map((c: any, idx: number) => ({
            ...c,
            selected: true,
            studentCount: c.code === "CSE" ? 183 : c.code === "CSE-AIML" ? 125 : c.code === "ECE" ? 61 : 60,
            sectionsCount: c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1,
            cycle: idx % 2 === 0 ? "physics" : "chemistry",
          }));
          setCourses(initial);
          saveCoursesToStorage(initial);
          syncSectionsWithBackend(initial);
        }
      } else {
        const defaultCourses: VTUCourse[] = [
          { code: "CSE", name: "Computer Science & Engineering", is_vtu_standard: true, selected: true, studentCount: 183, sectionsCount: 3, cycle: "physics" },
          { code: "CSE-AIML", name: "CSE (Artificial Intelligence & Machine Learning)", is_vtu_standard: true, selected: true, studentCount: 125, sectionsCount: 2, cycle: "chemistry" },
          { code: "ECE", name: "Electronics & Communication Engineering", is_vtu_standard: true, selected: true, studentCount: 61, sectionsCount: 1, cycle: "chemistry" },
          { code: "ISE", name: "Information Science & Engineering", is_vtu_standard: true, selected: false, studentCount: 60, sectionsCount: 1, cycle: "physics" },
          { code: "ME", name: "Mechanical Engineering", is_vtu_standard: true, selected: false, studentCount: 60, sectionsCount: 1, cycle: "chemistry" },
          { code: "EEE", name: "Electrical & Electronics Engineering", is_vtu_standard: true, selected: false, studentCount: 60, sectionsCount: 1, cycle: "physics" },
          { code: "CIV", name: "Civil Engineering", is_vtu_standard: true, selected: false, studentCount: 60, sectionsCount: 1, cycle: "chemistry" },
          { code: "AIML", name: "AI & Machine Learning", is_vtu_standard: true, selected: false, studentCount: 60, sectionsCount: 1, cycle: "physics" },
          { code: "DS", name: "Data Science", is_vtu_standard: true, selected: false, studentCount: 60, sectionsCount: 1, cycle: "chemistry" },
        ];
        setCourses(defaultCourses);
        saveCoursesToStorage(defaultCourses);
        syncSectionsWithBackend(defaultCourses);
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
      syncSectionsWithBackend(updated);
      return updated;
    });
  };

  const handleUpdateStudentCount = (code: string, count: number) => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.code === code ? { ...c, studentCount: Math.max(0, count) } : c));
      saveCoursesToStorage(updated);
      syncSectionsWithBackend(updated);
      return updated;
    });
  };

  const handleUpdateSectionsCount = (code: string, count: number) => {
    const safeCount = Math.max(1, Math.min(26, count));
    setCourses((prev) => {
      const updated = prev.map((c) => (c.code === code ? { ...c, sectionsCount: safeCount } : c));
      saveCoursesToStorage(updated);
      syncSectionsWithBackend(updated);
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
      sectionsCount: 1,
      cycle: "physics",
    };
    setCourses((prev) => {
      const updated = [newCourse, ...prev];
      saveCoursesToStorage(updated);
      syncSectionsWithBackend(updated);
      return updated;
    });
    setNewCourseCode("");
    setNewCourseName("");
    setShowAddCustom(false);
  };

  const selectedCourses = courses.filter((c) => c.selected);
  const totalStudents = selectedCourses.reduce((sum, c) => sum + c.studentCount, 0);

  // Compute Continuous Mixed Sections across branches based on entered sectionsCount
  const continuousSections = useMemo(() => {
    const selected = courses.filter((c) => c.selected);
    const result: CalculatedSection[] = [];
    const branchSectionsMap: Record<string, CalculatedSection[]> = {};
    let currIdx = 0;

    selected.forEach((c, bIdx) => {
      const intake = Math.max(0, c.studentCount);
      const numSec = Math.max(1, c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1));

      const secsForBranch: CalculatedSection[] = [];
      for (let sIdx = 0; sIdx < numSec; sIdx++) {
        const letter = getSectionLetter(currIdx);
        currIdx++;
        const label = c.code ? `${letter} (${c.code})` : letter;
        const base = intake > 0 ? Math.floor(intake / numSec) : 60;
        const extra = intake > 0 ? intake % numSec : 0;
        const secStdCount = base + (sIdx < extra ? 1 : 0);

        const secObj: CalculatedSection = {
          letter,
          branchCode: c.code,
          branchName: c.name,
          label,
          studentCount: secStdCount,
        };
        secsForBranch.push(secObj);
        result.push(secObj);
      }
      branchSectionsMap[c.code] = secsForBranch;
    });

    return { allSections: result, branchSectionsMap };
  }, [courses]);

  useEffect(() => {
    if (continuousSections.allSections.length > 0) {
      setItemUserScoped("vtu_calculated_sections", continuousSections.allSections);
      try {
        localStorage.setItem("vtu_calculated_sections", JSON.stringify(continuousSections.allSections));
      } catch {}
    }
  }, [continuousSections]);

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              VTU B.E. Degree Courses & Student Intake
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure student intake & number of sections under each branch. Continuous sections (A, B, C...) are automatically assigned across branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Total Students */}
            <div className="h-10 px-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Total Students:</span>
              <span className="text-primary font-extrabold">{totalStudents}</span>
            </div>

            {/* Total Sections Count with Continuous Span */}
            <div className="h-10 px-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Total Sections:</span>
              <span className="text-primary font-extrabold">{continuousSections.allSections.length}</span>
              {continuousSections.allSections.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Sec {continuousSections.allSections[0].letter} – {continuousSections.allSections[continuousSections.allSections.length - 1].letter})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Branch</span>
            </button>
          </div>
        </div>

        {/* Custom Branch Creation Form */}
        {showAddCustom && (
          <form
            onSubmit={handleAddCustomCourse}
            className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 tt-animate-fade shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">Add Department / Branch</h3>
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Branch Code (e.g. AI-ML)"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                className="h-11 px-4 text-xs font-mono rounded-xl border border-border bg-background"
                required
              />
              <input
                type="text"
                placeholder="Branch Name (e.g. Artificial Intelligence & Machine Learning)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="h-11 px-4 text-xs rounded-xl border border-border bg-background"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl cursor-pointer"
              >
                Save Branch
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/30 outline-none"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Courses Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center p-16 space-x-3 text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Loading pre-fetched VTU courses...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 cursor-pointer select-none ${
                    c.selected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-[0_0_24px_rgba(0,102,255,0.18)]"
                      : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={c.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleCourse(c.code);
                        }}
                        className="h-5 w-5 rounded border-primary text-primary focus:ring-primary/40 cursor-pointer pointer-events-none"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-primary">{c.code}</span>
                        <h3 className="text-sm font-bold text-foreground line-clamp-1">{c.name}</h3>
                      </div>
                    </div>

                    {c.selected && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-primary text-primary-foreground">
                        Active
                      </span>
                    )}
                  </div>

                  {c.selected && (
                    <div className="space-y-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                      {/* Students Admitted Intake & Class Capacity */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Students Admitted:
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="number"
                              min="0"
                              value={c.studentCount === 0 ? "" : c.studentCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateStudentCount(c.code, val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0));
                              }}
                              className="w-full h-8 px-2 text-xs font-mono font-bold rounded-lg border border-border bg-background text-right focus:ring-1 focus:ring-primary outline-none"
                            />
                            <span className="text-[11px] text-muted-foreground font-mono">std</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Number of Sections:
                          </span>
                          <div className="flex items-center h-8 space-x-1 bg-background border border-border rounded-lg px-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateSectionsCount(c.code, (c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1)) - 1)}
                              disabled={(c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1)) <= 1}
                              className="h-6 w-6 rounded bg-muted hover:bg-muted-foreground/20 font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="26"
                              value={c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1)}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                handleUpdateSectionsCount(c.code, val);
                              }}
                              className="w-8 text-center font-mono font-bold text-xs text-primary bg-transparent outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateSectionsCount(c.code, (c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1)) + 1)}
                              disabled={(c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1)) >= 20}
                              className="h-6 w-6 rounded bg-muted hover:bg-muted-foreground/20 font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Continuous Sections Preview */}
                      <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-medium text-muted-foreground block">
                            Continuous Sections:
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ~{Math.round(c.studentCount / Math.max(1, (c.sectionsCount ?? (c.code === "CSE" ? 3 : c.code === "CSE-AIML" ? 2 : 1))))} students / section
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                            Sec {(continuousSections.branchSectionsMap[c.code] || []).map((s: CalculatedSection) => s.letter).join(", ") || "-"}
                          </span>
                        </div>
                      </div>

                      {/* 1st Year Cycle Selection Option */}
                      {isFirstYear && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-xs font-medium text-muted-foreground">Cycle:</span>
                          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-background/80 border border-border/60">
                            <button
                              type="button"
                              onClick={() => handleUpdateCycle(c.code, "physics")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1",
                                currentCycle === "physics"
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Zap className="h-3 w-3" />
                              <span>Physics</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCycle(c.code, "chemistry")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1",
                                currentCycle === "chemistry"
                                  ? "bg-[#00A3FF] text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <FlaskConical className="h-3 w-3" />
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

        {/* Footer Navigation with Scrolling Overscroll Transition */}
        <WizardFooter
          prevHref="/academic-year"
          nextHref="/documents"
          nextLabel="Next: Scheme & Subjects"
        />

      </div>
    </AppShell>
  );
}
