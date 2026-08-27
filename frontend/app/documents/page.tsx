"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronDown,
  Building2,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

interface VTUCourse {
  code: string;
  name: string;
  selected: boolean;
  studentCount: number;
  cycle?: "physics" | "chemistry";
}

// ── Official VTU 1st Year (Physics Group & Chemistry Group) ESC-I Offerings ──
const VTU_ESC_OPTIONS = [
  { code: "1BESC104A", name: "Building Sciences & Mechanics", dept: "Civil Dept", weekly_hours: 3 },
  { code: "1BESC104B", name: "Introduction to Electrical Engineering", dept: "EEE Dept", weekly_hours: 3 },
  { code: "1BESC104C", name: "Introduction to Electronics and Communication Engineering", dept: "ECE Dept", weekly_hours: 3 },
  { code: "1BESC104D", name: "Introduction to Mechanical Engineering", dept: "ME Dept", weekly_hours: 3 },
  { code: "1BESC104E", name: "Essentials of Information Technology", dept: "CSE/IT Dept", weekly_hours: 3 },
];

// ── Official VTU Physics Cycle PSC <-> PSCL Pairs ──
const VTU_PSC_OPTIONS = [
  {
    psc: { code: "1BCIV105", name: "Engineering Mechanics", dept: "Civil Dept", weekly_hours: 3 },
    pscl: { code: "1BMEML107", name: "Mechanics and Materials Lab", dept: "Civil Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BBEE105", name: "Basics of Electrical Engineering", dept: "EEE Dept", weekly_hours: 3 },
    pscl: { code: "1BBEEL107", name: "Basic Electrical Lab", dept: "EEE Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BECE105", name: "Fundamentals of Electronics & Communication Engineering", dept: "ECE Dept", weekly_hours: 3 },
    pscl: { code: "1BECEL107", name: "Fundamentals of Electronics & Communication Engineering Lab", dept: "ECE Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEME105", name: "Elements of Mechanical Engineering", dept: "ME Dept", weekly_hours: 3 },
    pscl: { code: "1BEMEL107", name: "Elements of Mechanical Engineering Lab", dept: "ME Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEIT105", name: "Programming in C", dept: "CSE Dept", weekly_hours: 3 },
    pscl: { code: "1BPOPL107", name: "C Programming Lab", dept: "CSE Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEBT105", name: "Elements of Biotechnology and Biomimetics", dept: "BT Dept", weekly_hours: 3 },
    pscl: { code: "1BEBTL107", name: "Elements of Biotechnology Lab", dept: "BT Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BSSA105", name: "Principles of Soil Science and Agronomy", dept: "Agri Dept", weekly_hours: 3 },
    pscl: { code: "1BSSAL107", name: "Soil Science and Agronomy Field Lab", dept: "Agri Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEAE105", name: "Elements of Aeronautical Engineering", dept: "Aero Dept", weekly_hours: 3 },
    pscl: { code: "1BEAEL107", name: "Elements of Aeronautical Engineering Lab", dept: "Aero Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BECHE105", name: "Elements of Chemical Engineering", dept: "Chem Dept", weekly_hours: 3 },
    pscl: { code: "1BECHEL107", name: "Elements of Chemical Engineering Lab", dept: "Chem Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BETX105", name: "Technology of Textile", dept: "Textile Dept", weekly_hours: 3 },
    pscl: { code: "1BETEXL107", name: "Technology of Textile Lab", dept: "Textile Dept", weekly_hours: 2 },
  },
];

// ── Official VTU Chemistry Cycle Programming Language Courses (PLC) ──
const VTU_PLC_OPTIONS = [
  {
    code: "1BPLC105B",
    name: "Python Programming (for CSE and allied programmes)",
    labCode: "1BPLC105B-LAB",
    labName: "Python Programming Laboratory",
    dept: "CSE Dept",
  },
  {
    code: "1BPLC105E",
    name: "Introduction to C Programming (For non-IT programmes)",
    labCode: "1BPLC105E-LAB",
    labName: "C Programming Laboratory",
    dept: "Non-IT Engg Dept",
  },
];

// Helper to determine stream-specific fixed codes for Physics & Chemistry Cycles
function getStreamSpecificSubjects(courseCode: string) {
  const upper = courseCode.toUpperCase();
  
  if (upper.includes("EC") || upper === "ECE") {
    return {
      maths: { code: "1BMATE101", name: "Differential Calculus and Linear Algebra: EEE/ECE Stream", l: 3, t: 2 },
      physics: { code: "1BPHEC102", name: "Quantum Physics and Electronics Sensors (ECE stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEE102", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", l: 3, p: 2 },
      caed: { code: "1BCEDEC103", name: "Computer-Aided Engineering Drawing for ECE stream", l: 2, p: 2 },
    };
  }
  if (upper === "EEE" || upper.includes("EE")) {
    return {
      maths: { code: "1BMATE101", name: "Differential Calculus and Linear Algebra: EEE Stream", l: 3, t: 2 },
      physics: { code: "1BPHEE102", name: "Physics of Electrical Engineering Materials (EEE stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEE102", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", l: 3, p: 2 },
      caed: { code: "1BCEDE103", name: "Computer-Aided Engineering Drawing for EEE stream", l: 2, p: 2 },
    };
  }
  if (upper === "ME" || upper.includes("MECH")) {
    return {
      maths: { code: "1BMATM101", name: "Differential Calculus and Linear Algebra: ME Stream", l: 3, t: 2 },
      physics: { code: "1BPHYM102", name: "Physics of Materials (Mech stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEM102", name: "Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems (ME)", l: 3, p: 2 },
      caed: { code: "1BCEDM103", name: "Computer-Aided Engineering Drawing for ME stream", l: 2, p: 2 },
    };
  }
  if (upper === "CIV" || upper.includes("CIVIL")) {
    return {
      maths: { code: "1BMATC101", name: "Differential Calculus and Linear Algebra: CV Stream", l: 3, t: 2 },
      physics: { code: "1BPHYC102", name: "Physics for Sustainable Structural Systems (CV stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEC102", name: "Applied Chemistry for Sustainable Structure & Material Design (CV)", l: 3, p: 2 },
      caed: { code: "1BCEDC103", name: "Computer-Aided Engineering Drawing for CV Stream", l: 2, p: 2 },
    };
  }
  // Default: CSE / ISE / AI-ML / DS
  return {
    maths: { code: "1BMATS101", name: "Calculus and Linear Algebra: CSE Stream", l: 3, t: 2 },
    physics: { code: "1BPHYS102", name: "Quantum Physics and Applications (CSE stream)", l: 3, p: 2 },
    chemistry: { code: "1BCHES102", name: "Applied Chemistry for Smart Systems (CSE)", l: 3, p: 2 },
    caed: { code: "1BCEDS103", name: "Computer-Aided Engineering Drawing for CSE stream", l: 2, p: 2 },
  };
}

export default function DocumentsPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");

  // Selections map: courseCode -> { escCode?: string; pscCode?: string; plcCode?: string }
  const [courseSelections, setCourseSelections] = useState<
    Record<string, { escCode?: string; pscCode?: string; plcCode?: string }>
  >({});

  useEffect(() => {
    try {
      const savedCourses = localStorage.getItem("vtu_college_offered_courses");
      if (savedCourses) {
        const parsed: VTUCourse[] = JSON.parse(savedCourses);
        setCourses(parsed);
        const sel = parsed.find((c) => c.selected);
        if (sel) setActiveCourseCode(sel.code);
      } else {
        const defaultCourses: VTUCourse[] = [
          { code: "CSE", name: "Computer Science & Engineering", selected: true, studentCount: 180, cycle: "physics" },
          { code: "ECE", name: "Electronics & Communication Engineering", selected: true, studentCount: 120, cycle: "chemistry" },
        ];
        setCourses(defaultCourses);
      }

      const savedSelections = localStorage.getItem("vtu_course_curriculum_selections");
      if (savedSelections) {
        setCourseSelections(JSON.parse(savedSelections));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSelections = (updated: Record<string, { escCode?: string; pscCode?: string; plcCode?: string }>) => {
    try {
      localStorage.setItem("vtu_course_curriculum_selections", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const selectedCourses = courses.filter((c) => c.selected);
  const activeCourseObj = courses.find((c) => c.code === activeCourseCode);
  const activeCycle = activeCourseObj?.cycle || "physics";
  const currentSelection = courseSelections[activeCourseCode] || {};

  const handleSelectESC = (escCode: string) => {
    setCourseSelections((prev) => {
      const updated = {
        ...prev,
        [activeCourseCode]: { ...prev[activeCourseCode], escCode },
      };
      saveSelections(updated);
      return updated;
    });
  };

  const handleSelectPSC = (pscCode: string) => {
    setCourseSelections((prev) => {
      const updated = {
        ...prev,
        [activeCourseCode]: { ...prev[activeCourseCode], pscCode },
      };
      saveSelections(updated);
      return updated;
    });
  };

  const handleSelectPLC = (plcCode: string) => {
    setCourseSelections((prev) => {
      const updated = {
        ...prev,
        [activeCourseCode]: { ...prev[activeCourseCode], plcCode },
      };
      saveSelections(updated);
      return updated;
    });
  };

  // Compute active stream subjects
  const streamData = useMemo(() => {
    return getStreamSpecificSubjects(activeCourseCode);
  }, [activeCourseCode]);

  const chosenESC = VTU_ESC_OPTIONS.find((e) => e.code === currentSelection.escCode);
  const chosenPSCPair = VTU_PSC_OPTIONS.find((p) => p.psc.code === currentSelection.pscCode);
  const chosenPLC = VTU_PLC_OPTIONS.find((p) => p.code === currentSelection.plcCode);

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header (No Emojis) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              VTU Curriculum & Subject Allocation
            </h1>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">
              1st Year • {activeCycle === "physics" ? "Physics Group (I Semester)" : "Chemistry Group (I Semester)"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Active Branch:</span>
              <span className="text-primary font-extrabold">{activeCourseCode}</span>
              <span className="text-muted-foreground font-normal">
                ({activeCycle === "physics" ? "Physics Cycle" : "Chemistry Cycle"})
              </span>
            </div>
          </div>
        </div>

        {/* Course Tabs Selector (No Emojis) */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Select Degree Branch
          </h2>
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
                <span className="text-[10px] opacity-75 font-mono">({c.studentCount} std)</span>
                {c.cycle && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                      c.cycle === "physics"
                        ? "bg-primary/20 text-primary-foreground border border-primary/30"
                        : "bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/30"
                    }`}
                  >
                    {c.cycle === "physics" ? "Physics" : "Chemistry"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main 3 Blocks Layout */}
        <div className="space-y-6">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* BLOCK 1: THEORY SUBJECTS (L) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Theory Subjects (Lecture Hours)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-muted-foreground">7 Subjects</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* 1. Maths (Common to both cycles) */}
              <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <span className="font-mono font-bold text-primary text-xs">{streamData.maths.code}</span>
                  <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.maths.name}</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>3 hrs/wk</span>
                </span>
              </div>

              {/* 2. Physics OR Chemistry */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">{streamData.physics.code}</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.physics.name}</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>3 hrs/wk</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-[#00A3FF] text-xs">{streamData.chemistry.code}</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.chemistry.name}</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>3 hrs/wk</span>
                  </span>
                </div>
              )}

              {/* 3. CAED (Physics Cycle) OR Intro to AI (Chemistry Cycle) */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">{streamData.caed.code}</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.caed.name}</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>2 hrs/wk</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">1BAIA103</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">Introduction to AI and Applications</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>3 hrs/wk</span>
                  </span>
                </div>
              )}

              {/* 4. ESC-I with Selector (Common to both cycles) */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary text-xs">
                    {chosenESC ? chosenESC.code : "1BESC104x"}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                    3 hrs/wk
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {chosenESC ? chosenESC.name : "Engineering Science Course-I (ESC-I)"}
                  </p>
                  {chosenESC && (
                    <span className="text-[11px] text-muted-foreground font-mono">{chosenESC.dept}</span>
                  )}
                </div>
                <select
                  value={currentSelection.escCode || ""}
                  onChange={(e) => handleSelectESC(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-primary/30 bg-background outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose ESC-I Course --</option>
                  {VTU_ESC_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} — {opt.name} ({opt.dept})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. PSC (Physics Cycle) OR PLC (Chemistry Cycle) */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary text-xs">
                      {chosenPSCPair ? chosenPSCPair.psc.code : "1Bxxx105x"}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                      3 hrs/wk
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {chosenPSCPair ? chosenPSCPair.psc.name : "Programme Specific Course (PSC)"}
                    </p>
                    {chosenPSCPair && (
                      <span className="text-[11px] text-muted-foreground font-mono">{chosenPSCPair.psc.dept}</span>
                    )}
                  </div>
                  <select
                    value={currentSelection.pscCode || ""}
                    onChange={(e) => handleSelectPSC(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-primary/30 bg-background outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose PSC Course --</option>
                    {VTU_PSC_OPTIONS.map((opt) => (
                      <option key={opt.psc.code} value={opt.psc.code}>
                        {opt.psc.code} — {opt.psc.name} ({opt.psc.dept})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary text-xs">
                      {chosenPLC ? chosenPLC.code : "1BPLC105x"}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                      3 hrs/wk
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {chosenPLC ? chosenPLC.name : "Programming Language Course (PLC)"}
                    </p>
                    {chosenPLC && (
                      <span className="text-[11px] text-muted-foreground font-mono">{chosenPLC.dept}</span>
                    )}
                  </div>
                  <select
                    value={currentSelection.plcCode || ""}
                    onChange={(e) => handleSelectPLC(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-primary/30 bg-background outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose Programming Language (PLC) --</option>
                    {VTU_PLC_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.code} — {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 6. Soft Skills (Physics) OR Communication Skills (Chemistry) */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">1BSKS106</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">Soft Skills</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>1 hr/wk</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">1BENG106</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">Communication Skills</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>1 hr/wk</span>
                  </span>
                </div>
              )}

              {/* 7. Kannada (Physics) OR Indian Constitution (Chemistry) */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between md:col-span-2">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">1BKSK109 / 1BKBK109</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      Samskrutika Kannada / Balake Kannada
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>1 hr/wk</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between md:col-span-2">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">1BICO107</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      Indian Constitution & Engineering Ethics
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>1 hr/wk</span>
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* BLOCK 2: TUTORIAL SESSIONS (T) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>Tutorial Sessions</span>
              </h3>
              <span className="text-xs font-mono font-bold text-muted-foreground">1 Session</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <span className="font-mono font-bold text-amber-500 text-xs">
                    {streamData.maths.code}-TUT
                  </span>
                  <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                    {streamData.maths.name} (Tutorial)
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-mono font-bold shrink-0 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>2 hrs/wk</span>
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* BLOCK 3: PRACTICAL & LAB SUBJECTS (P) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-[#00A3FF] uppercase tracking-wider flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Practical & Lab Subjects</span>
              </h3>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {activeCycle === "physics" ? "4 Labs" : "3 Labs"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Physics Lab OR Chemistry Lab */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-[#00A3FF] text-xs">
                      {streamData.physics.code}-LAB
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      Applied Physics Practical Sessions
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>2 hrs/wk</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-[#00A3FF] text-xs">
                      {streamData.chemistry.code}-LAB
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      Applied Chemistry Laboratory
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>2 hrs/wk</span>
                  </span>
                </div>
              )}

              {/* CAED Lab (Physics) OR PLC Practice Lab (Chemistry) */}
              {activeCycle === "physics" ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-[#00A3FF] text-xs">
                      {streamData.caed.code}-LAB
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      Computer-Aided Engineering Drawing Lab
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>2 hrs/wk</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-[#00A3FF]/30 bg-[#00A3FF]/5 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">
                        {chosenPLC ? chosenPLC.labCode : "1BPLC105x-LAB"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#00A3FF]/20 text-[#00A3FF] font-bold">
                        Auto-Paired Lab
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      {chosenPLC ? chosenPLC.labName : "Programming Language Practice Lab"}
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>2 hrs/wk</span>
                  </span>
                </div>
              )}

              {/* Auto-Paired PSCL Lab (Physics Cycle only) */}
              {activeCycle === "physics" && (
                <div className="p-4 rounded-xl border border-[#00A3FF]/30 bg-[#00A3FF]/5 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">
                        {chosenPSCPair ? chosenPSCPair.pscl.code : "1BxxxL107x"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#00A3FF]/20 text-[#00A3FF] font-bold">
                        Auto-Paired Lab
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      {chosenPSCPair ? chosenPSCPair.pscl.name : "Programme-Specific Course Lab (PSCL)"}
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>2 hrs/wk</span>
                  </span>
                </div>
              )}

              {/* Innovation & Design Thinking Lab (Common to both cycles) */}
              <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <span className="font-mono font-bold text-[#00A3FF] text-xs">1BIDTL158</span>
                  <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                    Innovation and Design Thinking Lab (Project-based)
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold shrink-0 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>2 hrs/wk</span>
                </span>
              </div>

            </div>
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
