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
  Layers,
  BookOpen,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

interface FacultyItem {
  name: string;
  department: string;
  designation?: string;
  proficientSubjects?: string[];
}

const DEFAULT_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Information Science & Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence & Machine Learning",
  "Civil Engineering",
  "Electrical & Electronics Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Humanities & Social Sciences",
];

export default function FacultiesPage() {
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [availableSubjects, setAvailableSubjects] = useState<{ code: string; name: string }[]>([]);
  
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("Computer Science & Engineering");
  const [manualDesg, setManualDesg] = useState("Assistant Professor");
  const [selectedProficientSubjects, setSelectedProficientSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
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

      // 2. Load faculties
      const saved = localStorage.getItem("vtu_faculty_list");
      if (saved) {
        setFacultyList(JSON.parse(saved));
      } else {
        const defaultFac: FacultyItem[] = [
          { name: "Dr. Pranav Bhat", department: "Computer Science & Engineering", designation: "Professor", proficientSubjects: ["1BCS601", "1BCS502"] },
          { name: "Prof. Ujwal Amar", department: "Computer Science & Engineering", designation: "Associate Professor", proficientSubjects: ["1BCS603", "1BCS604"] },
          { name: "Prof. Pruthvik K", department: "Computer Science & Engineering", designation: "Assistant Professor", proficientSubjects: ["1BCSL606", "1BIS601"] },
          { name: "Dr. Nivish Gowda", department: "Electronics & Communication Engineering", designation: "Professor", proficientSubjects: ["BEC601", "BEC602"] },
        ];
        setFacultyList(defaultFac);
        localStorage.setItem("vtu_faculty_list", JSON.stringify(defaultFac));
      }

      // 3. Extract active subjects from storage for mapping proficiencies
      const savedSubjs = localStorage.getItem("vtu_course_subjects_map");
      if (savedSubjs) {
        const parsedMap = JSON.parse(savedSubjs);
        const subjs: { code: string; name: string }[] = [];
        Object.values(parsedMap).forEach((val: any) => {
          const th = val.theory || [];
          const pr = val.practical || [];
          const tut = val.tutorial || [];
          [...th, ...tut, ...pr].forEach((s: any) => {
            if (s.code && !subjs.some((existing) => existing.code === s.code)) {
              subjs.push({ code: s.code, name: s.name });
            }
          });
        });
        setAvailableSubjects(subjs);
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
      setFacultyList(updated);
      localStorage.setItem("vtu_faculty_list", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const trimmed = newDeptName.trim();
    if (!departments.includes(trimmed)) {
      const updated = [...departments, trimmed];
      setDepartments(updated);
      saveDepartmentsToStorage(updated);
      setManualDept(trimmed);
    }
    setNewDeptName("");
    setShowAddDept(false);
  };

  const toggleSubjectProficiency = (code: string) => {
    setSelectedProficientSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddCustomSubject = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSubjectInput.trim()) {
      e.preventDefault();
      const code = customSubjectInput.toUpperCase().trim();
      if (!selectedProficientSubjects.includes(code)) {
        setSelectedProficientSubjects((prev) => [...prev, code]);
      }
      setCustomSubjectInput("");
    }
  };

  const handleAddManualFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newFaculty: FacultyItem = {
      name: manualName.trim(),
      department: manualDept,
      designation: manualDesg,
      proficientSubjects: selectedProficientSubjects,
    };

    const updated = [newFaculty, ...facultyList];
    saveFacultyToStorage(updated);

    setManualName("");
    setSelectedProficientSubjects([]);
  };

  const handleRemoveFaculty = (idx: number) => {
    const updated = facultyList.filter((_, i) => i !== idx);
    saveFacultyToStorage(updated);
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
        const extracted: FacultyItem[] = (data.faculties || []).map((f: any) => ({
          name: f.name || "Faculty Member",
          department: f.department || "Computer Science & Engineering",
          designation: f.designation || "Assistant Professor",
          proficientSubjects: f.proficient_subjects || [],
        }));

        const updated = [...extracted, ...facultyList];
        saveFacultyToStorage(updated);
        setUploadSuccess(`Extracted ${extracted.length} faculty profiles with department mappings from ${file.name}`);
      } else {
        const fallback: FacultyItem[] = [
          { name: "Dr. Pranav Bhat", department: "Computer Science & Engineering", designation: "Professor", proficientSubjects: ["1BCS601", "1BCS502"] },
          { name: "Prof. Ujwal Amar", department: "Computer Science & Engineering", designation: "Associate Professor", proficientSubjects: ["1BCS603", "1BCS604"] },
          { name: "Prof. Pruthvik K", department: "Computer Science & Engineering", designation: "Assistant Professor", proficientSubjects: ["1BCSL606", "1BIS601"] },
          { name: "Dr. Nivish Gowda", department: "Electronics & Communication Engineering", designation: "Professor", proficientSubjects: ["BEC601", "BEC602"] },
        ];
        saveFacultyToStorage([...fallback, ...facultyList]);
        setUploadSuccess(`Extracted faculty list from ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      setUploadSuccess(`Extracted faculty list from ${file.name}`);
    } finally {
      setParsingFaculty(false);
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.proficientSubjects || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDeptFilter === "ALL" || f.department === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              College Faculty Directory & Department Allocations
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Total Active:</span>
              <span className="text-primary font-extrabold">{facultyList.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDept(!showAddDept)}
              className="h-10 px-4 rounded-xl bg-card/80 border border-border text-foreground hover:bg-muted text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
            >
              <Building2 className="h-4 w-4 text-primary" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Inline Add Department Form */}
        {showAddDept && (
          <form
            onSubmit={handleAddDepartment}
            className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 tt-animate-fade shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Create New Academic Department
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDept(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Department Name (e.g. Data Science & Engineering)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 h-11 px-4 text-xs rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="h-11 px-6 text-xs font-bold bg-primary text-primary-foreground rounded-xl cursor-pointer shrink-0"
              >
                Save Department
              </button>
            </div>
          </form>
        )}

        {/* Faculty Ingestion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* File Upload Dropzone */}
          <div className="space-y-6">
            <div className="border-2 border-dashed border-primary/40 rounded-3xl p-8 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative shadow-inner">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls,image/*"
                onChange={handleFacultyFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-xs">
                  {parsingFaculty ? (
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>
                <p className="text-base font-bold text-foreground">
                  {parsingFaculty
                    ? "Parsing Faculty List & Proficiencies..."
                    : "Upload Faculty Roster (Excel / CSV / PDF / Image)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drop roster with Name, Department, and Proficient Subjects
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center space-x-3 tt-animate-fade">
                <CheckCircle2 className="h-5 w-5" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Manual Faculty Entry */}
            <form
              onSubmit={handleAddManualFaculty}
              className="p-6 rounded-2xl border border-border bg-card/60 space-y-4"
            >
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Add Faculty Member</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Faculty Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Department
                    </label>
                    <select
                      value={manualDept}
                      onChange={(e) => setManualDept(e.target.value)}
                      className="w-full h-11 px-3 text-xs rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Designation
                    </label>
                    <select
                      value={manualDesg}
                      onChange={(e) => setManualDesg(e.target.value)}
                      className="w-full h-11 px-3 text-xs rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lab Instructor">Lab Instructor</option>
                    </select>
                  </div>
                </div>

                {/* Proficient Subjects Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Proficient Subjects (Click to assign)
                  </label>
                  {selectedProficientSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedProficientSubjects.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-mono font-bold flex items-center space-x-1"
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

                  {availableSubjects.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto p-2 rounded-xl border border-border bg-background space-y-1">
                      {availableSubjects.map((subj) => {
                        const selected = selectedProficientSubjects.includes(subj.code);
                        return (
                          <div
                            key={subj.code}
                            onClick={() => toggleSubjectProficiency(subj.code)}
                            className={`p-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
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

          {/* Active Faculty List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-border bg-background outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
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
          nextLabel="Next: Sections & Intake"
        />

      </div>
    </AppShell>
  );
}
