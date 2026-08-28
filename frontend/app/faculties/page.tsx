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
  CheckSquare2,
  Square,
  MinusSquare,
  Settings2,
  Sparkles,
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

const DEFAULT_DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "HOD / Head of Department",
  "Dean / Academic Director",
  "Lab Instructor / Technical Assistant",
  "Adjunct Faculty / Guest Lecturer",
  "Teaching Assistant",
];

export default function FacultiesPage() {
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [designations, setDesignations] = useState<string[]>(DEFAULT_DESIGNATIONS);
  const [availableSubjects, setAvailableSubjects] = useState<{ code: string; name: string }[]>([]);
  
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("Computer Science & Engineering");
  const [manualDesg, setManualDesg] = useState("Assistant Professor");
  const [selectedProficientSubjects, setSelectedProficientSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  // Custom Department & Designation Toggle States
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState("");
  const [isCustomDesg, setIsCustomDesg] = useState(false);
  const [customDesgInput, setCustomDesgInput] = useState("");

  // Department Management Modal / State
  const [showManageDepts, setShowManageDepts] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [newDeptInputInModal, setNewDeptInputInModal] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [parsingFaculty, setParsingFaculty] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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

      // 2. Load custom designations
      const savedDesgs = localStorage.getItem("vtu_college_designations");
      if (savedDesgs) {
        setDesignations(JSON.parse(savedDesgs));
      }

      // 3. Load faculties
      const saved = localStorage.getItem("vtu_faculty_list");
      if (saved) {
        setFacultyList(JSON.parse(saved));
      } else {
        setFacultyList([]);
        localStorage.setItem("vtu_faculty_list", JSON.stringify([]));
      }

      // 4. Extract active subjects from storage for mapping proficiencies
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
      setDepartments(updated);
      localStorage.setItem("vtu_college_departments", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveDesignationsToStorage = (updated: string[]) => {
    try {
      setDesignations(updated);
      localStorage.setItem("vtu_college_designations", JSON.stringify(updated));
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

  const handleDeleteDepartment = (deptNameToDelete: string) => {
    const updated = departments.filter((d) => d !== deptNameToDelete);
    saveDepartmentsToStorage(updated);
    if (manualDept === deptNameToDelete) {
      setManualDept(updated[0] || "General");
    }
    if (selectedDeptFilter === deptNameToDelete) {
      setSelectedDeptFilter("ALL");
    }
  };

  const handleAddCustomDepartmentInline = () => {
    if (!customDeptInput.trim()) return;
    const trimmed = customDeptInput.trim();
    if (!departments.includes(trimmed)) {
      const updated = [...departments, trimmed];
      saveDepartmentsToStorage(updated);
    }
    setManualDept(trimmed);
    setIsCustomDept(false);
    setCustomDeptInput("");
  };

  const handleAddCustomDesignationInline = () => {
    if (!customDesgInput.trim()) return;
    const trimmed = customDesgInput.trim();
    if (!designations.includes(trimmed)) {
      const updated = [...designations, trimmed];
      saveDesignationsToStorage(updated);
    }
    setManualDesg(trimmed);
    setIsCustomDesg(false);
    setCustomDesgInput("");
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

  const handleRemoveFaculty = (filteredIdx: number) => {
    const target = filteredFaculty[filteredIdx];
    const updated = facultyList.filter((f) => f !== target);
    saveFacultyToStorage(updated);
    setSelectedIndices((prev) =>
      prev.filter((i) => i !== filteredIdx).map((i) => (i > filteredIdx ? i - 1 : i))
    );
  };

  const handleToggleSelect = (filteredIdx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(filteredIdx)
        ? prev.filter((i) => i !== filteredIdx)
        : [...prev, filteredIdx]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.length === filteredFaculty.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(filteredFaculty.map((_, i) => i));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    const targets = new Set(selectedIndices.map((i) => filteredFaculty[i]));
    const updated = facultyList.filter((f) => !targets.has(f));
    saveFacultyToStorage(updated);
    setSelectedIndices([]);
  };

  const handleFacultyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFaculty(true);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/vtu/parse-faculty`, {
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

        if (extracted.length > 0) {
          // Auto-register any new departments found in file
          const newDepts = extracted.map((f) => f.department).filter(Boolean);
          const mergedDepts = Array.from(new Set([...departments, ...newDepts]));
          saveDepartmentsToStorage(mergedDepts);

          const updated = [...extracted, ...facultyList];
          saveFacultyToStorage(updated);
          setUploadSuccess(
            `Extracted ${extracted.length} faculty profiles with department mappings from ${file.name}`
          );
        } else {
          setUploadSuccess(`No faculty records found in ${file.name}.`);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUploadSuccess(
          `Upload failed: ${errorData.detail || "Unable to parse faculty document"}`
        );
      }
    } catch (err) {
      console.error(err);
      setUploadSuccess(`Network error: Unable to reach backend parser.`);
    } finally {
      setParsingFaculty(false);
      // Reset input value so same file can be re-uploaded if modified
      e.target.value = "";
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              College Faculty Directory & Department Allocations
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Total Active:</span>
              <span className="text-primary font-extrabold">{facultyList.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowManageDepts(true)}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Manage Departments ({departments.length})</span>
            </button>
          </div>
        </div>

        {/* Manage Departments Modal */}
        {showManageDepts && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 tt-animate-fade">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card/95 backdrop-blur-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-foreground">
                      Manage Academic Departments
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Add custom departments or delete unused departments
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageDepts(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Add Department Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Department Name (e.g. Data Science & AI)..."
                  value={newDeptInputInModal}
                  onChange={(e) => setNewDeptInputInModal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newDeptInputInModal.trim()) {
                        const trimmed = newDeptInputInModal.trim();
                        if (!departments.includes(trimmed)) {
                          saveDepartmentsToStorage([...departments, trimmed]);
                        }
                        setNewDeptInputInModal("");
                      }
                    }
                  }}
                  className="flex-1 h-8.5 px-3 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDeptInputInModal.trim()) {
                      const trimmed = newDeptInputInModal.trim();
                      if (!departments.includes(trimmed)) {
                        saveDepartmentsToStorage([...departments, trimmed]);
                      }
                      setNewDeptInputInModal("");
                    }
                  }}
                  className="h-8.5 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Department Search & Filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter departments..."
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  className="w-full h-8 pl-7 pr-3 text-xs rounded-lg border border-border bg-background/80 outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>

              {/* Departments List with Delete Action */}
              <div className="max-h-60 overflow-y-auto overscroll-y-contain space-y-1.5 pr-1">
                {departments
                  .filter((d) => d.toLowerCase().includes(deptSearchQuery.toLowerCase()))
                  .map((dept) => {
                    const count = facultyList.filter((f) => f.department === dept).length;
                    return (
                      <div
                        key={dept}
                        className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center justify-between hover:border-primary/40 transition group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-foreground truncate">{dept}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {count} {count === 1 ? "faculty assigned" : "faculties assigned"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDepartment(dept)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition cursor-pointer shrink-0"
                          title={`Delete ${dept}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    saveDepartmentsToStorage(DEFAULT_DEPARTMENTS);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  Reset to Default VTU Departments
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageDepts(false)}
                  className="h-8 px-4 bg-card border border-border text-foreground text-xs font-bold rounded-lg hover:bg-muted transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Faculty Ingestion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* File Upload Dropzone */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-primary/40 rounded-2xl p-4 sm:p-5 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative shadow-inner">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls,image/*"
                onChange={handleFacultyFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-xs">
                  {parsingFaculty ? (
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">
                  {parsingFaculty
                    ? "Parsing Faculty List & Proficiencies..."
                    : "Upload Faculty Roster (Excel / CSV / PDF / Image)"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Drop roster with Name, Department, and Proficient Subjects
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center space-x-2.5 tt-animate-fade">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Manual Faculty Entry */}
            <form
              onSubmit={handleAddManualFaculty}
              className="p-4 rounded-xl border border-border bg-card/60 space-y-3"
            >
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>Add Faculty Member</span>
              </h3>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Faculty Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Department with Custom Option & Manage */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Department
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsCustomDept(!isCustomDept)}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          {isCustomDept ? "Choose List" : "+ Custom"}
                        </button>
                        <span className="text-border">|</span>
                        <button
                          type="button"
                          onClick={() => setShowManageDepts(true)}
                          className="text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                    </div>

                    {isCustomDept ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Custom Department"
                          value={customDeptInput}
                          onChange={(e) => setCustomDeptInput(e.target.value)}
                          className="flex-1 h-8.5 px-2.5 text-xs rounded-lg border border-primary bg-background outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomDepartmentInline}
                          className="h-8.5 px-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer shrink-0"
                          title="Save and select department"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={manualDept}
                        onChange={(e) => {
                          if (e.target.value === "__CUSTOM__") {
                            setIsCustomDept(true);
                          } else {
                            setManualDept(e.target.value);
                          }
                        }}
                        className="w-full h-8.5 px-2.5 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Custom Department...</option>
                      </select>
                    )}
                  </div>

                  {/* Designation with Custom Option */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Designation
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomDesg(!isCustomDesg)}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {isCustomDesg ? "Choose List" : "+ Custom"}
                      </button>
                    </div>

                    {isCustomDesg ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Custom Designation"
                          value={customDesgInput}
                          onChange={(e) => setCustomDesgInput(e.target.value)}
                          className="flex-1 h-8.5 px-2.5 text-xs rounded-lg border border-primary bg-background outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomDesignationInline}
                          className="h-8.5 px-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer shrink-0"
                          title="Save and select designation"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={manualDesg}
                        onChange={(e) => {
                          if (e.target.value === "__CUSTOM__") {
                            setIsCustomDesg(true);
                          } else {
                            setManualDesg(e.target.value);
                          }
                        }}
                        className="w-full h-8.5 px-2.5 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        {designations.map((desg) => (
                          <option key={desg} value={desg}>
                            {desg}
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Custom Designation...</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Proficient Subjects Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Proficient Subjects (Click to assign)
                  </label>
                  {selectedProficientSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {selectedProficientSubjects.map((code) => (
                        <span
                          key={code}
                          className="px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-mono font-bold flex items-center space-x-1"
                        >
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => toggleSubjectProficiency(code)}
                            className="hover:text-destructive cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {availableSubjects.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto overscroll-y-contain p-1.5 rounded-lg border border-border bg-background space-y-1 scrollbar-thin">
                      {availableSubjects.map((subj) => {
                        const selected = selectedProficientSubjects.includes(subj.code);
                        return (
                          <div
                            key={subj.code}
                            onClick={() => toggleSubjectProficiency(subj.code)}
                            className={`p-1.5 rounded-md text-xs flex items-center justify-between cursor-pointer transition ${
                              selected
                                ? "bg-primary/10 border border-primary/30 text-primary font-bold"
                                : "hover:bg-muted/50 text-foreground"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono font-bold mr-1.5">{subj.code}</span>
                              <span className="text-[11px] opacity-90">{subj.name}</span>
                            </div>
                            {selected && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
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
                      className="w-full h-8.5 px-3 text-xs font-mono rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-8.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Faculty Member</span>
              </button>
            </form>
          </div>

          {/* Active Faculty List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search faculty or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-7 pr-2.5 text-xs rounded-lg border border-border bg-background/80 outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Select Action Bar */}
            {filteredFaculty.length > 0 && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-card/60 border border-border text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition cursor-pointer"
                  >
                    {filteredFaculty.length > 0 && selectedIndices.length === filteredFaculty.length ? (
                      <CheckSquare2 className="h-3.5 w-3.5 text-primary" />
                    ) : selectedIndices.length > 0 ? (
                      <MinusSquare className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>
                      {selectedIndices.length === filteredFaculty.length
                        ? "Deselect All"
                        : `Select All (${filteredFaculty.length})`}
                    </span>
                  </button>
                  {selectedIndices.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {selectedIndices.length} Selected
                    </span>
                  )}
                </div>

                {selectedIndices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIndices([])}
                      className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="h-7 px-2.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete Selected ({selectedIndices.length})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {filteredFaculty.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic rounded-xl border border-dashed border-border bg-muted/10">
                No faculty members found matching filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto overscroll-y-contain pr-1 scrollbar-thin">
                {filteredFaculty.map((f, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleSelect(idx)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer space-y-1.5 group ${
                        isSelected
                          ? "border-primary bg-primary/[0.06] shadow-2xs ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(idx);
                            }}
                            className="shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare2 className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground text-xs sm:text-sm truncate flex items-center space-x-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{f.name}</span>
                              </p>
                              {f.designation && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-semibold border border-border/50">
                                  {f.designation}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{f.department}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFaculty(idx);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
                          title="Delete Faculty"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Proficient Subjects Display */}
                      {f.proficientSubjects && f.proficientSubjects.length > 0 && (
                        <div className="pt-1.5 border-t border-border/40 flex flex-wrap items-center gap-1 pl-6">
                          <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-0.5">
                            <BookOpen className="h-2.5 w-2.5 text-primary" />
                            <span>Proficient:</span>
                          </span>
                          {f.proficientSubjects.map((code) => (
                            <span
                              key={code}
                              className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-mono font-bold"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
