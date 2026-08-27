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
  const [activeSem, setActiveSem] = useState<"5" | "6">("5");
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

  // Initial Maps for Sem 5 and Sem 6
  const initialMapSem5: Record<string, { theory: Subject[]; practical: Subject[] }> = {
    CSE: {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3 },
        { code: "1BCS502", name: "Machine Learning", category: "theory", weekly_hours: 3 },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4 },
        { code: "1BCS504", name: "Computer Vision", category: "theory", weekly_hours: 3 },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BCSL507", name: "Web Technology Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BCS502L", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    "CSE-AIML": {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3 },
        { code: "1BAI502", name: "Artificial Intelligence", category: "theory", weekly_hours: 3 },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4 },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3 },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BAI502L", name: "Artificial Intelligence Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    "CSE-DS": {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3 },
        { code: "1BDS502", name: "No SQL Databases", category: "theory", weekly_hours: 3 },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4 },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3 },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BDS502L", name: "No SQL Databases Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    ECE: {
      theory: [
        { code: "BEC501", name: "Technological Innovation and Management Entrepreneurship", category: "theory", weekly_hours: 3 },
        { code: "BEC502", name: "Digital Signal Processing", category: "theory", weekly_hours: 3 },
        { code: "BEC503", name: "Digital Communication", category: "theory", weekly_hours: 4 },
        { code: "BEC515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BECL504", name: "Digital Communication Lab", category: "practical", weekly_hours: 2 },
        { code: "BEC502L", name: "Digital Signal Processing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    EEE: {
      theory: [
        { code: "BEE501", name: "Engineering Management and Entrepreneurship", category: "theory", weekly_hours: 3 },
        { code: "BEE502", name: "Signals & DSP", category: "theory", weekly_hours: 3 },
        { code: "BEE503", name: "Power Electronics", category: "theory", weekly_hours: 4 },
        { code: "BEE515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BEEL504", name: "Power Electronics Lab", category: "practical", weekly_hours: 2 },
        { code: "BEE502L", name: "Signals & DSP Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    ISE: {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3 },
        { code: "1BCS502", name: "Machine Learning", category: "theory", weekly_hours: 3 },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4 },
        { code: "1BIS504", name: "Full Stack Development", category: "theory", weekly_hours: 3 },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BISL507", name: "Full Stack Development Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BCS502L", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    "AI&DS": {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3 },
        { code: "1BAI502", name: "Artificial Intelligence", category: "theory", weekly_hours: 3 },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4 },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3 },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BAI502L", name: "Artificial Intelligence Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    AIDS: {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3 },
        { code: "1BAI502", name: "Artificial Intelligence", category: "theory", weekly_hours: 3 },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4 },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3 },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BAI502L", name: "Artificial Intelligence Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    ME: {
      theory: [
        { code: "BME501", name: "Industrial Management & Entrepreneurship", category: "theory", weekly_hours: 3 },
        { code: "BME502", name: "Turbo machines", category: "theory", weekly_hours: 3 },
        { code: "BME503", name: "Theory of Machines", category: "theory", weekly_hours: 4 },
        { code: "BME515x", name: "Professional Elective - I", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BME504L", name: "CNC Programming and 3-D Printing lab", category: "practical", weekly_hours: 2 },
        { code: "BME502L", name: "Turbo machines Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CIV: {
      theory: [
        { code: "BCV501", name: "Construction Management and Entrepreneurship", category: "theory", weekly_hours: 3 },
        { code: "BCV502", name: "Geotechnical Engineering", category: "theory", weekly_hours: 3 },
        { code: "BCV503", name: "Concrete Technology", category: "theory", weekly_hours: 3 },
        { code: "BCV515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BCV504", name: "Environmental Engineering Lab", category: "practical", weekly_hours: 2 },
        { code: "BCV502L", name: "Geotechnical Engineering Laboratory", category: "practical", weekly_hours: 2 },
        { code: "BCV503L", name: "Concrete Technology Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CIVIL: {
      theory: [
        { code: "BCV501", name: "Construction Management and Entrepreneurship", category: "theory", weekly_hours: 3 },
        { code: "BCV502", name: "Geotechnical Engineering", category: "theory", weekly_hours: 3 },
        { code: "BCV503", name: "Concrete Technology", category: "theory", weekly_hours: 3 },
        { code: "BCV515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BCV504", name: "Environmental Engineering Lab", category: "practical", weekly_hours: 2 },
        { code: "BCV502L", name: "Geotechnical Engineering Laboratory", category: "practical", weekly_hours: 2 },
        { code: "BCV503L", name: "Concrete Technology Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CH: {
      theory: [
        { code: "BCH501", name: "Industrial Process Management", category: "theory", weekly_hours: 3 },
        { code: "BCH502", name: "Chemical Reaction Engineering", category: "theory", weekly_hours: 3 },
        { code: "BCH503", name: "Mass Transfer Operations-I", category: "theory", weekly_hours: 4 },
        { code: "BCH515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BCHL504", name: "Mass Transfer Operations Lab-1", category: "practical", weekly_hours: 2 },
        { code: "BCH502L", name: "Chemical Reaction Engineering Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    BME: {
      theory: [
        { code: "BBM501", name: "Technological Innovation Management & Entrepreneurship", category: "theory", weekly_hours: 3 },
        { code: "BBM502", name: "Digital Signal Processing", category: "theory", weekly_hours: 3 },
        { code: "BBM503", name: "Clinical Instrumentation", category: "theory", weekly_hours: 4 },
        { code: "BBM515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3 },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2 },
      ],
      practical: [
        { code: "BBM504", name: "Clinical Instrumentation Lab", category: "practical", weekly_hours: 2 },
        { code: "BBM502L", name: "Digital Signal Processing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
  };

  const initialMapSem6: Record<string, { theory: Subject[]; practical: Subject[] }> = {
    CSE: {
      theory: [
        { code: "1BCS601", name: "Advanced Java Programming", category: "theory", weekly_hours: 3 },
        { code: "1BCS602", name: "Cryptography and Network Security", category: "theory", weekly_hours: 3 },
        { code: "1BCS603", name: "High Performance Computing", category: "theory", weekly_hours: 3 },
        { code: "1BCS604", name: "Internet of Things", category: "theory", weekly_hours: 3 },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BCSL606", name: "IoT laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BCS601L", name: "Advanced Java Programming Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    "CSE-AIML": {
      theory: [
        { code: "1BCS601", name: "Advanced Java Programming", category: "theory", weekly_hours: 3 },
        { code: "1BIS602", name: "Information and Network Security", category: "theory", weekly_hours: 3 },
        { code: "1BCI603", name: "High Performance Computing in Artificial Intelligence", category: "theory", weekly_hours: 3 },
        { code: "1BCS604", name: "Internet of Things", category: "theory", weekly_hours: 3 },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BCSL606", name: "IoT Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BCS601L", name: "Advanced Java Programming Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    "CSE-DS": {
      theory: [
        { code: "1BCS601", name: "Advanced Java Programming", category: "theory", weekly_hours: 3 },
        { code: "1BAD602", name: "Data Security & Privacy", category: "theory", weekly_hours: 3 },
        { code: "1BCS603", name: "High Performance Computing", category: "theory", weekly_hours: 3 },
        { code: "1BAD604", name: "Big Data Analytics", category: "theory", weekly_hours: 3 },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BDSL606", name: "Big Data Analytics Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BCS601L", name: "Advanced Java Programming Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    ECE: {
      theory: [
        { code: "BEC601", name: "Embedded System Design", category: "theory", weekly_hours: 3 },
        { code: "BEC602", name: "VLSI Design and Testing", category: "theory", weekly_hours: 4 },
        { code: "BEC613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BEC654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "BECL606", name: "VLSI Design and Testing Lab", category: "practical", weekly_hours: 2 },
        { code: "BEC657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BEC601L", name: "Embedded System Design Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    EEE: {
      theory: [
        { code: "BEE601", name: "Power system Analysis - I", category: "theory", weekly_hours: 3 },
        { code: "BEE602", name: "Control Systems", category: "theory", weekly_hours: 4 },
        { code: "BEE613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BEE654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "BEEL606", name: "Control System Lab", category: "practical", weekly_hours: 2 },
        { code: "BEE657x", name: "Ability Enhancement Course/Skill Development Course - V", category: "practical", weekly_hours: 2 },
        { code: "BEE601L", name: "Power system Analysis - I Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    ISE: {
      theory: [
        { code: "1BIS601", name: "Big Data analytics", category: "theory", weekly_hours: 3 },
        { code: "1BIS602", name: "Information and Network Security", category: "theory", weekly_hours: 3 },
        { code: "1BIS603", name: "Data Science and Visualization", category: "theory", weekly_hours: 3 },
        { code: "1BIS604", name: "Cloud Computing and Applications", category: "theory", weekly_hours: 3 },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BISL606", name: "Data Science and Visualization Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BIS601L", name: "Big Data Analytics Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    "AI&DS": {
      theory: [
        { code: "1BAD601", name: "Natural Language Processing", category: "theory", weekly_hours: 3 },
        { code: "1BAD602", name: "Data Security & Privacy", category: "theory", weekly_hours: 3 },
        { code: "1BAI603", name: "Deep Learning", category: "theory", weekly_hours: 3 },
        { code: "1BAD604", name: "Big Data Analytics", category: "theory", weekly_hours: 3 },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BAIL606", name: "Deep Learning Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BAD601L", name: "Natural Language Processing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    AIDS: {
      theory: [
        { code: "1BAD601", name: "Natural Language Processing", category: "theory", weekly_hours: 3 },
        { code: "1BAD602", name: "Data Security & Privacy", category: "theory", weekly_hours: 3 },
        { code: "1BAI603", name: "Deep Learning", category: "theory", weekly_hours: 3 },
        { code: "1BAD604", name: "Big Data Analytics", category: "theory", weekly_hours: 3 },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "1BAIL606", name: "Deep Learning Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
        { code: "1BAD601L", name: "Natural Language Processing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    ME: {
      theory: [
        { code: "BME601", name: "Heat Transfer", category: "theory", weekly_hours: 3 },
        { code: "BME602", name: "Machine Design", category: "theory", weekly_hours: 4 },
        { code: "BME613x", name: "Professional Elective - II", category: "theory", weekly_hours: 3 },
        { code: "BME654x", name: "Open Elective - I", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "BMEL606L", name: "Design lab", category: "practical", weekly_hours: 2 },
        { code: "BME657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BME601L", name: "Heat Transfer Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CIV: {
      theory: [
        { code: "BCV601", name: "Design of RCC Structures", category: "theory", weekly_hours: 3 },
        { code: "BCV602", name: "Irrigation Engineering and Hydraulic Structures", category: "theory", weekly_hours: 4 },
        { code: "BCV613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BCV654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "BCVL606", name: "Software Application Lab", category: "practical", weekly_hours: 2 },
        { code: "BCV657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BCV601L", name: "Design of RCC Structures Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CIVIL: {
      theory: [
        { code: "BCV601", name: "Design of RCC Structures", category: "theory", weekly_hours: 3 },
        { code: "BCV602", name: "Irrigation Engineering and Hydraulic Structures", category: "theory", weekly_hours: 4 },
        { code: "BCV613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BCV654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
      ],
      practical: [
        { code: "BCVL606", name: "Software Application Lab", category: "practical", weekly_hours: 2 },
        { code: "BCV657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BCV601L", name: "Design of RCC Structures Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CH: {
      theory: [
        { code: "BCH601", name: "Process Equipment Design and Drawing", category: "theory", weekly_hours: 3 },
        { code: "BCH602", name: "Mass Transfer Operations-II", category: "theory", weekly_hours: 4 },
        { code: "BCH613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BCH654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1 },
      ],
      practical: [
        { code: "BCHL606", name: "Mass Transfer Operations lab-2", category: "practical", weekly_hours: 2 },
        { code: "BCH657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BCH601L", name: "Process Equipment Design and Drawing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CHE: {
      theory: [
        { code: "BCH601", name: "Process Equipment Design and Drawing", category: "theory", weekly_hours: 3 },
        { code: "BCH602", name: "Mass Transfer Operations-II", category: "theory", weekly_hours: 4 },
        { code: "BCH613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BCH654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1 },
      ],
      practical: [
        { code: "BCHL606", name: "Mass Transfer Operations lab-2", category: "practical", weekly_hours: 2 },
        { code: "BCH657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BCH601L", name: "Process Equipment Design and Drawing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    CHEMICAL: {
      theory: [
        { code: "BCH601", name: "Process Equipment Design and Drawing", category: "theory", weekly_hours: 3 },
        { code: "BCH602", name: "Mass Transfer Operations-II", category: "theory", weekly_hours: 4 },
        { code: "BCH613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BCH654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1 },
      ],
      practical: [
        { code: "BCHL606", name: "Mass Transfer Operations lab-2", category: "practical", weekly_hours: 2 },
        { code: "BCH657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BCH601L", name: "Process Equipment Design and Drawing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    BME: {
      theory: [
        { code: "BBM601", name: "Medical Image Processing", category: "theory", weekly_hours: 3 },
        { code: "BBM602", name: "Biomedical Digital Signal Processing", category: "theory", weekly_hours: 4 },
        { code: "BBM613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BBM654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1 },
      ],
      practical: [
        { code: "BBML606", name: "Biomedical DSP Lab", category: "practical", weekly_hours: 2 },
        { code: "BEI657", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BBM601L", name: "Medical Image Processing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
    BIOMEDICAL: {
      theory: [
        { code: "BBM601", name: "Medical Image Processing", category: "theory", weekly_hours: 3 },
        { code: "BBM602", name: "Biomedical Digital Signal Processing", category: "theory", weekly_hours: 4 },
        { code: "BBM613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BBM654x", name: "Open Elective Course", category: "theory", weekly_hours: 3 },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1 },
      ],
      practical: [
        { code: "BBML606", name: "Biomedical DSP Lab", category: "practical", weekly_hours: 2 },
        { code: "BEI657", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2 },
        { code: "BBM601L", name: "Medical Image Processing Laboratory", category: "practical", weekly_hours: 2 },
      ],
    },
  };

  // Helper to load subject map for active semester
  const loadMapForSem = (sem: "5" | "6") => {
    const key = sem === "6" ? "vtu_course_subjects_map_sem6" : "vtu_course_subjects_map_sem5";
    const saved = localStorage.getItem(key);
    const defaults = sem === "6" ? initialMapSem6 : initialMapSem5;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...defaults, ...parsed };
        setCourseSubjectsMap(merged);
        localStorage.setItem(key, JSON.stringify(merged));
      } catch {
        setCourseSubjectsMap(defaults as any);
        localStorage.setItem(key, JSON.stringify(defaults));
      }
    } else {
      setCourseSubjectsMap(defaults as any);
      localStorage.setItem(key, JSON.stringify(defaults));
    }
  };

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

      const active = (localStorage.getItem("vtu_active_sem") as "5" | "6") || "6";
      setActiveSem(active);
      loadMapForSem(active);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSemSwitch = (sem: "5" | "6") => {
    setActiveSem(sem);
    localStorage.setItem("vtu_active_sem", sem);
    loadMapForSem(sem);
  };

  const saveSubjectsToStorage = (updatedMap: any) => {
    try {
      const key = activeSem === "6" ? "vtu_course_subjects_map_sem6" : "vtu_course_subjects_map_sem5";
      localStorage.setItem(key, JSON.stringify(updatedMap));
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
        
        {/* Page Hero Header (No suggestions/descriptions) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            VTU Scheme Document Upload & Subject Ingestion
          </h1>

          <div className="flex items-center gap-3 shrink-0">
            {/* Semester Switcher */}
            <div className="flex items-center bg-muted p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => handleSemSwitch("5")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeSem === "5"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                5th Semester
              </button>
              <button
                type="button"
                onClick={() => handleSemSwitch("6")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeSem === "6"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                6th Semester
              </button>
            </div>

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
