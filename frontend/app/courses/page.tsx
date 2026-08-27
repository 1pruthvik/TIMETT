"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  Users,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

interface VTUCourse {
  code: string;
  name: string;
  is_vtu_standard: boolean;
  selected: boolean;
  studentCount: number;
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              VTU B.E. Degree Courses & Student Intake
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Choose the degree branches offered by your institution, enter the admitted student intake count for each program, and choose your active target course.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-bold">
              Total Students: {totalStudents}
            </div>
            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Branch</span>
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
              <h3 className="text-sm font-bold text-primary">Add Custom Department / Branch</h3>
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
                placeholder="Branch Name (e.g. Artificial Intelligence & Robotics)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="h-11 px-4 text-xs rounded-xl border border-border bg-background"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl"
              >
                Save Branch
              </button>
            </div>
          </form>
        )}

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search branches by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-xs rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/30 outline-none"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="text-xs text-muted-foreground font-medium self-start sm:self-center">
            Showing {filteredCourses.length} programs ({selectedCourses.length} active in college portfolio)
          </div>
        </div>

        {/* Courses Cards Grid (Spread across the entire page) */}
        {loading ? (
          <div className="flex items-center justify-center p-16 space-x-3 text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Loading pre-fetched VTU courses from registry...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c) => {
              const isActiveTarget = activeCourseCode === c.code;
              return (
                <div
                  key={c.code}
                  onClick={() => {
                    if (c.selected) setActiveCourseCode(c.code);
                  }}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                    isActiveTarget && c.selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-[0_0_24px_rgba(0,102,255,0.15)]"
                      : c.selected
                      ? "border-border bg-card/60 hover:border-primary/40 hover:bg-card/90"
                      : "opacity-40 bg-muted/20 border-dashed cursor-default"
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
                        className="h-5 w-5 rounded border-primary text-primary focus:ring-primary/40 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-primary">{c.code}</span>
                        <h3 className="text-sm font-bold text-foreground line-clamp-1">{c.name}</h3>
                      </div>
                    </div>

                    {isActiveTarget && c.selected && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-primary text-primary-foreground">
                        Target
                      </span>
                    )}
                  </div>

                  {c.selected && (
                    <div
                      className="pt-3 border-t border-border/50 flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-medium text-muted-foreground">Students Admitted:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={c.studentCount}
                          onChange={(e) => handleUpdateStudentCount(c.code, Number(e.target.value))}
                          className="w-20 h-9 px-3 text-xs font-mono font-bold rounded-lg border border-border bg-background text-right focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-[11px] text-muted-foreground">std</span>
                      </div>
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
