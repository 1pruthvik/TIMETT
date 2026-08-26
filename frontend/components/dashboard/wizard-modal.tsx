"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface VTUCourse {
  code: string;
  name: string;
  is_vtu_standard: boolean;
  selected: boolean;
  studentCount: number;
}

interface Subject {
  code: string;
  name: string;
  category: "theory" | "practical";
  weekly_hours: number;
}

interface FacultyItem {
  name: string;
  department: string;
}

export function WizardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [institutionType, setInstitutionType] = useState<"vtu" | "university">("vtu");
  const [selectedYear, setSelectedYear] = useState("2"); // 1st, 2nd, 3rd, 4th
  const [selectedSemType, setSelectedSemType] = useState<"odd" | "even">("odd");

  // Courses list & Active Target Course for Timetable Generation
  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Per-Course Mapped Parsed Scheme Subjects { "CSE": { theory: [...], practical: [...] } }
  const [courseSubjectsMap, setCourseSubjectsMap] = useState<Record<string, { theory: Subject[]; practical: Subject[] }>>({});
  const [parsingScheme, setParsingScheme] = useState(false);

  // Faculties side-by-side
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [manualFacultyName, setManualFacultyName] = useState("");
  const [manualFacultyDept, setManualFacultyDept] = useState("CSE");
  const [parsingFaculty, setParsingFaculty] = useState(false);

  // Section & Batch Calculation
  const [roomCapacity, setRoomCapacity] = useState(60);
  const [coincidedLabGroup, setCoincidedLabGroup] = useState("CS Central Lab");
  const [labCapacity, setLabCapacity] = useState(30);
  const [theoryMin, setTheoryMin] = useState(50);
  const [labMin, setLabMin] = useState(100);

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVTUCourses();
    }
  }, [isOpen]);

  const saveCoursesToStorage = (updatedCourses: VTUCourse[]) => {
    try {
      localStorage.setItem("vtu_college_offered_courses", JSON.stringify(updatedCourses));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVTUCourses = async () => {
    setLoadingCourses(true);
    try {
      // Check if user has saved college course preferences in localStorage
      const saved = localStorage.getItem("vtu_college_offered_courses");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCourses(parsed);
        if (parsed.length > 0) {
          const selectedOne = parsed.find((c: any) => c.selected);
          if (selectedOne) setActiveCourseCode(selectedOne.code);
        }
        setLoadingCourses(false);
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
      setLoadingCourses(false);
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

  const handleSchemeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingScheme(true);
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

        setCourseSubjectsMap((prev) => ({
          ...prev,
          [activeCourseCode]: { theory: tSubjs, practical: pSubjs },
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsingScheme(false);
    }
  };


  const handleFacultyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFaculty(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/vtu/parse-faculty", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFacultyList((prev) => [...prev, ...(data.faculties || [])]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsingFaculty(false);
    }
  };

  const handleAddManualFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFacultyName) return;
    setFacultyList((prev) => [...prev, { name: manualFacultyName, department: manualFacultyDept }]);
    setManualFacultyName("");
  };

  const handleRemoveFaculty = (index: number) => {
    setFacultyList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunGenerator = async () => {
    setGenerating(true);
    setGenStatus(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/generator/generate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setGenStatus("Timetable successfully generated and saved!");
        setTimeout(() => {
          onClose();
          window.location.href = "/timetable";
        }, 1500);
      } else {
        setGenStatus(`Generation status: ${data.message || "Failed"}`);
      }
    } catch (err) {
      setGenStatus("Could not reach solver API.");
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Selected courses summary
  const selectedCourses = courses.filter((c) => c.selected);
  const totalStudents = selectedCourses.reduce((sum, c) => sum + c.studentCount, 0);
  const calculatedSections = Math.ceil(totalStudents / Math.max(1, roomCapacity));
  const calculatedBatchesPerSec = Math.ceil((roomCapacity || 60) / Math.max(1, labCapacity));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Automated Timetable Setup Wizard</h2>
              <p className="text-xs text-muted-foreground">Step {step} of 5 — VTU Institutional Flow</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="w-full bg-muted/40 h-1">
          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Academic Year & Scheme */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">1. Choose Academic Year & Institution Type</h3>
                <p className="text-xs text-muted-foreground">Select your institution affiliation and active academic session.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Institution Scheme</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInstitutionType("vtu")}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1 transition ${
                        institutionType === "vtu" ? "border-primary bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                      <span>VTU Affiliated College</span>
                    </button>
                    <button
                      onClick={() => setInstitutionType("university")}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1 transition ${
                        institutionType === "university" ? "border-primary bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                      }`}
                    >
                      <GraduationCap className="h-5 w-5" />
                      <span>Autonomous University</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Select Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Semester Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedSemType("odd")}
                      className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition ${
                        selectedSemType === "odd" ? "border-primary bg-primary/10 text-primary font-bold shadow-xs" : "hover:bg-muted"
                      }`}
                    >
                      {selectedYear === "1"
                        ? "1st Sem"
                        : selectedYear === "2"
                        ? "3rd Sem"
                        : selectedYear === "3"
                        ? "5th Sem"
                        : "7th Sem"}
                    </button>
                    <button
                      onClick={() => setSelectedSemType("even")}
                      className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition ${
                        selectedSemType === "even" ? "border-primary bg-primary/10 text-primary font-bold shadow-xs" : "hover:bg-muted"
                      }`}
                    >
                      {selectedYear === "1"
                        ? "2nd Sem"
                        : selectedYear === "2"
                        ? "4th Sem"
                        : selectedYear === "3"
                        ? "6th Sem"
                        : "8th Sem"}
                    </button>

                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: VTU Pre-Fetched B.E. Degree Courses & Student Intake */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">2. Pre-Fetched VTU B.E. Degree Courses & Student Intake</h3>
                  <p className="text-xs text-muted-foreground">
                    Checkboxes save your college's offered portfolio (remembered automatically). Click a course card to select it for timetable generation.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  Total Students: {totalStudents}
                </span>
              </div>

              {loadingCourses ? (
                <div className="flex items-center justify-center p-8 space-x-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading VTU Courses...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                  {courses.map((c) => {
                    const isActiveTarget = activeCourseCode === c.code;
                    return (
                      <div
                        key={c.code}
                        onClick={() => {
                          if (c.selected) setActiveCourseCode(c.code);
                        }}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between space-x-3 cursor-pointer ${
                          isActiveTarget && c.selected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md"
                            : c.selected
                            ? "border-border bg-card hover:border-primary/50 shadow-xs"
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
                              <p className="text-xs font-bold truncate">{c.name}</p>
                              {isActiveTarget && c.selected && (
                                <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-primary text-primary-foreground">
                                  Target
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-primary font-semibold">{c.code}</span>
                          </div>
                        </div>

                        {c.selected && (
                          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-muted-foreground">Students:</span>
                            <input
                              type="number"
                              value={c.studentCount}
                              onChange={(e) => handleUpdateStudentCount(c.code, Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs rounded border bg-background text-right font-mono focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: VTU Scheme Document Upload & Auto Segregation Per Course */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold">3. VTU Scheme Document Upload & Subject Ingestion</h3>
                <p className="text-xs text-muted-foreground">
                  Upload VTU Scheme PDF/DOCX for <span className="font-bold text-primary">{activeCourseCode}</span>. Subjects are segregated into Theory & Practical Labs.
                </p>
              </div>

              {/* Course Selection Tabs for Scheme Ingestion */}
              <div className="flex flex-wrap gap-2 pb-1 border-b border-border">
                {selectedCourses.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setActiveCourseCode(c.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                      activeCourseCode === c.code
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{c.code}</span>
                    <span className="text-[10px] opacity-75">({c.studentCount})</span>
                  </button>
                ))}
              </div>

              <div className="border-2 border-dashed border-primary/30 rounded-2xl p-6 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleSchemeFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {parsingScheme ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                  </div>
                  <p className="text-sm font-semibold">
                    {parsingScheme ? `Extracting VTU Subjects for ${activeCourseCode}...` : `Click or Drag VTU Scheme Document for ${activeCourseCode} (PDF/DOCX) Here`}
                  </p>
                  <p className="text-xs text-muted-foreground">Parser auto-categorizes Theory vs Practical Lab subjects for {activeCourseCode}</p>
                </div>
              </div>

              {/* Segregated Subjects Display for Active Course */}
              {(() => {
                const activeData = courseSubjectsMap[activeCourseCode] || {
                  theory: [
                    { code: `21${activeCourseCode}32`, name: "Data Structures and Applications", category: "theory", weekly_hours: 4 },
                    { code: `21${activeCourseCode}33`, name: "Analog and Digital Electronics", category: "theory", weekly_hours: 4 },
                    { code: "21MAT31", name: "Transform Calculus & Fourier Series", category: "theory", weekly_hours: 4 },
                  ],
                  practical: [
                    { code: `21${activeCourseCode}L35`, name: "Data Structures Laboratory", category: "practical", weekly_hours: 3 },
                    { code: `21${activeCourseCode}L36`, name: "Electronics Laboratory", category: "practical", weekly_hours: 3 },
                  ],
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Theory Subjects */}
                    <div className="rounded-xl border p-4 bg-card space-y-3">
                      <h4 className="text-xs font-bold text-primary tracking-wider uppercase flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Theory Subjects for {activeCourseCode} ({activeData.theory.length})</span>
                      </h4>
                      {activeData.theory.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No theory subjects parsed yet for {activeCourseCode}. Upload scheme above.</p>
                      ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {activeData.theory.map((s, idx) => (
                            <div key={idx} className="p-2 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-mono font-bold text-primary">{s.code}</span>
                                <p className="font-medium text-foreground">{s.name}</p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">{s.weekly_hours} hrs/wk</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Practical / Lab Subjects */}
                    <div className="rounded-xl border p-4 bg-card space-y-3">
                      <h4 className="text-xs font-bold text-accent tracking-wider uppercase flex items-center space-x-2">
                        <Layers className="h-4 w-4" />
                        <span>Practical & Lab Subjects for {activeCourseCode} ({activeData.practical.length})</span>
                      </h4>
                      {activeData.practical.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No lab subjects parsed yet for {activeCourseCode}. Upload scheme above.</p>
                      ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {activeData.practical.map((s, idx) => (
                            <div key={idx} className="p-2 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-mono font-bold text-accent">{s.code}</span>
                                <p className="font-medium text-foreground">{s.name}</p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">{s.weekly_hours} hrs/wk</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}


          {/* STEP 4: Side-by-Side Faculty Ingestion */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold">4. Available Department Faculties (Positioned Alongside Subjects)</h3>
                <p className="text-xs text-muted-foreground">Type faculty names manually OR upload a PDF/DOCX containing department faculty list.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faculty Input Column */}
                <div className="space-y-4">
                  {/* Document Upload Parser */}
                  <div className="border border-dashed rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFacultyFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center space-x-2 text-xs font-semibold">
                      {parsingFaculty ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-primary" />}
                      <span>{parsingFaculty ? "Extracting Faculty..." : "Upload Faculty List (PDF / DOCX)"}</span>
                    </div>
                  </div>

                  {/* Manual Faculty Input */}
                  <form onSubmit={handleAddManualFaculty} className="rounded-xl border p-4 bg-card space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Manual Faculty Entry</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Faculty Name (e.g. Dr. Pranav Bhat)"
                        value={manualFacultyName}
                        onChange={(e) => setManualFacultyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border bg-background focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Department (e.g. CSE)"
                        value={manualFacultyDept}
                        onChange={(e) => setManualFacultyDept(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border bg-background focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <button type="submit" className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition">
                      Add Faculty
                    </button>
                  </form>
                </div>

                {/* Faculty List Output Column */}
                <div className="rounded-xl border p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary tracking-wider uppercase flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Ingested Department Faculty ({facultyList.length})</span>
                    </h4>
                  </div>

                  {facultyList.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No faculty added yet. Upload file or add manually on the left.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {facultyList.map((f, idx) => (
                        <div key={idx} className="p-2 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-foreground">{f.name}</p>
                            <span className="text-[10px] text-muted-foreground">{f.department}</span>
                          </div>
                          <button onClick={() => handleRemoveFaculty(idx)} className="p-1 text-muted-foreground hover:text-destructive transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Automated Section, Lab Coinciding, Batch & Time Slot Setup */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold">5. Section Calculation, Lab Coinciding & Period Durations</h3>
                <p className="text-xs text-muted-foreground">System calculates required sections and subdivides into lab batches ($B_1, B_2 \dots$).</p>
              </div>

              {/* Calculated Metrics Summary Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border bg-primary/5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Total Students</p>
                  <p className="text-lg font-extrabold text-primary">{totalStudents}</p>
                </div>
                <div className="p-3 rounded-xl border bg-primary/5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Required Sections</p>
                  <p className="text-lg font-extrabold text-primary">{calculatedSections}</p>
                </div>
                <div className="p-3 rounded-xl border bg-accent/5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Batches / Section</p>
                  <p className="text-lg font-extrabold text-accent">{calculatedBatchesPerSec} (B1, B2...)</p>
                </div>
                <div className="p-3 rounded-xl border bg-accent/5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Subjects Active</p>
                  <p className="text-lg font-extrabold text-accent">
                    {((courseSubjectsMap[activeCourseCode]?.theory?.length || 3) + (courseSubjectsMap[activeCourseCode]?.practical?.length || 2))}
                  </p>
                </div>

              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Classroom Room Capacity</label>
                  <input
                    type="number"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background font-mono focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-[10px] text-muted-foreground">Default: 60 students per section</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Lab Capacity ($C$)</label>
                  <input
                    type="number"
                    value={labCapacity}
                    onChange={(e) => setLabCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background font-mono focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-[10px] text-muted-foreground">Default: 30 students per lab batch</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Coinciding / Shared Lab Facility</label>
                <input
                  type="text"
                  value={coincidedLabGroup}
                  onChange={(e) => setCoincidedLabGroup(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
                  placeholder="e.g. DSA, OS, CS Labs share CS Central Lab Facility"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Theory Slot Duration (minutes)</label>
                  <input
                    type="number"
                    value={theoryMin}
                    onChange={(e) => setTheoryMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background font-mono focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Lab Slot Duration (minutes)</label>
                  <input
                    type="number"
                    value={labMin}
                    onChange={(e) => setLabMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background font-mono focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {genStatus && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 text-sm ${genStatus.includes("successfully") ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                  {genStatus.includes("successfully") ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{genStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || generating}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-lg border hover:bg-muted disabled:opacity-40 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              <span>Next Step</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleRunGenerator}
              disabled={generating}
              className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{generating ? "Solving Timetable..." : "Generate Conflict-Free Timetable"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
