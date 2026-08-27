"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  CheckCircle2,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

interface Subject {
  code: string;
  name: string;
  category: "theory" | "practical";
  weekly_hours: number;
}

interface VTUCourse {
  code: string;
  name: string;
  selected: boolean;
  studentCount: number;
}

export default function SubjectsPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");
  const [courseSubjectsMap, setCourseSubjectsMap] = useState<
    Record<string, { theory: Subject[]; practical: Subject[] }>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [parsingScheme, setParsingScheme] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Manual Add Subject
  const [showAddSubj, setShowAddSubj] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCategory, setNewSubjCategory] = useState<"theory" | "practical">("theory");
  const [newSubjHours, setNewSubjHours] = useState(4);

  useEffect(() => {
    try {
      const savedCourses = localStorage.getItem("vtu_college_offered_courses");
      if (savedCourses) {
        const parsed = JSON.parse(savedCourses);
        setCourses(parsed);
        const sel = parsed.find((c: any) => c.selected);
        if (sel) setActiveCourseCode(sel.code);
      } else {
        setCourses([
          { code: "CSE", name: "Computer Science & Engineering", selected: true, studentCount: 180 },
          { code: "ECE", name: "Electronics & Communication Engineering", selected: true, studentCount: 120 },
        ]);
      }

      const savedSubjects = localStorage.getItem("vtu_course_subjects_map");
      if (savedSubjects) {
        setCourseSubjectsMap(JSON.parse(savedSubjects));
      } else {
        const initialMap = {
          CSE: {
            theory: [
              { code: "1BMATCS301", name: "Mathematics for Computer Science", category: "theory", weekly_hours: 4 },
              { code: "1BCS302", name: "Digital Design & Computer Organization", category: "theory", weekly_hours: 4 },
              { code: "1BCS303", name: "Operating Systems Architecture", category: "theory", weekly_hours: 4 },
              { code: "1BCS304", name: "Data Structures and Applications", category: "theory", weekly_hours: 4 },
            ],
            practical: [
              { code: "1BCSL305", name: "Data Structures Laboratory", category: "practical", weekly_hours: 3 },
              { code: "1BCSL306", name: "Object Oriented Java Lab", category: "practical", weekly_hours: 3 },
            ],
          },
        };
        setCourseSubjectsMap(initialMap as any);
        localStorage.setItem("vtu_course_subjects_map", JSON.stringify(initialMap));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSubjectsToStorage = (updatedMap: any) => {
    try {
      localStorage.setItem("vtu_course_subjects_map", JSON.stringify(updatedMap));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSchemeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingScheme(true);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/vtu/parse-scheme", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const tSubjs = data.theory_subjects || [];
        const pSubjs = data.practical_subjects || [];

        setCourseSubjectsMap((prev) => {
          const updated = {
            ...prev,
            [activeCourseCode]: { theory: tSubjs, practical: pSubjs },
          };
          saveSubjectsToStorage(updated);
          return updated;
        });
        setUploadSuccess(`Extracted ${tSubjs.length} Theory & ${pSubjs.length} Lab subjects for ${activeCourseCode}!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsingScheme(false);
    }
  };

  const handleAddManualSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjCode || !newSubjName) return;

    const newSubj: Subject = {
      code: newSubjCode.toUpperCase().trim(),
      name: newSubjName.trim(),
      category: newSubjCategory,
      weekly_hours: Number(newSubjHours) || 4,
    };

    setCourseSubjectsMap((prev) => {
      const current = prev[activeCourseCode] || { theory: [], practical: [] };
      const updated = {
        ...prev,
        [activeCourseCode]: {
          theory:
            newSubjCategory === "theory"
              ? [...current.theory, newSubj]
              : current.theory,
          practical:
            newSubjCategory === "practical"
              ? [...current.practical, newSubj]
              : current.practical,
        },
      };
      saveSubjectsToStorage(updated);
      return updated;
    });

    setNewSubjCode("");
    setNewSubjName("");
    setShowAddSubj(false);
  };

  const handleRemoveSubject = (category: "theory" | "practical", index: number) => {
    setCourseSubjectsMap((prev) => {
      const current = prev[activeCourseCode] || { theory: [], practical: [] };
      const updated = {
        ...prev,
        [activeCourseCode]: {
          theory:
            category === "theory"
              ? current.theory.filter((_, i) => i !== index)
              : current.theory,
          practical:
            category === "practical"
              ? current.practical.filter((_, i) => i !== index)
              : current.practical,
        },
      };
      saveSubjectsToStorage(updated);
      return updated;
    });
  };

  const selectedCourses = courses.filter((c) => c.selected);
  const activeData = courseSubjectsMap[activeCourseCode] || { theory: [], practical: [] };

  const filteredTheory = activeData.theory.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPractical = activeData.practical.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
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
                  Subjects & Practical Lab Curriculum Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                {activeData.theory.length + activeData.practical.length} Subjects Active
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  VTU Scheme Subjects & Lab Allocation
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage theory and practical laboratory subjects for <span className="text-primary font-bold">{activeCourseCode}</span>.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubj(!showAddSubj)}
                  className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {/* Course Tabs */}
            <div className="flex flex-wrap gap-2 pb-1 border-b border-border/40">
              {selectedCourses.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setActiveCourseCode(c.code)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                    activeCourseCode === c.code
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{c.code}</span>
                  <span className="text-[10px] opacity-75 font-mono">({c.studentCount} std)</span>
                </button>
              ))}
            </div>

            {/* Manual Subject Form */}
            {showAddSubj && (
              <form
                onSubmit={handleAddManualSubject}
                className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 tt-animate-fade"
              >
                <p className="text-xs font-bold text-primary">Add Subject for {activeCourseCode}</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Code (e.g. 1BCS304)"
                    value={newSubjCode}
                    onChange={(e) => setNewSubjCode(e.target.value)}
                    className="h-10 px-3 text-xs rounded-lg border bg-background"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    className="h-10 px-3 text-xs rounded-lg border bg-background sm:col-span-2"
                    required
                  />
                  <select
                    value={newSubjCategory}
                    onChange={(e) => {
                      const cat = e.target.value as "theory" | "practical";
                      setNewSubjCategory(cat);
                      setNewSubjHours(cat === "practical" ? 3 : 4);
                    }}
                    className="h-10 px-3 text-xs rounded-lg border bg-background"
                  >
                    <option value="theory">Theory (4 hrs/wk)</option>
                    <option value="practical">Practical / Lab (3 hrs/wk)</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSubj(false)}
                    className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-lg"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            )}

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search subject code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-border bg-background/60 focus:ring-1 focus:ring-primary outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Segregated Subjects Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theory Subjects */}
              <div className="rounded-xl border border-border bg-card/90 p-4 space-y-3">
                <h4 className="text-xs font-bold text-primary tracking-wider uppercase flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Theory Subjects ({filteredTheory.length})</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{activeCourseCode}</span>
                </h4>
                {filteredTheory.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    No theory subjects found.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredTheory.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-primary">{s.code}</span>
                          <p className="font-medium text-foreground truncate">{s.name}</p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold">
                            {s.weekly_hours} hrs/wk
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject("theory", idx)}
                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Practical / Lab Subjects */}
              <div className="rounded-xl border border-border bg-card/90 p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#00A3FF] tracking-wider uppercase flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Layers className="h-4 w-4" />
                    <span>Practical & Lab Subjects ({filteredPractical.length})</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{activeCourseCode}</span>
                </h4>
                {filteredPractical.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    No practical subjects found.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredPractical.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-[#00A3FF]">{s.code}</span>
                          <p className="font-medium text-foreground truncate">{s.name}</p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-semibold">
                            {s.weekly_hours} hrs/wk
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject("practical", idx)}
                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <Link href="/documents">
              <button
                type="button"
                className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background/60 hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Document Ingestion</span>
              </button>
            </Link>

            <Link href="/faculty">
              <button
                type="button"
                className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold rounded-xl tt-gradient-btn text-white shadow-lg hover:scale-105 transition cursor-pointer"
              >
                <span>Faculty Setup</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  );
}