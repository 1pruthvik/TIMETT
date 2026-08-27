"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Plus,
  UserCheck,
  Search,
  Building2,
  BookOpen,
  Award,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

interface FacultyItem {
  id?: string;
  name: string;
  department: string;
  designation?: string;
  proficientSubjects?: string[];
  maxWeeklyHours?: number;
}

interface SubjectOption {
  code: string;
  name: string;
  department?: string;
}

const DEFAULT_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Information Science & Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence & Machine Learning",
  "Civil Engineering",
  "Electrical & Electronics Engineering",
  "Chemical Engineering",
  "Biomedical Engineering",
];

const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lab Instructor",
  "Visiting Faculty",
];

export default function FacultiesPage() {
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
  
  // Manual Entry Form State
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("Computer Science & Engineering");
  const [manualDesg, setManualDesg] = useState("Assistant Professor");
  const [selectedProficientSubjects, setSelectedProficientSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [parsingFaculty, setParsingFaculty] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Department creation modal / inline state
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  useEffect(() => {
    try {
      // 1. Load departments from storage or courses
      const savedDepts = localStorage.getItem("vtu_college_departments");
      if (savedDepts) {
        setDepartments(JSON.parse(savedDepts));
      } else {
        const savedCourses = localStorage.getItem("vtu_college_offered_courses");
        if (savedCourses) {
          const parsedCourses = JSON.parse(savedCourses);
          const courseNames = parsedCourses
            .filter((c: any) => c.selected && c.name)
            .map((c: any) => c.name);
          const merged = Array.from(new Set([...courseNames, ...DEFAULT_DEPARTMENTS]));
          setDepartments(merged);
          localStorage.setItem("vtu_college_departments", JSON.stringify(merged));
        } else {
          localStorage.setItem("vtu_college_departments", JSON.stringify(DEFAULT_DEPARTMENTS));
        }
      }

      // 2. Load available subjects from Sem 5 and Sem 6 maps
      const subjs: SubjectOption[] = [];
      ["vtu_course_subjects_map_sem5", "vtu_course_subjects_map_sem6"].forEach((key) => {
        const savedMap = localStorage.getItem(key);
        if (savedMap) {
          try {
            const parsed = JSON.parse(savedMap);
            Object.values(parsed).forEach((courseData: any) => {
              if (courseData?.theory) {
                courseData.theory.forEach((s: any) => {
                  if (s.code && !subjs.some((existing) => existing.code === s.code)) {
                    subjs.push({ code: s.code, name: s.name, department: s.department });
                  }
                });
              }
              if (courseData?.practical) {
                courseData.practical.forEach((s: any) => {
                  if (s.code && !subjs.some((existing) => existing.code === s.code)) {
                    subjs.push({ code: s.code, name: s.name, department: s.department });
                  }
                });
              }
            });
          } catch (e) {
            console.error(e);
          }
        }
      });
      setAvailableSubjects(subjs);

      // 3. Load faculties
      const saved = localStorage.getItem("vtu_faculty_list");
      if (saved) {
        setFacultyList(JSON.parse(saved));
      } else {
        const defaultFac: FacultyItem[] = [
          {
            name: "Dr. Pranav Bhat",
            department: "Computer Science & Engineering",
            designation: "Professor",
            proficientSubjects: ["1BCS601", "1BCS502", "1BCS603"],
          },
          {
            name: "Prof. Ujwal Amar",
            department: "Computer Science & Engineering",
            designation: "Associate Professor",
            proficientSubjects: ["1BCS603", "1BCS604", "1BCSL606"],
          },
          {
            name: "Prof. Pruthvik K",
            department: "Computer Science & Engineering",
            designation: "Assistant Professor",
            proficientSubjects: ["1BCSL606", "1BIS601", "1BCS501"],
          },
          {
            name: "Dr. Nivish Gowda",
            department: "Electronics & Communication Engineering",
            designation: "Professor",
            proficientSubjects: ["BEC601", "BEC602", "BECL606"],
          },
        ];
        setFacultyList(defaultFac);
        localStorage.setItem("vtu_faculty_list", JSON.stringify(defaultFac));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveDepartmentsToStorage = (updated: string[]) => {
    try {
      localStorage.setItem("vtu_college_departments", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveFacultyToStorage = (updated: FacultyItem[]) => {
    try {
      localStorage.setItem("vtu_faculty_list", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed) return;

    if (!departments.includes(trimmed)) {
      const updated = [...departments, trimmed];
      setDepartments(updated);
      saveDepartmentsToStorage(updated);
    }

    setManualDept(trimmed);
    setNewDeptName("");
    setShowAddDept(false);
  };

  const handleFacultyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFaculty(true);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/vtu/parse-faculty", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const extractedRaw: any[] = data.faculties || [];
        
        const extracted: FacultyItem[] = extractedRaw.map((f) => ({
          name: f.name,
          department: f.department || "Computer Science & Engineering",
          designation: f.designation || "Assistant Professor",
          proficientSubjects: f.proficient_subjects || f.proficientSubjects || [],
        }));

        // Auto-add any new departments extracted from file
        const extractedDepts = extracted.map((f) => f.department).filter(Boolean);
        const mergedDepts = Array.from(new Set([...departments, ...extractedDepts]));
        setDepartments(mergedDepts);
        saveDepartmentsToStorage(mergedDepts);

        setFacultyList((prev) => {
          const updated = [...prev, ...extracted];
          saveFacultyToStorage(updated);
          return updated;
        });
        setUploadSuccess(`Successfully parsed ${extracted.length} faculties with proficiency mappings!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsingFaculty(false);
    }
  };

  const handleAddManualFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newFac: FacultyItem = {
      name: manualName.trim(),
      department: manualDept.trim() || departments[0] || "Computer Science & Engineering",
      designation: manualDesg,
      proficientSubjects: selectedProficientSubjects,
    };

    setFacultyList((prev) => {
      const updated = [...prev, newFac];
      saveFacultyToStorage(updated);
      return updated;
    });

    setManualName("");
    setSelectedProficientSubjects([]);
    setCustomSubjectInput("");
  };

  const handleRemoveFaculty = (index: number) => {
    setFacultyList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveFacultyToStorage(updated);
      return updated;
    });
  };

  const toggleSubjectProficiency = (code: string) => {
    if (selectedProficientSubjects.includes(code)) {
      setSelectedProficientSubjects(selectedProficientSubjects.filter((c) => c !== code));
    } else {
      setSelectedProficientSubjects([...selectedProficientSubjects, code]);
    }
  };

  const handleAddCustomSubject = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSubjectInput.trim()) {
      e.preventDefault();
      const upper = customSubjectInput.trim().toUpperCase();
      if (!selectedProficientSubjects.includes(upper)) {
        setSelectedProficientSubjects([...selectedProficientSubjects, upper]);
      }
      setCustomSubjectInput("");
    }
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.proficientSubjects && f.proficientSubjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Available Department Faculties
          </h1>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddDept(!showAddDept)}
              className="h-10 px-4 rounded-xl bg-card border border-border text-foreground text-xs font-bold hover:bg-muted/80 transition cursor-pointer flex items-center space-x-2"
            >
              <Building2 className="h-4 w-4 text-primary" />
              <span>Add Department</span>
            </button>
            <div className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Total Faculty:</span>
              <span className="text-primary font-extrabold">{facultyList.length}</span>
            </div>
          </div>
        </div>

        {/* Add Department Form Modal / Card */}
        {showAddDept && (
          <form
            onSubmit={handleAddDepartment}
            className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 tt-animate-fade shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Add Institutional Department</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDept(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                placeholder="Department Name (e.g. Artificial Intelligence & Data Science)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="w-full sm:flex-1 h-11 px-4 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 h-11 text-xs font-bold bg-primary text-primary-foreground rounded-xl cursor-pointer hover:opacity-90 transition shrink-0"
              >
                Save Department
              </button>
            </div>
          </form>
        )}

        {uploadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center space-x-3 tt-animate-fade">
            <CheckCircle2 className="h-5 w-5" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Main 2-Column Expansive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Add Form */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* File Upload Parser Dropzone (Excel, CSV, PDF, DOCX, Image) */}
            <div className="border-2 border-dashed border-primary/40 rounded-3xl p-6 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative shadow-inner">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp,.tiff,image/*"
                onChange={handleFacultyFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-xs">
                  {parsingFaculty ? (
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {parsingFaculty
                      ? "Extracting Faculty & Proficiencies..."
                      : "Upload Faculty Roster (Excel / CSV / PDF / DOCX / Image)"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports department-wise lists & subject proficiencies
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Faculty Entry Card */}
            <form
              onSubmit={handleAddManualFaculty}
              className="p-6 rounded-2xl border border-border bg-card/60 space-y-4 shadow-sm"
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Manual Faculty Entry
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Faculty Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Designation
                    </label>
                    <select
                      value={manualDesg}
                      onChange={(e) => setManualDesg(e.target.value)}
                      className="w-full h-11 px-3 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-muted-foreground block">
                        Department
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddDept(true)}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>New</span>
                      </button>
                    </div>
                    <select
                      value={manualDept}
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          setShowAddDept(true);
                        } else {
                          setManualDept(e.target.value);
                        }
                      }}
                      className="w-full h-11 px-3 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Custom Dept...</option>
                    </select>
                  </div>
                </div>

                {/* Proficient Subjects Mapping Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1 flex items-center justify-between">
                    <span>Proficient Subjects / Specializations</span>
                    <span className="text-[10px] text-primary font-mono">{selectedProficientSubjects.length} selected</span>
                  </label>

                  {/* Selected Chips */}
                  {selectedProficientSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 rounded-xl bg-background border border-border/60">
                      {selectedProficientSubjects.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-mono font-bold text-[11px] flex items-center gap-1"
                        >
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => toggleSubjectProficiency(code)}
                            className="hover:text-destructive cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Available Subject Selector */}
                  {availableSubjects.length > 0 ? (
                    <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-border bg-background space-y-1">
                      {availableSubjects.map((subj) => {
                        const selected = selectedProficientSubjects.includes(subj.code);
                        return (
                          <div
                            key={subj.code}
                            onClick={() => toggleSubjectProficiency(subj.code)}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                              selected
                                ? "bg-primary/10 border border-primary/30 text-primary font-bold"
                                : "hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono font-bold mr-1.5">{subj.code}</span>
                              <span className="text-[11px] opacity-90">{subj.name}</span>
                            </div>
                            {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Type code (e.g. 1BCS601) & press Enter"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      onKeyDown={handleAddCustomSubject}
                      className="w-full h-10 px-3 text-xs font-mono rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Add Faculty Member</span>
              </button>
            </form>
          </div>

          {/* Right Column: Ingested Faculty Roster */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Faculty Roster ({facultyList.length})</span>
              </h3>

              {/* Search Filter */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search faculty or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-border bg-background/80 outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            {filteredFaculty.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground italic rounded-2xl border border-dashed border-border bg-muted/10">
                No faculty members found matching filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto pr-1">
                {filteredFaculty.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2 group hover:border-primary/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground text-sm truncate flex items-center space-x-1.5">
                            <UserCheck className="h-4 w-4 text-primary shrink-0" />
                            <span>{f.name}</span>
                          </p>
                          {f.designation && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold border border-border/50">
                              {f.designation}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{f.department}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFaculty(idx)}
                        className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Proficient Subjects Display */}
                    {f.proficientSubjects && f.proficientSubjects.length > 0 && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" />
                          <span>Proficient:</span>
                        </span>
                        {f.proficientSubjects.map((code) => (
                          <span
                            key={code}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono font-bold"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Navigation */}
        <WizardFooter
          prevHref="/documents"
          nextHref="/sections"
          nextLabel="Next: Sections & Durations"
        />

      </div>
    </AppShell>
  );
}
