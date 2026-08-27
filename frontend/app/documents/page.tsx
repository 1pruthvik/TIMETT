"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Clock,
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

// ── Official VTU 100-Series ESC-I Offerings (I Sem) ──
const VTU_ESC_100_OPTIONS = [
  { code: "1BESC104A", name: "Building Sciences & Mechanics", dept: "Civil Dept", weekly_hours: 3 },
  { code: "1BESC104B", name: "Introduction to Electrical Engineering", dept: "EEE Dept", weekly_hours: 3 },
  { code: "1BESC104C", name: "Introduction to Electronics and Communication Engineering", dept: "ECE Dept", weekly_hours: 3 },
  { code: "1BESC104D", name: "Introduction to Mechanical Engineering", dept: "ME Dept", weekly_hours: 3 },
  { code: "1BESC104E", name: "Essentials of Information Technology", dept: "CSE/IT Dept", weekly_hours: 3 },
];

// ── Official VTU 200-Series ESC-II Offerings (II Sem) ──
const VTU_ESC_200_OPTIONS = [
  { code: "1BESC204A", name: "Building Sciences & Mechanics", dept: "Civil Dept", weekly_hours: 3 },
  { code: "1BESC204B", name: "Introduction to Electrical Engineering", dept: "EEE Dept", weekly_hours: 3 },
  { code: "1BESC204C", name: "Introduction to Electronics & Communication Engineering", dept: "ECE Dept", weekly_hours: 3 },
  { code: "1BESC204D", name: "Introduction to Mechanical Engineering", dept: "ME Dept", weekly_hours: 3 },
  { code: "1BESC204E", name: "Essentials of Information Technology", dept: "CSE/IT Dept", weekly_hours: 3 },
];

// ── Official VTU Physics Cycle PSC <-> PSCL Pairs (100 Series) ──
const VTU_PSC_100_OPTIONS = [
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

// ── Official VTU Physics Cycle PSC <-> PSCL Pairs (200 Series) ──
const VTU_PSC_200_OPTIONS = [
  {
    psc: { code: "1BCIV205", name: "Engineering Mechanics", dept: "Civil Dept", weekly_hours: 3 },
    pscl: { code: "1BMEML207", name: "Mechanics and Materials Lab", dept: "Civil Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BBEE205", name: "Basics of Electrical Engineering", dept: "EEE Dept", weekly_hours: 3 },
    pscl: { code: "1BBEEL207", name: "Basic Electrical Lab", dept: "EEE Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BECE205", name: "Fundamentals of Electronics & Communication Engineering", dept: "ECE Dept", weekly_hours: 3 },
    pscl: { code: "1BECEL207", name: "Fundamentals of Electronics & Communication Engineering Lab", dept: "ECE Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEME205", name: "Elements of Mechanical Engineering", dept: "ME Dept", weekly_hours: 3 },
    pscl: { code: "1BEMEL207", name: "Elements of Mechanical Engineering Lab", dept: "ME Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEIT205", name: "Programming in C", dept: "CSE Dept", weekly_hours: 3 },
    pscl: { code: "1BPOPL207", name: "C Programming Lab", dept: "CSE Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEBT205", name: "Elements of Biotechnology and Biomimetics", dept: "BT Dept", weekly_hours: 3 },
    pscl: { code: "1BEBTL207", name: "Elements of Biotechnology Lab", dept: "BT Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BSSA205", name: "Principles of Soil Science and Agronomy", dept: "Agri Dept", weekly_hours: 3 },
    pscl: { code: "1BSSAL207", name: "Soil Science and Agronomy Field Lab", dept: "Agri Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BEAE205", name: "Elements of Aeronautical Engineering", dept: "Aero Dept", weekly_hours: 3 },
    pscl: { code: "1BEAEL207", name: "Elements of Aeronautical Engineering Lab", dept: "Aero Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BECHE205", name: "Elements of Chemical Engineering", dept: "Chem Dept", weekly_hours: 3 },
    pscl: { code: "1BECHEL207", name: "Elements of Chemical Engineering Lab", dept: "Chem Dept", weekly_hours: 2 },
  },
  {
    psc: { code: "1BETX205", name: "Technology of Textile", dept: "Textile Dept", weekly_hours: 3 },
    pscl: { code: "1BETXL207", name: "Technology of Textile Lab", dept: "Textile Dept", weekly_hours: 2 },
  },
];

// ── Official VTU Programming Language Courses (100 Series & 200 Series) ──
const VTU_PLC_100_OPTIONS = [
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

const VTU_PLC_200_OPTIONS = [
  {
    code: "1BPLC205B",
    name: "Python Programming (For CSE and allied programmes)",
    labCode: "1BPLC205B-LAB",
    labName: "Python Programming Laboratory",
    dept: "CSE Dept",
  },
  {
    code: "1BPLC205E",
    name: "Introduction to C Programming (for non-IT programmes)",
    labCode: "1BPLC205E-LAB",
    labName: "C Programming Laboratory",
    dept: "Non-IT Engg Dept",
  },
];

// Stream mapping resolver according to official VTU guidelines
export function resolveStreamType(courseCode: string): "CSE" | "ECE" | "EEE" | "ME" | "CV" {
  const upper = (courseCode || "").toUpperCase().trim();
  
  // 1. Civil Engineering Stream
  if (upper === "CV" || upper === "CIV" || upper.includes("CIVIL")) {
    return "CV";
  }

  // 2. Chemical Engineering -> Mechanical Engineering Stream
  if (upper === "CHE" || upper === "CH" || upper.includes("CHEM") || upper.includes("CHEMICAL")) {
    return "ME";
  }

  // 3. Mechanical Engineering Stream (Mechanical, Aeronautical, Automobile, etc.)
  if (
    upper === "ME" || upper === "MECH" || upper.includes("MECHANICAL") ||
    upper.includes("AERO") || upper.includes("AUTO") || upper.includes("MANUFACT") || upper.includes("ROBOT")
  ) {
    return "ME";
  }

  // 4. Biomedical Engineering -> Electrical & Electronics Engineering Stream
  if (
    upper === "BME" || upper === "BM" || upper === "BTE" ||
    upper.includes("BIOMED") || upper.includes("MEDICAL") || upper.includes("BIOMEDICAL")
  ) {
    return "EEE";
  }

  // 5. Electronics & Communication Stream
  if (
    upper === "ECE" || upper.includes("ELECTRONIC") || upper.includes("COMMUNICATION") ||
    upper === "TC" || upper === "ETE" || upper === "EI" || upper.includes("INSTRUMENT")
  ) {
    return "ECE";
  }

  // 6. Electrical & Electronics Stream
  if (upper === "EEE" || upper.includes("ELECTRICAL") || upper === "EE") {
    return "EEE";
  }

  // 7. Information Science, AI & DS, CSE & Allied -> Computer Science Engineering Stream
  if (
    upper === "ISE" || upper === "IS" || upper.includes("INFO") || upper.includes("INFORMATION") ||
    upper === "AIDS" || upper === "AI-DS" || upper === "AI_DS" || upper === "AIML" || upper === "AI" || upper === "DS" ||
    upper.includes("ARTIFICIAL") || upper.includes("DATA") || upper.includes("CYBER") || upper.includes("IOT") ||
    upper === "CSE" || upper === "CS" || upper.includes("COMPUTER") || upper.includes("SOFTWARE")
  ) {
    return "CSE";
  }

  // Default fallback: Computer Science Stream
  return "CSE";
}

// Helper to determine stream-specific fixed codes for I Sem and II Sem
function getStreamSpecificSubjects(courseCode: string, isSecondSem: boolean) {
  const stream = resolveStreamType(courseCode);

  if (isSecondSem) {
    // ── II SEMESTER (200 Series) ──
    if (stream === "ECE") {
      return {
        streamName: "ECE Stream",
        maths: { code: "1BMATE201", name: "Calculus, Laplace Transform and Numerical Techniques: EEE/ECE stream", l: 3, t: 2 },
        chemistry: { code: "1BCHEE202", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", l: 3, p: 2 },
        physics: { code: "1BPHEC202", name: "Quantum Physics and Electronic Sensors (ECE stream)", l: 3, p: 2 },
        caed: { code: "1BCEDEC203", name: "Computer-Aided Engineering Drawing for ECE stream", l: 2, p: 2 },
      };
    }
    if (stream === "EEE") {
      return {
        streamName: "EEE Stream",
        maths: { code: "1BMATE201", name: "Calculus, Laplace Transform and Numerical Techniques: EEE stream", l: 3, t: 2 },
        chemistry: { code: "1BCHEE202", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", l: 3, p: 2 },
        physics: { code: "1BPHEE202", name: "Physics of Electrical Engineering Materials (EEE stream)", l: 3, p: 2 },
        caed: { code: "1BCEDE203", name: "Computer-Aided Engineering Drawing for EEE stream", l: 2, p: 2 },
      };
    }
    if (stream === "ME") {
      return {
        streamName: "ME Stream",
        maths: { code: "1BMATM201", name: "Multivariable Calculus and Numerical Methods: ME Stream", l: 3, t: 2 },
        chemistry: { code: "1BCHEM202", name: "Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems (ME)", l: 3, p: 2 },
        physics: { code: "1BPHYM202", name: "Physics of Materials (Mech stream)", l: 3, p: 2 },
        caed: { code: "1BCEDM203", name: "Computer-Aided Engineering Drawing for ME stream", l: 2, p: 2 },
      };
    }
    if (stream === "CV") {
      return {
        streamName: "CV Stream",
        maths: { code: "1BMATC201", name: "Differential Calculus and Numerical Methods: CV Stream", l: 3, t: 2 },
        chemistry: { code: "1BCHEC202", name: "Applied Chemistry for Sustainable Structure & Material Design (CV)", l: 3, p: 2 },
        physics: { code: "1BPHYC202", name: "Physics for Sustainable Structural Systems (CV stream)", l: 3, p: 2 },
        caed: { code: "1BCEDC203", name: "Computer-Aided Engineering Drawing for CV Stream", l: 2, p: 2 },
      };
    }
    // Default: CSE Stream (CSE, ISE, AIDS, AIML)
    return {
      streamName: "CSE Stream",
      maths: { code: "1BMATS201", name: "Numerical Methods: CSE Stream", l: 3, t: 2 },
      chemistry: { code: "1BCHES202", name: "Applied Chemistry for Smart Systems (CSE)", l: 3, p: 2 },
      physics: { code: "1BPHYS202", name: "Quantum Physics and Applications (CSE stream)", l: 3, p: 2 },
      caed: { code: "1BCEDS203", name: "Computer-Aided Engineering Drawing for CSE stream", l: 2, p: 2 },
    };
  }

  // ── I SEMESTER (100 Series) ──
  if (stream === "ECE") {
    return {
      streamName: "ECE Stream",
      maths: { code: "1BMATE101", name: "Differential Calculus and Linear Algebra: EEE/ECE Stream", l: 3, t: 2 },
      physics: { code: "1BPHEC102", name: "Quantum Physics and Electronics Sensors (ECE stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEE102", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", l: 3, p: 2 },
      caed: { code: "1BCEDEC103", name: "Computer-Aided Engineering Drawing for ECE stream", l: 2, p: 2 },
    };
  }
  if (stream === "EEE") {
    return {
      streamName: "EEE Stream",
      maths: { code: "1BMATE101", name: "Differential Calculus and Linear Algebra: EEE Stream", l: 3, t: 2 },
      physics: { code: "1BPHEE102", name: "Physics of Electrical Engineering Materials (EEE stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEE102", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", l: 3, p: 2 },
      caed: { code: "1BCEDE103", name: "Computer-Aided Engineering Drawing for EEE stream", l: 2, p: 2 },
    };
  }
  if (stream === "ME") {
    return {
      streamName: "ME Stream",
      maths: { code: "1BMATM101", name: "Differential Calculus and Linear Algebra: ME Stream", l: 3, t: 2 },
      physics: { code: "1BPHYM102", name: "Physics of Materials (Mech stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEM102", name: "Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems (ME)", l: 3, p: 2 },
      caed: { code: "1BCEDM103", name: "Computer-Aided Engineering Drawing for ME stream", l: 2, p: 2 },
    };
  }
  if (stream === "CV") {
    return {
      streamName: "CV Stream",
      maths: { code: "1BMATC101", name: "Differential Calculus and Linear Algebra: CV Stream", l: 3, t: 2 },
      physics: { code: "1BPHYC102", name: "Physics for Sustainable Structural Systems (CV stream)", l: 3, p: 2 },
      chemistry: { code: "1BCHEC102", name: "Applied Chemistry for Sustainable Structure & Material Design (CV)", l: 3, p: 2 },
      caed: { code: "1BCEDC103", name: "Computer-Aided Engineering Drawing for CV Stream", l: 2, p: 2 },
    };
  }
  // Default: CSE Stream (CSE, ISE, AIDS, AIML)
  return {
    streamName: "CSE Stream",
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
  const [selectedSemType, setSelectedSemType] = useState<"odd" | "even">("odd");
  const [selectedYear, setSelectedYear] = useState<string>("1");

  // Selections map: courseCode -> { escCode?: string; pscCode?: string; plcCode?: string }
  const [courseSelections, setCourseSelections] = useState<
    Record<string, { escCode?: string; pscCode?: string; plcCode?: string }>
  >({});

  useEffect(() => {
    try {
      const savedSetup = localStorage.getItem("vtu_academic_setup");
      if (savedSetup) {
        const parsed = JSON.parse(savedSetup);
        if (parsed.selectedSemType) setSelectedSemType(parsed.selectedSemType);
        if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
      }

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

  const isSecondSem = selectedSemType === "even" || selectedYear === "2";

  const saveSelections = (updated: Record<string, { escCode?: string; pscCode?: string; plcCode?: string }>) => {
    try {
      localStorage.setItem("vtu_course_curriculum_selections", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const selectedCourses = courses.filter((c) => c.selected);
  const activeCourseObj = courses.find((c) => c.code === activeCourseCode);
  
  // In Sem 1: physics cycle takes physics group, chemistry cycle takes chemistry group.
  // In Sem 2: physics cycle (from Sem 1) takes chemistry group, chemistry cycle takes physics group.
  const isPhysGroup = !isSecondSem
    ? (activeCourseObj?.cycle || "physics") === "physics"
    : (activeCourseObj?.cycle || "physics") === "chemistry";

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
    return getStreamSpecificSubjects(activeCourseCode, isSecondSem);
  }, [activeCourseCode, isSecondSem]);

  const escOptions = isSecondSem ? VTU_ESC_200_OPTIONS : VTU_ESC_100_OPTIONS;
  const pscOptions = isSecondSem ? VTU_PSC_200_OPTIONS : VTU_PSC_100_OPTIONS;
  const plcOptions = isSecondSem ? VTU_PLC_200_OPTIONS : VTU_PLC_100_OPTIONS;

  const chosenESC = escOptions.find((e) => e.code === currentSelection.escCode);
  const chosenPSCPair = pscOptions.find((p) => p.psc.code === currentSelection.pscCode);
  const chosenPLC = plcOptions.find((p) => p.code === currentSelection.plcCode);

  // Synchronize compiled subjects map for downstream sections & CP-SAT solver
  useEffect(() => {
    if (selectedCourses.length === 0) return;
    const map: Record<string, { theory: any[]; tutorial: any[]; practical: any[] }> = {};

    selectedCourses.forEach((c) => {
      const isPhys = !isSecondSem
        ? (c.cycle || "physics") === "physics"
        : (c.cycle || "physics") === "chemistry";

      const stream = getStreamSpecificSubjects(c.code, isSecondSem);
      const sel = courseSelections[c.code] || {};
      const esc = escOptions.find((e) => e.code === sel.escCode);
      const pscPair = pscOptions.find((p) => p.psc.code === sel.pscCode);
      const plc = plcOptions.find((p) => p.code === sel.plcCode);

      if (isPhys) {
        // Physics Group Subjects
        const theory = [
          { code: stream.maths.code, name: stream.maths.name, category: "theory", weekly_hours: 3 },
          { code: stream.physics.code, name: stream.physics.name, category: "theory", weekly_hours: 3 },
          { code: stream.caed.code, name: stream.caed.name, category: "theory", weekly_hours: 2 },
          {
            code: esc ? esc.code : isSecondSem ? "1BESC204x" : "1BESC104x",
            name: esc ? esc.name : isSecondSem ? "Engineering Science Course-II (ESC-II)" : "Engineering Science Course-I (ESC-I)",
            category: "theory",
            weekly_hours: 3,
          },
          {
            code: pscPair ? pscPair.psc.code : isSecondSem ? "1Bxxx205x" : "1Bxxx105x",
            name: pscPair ? pscPair.psc.name : "Programme Specific Course (PSC)",
            category: "theory",
            weekly_hours: 3,
          },
          { code: isSecondSem ? "1BSKS206" : "1BSKS106", name: "Soft Skills", category: "theory", weekly_hours: 1 },
          { code: isSecondSem ? "1BKSK209" : "1BKSK109", name: "Samskrutika Kannada / Balake Kannada", category: "theory", weekly_hours: 1 },
        ];

        const tutorial = [
          { code: `${stream.maths.code}-TUT`, name: `${stream.maths.name} (Tutorial)`, category: "tutorial", weekly_hours: 2 },
        ];

        const practical = [
          { code: `${stream.physics.code}-LAB`, name: "Applied Physics Practical Sessions", category: "practical", weekly_hours: 2 },
          { code: `${stream.caed.code}-LAB`, name: "Computer-Aided Engineering Drawing Lab", category: "practical", weekly_hours: 2 },
          {
            code: pscPair ? pscPair.pscl.code : isSecondSem ? "1BxxxL207x" : "1BxxxL107x",
            name: pscPair ? pscPair.pscl.name : "Programme-Specific Course Lab (PSCL)",
            category: "practical",
            weekly_hours: 2,
          },
          {
            code: isSecondSem ? "1BPRJ258" : "1BIDTL158",
            name: isSecondSem ? "Interdisciplinary Project-Based Learning" : "Innovation and Design Thinking Lab (Project-based)",
            category: "practical",
            weekly_hours: 2,
          },
        ];

        map[c.code] = { theory, tutorial, practical };
      } else {
        // Chemistry Group Subjects
        const theory = [
          { code: stream.maths.code, name: stream.maths.name, category: "theory", weekly_hours: 3 },
          { code: stream.chemistry.code, name: stream.chemistry.name, category: "theory", weekly_hours: 3 },
          { code: isSecondSem ? "1BAIA203" : "1BAIA103", name: "Introduction to AI and Applications", category: "theory", weekly_hours: 3 },
          {
            code: esc ? esc.code : isSecondSem ? "1BESC204x" : "1BESC104x",
            name: esc ? esc.name : isSecondSem ? "Engineering Science Course-II (ESC-II)" : "Engineering Science Course-I (ESC-I)",
            category: "theory",
            weekly_hours: 3,
          },
          {
            code: plc ? plc.code : isSecondSem ? "1BPLC205x" : "1BPLC105x",
            name: plc ? plc.name : "Programming Language Course (PLC)",
            category: "theory",
            weekly_hours: 3,
          },
          { code: isSecondSem ? "1BENG206" : "1BENG106", name: "Communication Skills", category: "theory", weekly_hours: 1 },
          { code: isSecondSem ? "1BICO207" : "1BICO107", name: "Indian Constitution & Engineering Ethics", category: "theory", weekly_hours: 1 },
        ];

        const tutorial = [
          { code: `${stream.maths.code}-TUT`, name: `${stream.maths.name} (Tutorial)`, category: "tutorial", weekly_hours: 2 },
        ];

        const practical = [
          { code: `${stream.chemistry.code}-LAB`, name: "Applied Chemistry Laboratory", category: "practical", weekly_hours: 2 },
          {
            code: plc ? plc.labCode : isSecondSem ? "1BPLC205x-LAB" : "1BPLC105x-LAB",
            name: plc ? plc.labName : "Programming Language Practice Lab",
            category: "practical",
            weekly_hours: 2,
          },
          {
            code: isSecondSem ? "1BPRJ258" : "1BIDTL158",
            name: isSecondSem ? "Interdisciplinary Project-Based Learning" : "Innovation and Design Thinking Lab (Project-based)",
            category: "practical",
            weekly_hours: 2,
          },
        ];

        map[c.code] = { theory, tutorial, practical };
      }
    });

    try {
      localStorage.setItem("vtu_course_subjects_map", JSON.stringify(map));
    } catch (e) {
      console.error(e);
    }
  }, [selectedCourses, courseSelections, isSecondSem]);

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              VTU Curriculum & Subject Allocation
            </h1>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">
              {isSecondSem ? "II Semester" : "I Semester"} • {isPhysGroup ? "Physics Group" : "Chemistry Group"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Active Branch:</span>
              <span className="text-primary font-extrabold">{activeCourseCode}</span>
              <span className="text-muted-foreground font-normal">
                • {streamData.streamName} • ({activeCourseObj?.cycle === "chemistry" ? "Chemistry Cycle" : "Physics Cycle"})
              </span>
            </div>
          </div>
        </div>

        {/* Course Tabs Selector */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Select Degree Branch
          </h2>
          <div className="flex flex-wrap gap-2.5 pb-2">
            {selectedCourses.map((c) => {
              const stream = resolveStreamType(c.code);
              return (
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-muted/60 text-muted-foreground border border-border/40">
                    {stream}
                  </span>
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
              );
            })}
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
              
              {/* 1. Mathematics */}
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
              {isPhysGroup ? (
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

              {/* 3. CAED (Physics Group) OR Intro to AI (Chemistry Group) */}
              {isPhysGroup ? (
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
                    <span className="font-mono font-bold text-primary text-xs">
                      {isSecondSem ? "1BAIA203" : "1BAIA103"}
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      Introduction to AI and Applications
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>3 hrs/wk</span>
                  </span>
                </div>
              )}

              {/* 4. ESC Course with Selector */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary text-xs">
                    {chosenESC ? chosenESC.code : isSecondSem ? "1BESC204x" : "1BESC104x"}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                    3 hrs/wk
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {chosenESC ? chosenESC.name : isSecondSem ? "Engineering Science Course-II (ESC-II)" : "Engineering Science Course-I (ESC-I)"}
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
                  <option value="">-- Choose {isSecondSem ? "ESC-II" : "ESC-I"} Course --</option>
                  {escOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} — {opt.name} ({opt.dept})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. PSC (Physics Group) OR PLC (Chemistry Group) */}
              {isPhysGroup ? (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary text-xs">
                      {chosenPSCPair ? chosenPSCPair.psc.code : isSecondSem ? "1Bxxx205x" : "1Bxxx105x"}
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
                    {pscOptions.map((opt) => (
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
                      {chosenPLC ? chosenPLC.code : isSecondSem ? "1BPLC205x" : "1BPLC105x"}
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
                    {plcOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.code} — {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 6. Soft Skills (Physics Group) OR Communication Skills (Chemistry Group) */}
              {isPhysGroup ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">
                      {isSecondSem ? "1BSKS206" : "1BSKS106"}
                    </span>
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
                    <span className="font-mono font-bold text-primary text-xs">
                      {isSecondSem ? "1BENG206" : "1BENG106"}
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">Communication Skills</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold shrink-0 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>1 hr/wk</span>
                  </span>
                </div>
              )}

              {/* 7. Kannada (Physics Group) OR Indian Constitution (Chemistry Group) */}
              {isPhysGroup ? (
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between md:col-span-2">
                  <div className="min-w-0 pr-3">
                    <span className="font-mono font-bold text-primary text-xs">
                      {isSecondSem ? "1BKSK209 / 1BKBK209" : "1BKSK109 / 1BKBK109"}
                    </span>
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
                    <span className="font-mono font-bold text-primary text-xs">
                      {isSecondSem ? "1BICO207" : "1BICO107"}
                    </span>
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
                {isPhysGroup ? "4 Labs" : "3 Labs"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Physics Lab OR Chemistry Lab */}
              {isPhysGroup ? (
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

              {/* CAED Lab (Physics Group) OR PLC Practice Lab (Chemistry Group) */}
              {isPhysGroup ? (
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
                        {chosenPLC ? chosenPLC.labCode : isSecondSem ? "1BPLC205x-LAB" : "1BPLC105x-LAB"}
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

              {/* Auto-Paired PSCL Lab (Physics Group only) */}
              {isPhysGroup && (
                <div className="p-4 rounded-xl border border-[#00A3FF]/30 bg-[#00A3FF]/5 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">
                        {chosenPSCPair ? chosenPSCPair.pscl.code : isSecondSem ? "1BxxxL207x" : "1BxxxL107x"}
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

              {/* Innovation & Design Thinking Lab (I Sem) OR Interdisciplinary Project-Based Learning (II Sem) */}
              <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <span className="font-mono font-bold text-[#00A3FF] text-xs">
                    {isSecondSem ? "1BPRJ258" : "1BIDTL158"}
                  </span>
                  <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                    {isSecondSem
                      ? "Interdisciplinary Project-Based Learning"
                      : "Innovation and Design Thinking Lab (Project-based)"}
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
