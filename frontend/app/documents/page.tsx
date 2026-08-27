"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  BookOpen,
  Layers,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

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

export default function DocumentsPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");
  const [semKey, setSemKey] = useState<string>("sem_7");
  const [semesterTitle, setSemesterTitle] = useState<string>("4th Year • 7th Semester (Odd)");
  
  // Master map partitioned by semester: { [semKey: string]: { [courseCode: string]: { theory: Subject[]; practical: Subject[] } } }
  const [allSemMap, setAllSemMap] = useState<
    Record<string, Record<string, { theory: Subject[]; practical: Subject[] }>>
  >({});

  // Active semester subjects map: { [courseCode: string]: { theory: Subject[]; practical: Subject[] } }
  const [courseSubjectsMap, setCourseSubjectsMap] = useState<
    Record<string, { theory: Subject[]; practical: Subject[] }>
  >({});

  const [parsingScheme, setParsingScheme] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Manual Add Subject
  const [showAddSubj, setShowAddSubj] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCategory, setNewSubjCategory] = useState<"theory" | "practical">("theory");
  const [newSubjHours, setNewSubjHours] = useState(4);

  const getComputedSemKey = (parsedSetup: any): { key: string; label: string } => {
    if (parsedSetup.semKey && parsedSetup.semesterLabel) {
      const yr = parsedSetup.yearLevelLabel || "4th Year";
      const sem = parsedSetup.semesterLabel || "7th Semester";
      const type = parsedSetup.selectedSemType === "even" ? "Even" : "Odd";
      return {
        key: parsedSetup.semKey,
        label: `${yr} • ${sem} (${type})`,
      };
    }
    const y = Number(parsedSetup.selectedYear) || 4;
    const semNum = (y - 1) * 2 + (parsedSetup.selectedSemType === "even" ? 2 : 1);
    const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
    const yrLabel = `${ordinals[y - 1] || `${y}th`} Year`;
    const semLabel = `${ordinals[semNum - 1] || `${semNum}th`} Semester`;
    const typeLabel = parsedSetup.selectedSemType === "even" ? "Even" : "Odd";
    return {
      key: `sem_${semNum}`,
      label: `${yrLabel} • ${semLabel} (${typeLabel})`,
    };
  };

  useEffect(() => {
    try {
      // 1. Read active academic setup
      let currentSemKey = "sem_7";
      let currentSemLabel = "4th Year • 7th Semester (Odd)";

      const savedSetup = localStorage.getItem("vtu_academic_setup");
      if (savedSetup) {
        const parsedSetup = JSON.parse(savedSetup);
        const info = getComputedSemKey(parsedSetup);
        currentSemKey = info.key;
        currentSemLabel = info.label;
      }
      setSemKey(currentSemKey);
      setSemesterTitle(currentSemLabel);

      // 2. Load courses
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

      // 3. Base semester templates
      const defaultSemesterTemplates: Record<
        string,
        Record<string, { theory: Subject[]; practical: Subject[] }>
      > = {
        sem_7: {
          CSE: {
            theory: [
              { code: "1BCS701", name: "Big Data Analytics", category: "theory", weekly_hours: 3 },
              { code: "1BCS702", name: "Professional Elective Course - III", category: "theory", weekly_hours: 3 },
              { code: "1BCS703", name: "Professional Elective Course - IV", category: "theory", weekly_hours: 3 },
              { code: "1BCS704", name: "Open Elective Course - I", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "1BCSL701", name: "Big Data Analytics Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          "CSE-AIML": {
            theory: [
              { code: "1BCD701", name: "Deep Learning", category: "theory", weekly_hours: 3 },
              { code: "1BAI702", name: "Professional Elective Course - III", category: "theory", weekly_hours: 3 },
              { code: "1BAI703", name: "Professional Elective Course - IV", category: "theory", weekly_hours: 3 },
              { code: "1BAI704", name: "Open Elective Course - I", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "1BCDL701", name: "Deep Learning Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          "CSE-DS": {
            theory: [
              { code: "1BCD701", name: "Deep Learning", category: "theory", weekly_hours: 3 },
              { code: "1BDS702", name: "Professional Elective Course - III", category: "theory", weekly_hours: 3 },
              { code: "1BDS703", name: "Professional Elective Course - IV", category: "theory", weekly_hours: 3 },
              { code: "1BDS704", name: "Open Elective Course - I", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "1BCDL701", name: "Deep Learning Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          ISE: {
            theory: [
              { code: "1BIS701", name: "High Performance Computing", category: "theory", weekly_hours: 3 },
              { code: "1BIS702", name: "Professional Elective Course - III", category: "theory", weekly_hours: 3 },
              { code: "1BIS703", name: "Professional Elective Course - IV", category: "theory", weekly_hours: 3 },
              { code: "1BIS704", name: "Open Elective Course - I", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "1BISL701", name: "High Performance Computing Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          "AI&DS": {
            theory: [
              { code: "1BAD701", name: "High Performance Computing in Artificial Intelligence", category: "theory", weekly_hours: 3 },
              { code: "1BAD702", name: "Professional Elective Course - III", category: "theory", weekly_hours: 3 },
              { code: "1BAD703", name: "Professional Elective Course - IV", category: "theory", weekly_hours: 3 },
              { code: "1BAD704", name: "Open Elective Course - I", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "1BADL701", name: "High Performance Computing in AI Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          ECE: {
            theory: [
              { code: "BEC701", name: "Microwave Engineering and Antenna Theory", category: "theory", weekly_hours: 3 },
              { code: "BEC702", name: "Computer Networks and Protocols", category: "theory", weekly_hours: 3 },
              { code: "BEC703", name: "Wireless Communication Systems", category: "theory", weekly_hours: 4 },
              { code: "BEC714", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
              { code: "BEC755", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "BECL701", name: "Microwave Engineering & Antenna Laboratory", category: "practical", weekly_hours: 2 },
              { code: "BECL702", name: "Computer Networks & Protocols Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          EEE: {
            theory: [
              { code: "BEE701", name: "Switchgear and Protection", category: "theory", weekly_hours: 3 },
              { code: "BEE702", name: "Industrial Drives and Applications", category: "theory", weekly_hours: 4 },
              { code: "BEE703", name: "Power System Analysis - II", category: "theory", weekly_hours: 3 },
              { code: "BEE714", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
              { code: "BEE755", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "BEEL701", name: "Switchgear & Protection Laboratory", category: "practical", weekly_hours: 2 },
              { code: "BEEL703", name: "Power System Analysis - II Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          ME: {
            theory: [
              { code: "BME701", name: "Finite Element Methods", category: "theory", weekly_hours: 3 },
              { code: "BME702", name: "Hydraulics and Pneumatics", category: "theory", weekly_hours: 3 },
              { code: "BME703", name: "Control Engineering", category: "theory", weekly_hours: 4 },
              { code: "BME714", name: "Professional Elective - III", category: "theory", weekly_hours: 3 },
              { code: "BME755", name: "Open Elective - II", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "BMEL701", name: "Finite Element Methods Laboratory", category: "practical", weekly_hours: 2 },
              { code: "BMEL702", name: "Hydraulics & Pneumatics Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          CIV: {
            theory: [
              { code: "1BCV701", name: "Design & Detailing of Steel Structures", category: "theory", weekly_hours: 3 },
              { code: "1BCV702", name: "Professional Elective Course - III", category: "theory", weekly_hours: 3 },
              { code: "1BCV703", name: "Professional Elective Course - IV", category: "theory", weekly_hours: 3 },
              { code: "1BCV704", name: "Open Elective Course - I", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "1BCVL701", name: "Design & Detailing of Steel Structures Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          BME: {
            theory: [
              { code: "BBM701", name: "Biomechanics and Biodynamics", category: "theory", weekly_hours: 3 },
              { code: "BBM702", name: "ARM Processor", category: "theory", weekly_hours: 3 },
              { code: "BBM703", name: "Biometric System", category: "theory", weekly_hours: 4 },
              { code: "BBM714", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
              { code: "BBM755", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "BBML701", name: "Biomechanics & Biodynamics Laboratory", category: "practical", weekly_hours: 2 },
              { code: "BBML702", name: "ARM Processor Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
          CH: {
            theory: [
              { code: "BCH701", name: "Process Modeling and Simulation", category: "theory", weekly_hours: 3 },
              { code: "BCH702", name: "Process Control and Industrial IoT", category: "theory", weekly_hours: 3 },
              { code: "BCH703", name: "Process Engineering Economics and Management", category: "theory", weekly_hours: 4 },
              { code: "BCH714", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
              { code: "BCH755", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
            ],
            practical: [
              { code: "BCHL701", name: "Process Modeling & Simulation Laboratory", category: "practical", weekly_hours: 2 },
              { code: "BCHL702", name: "Process Control & Industrial IoT Laboratory", category: "practical", weekly_hours: 2 },
            ],
          },
        },
        sem_8: {
          CSE: {
            theory: [
              { code: "1BCS801", name: "Professional Elective-V (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
              { code: "1BCS802", name: "Open Elective-II (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          "CSE-AIML": {
            theory: [
              { code: "1BAI801", name: "Professional Elective-V (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
              { code: "1BAI802", name: "Open Elective-II (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          "CSE-DS": {
            theory: [
              { code: "1BDS801", name: "Professional Elective-V (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
              { code: "1BDS802", name: "Open Elective-II (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          ECE: {
            theory: [
              { code: "BEC801", name: "Professional Elective (Online Courses)", category: "theory", weekly_hours: 3 },
              { code: "BEC802", name: "Open Elective (Online Courses)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          EEE: {
            theory: [
              { code: "BEE801", name: "Professional Elective (Online Courses)", category: "theory", weekly_hours: 3 },
              { code: "BEE802", name: "Open Elective (Online Courses)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          ME: {
            theory: [
              { code: "BME811", name: "Professional Elective -IV (Online Courses)", category: "theory", weekly_hours: 3 },
              { code: "BME852", name: "Open Elective - III (Online Courses)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          CIV: {
            theory: [
              { code: "BCV801", name: "Professional Elective (Online Courses)", category: "theory", weekly_hours: 3 },
              { code: "BCV802", name: "Open Elective (Online Courses)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          BME: {
            theory: [
              { code: "BBM801", name: "Professional Elective (Online Courses)", category: "theory", weekly_hours: 3 },
              { code: "BBM802", name: "Open Elective (Online Courses)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          CH: {
            theory: [
              { code: "BCH801", name: "Professional Elective (Online Courses)", category: "theory", weekly_hours: 3 },
              { code: "BCH802", name: "Open Elective (Online Courses)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          "AI&DS": {
            theory: [
              { code: "1BAD801", name: "Professional Elective-V (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
              { code: "1BAD802", name: "Open Elective-II (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
          ISE: {
            theory: [
              { code: "1BIS801", name: "Professional Elective-V (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
              { code: "1BIS802", name: "Open Elective-II (NPTEL/VTU Online Course)", category: "theory", weekly_hours: 3 },
            ],
            practical: [],
          },
        },
        sem_3: {
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
        },
      };

      // 4. Load master semester subjects map
      let masterMap = defaultSemesterTemplates;
      const savedMasterMap = localStorage.getItem("vtu_semester_course_subjects_map");
      if (savedMasterMap) {
        masterMap = { ...defaultSemesterTemplates, ...JSON.parse(savedMasterMap) };
      }
      
      // Ensure sem_7 contains CSE, CSE-AIML, CSE-DS, ISE, AI&DS, ECE, EEE, ME, CIV, BME, and CH
      if (!masterMap.sem_7) masterMap.sem_7 = defaultSemesterTemplates.sem_7;
      if (!masterMap.sem_7.CSE) masterMap.sem_7.CSE = defaultSemesterTemplates.sem_7.CSE;
      masterMap.sem_7["CSE-AIML"] = defaultSemesterTemplates.sem_7["CSE-AIML"];
      masterMap.sem_7["CSE-DS"] = defaultSemesterTemplates.sem_7["CSE-DS"];
      masterMap.sem_7.ISE = defaultSemesterTemplates.sem_7.ISE;
      masterMap.sem_7["AI&DS"] = defaultSemesterTemplates.sem_7["AI&DS"];
      masterMap.sem_7.ECE = defaultSemesterTemplates.sem_7.ECE;
      masterMap.sem_7.EEE = defaultSemesterTemplates.sem_7.EEE;
      masterMap.sem_7.ME = defaultSemesterTemplates.sem_7.ME;
      masterMap.sem_7.CIV = defaultSemesterTemplates.sem_7.CIV;
      masterMap.sem_7.BME = defaultSemesterTemplates.sem_7.BME;
      masterMap.sem_7.CH = defaultSemesterTemplates.sem_7.CH;
      
      // Ensure sem_8 contains all 11 streams
      if (!masterMap.sem_8) masterMap.sem_8 = defaultSemesterTemplates.sem_8;
      masterMap.sem_8.CSE = defaultSemesterTemplates.sem_8.CSE;
      masterMap.sem_8["CSE-AIML"] = defaultSemesterTemplates.sem_8["CSE-AIML"];
      masterMap.sem_8["CSE-DS"] = defaultSemesterTemplates.sem_8["CSE-DS"];
      masterMap.sem_8.ECE = defaultSemesterTemplates.sem_8.ECE;
      masterMap.sem_8.EEE = defaultSemesterTemplates.sem_8.EEE;
      masterMap.sem_8.ME = defaultSemesterTemplates.sem_8.ME;
      masterMap.sem_8.CIV = defaultSemesterTemplates.sem_8.CIV;
      masterMap.sem_8.BME = defaultSemesterTemplates.sem_8.BME;
      masterMap.sem_8.CH = defaultSemesterTemplates.sem_8.CH;
      masterMap.sem_8["AI&DS"] = defaultSemesterTemplates.sem_8["AI&DS"];
      masterMap.sem_8.ISE = defaultSemesterTemplates.sem_8.ISE;

      if (!masterMap.sem_3) masterMap.sem_3 = defaultSemesterTemplates.sem_3;

      setAllSemMap(masterMap);
      localStorage.setItem("vtu_semester_course_subjects_map", JSON.stringify(masterMap));

      // 5. Set active semester subjects
      const activeSemSubjects = masterMap[currentSemKey] || {};
      setCourseSubjectsMap(activeSemSubjects);
      localStorage.setItem("vtu_course_subjects_map", JSON.stringify(activeSemSubjects));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSubjectsToStorage = (updatedActiveMap: Record<string, { theory: Subject[]; practical: Subject[] }>) => {
    try {
      setCourseSubjectsMap(updatedActiveMap);
      localStorage.setItem("vtu_course_subjects_map", JSON.stringify(updatedActiveMap));

      setAllSemMap((prevMaster) => {
        const newMaster = {
          ...prevMaster,
          [semKey]: updatedActiveMap,
        };
        localStorage.setItem("vtu_semester_course_subjects_map", JSON.stringify(newMaster));
        return newMaster;
      });
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

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header with Academic Year & 7th Sem Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                {semesterTitle}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                VTU 2025 Scheme
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              VTU Scheme Document Upload & Subject Ingestion
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddSubj(!showAddSubj)}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Course Selector Tabs Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Course Scheme
            </h2>
            <span className="text-xs font-mono text-primary font-bold">
              {activeData.theory.length} Theory + {activeData.practical.length} Practical Labs
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 pb-2">
            {selectedCourses.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setActiveCourseCode(c.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeCourseCode === c.code
                    ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30"
                    : "bg-card/70 border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{c.code}</span>
                <span className="text-[10px] opacity-75 font-mono">({c.studentCount} students)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Subject Form */}
        {showAddSubj && (
          <form
            onSubmit={handleAddManualSubject}
            className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 tt-animate-fade shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">Add Subject for {activeCourseCode}</h3>
              <button
                type="button"
                onClick={() => setShowAddSubj(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Code (e.g. 1BCS304)"
                value={newSubjCode}
                onChange={(e) => setNewSubjCode(e.target.value)}
                className="h-11 px-4 text-xs font-mono rounded-xl border border-border bg-background"
                required
              />
              <input
                type="text"
                placeholder="Subject Name"
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                className="h-11 px-4 text-xs rounded-xl border border-border bg-background sm:col-span-2"
                required
              />
              <select
                value={newSubjCategory}
                onChange={(e) => {
                  const cat = e.target.value as "theory" | "practical";
                  setNewSubjCategory(cat);
                  setNewSubjHours(cat === "practical" ? 3 : 4);
                }}
                className="h-11 px-4 text-xs rounded-xl border border-border bg-background cursor-pointer"
              >
                <option value="theory">Theory (4 hrs/wk)</option>
                <option value="practical">Practical / Lab (3 hrs/wk)</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl cursor-pointer"
              >
                Save Subject
              </button>
            </div>
          </form>
        )}

        {/* Scheme File Upload Dropzone */}
        <div className="border-2 border-dashed border-primary/40 rounded-3xl p-8 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative shadow-inner">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp,.tiff,image/*"
            onChange={handleSchemeFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-xs">
              {parsingScheme ? (
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>
            <p className="text-base font-bold text-foreground">
              {parsingScheme
                ? `Extracting Subjects for ${activeCourseCode}...`
                : `Upload VTU Scheme for ${activeCourseCode} (PDF / PNG / JPG / DOCX)`}
            </p>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center space-x-3 tt-animate-fade">
            <CheckCircle2 className="h-5 w-5" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Theory and Practical Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theory Subjects */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Theory Subjects ({activeData.theory.length})</span>
              </h3>
              <span className="text-xs font-mono font-bold text-muted-foreground">{activeCourseCode}</span>
            </div>

            {activeData.theory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 text-center">
                No theory subjects extracted.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {activeData.theory.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between text-xs group hover:border-primary/40 transition"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="font-mono font-bold text-primary text-xs">{s.code}</span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{s.name}</p>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{s.weekly_hours} hrs/wk</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject("theory", idx)}
                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practical / Lab Subjects */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-[#00A3FF] uppercase tracking-wider flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Practical & Lab Subjects ({activeData.practical.length})</span>
              </h3>
              <span className="text-xs font-mono font-bold text-muted-foreground">{activeCourseCode}</span>
            </div>

            {activeData.practical.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-8 text-center">
                No practical lab subjects extracted.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {activeData.practical.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between text-xs group hover:border-[#00A3FF]/40 transition"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">{s.code}</span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{s.name}</p>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{s.weekly_hours} hrs/wk</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject("practical", idx)}
                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation with Scrolling Overscroll Transition */}
        <WizardFooter
          prevHref="/courses"
          nextHref="/faculties"
          nextLabel="Next: Department Faculties"
        />

      </div>
    </AppShell>
  );
}
