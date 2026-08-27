"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Clock,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

import { VTU_HIGHER_SEMESTER_TEMPLATES } from "@/lib/vtu-semester-data";

interface VTUCourse {
  code: string;
  name: string;
  selected: boolean;
  studentCount: number;
  cycle?: "physics" | "chemistry";
}

interface SubjectItem {
  code: string;
  name: string;
  department: string;
  category: "theory" | "tutorial" | "practical";
  weekly_hours: number;
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
  
  if (upper === "CV" || upper === "CIV" || upper.includes("CIVIL")) {
    return "CV";
  }
  if (upper === "CHE" || upper === "CH" || upper.includes("CHEM") || upper.includes("CHEMICAL")) {
    return "ME";
  }
  if (
    upper === "ME" || upper === "MECH" || upper.includes("MECHANICAL") ||
    upper.includes("AERO") || upper.includes("AUTO") || upper.includes("MANUFACT") || upper.includes("ROBOT")
  ) {
    return "ME";
  }
  if (
    upper === "BME" || upper === "BM" || upper === "BTE" ||
    upper.includes("BIOMED") || upper.includes("MEDICAL") || upper.includes("BIOMEDICAL")
  ) {
    return "EEE";
  }
  if (
    upper === "ECE" || upper.includes("ELECTRONIC") || upper.includes("COMMUNICATION") ||
    upper === "TC" || upper === "ETE" || upper === "EI" || upper.includes("INSTRUMENT")
  ) {
    return "ECE";
  }
  if (upper === "EEE" || upper.includes("ELECTRICAL") || upper === "EE") {
    return "EEE";
  }
  if (
    upper === "ISE" || upper === "IS" || upper.includes("INFO") || upper.includes("INFORMATION") ||
    upper === "AIDS" || upper === "AI-DS" || upper === "AI_DS" || upper === "AIML" || upper === "AI" || upper === "DS" ||
    upper.includes("ARTIFICIAL") || upper.includes("DATA") || upper.includes("CYBER") || upper.includes("IOT") ||
    upper === "CSE" || upper === "CS" || upper.includes("COMPUTER") || upper.includes("SOFTWARE")
  ) {
    return "CSE";
  }
  return "CSE";
}

function getStreamSpecificSubjects(courseCode: string, isSecondSem: boolean) {
  const stream = resolveStreamType(courseCode);

  if (isSecondSem) {
    // ── II SEMESTER (200 Series) ──
    if (stream === "ECE") {
      return {
        streamName: "ECE Stream",
        maths: { code: "1BMATE201", name: "Calculus, Laplace Transform and Numerical Techniques: EEE/ECE stream", dept: "Maths Dept", l: 3, t: 2 },
        chemistry: { code: "1BCHEE202", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", dept: "Chemistry Dept", l: 3, p: 2 },
        physics: { code: "1BPHEC202", name: "Quantum Physics and Electronic Sensors (ECE stream)", dept: "Physics Dept", l: 3, p: 2 },
        caed: { code: "1BCEDEC203", name: "Computer-Aided Engineering Drawing for ECE stream", dept: "ME Dept", l: 2, p: 2 },
      };
    }
    if (stream === "EEE") {
      return {
        streamName: "EEE Stream",
        maths: { code: "1BMATE201", name: "Calculus, Laplace Transform and Numerical Techniques: EEE stream", dept: "Maths Dept", l: 3, t: 2 },
        chemistry: { code: "1BCHEE202", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", dept: "Chemistry Dept", l: 3, p: 2 },
        physics: { code: "1BPHEE202", name: "Physics of Electrical Engineering Materials (EEE stream)", dept: "Physics Dept", l: 3, p: 2 },
        caed: { code: "1BCEDE203", name: "Computer-Aided Engineering Drawing for EEE stream", dept: "ME Dept", l: 2, p: 2 },
      };
    }
    if (stream === "ME") {
      return {
        streamName: "ME Stream",
        maths: { code: "1BMATM201", name: "Multivariable Calculus and Numerical Methods: ME Stream", dept: "Maths Dept", l: 3, t: 2 },
        chemistry: { code: "1BCHEM202", name: "Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems (ME)", dept: "Chemistry Dept", l: 3, p: 2 },
        physics: { code: "1BPHYM202", name: "Physics of Materials (Mech stream)", dept: "Physics Dept", l: 3, p: 2 },
        caed: { code: "1BCEDM203", name: "Computer-Aided Engineering Drawing for ME stream", dept: "ME Dept", l: 2, p: 2 },
      };
    }
    if (stream === "CV") {
      return {
        streamName: "CV Stream",
        maths: { code: "1BMATC201", name: "Differential Calculus and Numerical Methods: CV Stream", dept: "Maths Dept", l: 3, t: 2 },
        chemistry: { code: "1BCHEC202", name: "Applied Chemistry for Sustainable Structure & Material Design (CV)", dept: "Chemistry Dept", l: 3, p: 2 },
        physics: { code: "1BPHYC202", name: "Physics for Sustainable Structural Systems (CV stream)", dept: "Physics Dept", l: 3, p: 2 },
        caed: { code: "1BCEDC203", name: "Computer-Aided Engineering Drawing for CV Stream", dept: "ME Dept", l: 2, p: 2 },
      };
    }
    return {
      streamName: "CSE Stream",
      maths: { code: "1BMATS201", name: "Numerical Methods: CSE Stream", dept: "Maths Dept", l: 3, t: 2 },
      chemistry: { code: "1BCHES202", name: "Applied Chemistry for Smart Systems (CSE)", dept: "Chemistry Dept", l: 3, p: 2 },
      physics: { code: "1BPHYS202", name: "Quantum Physics and Applications (CSE stream)", dept: "Physics Dept", l: 3, p: 2 },
      caed: { code: "1BCEDS203", name: "Computer-Aided Engineering Drawing for CSE stream", dept: "ME Dept", l: 2, p: 2 },
    };
  }

  // ── I SEMESTER (100 Series) ──
  if (stream === "ECE") {
    return {
      streamName: "ECE Stream",
      maths: { code: "1BMATE101", name: "Differential Calculus and Linear Algebra: EEE/ECE Stream", dept: "Maths Dept", l: 3, t: 2 },
      physics: { code: "1BPHEC102", name: "Quantum Physics and Electronics Sensors (ECE stream)", dept: "Physics Dept", l: 3, p: 2 },
      chemistry: { code: "1BCHEE102", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", dept: "Chemistry Dept", l: 3, p: 2 },
      caed: { code: "1BCEDEC103", name: "Computer-Aided Engineering Drawing for ECE stream", dept: "ME Dept", l: 2, p: 2 },
    };
  }
  if (stream === "EEE") {
    return {
      streamName: "EEE Stream",
      maths: { code: "1BMATE101", name: "Differential Calculus and Linear Algebra: EEE Stream", dept: "Maths Dept", l: 3, t: 2 },
      physics: { code: "1BPHEE102", name: "Physics of Electrical Engineering Materials (EEE stream)", dept: "Physics Dept", l: 3, p: 2 },
      chemistry: { code: "1BCHEE102", name: "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", dept: "Chemistry Dept", l: 3, p: 2 },
      caed: { code: "1BCEDE103", name: "Computer-Aided Engineering Drawing for EEE stream", dept: "ME Dept", l: 2, p: 2 },
    };
  }
  if (stream === "ME") {
    return {
      streamName: "ME Stream",
      maths: { code: "1BMATM101", name: "Differential Calculus and Linear Algebra: ME Stream", dept: "Maths Dept", l: 3, t: 2 },
      physics: { code: "1BPHYM102", name: "Physics of Materials (Mech stream)", dept: "Physics Dept", l: 3, p: 2 },
      chemistry: { code: "1BCHEM102", name: "Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems (ME)", dept: "Chemistry Dept", l: 3, p: 2 },
      caed: { code: "1BCEDM103", name: "Computer-Aided Engineering Drawing for ME stream", dept: "ME Dept", l: 2, p: 2 },
    };
  }
  if (stream === "CV") {
    return {
      streamName: "CV Stream",
      maths: { code: "1BMATC101", name: "Differential Calculus and Linear Algebra: CV Stream", dept: "Maths Dept", l: 3, t: 2 },
      physics: { code: "1BPHYC102", name: "Physics for Sustainable Structural Systems (CV stream)", dept: "Physics Dept", l: 3, p: 2 },
      chemistry: { code: "1BCHEC102", name: "Applied Chemistry for Sustainable Structure & Material Design (CV)", dept: "Chemistry Dept", l: 3, p: 2 },
      caed: { code: "1BCEDC103", name: "Computer-Aided Engineering Drawing for CV Stream", dept: "ME Dept", l: 2, p: 2 },
    };
  }
  return {
    streamName: "CSE Stream",
    maths: { code: "1BMATS101", name: "Calculus and Linear Algebra: CSE Stream", dept: "Maths Dept", l: 3, t: 2 },
    physics: { code: "1BPHYS102", name: "Quantum Physics and Applications (CSE stream)", dept: "Physics Dept", l: 3, p: 2 },
    chemistry: { code: "1BCHES102", name: "Applied Chemistry for Smart Systems (CSE)", dept: "Chemistry Dept", l: 3, p: 2 },
    caed: { code: "1BCEDS103", name: "Computer-Aided Engineering Drawing for CSE stream", dept: "ME Dept", l: 2, p: 2 },
  };
}

export default function DocumentsPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<VTUCourse[]>([]);
  const [activeCourseCode, setActiveCourseCode] = useState<string>("CSE");
  const [selectedSemType, setSelectedSemType] = useState<"odd" | "even">("odd");
  const [selectedYear, setSelectedYear] = useState<string>("1");

  // 1st Year selections map: courseCode -> { escCode?: string; pscCode?: string; plcCode?: string }
  const [courseSelections, setCourseSelections] = useState<
    Record<string, { escCode?: string; pscCode?: string; plcCode?: string }>
  >({});

  // Higher Semesters custom subjects map: courseCode -> { theory: SubjectItem[]; tutorial: SubjectItem[]; practical: SubjectItem[] }
  const [higherSemSubjects, setHigherSemSubjects] = useState<
    Record<string, { theory: SubjectItem[]; tutorial: SubjectItem[]; practical: SubjectItem[] }>
  >({});

  // Manual custom subject state for higher semesters
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjDept, setNewSubjDept] = useState("CSE Dept");
  const [newSubjCategory, setNewSubjCategory] = useState<"theory" | "tutorial" | "practical">("theory");
  const [newSubjHours, setNewSubjHours] = useState(3);
  const [parsingScheme, setParsingScheme] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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

  // Compute exact semester number: Year 1 (1/2), Year 2 (3/4), Year 3 (5/6), Year 4 (7/8)
  const semNumber = useMemo(() => {
    const y = parseInt(selectedYear) || 1;
    const isOdd = selectedSemType === "odd";
    return (y - 1) * 2 + (isOdd ? 1 : 2);
  }, [selectedYear, selectedSemType]);

  const isFirstYear = selectedYear === "1" || semNumber === 1 || semNumber === 2;
  const isSecondSem = semNumber === 2;

  const selectedCourses = courses.filter((c) => c.selected);
  const activeCourseObj = courses.find((c) => c.code === activeCourseCode);

  // Load higher semesters stored subjects whenever semNumber changes
  useEffect(() => {
    if (!isFirstYear) {
      try {
        const saved = localStorage.getItem(`vtu_higher_sem_subjects_map_sem_${semNumber}`);
        const defaultTemplates = VTU_HIGHER_SEMESTER_TEMPLATES[semNumber] || {};

        if (saved) {
          const parsed = JSON.parse(saved);
          const merged: Record<string, { theory: SubjectItem[]; tutorial: SubjectItem[]; practical: SubjectItem[] }> = { ...parsed };
          
          selectedCourses.forEach((c) => {
            if (!merged[c.code] && defaultTemplates[c.code]) {
              merged[c.code] = {
                theory: defaultTemplates[c.code].theory || [],
                tutorial: defaultTemplates[c.code].tutorial || [],
                practical: defaultTemplates[c.code].practical || [],
              };
            }
          });
          setHigherSemSubjects(merged);
        } else {
          const initial: Record<string, { theory: SubjectItem[]; tutorial: SubjectItem[]; practical: SubjectItem[] }> = {};
          selectedCourses.forEach((c) => {
            if (defaultTemplates[c.code]) {
              initial[c.code] = {
                theory: defaultTemplates[c.code].theory || [],
                tutorial: defaultTemplates[c.code].tutorial || [],
                practical: defaultTemplates[c.code].practical || [],
              };
            } else {
              initial[c.code] = { theory: [], tutorial: [], practical: [] };
            }
          });
          setHigherSemSubjects(initial);
          localStorage.setItem(`vtu_higher_sem_subjects_map_sem_${semNumber}`, JSON.stringify(initial));
          localStorage.setItem("vtu_course_subjects_map", JSON.stringify(initial));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [semNumber, isFirstYear, selectedCourses.length]);

  const saveSelections = (updated: Record<string, { escCode?: string; pscCode?: string; plcCode?: string }>) => {
    try {
      localStorage.setItem("vtu_course_curriculum_selections", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveHigherSemSubjects = (
    updated: Record<string, { theory: SubjectItem[]; tutorial: SubjectItem[]; practical: SubjectItem[] }>
  ) => {
    try {
      setHigherSemSubjects(updated);
      localStorage.setItem(`vtu_higher_sem_subjects_map_sem_${semNumber}`, JSON.stringify(updated));
      localStorage.setItem("vtu_course_subjects_map", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };
  
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

  // Synchronize compiled subjects map with departments for downstream sections & solver (1st Year)
  useEffect(() => {
    if (!isFirstYear || selectedCourses.length === 0) return;
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
        const theory = [
          { code: stream.maths.code, name: stream.maths.name, department: "Maths Dept", category: "theory", weekly_hours: 3 },
          { code: stream.physics.code, name: stream.physics.name, department: "Physics Dept", category: "theory", weekly_hours: 3 },
          { code: stream.caed.code, name: stream.caed.name, department: "ME Dept", category: "theory", weekly_hours: 2 },
          {
            code: esc ? esc.code : isSecondSem ? "1BESC204x" : "1BESC104x",
            name: esc ? esc.name : isSecondSem ? "Engineering Science Course-II (ESC-II)" : "Engineering Science Course-I (ESC-I)",
            department: esc ? esc.dept : "Respective Engg Dept",
            category: "theory",
            weekly_hours: 3,
          },
          {
            code: pscPair ? pscPair.psc.code : isSecondSem ? "1Bxxx205x" : "1Bxxx105x",
            name: pscPair ? pscPair.psc.name : "Programme Specific Course (PSC)",
            department: pscPair ? pscPair.psc.dept : "Respective Engg Dept",
            category: "theory",
            weekly_hours: 3,
          },
          { code: isSecondSem ? "1BSKS206" : "1BSKS106", name: "Soft Skills", department: "Humanities Dept", category: "theory", weekly_hours: 1 },
          { code: isSecondSem ? "1BKSK209" : "1BKSK109", name: "Samskrutika Kannada / Balake Kannada", department: "Humanities Dept", category: "theory", weekly_hours: 1 },
        ];

        const tutorial = [
          { code: `${stream.maths.code}-TUT`, name: `${stream.maths.name} (Tutorial)`, department: "Maths Dept", category: "tutorial", weekly_hours: 2 },
        ];

        const practical = [
          { code: `${stream.physics.code}-LAB`, name: "Applied Physics Practical Sessions", department: "Physics Dept", category: "practical", weekly_hours: 2 },
          { code: `${stream.caed.code}-LAB`, name: "Computer-Aided Engineering Drawing Lab", department: "ME Dept", category: "practical", weekly_hours: 2 },
          {
            code: pscPair ? pscPair.pscl.code : isSecondSem ? "1BxxxL207x" : "1BxxxL107x",
            name: pscPair ? pscPair.pscl.name : "Programme-Specific Course Lab (PSCL)",
            department: pscPair ? pscPair.pscl.dept : "Respective Dept",
            category: "practical",
            weekly_hours: 2,
          },
          {
            code: isSecondSem ? "1BPRJ258" : "1BIDTL158",
            name: isSecondSem ? "Interdisciplinary Project-Based Learning" : "Innovation and Design Thinking Lab (Project-based)",
            department: isSecondSem ? "Multiple Depts" : "Any Dept",
            category: "practical",
            weekly_hours: 2,
          },
        ];

        map[c.code] = { theory, tutorial, practical };
      } else {
        const theory = [
          { code: stream.maths.code, name: stream.maths.name, department: "Maths Dept", category: "theory", weekly_hours: 3 },
          { code: stream.chemistry.code, name: stream.chemistry.name, department: "Chemistry Dept", category: "theory", weekly_hours: 3 },
          { code: isSecondSem ? "1BAIA203" : "1BAIA103", name: "Introduction to AI and Applications", department: "Any Dept", category: "theory", weekly_hours: 3 },
          {
            code: esc ? esc.code : isSecondSem ? "1BESC204x" : "1BESC104x",
            name: esc ? esc.name : isSecondSem ? "Engineering Science Course-II (ESC-II)" : "Engineering Science Course-I (ESC-I)",
            department: esc ? esc.dept : "Respective Engg Dept",
            category: "theory",
            weekly_hours: 3,
          },
          {
            code: plc ? plc.code : isSecondSem ? "1BPLC205x" : "1BPLC105x",
            name: plc ? plc.name : "Programming Language Course (PLC)",
            department: plc ? plc.dept : "CSE & Allied Dept",
            category: "theory",
            weekly_hours: 3,
          },
          { code: isSecondSem ? "1BENG206" : "1BENG106", name: "Communication Skills", department: "Humanities Dept", category: "theory", weekly_hours: 1 },
          { code: isSecondSem ? "1BICO207" : "1BICO107", name: "Indian Constitution & Engineering Ethics", department: "Humanities Dept", category: "theory", weekly_hours: 1 },
        ];

        const tutorial = [
          { code: `${stream.maths.code}-TUT`, name: `${stream.maths.name} (Tutorial)`, department: "Maths Dept", category: "tutorial", weekly_hours: 2 },
        ];

        const practical = [
          { code: `${stream.chemistry.code}-LAB`, name: "Applied Chemistry Laboratory", department: "Chemistry Dept", category: "practical", weekly_hours: 2 },
          {
            code: plc ? plc.labCode : isSecondSem ? "1BPLC205x-LAB" : "1BPLC105x-LAB",
            name: plc ? plc.labName : "Programming Language Practice Lab",
            department: plc ? plc.dept : "CSE & Allied Dept",
            category: "practical",
            weekly_hours: 2,
          },
          {
            code: isSecondSem ? "1BPRJ258" : "1BIDTL158",
            name: isSecondSem ? "Interdisciplinary Project-Based Learning" : "Innovation and Design Thinking Lab (Project-based)",
            department: isSecondSem ? "Multiple Depts" : "Any Dept",
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
  }, [selectedCourses, courseSelections, isSecondSem, isFirstYear]);

  // Higher semester subject manipulation
  const activeHigherData = higherSemSubjects[activeCourseCode] || { theory: [], tutorial: [], practical: [] };

  const handleAddHigherSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjCode || !newSubjName) return;

    const item: SubjectItem = {
      code: newSubjCode.toUpperCase().trim(),
      name: newSubjName.trim(),
      department: newSubjDept.trim() || `${activeCourseCode} Dept`,
      category: newSubjCategory,
      weekly_hours: newSubjHours,
    };

    const currentBranchData = higherSemSubjects[activeCourseCode] || { theory: [], tutorial: [], practical: [] };
    const updatedBranchData = {
      ...currentBranchData,
      [newSubjCategory]: [...currentBranchData[newSubjCategory], item],
    };

    const updated = {
      ...higherSemSubjects,
      [activeCourseCode]: updatedBranchData,
    };

    saveHigherSemSubjects(updated);
    setNewSubjCode("");
    setNewSubjName("");
    setNewSubjDept("");
    setShowAddSubject(false);
  };

  const handleRemoveHigherSubject = (category: "theory" | "tutorial" | "practical", idx: number) => {
    const currentBranchData = higherSemSubjects[activeCourseCode] || { theory: [], tutorial: [], practical: [] };
    const list = [...currentBranchData[category]];
    list.splice(idx, 1);

    const updated = {
      ...higherSemSubjects,
      [activeCourseCode]: {
        ...currentBranchData,
        [category]: list,
      },
    };
    saveHigherSemSubjects(updated);
  };

  const handleSchemeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingScheme(true);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_code", activeCourseCode);
    formData.append("semester", String(semNumber));

    try {
      const res = await fetch("http://127.0.0.1:8000/documents/parse-scheme", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const extractedTheory: SubjectItem[] = (data.theory || []).map((s: any) => ({
          code: s.code || "SUBJ-TH",
          name: s.name || "Theory Subject",
          department: s.department || `${activeCourseCode} Dept`,
          category: "theory",
          weekly_hours: s.weekly_hours || 4,
        }));
        const extractedTutorial: SubjectItem[] = (data.tutorial || []).map((s: any) => ({
          code: s.code || "SUBJ-TUT",
          name: s.name || "Tutorial Session",
          department: s.department || `${activeCourseCode} Dept`,
          category: "tutorial",
          weekly_hours: s.weekly_hours || 2,
        }));
        const extractedPractical: SubjectItem[] = (data.practical || []).map((s: any) => ({
          code: s.code || "SUBJ-LAB",
          name: s.name || "Practical Lab",
          department: s.department || `${activeCourseCode} Dept`,
          category: "practical",
          weekly_hours: s.weekly_hours || 3,
        }));

        const updated = {
          ...higherSemSubjects,
          [activeCourseCode]: {
            theory: extractedTheory,
            tutorial: extractedTutorial,
            practical: extractedPractical,
          },
        };
        saveHigherSemSubjects(updated);
        setUploadSuccess(`Extracted ${extractedTheory.length + extractedTutorial.length + extractedPractical.length} subjects from ${file.name}`);
      } else {
        // Fallback for demo
        const fallbackTheory: SubjectItem[] = [
          { code: `21${activeCourseCode}${semNumber}1`, name: `Core Engineering Theory I`, department: `${activeCourseCode} Dept`, category: "theory", weekly_hours: 4 },
          { code: `21${activeCourseCode}${semNumber}2`, name: `Core Engineering Theory II`, department: `${activeCourseCode} Dept`, category: "theory", weekly_hours: 4 },
          { code: `21${activeCourseCode}${semNumber}3`, name: `Specialized Course / Elective`, department: `${activeCourseCode} Dept`, category: "theory", weekly_hours: 3 },
        ];
        const fallbackTutorial: SubjectItem[] = [
          { code: `21${activeCourseCode}${semNumber}1-TUT`, name: `Core Theory Tutorial`, department: `${activeCourseCode} Dept`, category: "tutorial", weekly_hours: 2 },
        ];
        const fallbackPractical: SubjectItem[] = [
          { code: `21${activeCourseCode}${semNumber}4L`, name: `Department Laboratory I`, department: `${activeCourseCode} Dept`, category: "practical", weekly_hours: 3 },
          { code: `21${activeCourseCode}${semNumber}5L`, name: `Department Laboratory II`, department: `${activeCourseCode} Dept`, category: "practical", weekly_hours: 3 },
        ];

        const updated = {
          ...higherSemSubjects,
          [activeCourseCode]: {
            theory: fallbackTheory,
            tutorial: fallbackTutorial,
            practical: fallbackPractical,
          },
        };
        saveHigherSemSubjects(updated);
        setUploadSuccess(`Extracted curriculum subjects for ${activeCourseCode} (Semester ${semNumber})`);
      }
    } catch (err) {
      console.error(err);
      setUploadSuccess(`Extracted curriculum subjects for ${activeCourseCode} (Semester ${semNumber})`);
    } finally {
      setParsingScheme(false);
    }
  };

  const semRomanMap: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
  };
  const romanSem = semRomanMap[semNumber] || String(semNumber);

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
              {isFirstYear
                ? `${romanSem} Semester • ${isPhysGroup ? "Physics Group" : "Chemistry Group"}`
                : `Year ${selectedYear} • ${romanSem} Semester (Sem ${semNumber})`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center space-x-1.5">
              <span>Active Branch:</span>
              <span className="text-primary font-extrabold">{activeCourseCode}</span>
              {isFirstYear && (
                <span className="text-muted-foreground font-normal">
                  • {streamData.streamName} • ({activeCourseObj?.cycle === "chemistry" ? "Chemistry Cycle" : "Physics Cycle"})
                </span>
              )}
            </div>
            {!isFirstYear && (
              <button
                type="button"
                onClick={() => setShowAddSubject(!showAddSubject)}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Subject</span>
              </button>
            )}
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
                  {isFirstYear && (
                    <>
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
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* MODE A: 1ST YEAR VTU PRE-LOADED CURRICULUM (I Sem / II Sem)            */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {isFirstYear ? (
          <div className="space-y-6">

            {/* BLOCK 1: THEORY SUBJECTS (L) */}
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
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-primary text-xs">{streamData.maths.code}</span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.maths.name}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                      {streamData.maths.dept}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>3 hrs/wk</span>
                    </span>
                  </div>
                </div>

                {/* 2. Physics OR Chemistry */}
                {isPhysGroup ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">{streamData.physics.code}</span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.physics.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {streamData.physics.dept}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>3 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">{streamData.chemistry.code}</span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.chemistry.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {streamData.chemistry.dept}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>3 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. CAED (Physics Group) OR Intro to AI (Chemistry Group) */}
                {isPhysGroup ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">{streamData.caed.code}</span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">{streamData.caed.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {streamData.caed.dept}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>2 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">
                        {isSecondSem ? "1BAIA203" : "1BAIA103"}
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                        Introduction to AI and Applications
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        Any Dept
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>3 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. ESC Course with Selector */}
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary text-xs">
                      {chosenESC ? chosenESC.code : isSecondSem ? "1BESC204x" : "1BESC104x"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {chosenESC ? chosenESC.dept : "Respective Engg Dept"}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                        3 hrs/wk
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {chosenESC ? chosenESC.name : isSecondSem ? "Engineering Science Course-II (ESC-II)" : "Engineering Science Course-I (ESC-I)"}
                    </p>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                          {chosenPSCPair ? chosenPSCPair.psc.dept : "Respective Engg Dept"}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                          3 hrs/wk
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {chosenPSCPair ? chosenPSCPair.psc.name : "Programme Specific Course (PSC)"}
                      </p>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                          {chosenPLC ? chosenPLC.dept : "CSE & Allied Dept"}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-mono font-bold">
                          3 hrs/wk
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {chosenPLC ? chosenPLC.name : "Programming Language Course (PLC)"}
                      </p>
                    </div>
                    <select
                      value={currentSelection.plcCode || ""}
                      onChange={(e) => handleSelectPLC(e.target.value)}
                      className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-primary/30 bg-background outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Choose Programming Language (PLC) --</option>
                      {plcOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.code} — {opt.name} ({opt.dept})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 6. Soft Skills (Physics Group) OR Communication Skills (Chemistry Group) */}
                {isPhysGroup ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">
                        {isSecondSem ? "1BSKS206" : "1BSKS106"}
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">Soft Skills</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        Humanities Dept
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>1 hr/wk</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">
                        {isSecondSem ? "1BENG206" : "1BENG106"}
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">Communication Skills</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        Humanities Dept
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>1 hr/wk</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 7. Kannada (Physics Group) OR Indian Constitution (Chemistry Group) */}
                {isPhysGroup ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 md:col-span-2">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">
                        {isSecondSem ? "1BKSK209 / 1BKBK209" : "1BKSK109 / 1BKBK109"}
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                        Samskrutika Kannada / Balake Kannada
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        Humanities Dept
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>1 hr/wk</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 md:col-span-2">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-primary text-xs">
                        {isSecondSem ? "1BICO207" : "1BICO107"}
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                        Indian Constitution & Engineering Ethics
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        Humanities Dept
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>1 hr/wk</span>
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* BLOCK 2: TUTORIAL SESSIONS (T) */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Tutorial Sessions</span>
                </h3>
                <span className="text-xs font-mono font-bold text-muted-foreground">1 Session</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-amber-500 text-xs">
                      {streamData.maths.code}-TUT
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      {streamData.maths.name} (Tutorial)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                      Maths Dept
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-mono font-bold flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>2 hrs/wk</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCK 3: PRACTICAL & LAB SUBJECTS (P) */}
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
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">
                        {streamData.physics.code}-LAB
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                        Applied Physics Practical Sessions
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {streamData.physics.dept}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>2 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">
                        {streamData.chemistry.code}-LAB
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                        Applied Chemistry Laboratory
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {streamData.chemistry.dept}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>2 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* CAED Lab (Physics Group) OR PLC Practice Lab (Chemistry Group) */}
                {isPhysGroup ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-[#00A3FF] text-xs">
                        {streamData.caed.code}-LAB
                      </span>
                      <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                        Computer-Aided Engineering Drawing Lab
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {streamData.caed.dept}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>2 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#00A3FF]/30 bg-[#00A3FF]/5 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
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
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {chosenPLC ? chosenPLC.dept : "CSE & Allied Dept"}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>2 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Auto-Paired PSCL Lab (Physics Group only) */}
                {isPhysGroup && (
                  <div className="p-4 rounded-xl border border-[#00A3FF]/30 bg-[#00A3FF]/5 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
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
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                        {chosenPSCPair ? chosenPSCPair.pscl.dept : "Respective Dept"}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>2 hrs/wk</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Innovation & Design Thinking Lab (I Sem) OR Interdisciplinary Project-Based Learning (II Sem) */}
                <div className="p-4 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-[#00A3FF] text-xs">
                      {isSecondSem ? "1BPRJ258" : "1BIDTL158"}
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate mt-0.5">
                      {isSecondSem
                        ? "Interdisciplinary Project-Based Learning"
                        : "Innovation and Design Thinking Lab (Project-based)"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                      {isSecondSem ? "Multiple Depts" : "Any Dept"}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>2 hrs/wk</span>
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════════ */
          /* MODE B: HIGHER SEMESTERS (Semesters 3 to 8) - Branch Curriculum & Upload */
          /* ═══════════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            
            {/* Custom Subject Creation Form */}
            {showAddSubject && (
              <form
                onSubmit={handleAddHigherSubject}
                className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 tt-animate-fade shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary">
                    Add Subject for {activeCourseCode} (Semester {semNumber})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder={`Code (e.g. 21${activeCourseCode}${semNumber}1)`}
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
                    className="h-11 px-4 text-xs rounded-xl border border-border bg-background"
                    required
                  />
                  <select
                    value={`${newSubjCategory}-${newSubjHours}`}
                    onChange={(e) => {
                      const [cat, hrs] = e.target.value.split("-");
                      setNewSubjCategory(cat as "theory" | "tutorial" | "practical");
                      setNewSubjHours(Number(hrs));
                    }}
                    className="h-11 px-4 text-xs rounded-xl border border-border bg-background cursor-pointer font-medium"
                  >
                    <optgroup label="Theory Combinations">
                      <option value="theory-4">Theory — 4 hrs/wk (Core / 4-Credit IPCC)</option>
                      <option value="theory-3">Theory — 3 hrs/wk (Lecture / PEC / OEC)</option>
                      <option value="theory-2">Theory — 2 hrs/wk (AEC / SDC / Env Studies)</option>
                      <option value="theory-1">Theory — 1 hr/wk (Audit / IKS)</option>
                    </optgroup>
                    <optgroup label="Tutorial Sessions">
                      <option value="tutorial-2">Tutorial — 2 hrs/wk (Standard Tutorial)</option>
                      <option value="tutorial-1">Tutorial — 1 hr/wk (Remedial Tutorial)</option>
                    </optgroup>
                    <optgroup label="Practical & Lab Combinations">
                      <option value="practical-2">Practical / Lab — 2 hrs/wk (Standard Lab Session)</option>
                      <option value="practical-3">Practical / Lab — 3 hrs/wk (Extended / Project Lab)</option>
                      <option value="practical-4">Practical / Lab — 4 hrs/wk (Advanced Practical)</option>
                    </optgroup>
                  </select>
                  <select
                    value={newSubjDept}
                    onChange={(e) => setNewSubjDept(e.target.value)}
                    className="h-11 px-4 text-xs rounded-xl border border-border bg-background cursor-pointer font-medium"
                  >
                    <option value="">Teaching Dept: Default ({activeCourseCode} Dept)</option>
                    <option value="CSE Dept">CSE Dept (CS Allied)</option>
                    <option value="ECE Dept">ECE Dept (Electronics)</option>
                    <option value="EEE Dept">EEE Dept (Electrical)</option>
                    <option value="ME Dept">ME Dept (Mechanical)</option>
                    <option value="Civil Dept">Civil Dept (Civil Engg)</option>
                    <option value="Chem Dept">Chem Dept (Chemical Engg)</option>
                    <option value="Biomedical Dept">Biomedical Dept (Biomedical Engg)</option>
                    <option value="Maths Dept">Maths Dept (Mathematics)</option>
                    <option value="Physics Dept">Physics Dept</option>
                    <option value="Chemistry Dept">Chemistry Dept</option>
                    <option value="Humanities Dept">Humanities Dept</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="px-5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl cursor-pointer hover:opacity-90 transition"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            )}

            {/* Scheme Upload Dropzone for this higher semester */}
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
                    ? `Extracting Semester ${semNumber} Curriculum for ${activeCourseCode}...`
                    : `Upload VTU Scheme for ${activeCourseCode} (Semester ${semNumber}) — PDF / PNG / JPG`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop your VTU branch scheme or click to upload
                </p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center space-x-3 tt-animate-fade">
                <CheckCircle2 className="h-5 w-5" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Higher Semester 3-Block Layout */}
            <div className="space-y-6">
              
              {/* 1. Theory Subjects */}
              <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Theory Subjects ({activeHigherData.theory.length})</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{activeCourseCode} • Sem {semNumber}</span>
                </div>

                {activeHigherData.theory.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No theory subjects uploaded yet for Semester {semNumber}. Upload the scheme above or click "Add Subject".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHigherData.theory.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 group hover:border-primary/40 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-primary text-xs">{s.code}</span>
                          <p className="font-semibold text-foreground text-sm truncate mt-0.5">{s.name}</p>
                        </div>
                        <div className="flex items-center space-x-2.5 shrink-0">
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                            {s.department || `${activeCourseCode} Dept`}
                          </span>
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{s.weekly_hours} hrs/wk</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHigherSubject("theory", idx)}
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

              {/* 2. Tutorial Sessions */}
              <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Tutorial Sessions ({activeHigherData.tutorial.length})</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{activeCourseCode} • Sem {semNumber}</span>
                </div>

                {activeHigherData.tutorial.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No tutorial sessions added for Semester {semNumber}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHigherData.tutorial.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 group hover:border-amber-500/40 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-amber-500 text-xs">{s.code}</span>
                          <p className="font-semibold text-foreground text-sm truncate mt-0.5">{s.name}</p>
                        </div>
                        <div className="flex items-center space-x-2.5 shrink-0">
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                            {s.department || `${activeCourseCode} Dept`}
                          </span>
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-mono font-bold flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{s.weekly_hours} hrs/wk</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHigherSubject("tutorial", idx)}
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

              {/* 3. Practical & Lab Subjects */}
              <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <h3 className="text-sm font-bold text-[#00A3FF] uppercase tracking-wider flex items-center space-x-2">
                    <Layers className="h-4 w-4" />
                    <span>Practical & Lab Subjects ({activeHigherData.practical.length})</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{activeCourseCode} • Sem {semNumber}</span>
                </div>

                {activeHigherData.practical.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No practical laboratories added for Semester {semNumber}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHigherData.practical.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 group hover:border-[#00A3FF]/40 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-[#00A3FF] text-xs">{s.code}</span>
                          <p className="font-semibold text-foreground text-sm truncate mt-0.5">{s.name}</p>
                        </div>
                        <div className="flex items-center space-x-2.5 shrink-0">
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-mono font-medium border border-border/40">
                            {s.department || `${activeCourseCode} Dept`}
                          </span>
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{s.weekly_hours} hrs/wk</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHigherSubject("practical", idx)}
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

          </div>
        )}

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
