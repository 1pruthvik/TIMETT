"use client";

import { useEffect, useState, useMemo } from "react";
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
  Download,
  FileSpreadsheet,
  Table as TableIcon,
  Check,
  Hash,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";
import { getItemUserScoped, setItemUserScoped } from "@/lib/user-storage";
import { VTU_HIGHER_SEMESTER_TEMPLATES, resolveStreamType } from "@/lib/vtu-semester-data";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://tempus-backend-g36k.onrender.com").replace(/\/$/, "");

const FIRST_YEAR_SUBJECTS_SEM1 = [
  { code: "1BMATS101", name: "Mathematics - I (Calculus & Linear Algebra)" },
  { code: "1BPHYS102", name: "Applied Physics for Engineers" },
  { code: "1BCHES102", name: "Applied Chemistry for Engineers" },
  { code: "1BCEDS103", name: "Computer-Aided Engineering Drawing (CAED)" },
  { code: "1BESC104", name: "Introduction to Electronics Engineering" },
  { code: "1BEIT105", name: "Programming in C" },
  { code: "1BPLC105", name: "Python Programming" },
  { code: "1BSKS106", name: "Soft Skills & Professional Communication" },
  { code: "1BKSK109", name: "Samskrutika Kannada / Balake Kannada" },
  { code: "1BICO107", name: "Indian Constitution & Engineering Ethics" },
];

const FIRST_YEAR_SUBJECTS_SEM2 = [
  { code: "1BMATS201", name: "Mathematics - II (Advanced Calculus & Numerical Methods)" },
  { code: "1BPHYS202", name: "Physics for Computing / Emerging Hardware" },
  { code: "1BCHES202", name: "Chemistry for Emerging Electronics" },
  { code: "1BCEDS203", name: "Computer-Aided Engineering Drawing" },
  { code: "1BESC204", name: "Introduction to Electrical Engineering" },
  { code: "1BEIT205", name: "Data Structures with C" },
  { code: "1BPLC205", name: "Object Oriented Programming (Java/C++)" },
  { code: "1BSKS206", name: "Professional Writing Skills" },
  { code: "1BICO207", name: "Scientific Foundations of Health" },
];

const inferDepartmentFromSubjects = (subjs: string[]): string => {
  const combined = subjs.join(" ").toUpperCase();
  if (combined.includes("AIML") || combined.includes("AI")) return "Artificial Intelligence & Machine Learning";
  if (combined.includes("ECE") || combined.includes("EC") || combined.includes("ELECTRONIC")) return "Electronics & Communication Engineering";
  if (combined.includes("ISE") || combined.includes("IS") || combined.includes("INFO")) return "Information Science & Engineering";
  if (combined.includes("MECH") || combined.includes("ME")) return "Mechanical Engineering";
  if (combined.includes("EEE") || combined.includes("ELECTRI")) return "Electrical & Electronics Engineering";
  if (combined.includes("CIV") || combined.includes("CV")) return "Civil Engineering";
  if (combined.includes("MAT")) return "Mathematics";
  if (combined.includes("PHY")) return "Physics";
  if (combined.includes("CHE")) return "Chemistry";
  return "Computer Science & Engineering";
};

interface FacultyItem {
  name: string;
  department: string;
  designation?: string;
  cadre?: string;
  s1?: string;
  s2?: string;
  sem_handling?: string;
  proficientSubjects?: string[];
  proficient_subjects?: string[];
  max_hours_per_week?: number;
}

interface SectionAllocation {
  no?: number;
  course: string;
  sem: number | string;
  sections: Record<string, string>;
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
  const [sectionAllocations, setSectionAllocations] = useState<SectionAllocation[]>([]);
  const [activeRosterTab, setActiveRosterTab] = useState<"faculty" | "sections">("faculty");
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);

  // College semester cycle: Odd (1, 3, 5, 7) or Even (2, 4, 6, 8)
  const [isMounted, setIsMounted] = useState(false);
  const [activeCycle, setActiveCycle] = useState<"odd" | "even">("odd");
  const cycleSemesters = useMemo(() => {
    return activeCycle === "even" ? [2, 4, 6, 8] : [1, 3, 5, 7];
  }, [activeCycle]);

  // Faculty manual input states
  const [manualName, setManualName] = useState("");
  const [manualCadre, setManualCadre] = useState("AP");
  const [selectedSemHandling, setSelectedSemHandling] = useState<number[]>([3]);
  const [numSubjects, setNumSubjects] = useState<number>(2);
  const [subjectInputs, setSubjectInputs] = useState<string[]>(["", ""]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [activePickerSem, setActivePickerSem] = useState<number>(3);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [parsingFaculty, setParsingFaculty] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleDownloadExcelTemplate = () => {
    let url = `${API_BASE}/vtu/download-faculty-template`;
    try {
      const calc = getItemUserScoped<any[]>("vtu_calculated_sections");
      if (calc && Array.isArray(calc) && calc.length > 0) {
        const labels = calc.map((s: any) => s.label || (s.branchCode ? `${s.letter} (${s.branchCode})` : s.letter)).join(",");
        url += `?sections=${encodeURIComponent(labels)}`;
      }
    } catch {}
    window.open(url, "_blank");
  };

  const detectedSectionColumns = useMemo(() => {
    const keys = new Set<string>();
    sectionAllocations.forEach((alloc) => {
      Object.keys(alloc.sections || {}).forEach((k) => {
        if (k && !k.toLowerCase().includes("none") && !k.toLowerCase().includes("nan")) {
          keys.add(k.trim());
        }
      });
    });

    if (keys.size > 0) {
      return Array.from(keys).sort((a, b) => a.localeCompare(b));
    }

    try {
      const calc = getItemUserScoped<any[]>("vtu_calculated_sections");
      if (calc && Array.isArray(calc) && calc.length > 0) {
        return calc.map((s) => s.label || (s.branchCode ? `${s.letter} (${s.branchCode})` : s.letter));
      }
    } catch {}

    return ["A (CSE)", "B (CSE)", "C (CSE)", "D (CSE-AIML)", "E (CSE-AIML)", "F (ECE)"];
  }, [sectionAllocations]);

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "Name,Cadre,S1,S2,Sem handling\n" +
      "Dr Malini M P,Dean,DDCO(CSE),DDCO(AIML),3\n" +
      'Dr Hema M S,HOD,BDA(ISE),OS(CSE),"7,3"\n' +
      'Dr Deepak N,ASP,CG(CSE),SE(OE),"5,7"\n' +
      'Dr Savitha G,ASP,SEPM(ISE),IOT(CSE),"5,7"\n' +
      "Dr Mallanagouda P,ASP,C(CSE),,1\n" +
      'Dr Satish B B,ASP,BDA(CSE),USP(CSE),"7,5"\n' +
      'Prof. Sudheendra B,POP,OS(AIML),IoT(CSE),"3,7"\n' +
      'Dr Anil Kumar B,AP,CN(ISE),CNS(CSE),"5,7"\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "VTU_Faculty_Allocation_Template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isValidAcademicName = (str: string): boolean => {
    if (!str || typeof str !== "string") return false;
    const s = str.replace(/[\r\n\t]/g, "").trim();
    if (s.length < 3 || s.length > 100) return false;
    // Reject non-ASCII characters (like Arabic, Cyrillic, garbled unicode bytes)
    if (/[^\x20-\x7E]/.test(s)) return false;
    // Reject known binary/zip/xml keywords or weird symbols
    if (/PK[\x00-\x1f]|sheet\d|worksheets\/|xml|\[\]|\^|~|@|#|\$|%|\*|[{}]|<|>|\\|\//i.test(s)) return false;
    // Must contain only standard English characters, numbers, spaces, &, (), ., -
    if (!/^[a-zA-Z0-9\s&(),.-]+$/.test(s)) return false;
    // Must start with an English letter
    if (!/^[a-zA-Z]/.test(s)) return false;
    return true;
  };

  useEffect(() => {
    try {
      // 1. Load departments from user-scoped storage or courses
      let parsedDepts: string[] = getItemUserScoped<string[]>("vtu_college_departments") || [];
      if (!parsedDepts || parsedDepts.length === 0) {
        const parsedCourses = getItemUserScoped<any[]>("vtu_college_offered_courses") || [];
        parsedDepts = parsedCourses.filter((c: any) => c.selected && c.name).map((c: any) => c.name);
      }

      const cleanedDepts = Array.from(new Set([...DEFAULT_DEPARTMENTS, ...parsedDepts]))
        .filter((d) => isValidAcademicName(d));
      setDepartments(cleanedDepts);
      setItemUserScoped("vtu_college_departments", cleanedDepts);

      // 2. Load faculties from user-scoped storage (pure user data, no hardcoded defaults)
      let parsedFac: FacultyItem[] = getItemUserScoped<FacultyItem[]>("vtu_faculty_list") || [];

      const cleanedFac = parsedFac.filter(
        (f) => f && isValidAcademicName(f.name) && isValidAcademicName(f.department)
      );

      setFacultyList(cleanedFac);
      setItemUserScoped("vtu_faculty_list", cleanedFac);

      // 3. Load section allocations matrix if available
      const parsedAlloc = getItemUserScoped<SectionAllocation[]>("vtu_faculty_section_allocations");
      if (parsedAlloc && Array.isArray(parsedAlloc) && parsedAlloc.length > 0) {
        setSectionAllocations(parsedAlloc);
      }

      // 4. Load college semester term cycle (odd vs even)
      const savedCycle = localStorage.getItem("vtu_active_sem_cycle");
      const savedSetup = localStorage.getItem("vtu_academic_setup");
      let cycle: "odd" | "even" = "odd";
      if (savedCycle === "even" || savedCycle === "odd") {
        cycle = savedCycle as "odd" | "even";
      } else if (savedSetup) {
        const parsed = JSON.parse(savedSetup);
        if (parsed.selectedSemType === "even" || parsed.selectedSemType === "odd") {
          cycle = parsed.selectedSemType;
        }
      }
      setActiveCycle(cycle);
      const defaultSems = cycle === "even" ? [2, 4, 6, 8] : [1, 3, 5, 7];
      const initialSem = defaultSems[1] || defaultSems[0];
      setSelectedSemHandling([initialSem]);
      setActivePickerSem(initialSem);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMounted(true);
    }
  }, []);

  const saveDepartmentsToStorage = (updated: string[]) => {
    try {
      setItemUserScoped("vtu_college_departments", updated);
    } catch (e) {
      console.error(e);
    }
  };

  const saveFacultyToStorage = (updated: FacultyItem[]) => {
    try {
      setFacultyList(updated);
      setItemUserScoped("vtu_faculty_list", updated);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSemHandling = (sem: number) => {
    setSelectedSemHandling((prev) => {
      const updated = prev.includes(sem) ? prev.filter((s) => s !== sem) : [...prev, sem].sort((a, b) => a - b);
      if (!updated.includes(activePickerSem) && updated.length > 0) {
        setActivePickerSem(updated[0]);
      }
      return updated;
    });
  };

  const handleNumSubjectsChange = (val: number) => {
    const n = Math.max(1, Math.min(6, val));
    setNumSubjects(n);
    setSubjectInputs((prev) => {
      const updated = [...prev];
      if (updated.length < n) {
        while (updated.length < n) updated.push("");
      } else if (updated.length > n) {
        updated.length = n;
      }
      return updated;
    });
    if (activeSlotIndex >= n) {
      setActiveSlotIndex(n - 1);
    }
  };

  // Only display semesters that are currently checked in sem handling; fallback to all cycle semesters if none checked
  const availablePickerSems = selectedSemHandling.length > 0 ? selectedSemHandling : cycleSemesters;

  interface PickerSubject {
    code: string;
    name: string;
    branch?: string;
  }

  const [pickerSubjects, setPickerSubjects] = useState<PickerSubject[]>([]);

  useEffect(() => {
    if (!isMounted) return;

    // 1. Get offered courses for this college (from documents/courses setup)
    let collegeCourses: any[] = getItemUserScoped<any[]>("vtu_college_offered_courses") || [];
    if (!collegeCourses || collegeCourses.length === 0) {
      try {
        const raw = localStorage.getItem("vtu_college_offered_courses");
        if (raw) collegeCourses = JSON.parse(raw);
      } catch {}
    }
    let selectedCourses = (collegeCourses || []).filter((c: any) => c && c.selected);
    if (selectedCourses.length === 0 && collegeCourses.length > 0) {
      selectedCourses = collegeCourses;
    }
    if (selectedCourses.length === 0) {
      selectedCourses = [
        { code: "CSE", name: "Computer Science & Engineering", selected: true, cycle: "physics" },
        { code: "AIML", name: "AI & Machine Learning", selected: true, cycle: "physics" },
        { code: "ECE", name: "Electronics & Communication Engineering", selected: true, cycle: "chemistry" },
      ];
    }

    const result: PickerSubject[] = [];
    const seenCodes = new Set<string>();

    if (activePickerSem === 1 || activePickerSem === 2) {
      let sem1or2Map: any = getItemUserScoped<any>(`vtu_first_year_subjects_map_sem_${activePickerSem}`);
      if (!sem1or2Map) {
        try {
          const raw =
            localStorage.getItem(`vtu_first_year_subjects_map_sem_${activePickerSem}`) ||
            localStorage.getItem("vtu_course_subjects_map");
          if (raw) sem1or2Map = JSON.parse(raw);
        } catch {}
      }

      if (sem1or2Map && typeof sem1or2Map === "object") {
        selectedCourses.forEach((c) => {
          const courseObj = sem1or2Map[c.code];
          if (courseObj) {
            const th = courseObj.theory || [];
            const pr = courseObj.practical || [];
            const tut = courseObj.tutorial || [];
            [...th, ...pr, ...tut].forEach((s: any) => {
              if (s && s.code) {
                const uniqueKey = `${s.code}_${c.code}`;
                if (!seenCodes.has(uniqueKey)) {
                  seenCodes.add(uniqueKey);
                  result.push({
                    code: s.code,
                    name: s.name || s.code,
                    branch: c.code,
                  });
                }
              }
            });
          }
        });
      }

      // Fallback if user hasn't visited /documents for 1st year yet
      if (result.length === 0) {
        const fallback1st = activePickerSem === 1 ? FIRST_YEAR_SUBJECTS_SEM1 : FIRST_YEAR_SUBJECTS_SEM2;
        fallback1st.forEach((s) => {
          result.push({ code: s.code, name: s.name });
        });
      }

      setPickerSubjects(result);
      return;
    }

    // Higher Semesters (Sem 3 to 8): Read the curriculum subjects configured on /documents
    let savedMap: any = getItemUserScoped<any>(`vtu_higher_sem_subjects_map_sem_${activePickerSem}`);
    if (!savedMap) {
      try {
        const raw = localStorage.getItem(`vtu_higher_sem_subjects_map_sem_${activePickerSem}`);
        if (raw) savedMap = JSON.parse(raw);
      } catch {}
    }

    const defaultTemplates = VTU_HIGHER_SEMESTER_TEMPLATES[activePickerSem] || {};

    selectedCourses.forEach((c) => {
      const streamType = resolveStreamType(c.code);
      const fallbackTmpl =
        defaultTemplates[c.code] ||
        defaultTemplates[streamType] ||
        defaultTemplates["CSE"] || { theory: [], tutorial: [], practical: [] };

      // Use subjects configured on /documents for this active course branch, or fall back to branch syllabus
      const branchData = savedMap?.[c.code] || fallbackTmpl;
      if (branchData) {
        const th = branchData.theory || [];
        const pr = branchData.practical || [];
        const tut = branchData.tutorial || [];
        [...th, ...pr, ...tut].forEach((s: any) => {
          if (s && s.code) {
            const uniqueKey = `${s.code}_${c.code}`;
            if (!seenCodes.has(uniqueKey)) {
              seenCodes.add(uniqueKey);
              result.push({
                code: s.code,
                name: s.name || s.code,
                branch: c.code,
              });
            }
          }
        });
      }
    });

    setPickerSubjects(result);
  }, [activePickerSem, isMounted]);

  const filteredPickerSubjects = useMemo(() => {
    return pickerSubjects.filter(
      (s) =>
        s.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        (s.branch && s.branch.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
    );
  }, [pickerSubjects, subjectSearchQuery]);

  const handlePickSubject = (subj: PickerSubject) => {
    const formatted = subj.branch ? `${subj.code}(${subj.branch})` : subj.code;
    setSubjectInputs((prev) => {
      const updated = [...prev];
      const targetIdx = activeSlotIndex < updated.length ? activeSlotIndex : 0;
      updated[targetIdx] = formatted;
      return updated;
    });
    // Auto advance to next slot if empty
    setActiveSlotIndex((prev) => (prev + 1 < numSubjects ? prev + 1 : prev));
  };

  const handleAddManualFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const desgMap: Record<string, string> = {
      Dean: "Dean",
      HOD: "Head of Department (HOD)",
      ASP: "Associate Professor",
      AP: "Assistant Professor",
      POP: "Professor of Practice",
      Professor: "Professor",
    };

    const cleanSubjs = subjectInputs.map((s) => s.trim()).filter((s) => s.length > 0);
    const semStr = selectedSemHandling.sort((a, b) => a - b).join(", ");
    const inferredDept = inferDepartmentFromSubjects(cleanSubjs);

    const newFaculty: FacultyItem = {
      name: manualName.trim(),
      department: inferredDept,
      designation: desgMap[manualCadre] || manualCadre,
      cadre: manualCadre,
      s1: cleanSubjs[0] || "",
      s2: cleanSubjs[1] || "",
      sem_handling: semStr,
      proficientSubjects: cleanSubjs,
    };

    const updated = [newFaculty, ...facultyList];
    saveFacultyToStorage(updated);

    // Reset fields
    setManualName("");
    setSubjectInputs(Array(numSubjects).fill(""));
    setActiveSlotIndex(0);
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
      const res = await fetch(`${API_BASE}/vtu/parse-faculty`, {
        method: "POST",
        body: formData,
      }).catch(() => null);

      let extracted: FacultyItem[] = [];
      let parsedAllocations: SectionAllocation[] = [];

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        extracted = (data?.faculties || []).map((f: any) => ({
          name: f.name || "Faculty Member",
          department: f.department || "Computer Science & Engineering",
          designation: f.designation || "Assistant Professor",
          cadre: f.cadre || "AP",
          s1: f.s1 || "",
          s2: f.s2 || "",
          sem_handling: f.sem_handling || "",
          proficientSubjects: f.proficient_subjects || [],
        }));
        if (data?.allocations && Array.isArray(data.allocations)) {
          parsedAllocations = data.allocations;
        }
      }

      // Filter out any invalid / binary / garbled strings from backend
      extracted = extracted.filter((f) => f && isValidAcademicName(f.name) && isValidAcademicName(f.department));

      // If backend returned 0 valid names, perform clean client-side extraction
      if (extracted.length === 0) {
        let fileDept = "Computer Science & Engineering";
        if (file.name.toLowerCase().includes("humanities")) fileDept = "Humanities & Social Sciences";
        else if (file.name.toLowerCase().includes("ece") || file.name.toLowerCase().includes("electronics")) fileDept = "Electronics & Communication Engineering";
        else if (file.name.toLowerCase().includes("ise") || file.name.toLowerCase().includes("information")) fileDept = "Information Science & Engineering";
        else if (file.name.toLowerCase().includes("me") || file.name.toLowerCase().includes("mechanical")) fileDept = "Mechanical Engineering";

        const isTextFile = file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt");

        if (isTextFile) {
          const textContent = await file.text().catch(() => "");
          const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

          for (let i = 0; i < lines.length; i++) {
            const rowStr = lines[i].trim();
            if (rowStr.toLowerCase().startsWith("name") || rowStr.toLowerCase().startsWith("sl")) continue;
            const parts = rowStr.split(/[,;\t]/).map((p) => p.trim());
            if (parts.length > 0) {
              const rawName = parts[0];
              if (rawName && isValidAcademicName(rawName)) {
                const cadre = parts[1] || "AP";
                const s1 = parts[2] || "";
                const s2 = parts[3] || "";
                const semHandling = parts[4] || "";
                const subjs = [s1, s2].filter(Boolean);
                const desg = cadre === "Dean" ? "Dean" : cadre === "HOD" ? "Head of Department (HOD)" : cadre === "ASP" ? "Associate Professor" : cadre === "POP" ? "Professor of Practice" : "Assistant Professor";
                extracted.push({
                  name: rawName,
                  department: fileDept,
                  designation: desg,
                  cadre: cadre,
                  s1: s1,
                  s2: s2,
                  sem_handling: semHandling,
                  proficientSubjects: subjs,
                });
              }
            }
          }
        }
      }

      // Final strict safety filter: ensure ONLY valid academic names are saved
      extracted = extracted.filter((f) => f && isValidAcademicName(f.name) && isValidAcademicName(f.department));

      if (extracted.length === 0) {
        setUploadSuccess(null);
        alert(`No valid faculty names could be identified in ${file.name}. Please ensure the file follows the standard format: Name, Cadre, S1, S2, Sem handling.`);
        return;
      }

      // If section allocations were parsed, save them to state and storage
      if (parsedAllocations.length > 0) {
        setSectionAllocations(parsedAllocations);
        setItemUserScoped("vtu_faculty_section_allocations", parsedAllocations);
      }

      // Add new department to department filter dropdown if not existing
      const deptsSet = new Set(departments);
      extracted.forEach((f) => {
        if (f.department && isValidAcademicName(f.department)) deptsSet.add(f.department);
      });
      const updatedDepts = Array.from(deptsSet);
      setDepartments(updatedDepts);
      saveDepartmentsToStorage(updatedDepts);

      // Save extracted roster directly (replacing any previous roster)
      saveFacultyToStorage(extracted);
      setSelectedDeptFilter("ALL");
      setUploadSuccess(`Successfully extracted ${extracted.length} faculty profiles with subject proficiencies from ${file.name}`);
    } catch (err) {
      console.error("Faculty upload fallback:", err);
    } finally {
      setParsingFaculty(false);
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.proficientSubjects || f.proficient_subjects || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

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
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>

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
                    ? "Parsing Faculty Allocation List..."
                    : "Upload Faculty Allocation List (Excel / CSV / PDF / Image)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drop roster matching: Name, Cadre, S1, S2, Sem handling
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center space-x-3 tt-animate-fade">
                <CheckCircle2 className="h-5 w-5" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Manual Faculty Entry Form */}
            <form
              onSubmit={handleAddManualFaculty}
              className="p-6 rounded-2xl border border-border bg-card/60 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Add Faculty Member</span>
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                  {activeCycle === "even" ? "Even Sems Cycle (2, 4, 6, 8)" : "Odd Sems Cycle (1, 3, 5, 7)"}
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. Name & Cadre (Department completely removed) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Faculty Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr Malini M P"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Cadre (Designation)
                    </label>
                    <select
                      value={manualCadre}
                      onChange={(e) => setManualCadre(e.target.value)}
                      className="w-full h-11 px-3 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      <option value="Dean">Dean</option>
                      <option value="HOD">HOD (Head of Department)</option>
                      <option value="ASP">ASP (Associate Professor)</option>
                      <option value="AP">AP (Assistant Professor)</option>
                      <option value="POP">POP (Professor of Practice)</option>
                      <option value="Professor">Professor</option>
                    </select>
                  </div>
                </div>

                {/* 2. Checkboxes for the 4 Semesters Handling (Odd or Even based on active college cycle) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Semesters Handling ({activeCycle === "even" ? "Even Terms" : "Odd Terms"})
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Select the active semesters handled by this faculty:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {cycleSemesters.map((sem) => {
                      const isChecked = selectedSemHandling.includes(sem);
                      return (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => toggleSemHandling(sem)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                            isChecked
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs"
                              : "border-border bg-background/60 text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare2 className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span>Sem {sem}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Number of Subjects Stepper */}
                <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block">
                      Number of Subjects
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                      Specify subject workload allocation count (S1, S2, etc.)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleNumSubjectsChange(numSubjects - 1)}
                      disabled={numSubjects <= 1}
                      className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted font-bold text-sm flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm w-6 text-center text-primary">
                      {numSubjects}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNumSubjectsChange(numSubjects + 1)}
                      disabled={numSubjects >= 6}
                      className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted font-bold text-sm flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. Subject Inputs based on numSubjects */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Assigned Subjects ({numSubjects})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {subjectInputs.map((subjVal, idx) => {
                      const isActiveSlot = activeSlotIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveSlotIndex(idx)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer space-y-1 ${
                            isActiveSlot
                              ? "border-primary bg-primary/[0.04] ring-2 ring-primary/30"
                              : "border-border bg-background hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-primary">
                              Subject {idx + 1} {idx === 0 ? "(S1)" : idx === 1 ? "(S2)" : `(S${idx + 1})`}
                            </span>
                            {isActiveSlot ? (
                              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold uppercase">
                                Active Slot
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Click to select</span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder={`e.g. DDCO(CSE)`}
                            value={subjVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSubjectInputs((prev) => {
                                const up = [...prev];
                                up[idx] = val;
                                return up;
                              });
                            }}
                            onFocus={() => setActiveSlotIndex(idx)}
                            className="w-full h-8 px-2 text-xs font-mono font-semibold rounded-lg border border-border/60 bg-background/80 outline-none"
                            required={idx === 0}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Subject Selection Menu with Semester Toggles */}
                <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/[0.02] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span>Select Subject from Curriculum</span>
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Clicking any subject populates into <strong className="text-primary font-bold">Subject {activeSlotIndex + 1}</strong>
                      </p>
                    </div>

                    {/* Semester Toggle Pills (Only displaying the sems chosen in Sem Handling checkboxes!) */}
                    <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-xl border border-border/60 overflow-x-auto">
                      {availablePickerSems.map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => setActivePickerSem(sem)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0 ${
                            activePickerSem === sem
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Sem {sem}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Search inside picker */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={`Filter Sem ${activePickerSem} subjects by name or code...`}
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-border bg-background outline-none"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  {/* Filtered Subject Options */}
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {!isMounted ? (
                      <div className="p-4 text-center text-xs text-muted-foreground italic">
                        Loading curriculum subjects...
                      </div>
                    ) : filteredPickerSubjects.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground italic">
                        No subjects found matching "{subjectSearchQuery}".
                      </div>
                    ) : (
                      filteredPickerSubjects.map((s, idx) => (
                        <div
                          key={`${s.code}_${s.branch || idx}`}
                          onClick={() => handlePickSubject(s)}
                          className="p-2 rounded-xl border border-border/60 bg-background hover:bg-primary/10 hover:border-primary/40 flex items-center justify-between cursor-pointer transition group"
                        >
                          <div className="min-w-0 pr-2 flex items-center flex-wrap gap-1.5">
                            <span className="font-mono font-bold text-primary text-xs">{s.code}</span>
                            <span className="text-xs text-foreground font-medium truncate">{s.name}</span>
                            {s.branch && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {s.branch}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground font-semibold shrink-0 transition">
                            + Select
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Save Faculty Member</span>
              </button>
            </form>
          </div>

          {/* Active Faculty List & Section Allocations */}
          <div className="space-y-4">
            
            {/* Header with Switcher Tabs if Section Allocations exist */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {sectionAllocations.length > 0 ? (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveRosterTab("faculty")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRosterTab === "faculty"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Faculty List ({facultyList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRosterTab("sections")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRosterTab === "sections"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    <span>Section Matrix ({sectionAllocations.length})</span>
                  </button>
                </div>
              ) : (
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
              )}

              {activeRosterTab === "faculty" && (
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
              )}
            </div>

            {/* SECTION MATRIX VIEW TAB */}
            {activeRosterTab === "sections" && sectionAllocations.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[65vh]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/70 border-b border-border text-[11px] font-bold text-muted-foreground uppercase sticky top-0 bg-muted z-10">
                        <th className="p-3 font-mono">No</th>
                        <th className="p-3">Course</th>
                        <th className="p-3 font-mono">Sem</th>
                        {detectedSectionColumns.map((colName) => (
                          <th key={colName} className="p-3 text-center font-mono">
                            {colName.toLowerCase().startsWith("sec") ? colName : `Sec ${colName}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {sectionAllocations.map((alloc, aIdx) => (
                        <tr key={aIdx} className="hover:bg-muted/30 transition">
                          <td className="p-3 font-mono font-bold text-muted-foreground">{alloc.no ?? aIdx + 1}</td>
                          <td className="p-3 font-bold text-foreground">{alloc.course}</td>
                          <td className="p-3 font-mono text-primary font-bold">Sem {alloc.sem}</td>
                          {detectedSectionColumns.map((colName) => {
                            const val =
                              alloc.sections[colName] ||
                              alloc.sections[`Sec ${colName}`] ||
                              alloc.sections[colName.split(" ")[0]] ||
                              "-";
                            return (
                              <td key={colName} className="p-3 text-center font-mono font-semibold">
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                {/* Multi-Select Action Bar */}
                {filteredFaculty.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-card/60 border border-border text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition cursor-pointer"
                      >
                        {filteredFaculty.length > 0 && selectedIndices.length === filteredFaculty.length ? (
                          <CheckSquare2 className="h-4 w-4 text-primary" />
                        ) : selectedIndices.length > 0 ? (
                          <MinusSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>
                          {selectedIndices.length === filteredFaculty.length
                            ? "Deselect All"
                            : `Select All (${filteredFaculty.length})`}
                        </span>
                      </button>
                      {selectedIndices.length > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {selectedIndices.length} Selected
                        </span>
                      )}
                    </div>

                    {selectedIndices.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIndices([])}
                          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          className="h-8 px-3 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Selected ({selectedIndices.length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {filteredFaculty.length === 0 ? (
                  <div className="p-12 text-center text-xs text-muted-foreground italic rounded-2xl border border-dashed border-border bg-muted/10">
                    No faculty members found matching filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto pr-1">
                    {filteredFaculty.map((f, idx) => {
                      const isSelected = selectedIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleSelect(idx)}
                          className={`p-4 rounded-xl border transition cursor-pointer space-y-2 group ${
                            isSelected
                              ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary/30"
                              : "border-border/60 bg-card/60 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              {/* Selection Checkbox */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(idx);
                                }}
                                className="shrink-0"
                              >
                                {isSelected ? (
                                  <CheckSquare2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-foreground text-sm truncate flex items-center space-x-1.5">
                                    <UserCheck className="h-4 w-4 text-primary shrink-0" />
                                    <span>{f.name}</span>
                                  </p>
                                  {f.cadre && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                                      {f.cadre}
                                    </span>
                                  )}
                                  {f.designation && f.designation !== f.cadre && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold border border-border/50">
                                      {f.designation}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                  <span>{f.department}</span>
                                  {f.sem_handling && (
                                    <span className="text-[11px] font-mono font-semibold text-foreground/80 bg-background/80 px-2 py-0.5 rounded-md border border-border/60">
                                      Sem: {f.sem_handling}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFaculty(idx);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
                              title="Delete Faculty"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* S1, S2, and Proficient Subjects Display */}
                          {(f.s1 || f.s2 || (f.proficientSubjects || f.proficient_subjects || []).length > 0) && (
                            <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1.5 pl-7">
                              {f.s1 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold border border-blue-500/20">
                                  S1: {f.s1}
                                </span>
                              )}
                              {f.s2 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold border border-indigo-500/20">
                                  S2: {f.s2}
                                </span>
                              )}
                              {!f.s1 && !f.s2 && (
                                <>
                                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                    <BookOpen className="h-3 w-3 text-primary" />
                                    <span>Proficient:</span>
                                  </span>
                                  {(f.proficientSubjects || f.proficient_subjects || []).map((code: string) => (
                                    <span
                                      key={code}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono font-bold"
                                    >
                                      {code}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
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
