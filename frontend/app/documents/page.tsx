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
import { VTU_HIGHER_SEMESTER_TEMPLATES } from "@/lib/vtu-semester-data";

interface Subject {
  code: string;
  name: string;
  category: "theory" | "practical";
  weekly_hours: number;
  department?: string;
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
  const [activeSem, setActiveSem] = useState<string>("6");
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
  const [newSubjHours, setNewSubjHours] = useState(3);
  const [newSubjDept, setNewSubjDept] = useState("");

  // Initial Maps for Sem 5 and Sem 6
  const initialMapSem5: Record<string, { theory: Subject[]; practical: Subject[] }> = {
    CSE: {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS502", name: "Machine Learning", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4, department: "CS Allied" },
        { code: "1BCS504", name: "Computer Vision", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BCSL507", name: "Web Technology Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BCS502L", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    "CSE-AIML": {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAI502", name: "Artificial Intelligence", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4, department: "CS Allied" },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BAI502L", name: "Artificial Intelligence Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    "CSE-DS": {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BDS502", name: "No SQL Databases", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4, department: "CS Allied" },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BDS502L", name: "No SQL Databases Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    ECE: {
      theory: [
        { code: "BEC501", name: "Technological Innovation and Management Entrepreneurship", category: "theory", weekly_hours: 3, department: "ECE/ETE" },
        { code: "BEC502", name: "Digital Signal Processing", category: "theory", weekly_hours: 3, department: "ECE/ETE" },
        { code: "BEC503", name: "Digital Communication", category: "theory", weekly_hours: 4, department: "ECE/ETE" },
        { code: "BEC515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "ECE/ETE" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BECL504", name: "Digital Communication Lab", category: "practical", weekly_hours: 2, department: "ECE/ETE" },
        { code: "BEC502L", name: "Digital Signal Processing Laboratory", category: "practical", weekly_hours: 2, department: "ECE/ETE" },
      ],
    },
    EEE: {
      theory: [
        { code: "BEE501", name: "Engineering Management and Entrepreneurship", category: "theory", weekly_hours: 3, department: "EEE" },
        { code: "BEE502", name: "Signals & DSP", category: "theory", weekly_hours: 3, department: "EEE" },
        { code: "BEE503", name: "Power Electronics", category: "theory", weekly_hours: 4, department: "EEE" },
        { code: "BEE515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "EEE" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BEEL504", name: "Power Electronics Lab", category: "practical", weekly_hours: 2, department: "EEE" },
        { code: "BEE502L", name: "Signals & DSP Laboratory", category: "practical", weekly_hours: 2, department: "EEE" },
      ],
    },
    ISE: {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS502", name: "Machine Learning", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4, department: "CS Allied" },
        { code: "1BIS504", name: "Full Stack Development", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BISL507", name: "Full Stack Development Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BCS502L", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    "AI&DS": {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAI502", name: "Artificial Intelligence", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4, department: "CS Allied" },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BAI502L", name: "Artificial Intelligence Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    AIDS: {
      theory: [
        { code: "1BCS501", name: "Software Engineering and Project Management", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAI502", name: "Artificial Intelligence", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS503", name: "Theory of Computation", category: "theory", weekly_hours: 4, department: "CS Allied" },
        { code: "1BAI504", name: "Computer Networks", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX505x", name: "Professional Elective Course-I", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BAIL507", name: "Data Visualization Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BAI502L", name: "Artificial Intelligence Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    ME: {
      theory: [
        { code: "BME501", name: "Industrial Management & Entrepreneurship", category: "theory", weekly_hours: 3, department: "ME" },
        { code: "BME502", name: "Turbo machines", category: "theory", weekly_hours: 3, department: "ME" },
        { code: "BME503", name: "Theory of Machines", category: "theory", weekly_hours: 4, department: "ME" },
        { code: "BME515x", name: "Professional Elective - I", category: "theory", weekly_hours: 3, department: "ME" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BME504L", name: "CNC Programming and 3-D Printing lab", category: "practical", weekly_hours: 2, department: "ME" },
        { code: "BME502L", name: "Turbo machines Laboratory", category: "practical", weekly_hours: 2, department: "ME" },
      ],
    },
    CIV: {
      theory: [
        { code: "BCV501", name: "Construction Management and Entrepreneurship", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV502", name: "Geotechnical Engineering", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV503", name: "Concrete Technology", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BCV504", name: "Environmental Engineering Lab", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV502L", name: "Geotechnical Engineering Laboratory", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV503L", name: "Concrete Technology Laboratory", category: "practical", weekly_hours: 2, department: "CIVIL" },
      ],
    },
    CIVIL: {
      theory: [
        { code: "BCV501", name: "Construction Management and Entrepreneurship", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV502", name: "Geotechnical Engineering", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV503", name: "Concrete Technology", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BCV504", name: "Environmental Engineering Lab", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV502L", name: "Geotechnical Engineering Laboratory", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV503L", name: "Concrete Technology Laboratory", category: "practical", weekly_hours: 2, department: "CIVIL" },
      ],
    },
    CH: {
      theory: [
        { code: "BCH501", name: "Industrial Process Management", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH502", name: "Chemical Reaction Engineering", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH503", name: "Mass Transfer Operations-I", category: "theory", weekly_hours: 4, department: "CHEMICAL" },
        { code: "BCH515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BCHL504", name: "Mass Transfer Operations Lab-1", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH502L", name: "Chemical Reaction Engineering Laboratory", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
      ],
    },
    BME: {
      theory: [
        { code: "BBM501", name: "Technological Innovation Management & Entrepreneurship", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BBM502", name: "Digital Signal Processing", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BBM503", name: "Clinical Instrumentation", category: "theory", weekly_hours: 4, department: "BIOMEDICAL" },
        { code: "BBM515x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BRMK557", name: "Research Methodology and IPR", category: "theory", weekly_hours: 3, department: "Humanities/Any" },
        { code: "BESK508", name: "Environmental Studies", category: "theory", weekly_hours: 2, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BBM504", name: "Clinical Instrumentation Lab", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
        { code: "BBM502L", name: "Digital Signal Processing Laboratory", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
      ],
    },
  };

  const initialMapSem6: Record<string, { theory: Subject[]; practical: Subject[] }> = {
    CSE: {
      theory: [
        { code: "1BCS601", name: "Advanced Java Programming", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS602", name: "Cryptography and Network Security", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS603", name: "High Performance Computing", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS604", name: "Internet of Things", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BCSL606", name: "IoT laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BCS601L", name: "Advanced Java Programming Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    "CSE-AIML": {
      theory: [
        { code: "1BCS601", name: "Advanced Java Programming", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BIS602", name: "Information and Network Security", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCI603", name: "High Performance Computing in Artificial Intelligence", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS604", name: "Internet of Things", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BCSL606", name: "IoT Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BCS601L", name: "Advanced Java Programming Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    "CSE-DS": {
      theory: [
        { code: "1BCS601", name: "Advanced Java Programming", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAD602", name: "Data Security & Privacy", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BCS603", name: "High Performance Computing", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAD604", name: "Big Data Analytics", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BDSL606", name: "Big Data Analytics Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BCS601L", name: "Advanced Java Programming Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    ECE: {
      theory: [
        { code: "BEC601", name: "Embedded System Design", category: "theory", weekly_hours: 3, department: "ECE/ETE" },
        { code: "BEC602", name: "VLSI Design and Testing", category: "theory", weekly_hours: 4, department: "ECE/ETE" },
        { code: "BEC613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "ECE/ETE" },
        { code: "BEC654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "ECE/ETE" },
      ],
      practical: [
        { code: "BECL606", name: "VLSI Design and Testing Lab", category: "practical", weekly_hours: 2, department: "ECE/ETE" },
        { code: "BEC657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "ECE/ETE" },
        { code: "BEC601L", name: "Embedded System Design Laboratory", category: "practical", weekly_hours: 2, department: "ECE/ETE" },
      ],
    },
    EEE: {
      theory: [
        { code: "BEE601", name: "Power system Analysis - I", category: "theory", weekly_hours: 3, department: "EEE" },
        { code: "BEE602", name: "Control Systems", category: "theory", weekly_hours: 4, department: "EEE" },
        { code: "BEE613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "EEE" },
        { code: "BEE654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "EEE" },
      ],
      practical: [
        { code: "BEEL606", name: "Control System Lab", category: "practical", weekly_hours: 2, department: "EEE" },
        { code: "BEE657x", name: "Ability Enhancement Course/Skill Development Course - V", category: "practical", weekly_hours: 2, department: "EEE" },
        { code: "BEE601L", name: "Power system Analysis - I Laboratory", category: "practical", weekly_hours: 2, department: "EEE" },
      ],
    },
    ISE: {
      theory: [
        { code: "1BIS601", name: "Big Data analytics", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BIS602", name: "Information and Network Security", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BIS603", name: "Data Science and Visualization", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BIS604", name: "Cloud Computing and Applications", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BISL606", name: "Data Science and Visualization Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BIS601L", name: "Big Data Analytics Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    "AI&DS": {
      theory: [
        { code: "1BAD601", name: "Natural Language Processing", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAD602", name: "Data Security & Privacy", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAI603", name: "Deep Learning", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAD604", name: "Big Data Analytics", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BAIL606", name: "Deep Learning Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BAD601L", name: "Natural Language Processing Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    AIDS: {
      theory: [
        { code: "1BAD601", name: "Natural Language Processing", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAD602", name: "Data Security & Privacy", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAI603", name: "Deep Learning", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BAD604", name: "Big Data Analytics", category: "theory", weekly_hours: 3, department: "CS Allied" },
        { code: "1BXX605x", name: "Professional Elective Courses-II", category: "theory", weekly_hours: 3, department: "CS Allied" },
      ],
      practical: [
        { code: "1BAIL606", name: "Deep Learning Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BXXL607x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
        { code: "1BAD601L", name: "Natural Language Processing Laboratory", category: "practical", weekly_hours: 2, department: "CS Allied" },
      ],
    },
    ME: {
      theory: [
        { code: "BME601", name: "Heat Transfer", category: "theory", weekly_hours: 3, department: "ME" },
        { code: "BME602", name: "Machine Design", category: "theory", weekly_hours: 4, department: "ME" },
        { code: "BME613x", name: "Professional Elective - II", category: "theory", weekly_hours: 3, department: "ME" },
        { code: "BME654x", name: "Open Elective - I", category: "theory", weekly_hours: 3, department: "ME" },
      ],
      practical: [
        { code: "BMEL606L", name: "Design lab", category: "practical", weekly_hours: 2, department: "ME" },
        { code: "BME657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "ME" },
        { code: "BME601L", name: "Heat Transfer Laboratory", category: "practical", weekly_hours: 2, department: "ME" },
      ],
    },
    CIV: {
      theory: [
        { code: "BCV601", name: "Design of RCC Structures", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV602", name: "Irrigation Engineering and Hydraulic Structures", category: "theory", weekly_hours: 4, department: "CIVIL" },
        { code: "BCV613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "CIVIL" },
      ],
      practical: [
        { code: "BCVL606", name: "Software Application Lab", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV601L", name: "Design of RCC Structures Laboratory", category: "practical", weekly_hours: 2, department: "CIVIL" },
      ],
    },
    CIVIL: {
      theory: [
        { code: "BCV601", name: "Design of RCC Structures", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV602", name: "Irrigation Engineering and Hydraulic Structures", category: "theory", weekly_hours: 4, department: "CIVIL" },
        { code: "BCV613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CIVIL" },
        { code: "BCV654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "CIVIL" },
      ],
      practical: [
        { code: "BCVL606", name: "Software Application Lab", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "CIVIL" },
        { code: "BCV601L", name: "Design of RCC Structures Laboratory", category: "practical", weekly_hours: 2, department: "CIVIL" },
      ],
    },
    CH: {
      theory: [
        { code: "BCH601", name: "Process Equipment Design and Drawing", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH602", name: "Mass Transfer Operations-II", category: "theory", weekly_hours: 4, department: "CHEMICAL" },
        { code: "BCH613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BCHL606", name: "Mass Transfer Operations lab-2", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH601L", name: "Process Equipment Design and Drawing Laboratory", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
      ],
    },
    CHE: {
      theory: [
        { code: "BCH601", name: "Process Equipment Design and Drawing", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH602", name: "Mass Transfer Operations-II", category: "theory", weekly_hours: 4, department: "CHEMICAL" },
        { code: "BCH613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BCHL606", name: "Mass Transfer Operations lab-2", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH601L", name: "Process Equipment Design and Drawing Laboratory", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
      ],
    },
    CHEMICAL: {
      theory: [
        { code: "BCH601", name: "Process Equipment Design and Drawing", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH602", name: "Mass Transfer Operations-II", category: "theory", weekly_hours: 4, department: "CHEMICAL" },
        { code: "BCH613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BCH654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "CHEMICAL" },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BCHL606", name: "Mass Transfer Operations lab-2", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH657x", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
        { code: "BCH601L", name: "Process Equipment Design and Drawing Laboratory", category: "practical", weekly_hours: 2, department: "CHEMICAL" },
      ],
    },
    BME: {
      theory: [
        { code: "BBM601", name: "Medical Image Processing", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BBM602", name: "Biomedical Digital Signal Processing", category: "theory", weekly_hours: 4, department: "BIOMEDICAL" },
        { code: "BBM613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BBM654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BBML606", name: "Biomedical DSP Lab", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
        { code: "BEI657", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
        { code: "BBM601L", name: "Medical Image Processing Laboratory", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
      ],
    },
    BIOMEDICAL: {
      theory: [
        { code: "BBM601", name: "Medical Image Processing", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BBM602", name: "Biomedical Digital Signal Processing", category: "theory", weekly_hours: 4, department: "BIOMEDICAL" },
        { code: "BBM613x", name: "Professional Elective Course", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BBM654x", name: "Open Elective Course", category: "theory", weekly_hours: 3, department: "BIOMEDICAL" },
        { code: "BIKS609", name: "Indian Knowledge System", category: "theory", weekly_hours: 1, department: "Humanities/Any" },
      ],
      practical: [
        { code: "BBML606", name: "Biomedical DSP Lab", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
        { code: "BEI657", name: "Ability Enhancement Course/Skill Development Course V", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
        { code: "BBM601L", name: "Medical Image Processing Laboratory", category: "practical", weekly_hours: 2, department: "BIOMEDICAL" },
      ],
    },
  };

  // Helper to load subject map for any active semester (1-8)
  const getDefaultsForSem = (semStr: string) => {
    const semNum = Number(semStr) || 6;
    const tmpl = VTU_HIGHER_SEMESTER_TEMPLATES[semNum];
    const baseDefaults = semNum % 2 === 1 ? initialMapSem5 : initialMapSem6;

    if (!tmpl) return baseDefaults;

    const result: Record<string, { theory: Subject[]; practical: Subject[] }> = {};
    
    Object.keys(tmpl).forEach((bKey) => {
      const data = tmpl[bKey];
      result[bKey] = {
        theory: (data.theory || []).map((s) => ({
          code: s.code,
          name: s.name,
          category: "theory",
          weekly_hours: s.weekly_hours || 4,
          department: s.department || (bKey.includes("ECE") ? "ECE/ETE" : bKey.includes("EEE") ? "EEE" : bKey.includes("ME") ? "ME" : bKey.includes("CIV") ? "CIVIL" : bKey.includes("CH") ? "CHEMICAL" : bKey.includes("BM") ? "BIOMEDICAL" : "CS Allied"),
        })),
        practical: (data.practical || []).map((s) => ({
          code: s.code,
          name: s.name,
          category: "practical",
          weekly_hours: s.weekly_hours || 2,
          department: s.department || (bKey.includes("ECE") ? "ECE/ETE" : bKey.includes("EEE") ? "EEE" : bKey.includes("ME") ? "ME" : bKey.includes("CIV") ? "CIVIL" : bKey.includes("CH") ? "CHEMICAL" : bKey.includes("BM") ? "BIOMEDICAL" : "CS Allied"),
        })),
      };
    });

    Object.keys(baseDefaults).forEach((cCode) => {
      if (!result[cCode]) {
        result[cCode] = baseDefaults[cCode];
      }
    });

    return result;
  };

  const loadMapForSem = (semStr: string) => {
    const key = `vtu_course_subjects_map_sem${semStr}`;
    const saved = localStorage.getItem(key);
    const defaults = getDefaultsForSem(semStr);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: any = { ...defaults };
        Object.keys(defaults).forEach((cCode) => {
          const defCourse = defaults[cCode];
          const savedCourse = parsed[cCode];
          if (savedCourse && ((savedCourse.theory && savedCourse.theory.length > 0) || (savedCourse.practical && savedCourse.practical.length > 0))) {
            merged[cCode] = {
              theory: (savedCourse.theory || []).map((s: Subject, idx: number) => ({
                ...s,
                department: s.department || defCourse?.theory?.[idx]?.department || "CS Allied",
              })),
              practical: (savedCourse.practical || []).map((s: Subject, idx: number) => ({
                ...s,
                department: s.department || defCourse?.practical?.[idx]?.department || "CS Allied",
              })),
            };
          } else {
            merged[cCode] = defCourse;
          }
        });
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

      const active = localStorage.getItem("vtu_active_sem") || "6";
      setActiveSem(active);
      loadMapForSem(active);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSemSwitch = (semStr: string) => {
    setActiveSem(semStr);
    localStorage.setItem("vtu_active_sem", semStr);
    loadMapForSem(semStr);
  };

  const saveSubjectsToStorage = (updatedMap: any) => {
    try {
      const key = `vtu_course_subjects_map_sem${activeSem}`;
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

    const defaultDept =
      newSubjDept.trim() ||
      (activeCourseCode === "ECE"
        ? "ECE/ETE"
        : activeCourseCode === "EEE"
        ? "EEE"
        : activeCourseCode === "ME"
        ? "ME"
        : activeCourseCode.includes("CIV")
        ? "CIVIL"
        : activeCourseCode.includes("CH")
        ? "CHEMICAL"
        : activeCourseCode.includes("BM")
        ? "BIOMEDICAL"
        : "CS Allied");

    const newSubj: Subject = {
      code: newSubjCode.toUpperCase().trim(),
      name: newSubjName.trim(),
      category: newSubjCategory,
      weekly_hours: Number(newSubjHours) || (newSubjCategory === "practical" ? 2 : 3),
      department: defaultDept,
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
    setNewSubjDept("");
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
            {/* Semester Switcher (1st through 8th Semesters) */}
            <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl border border-border/60 overflow-x-auto max-w-xs sm:max-w-md">
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSemSwitch(s)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${
                    activeSem === String(s)
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Sem {s}
                </button>
              ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="h-11 px-4 text-xs rounded-xl border border-border bg-background"
                required
              />
              <select
                value={`${newSubjCategory}-${newSubjHours}`}
                onChange={(e) => {
                  const [cat, hrs] = e.target.value.split("-");
                  setNewSubjCategory(cat as "theory" | "practical");
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
                <option value="">Teaching Dept: Default ({activeCourseCode})</option>
                <option value="CS Allied">CS Allied (CSE/ISE/AIML/DS)</option>
                <option value="ECE/ETE">ECE/ETE (Electronics)</option>
                <option value="EEE">EEE (Electrical)</option>
                <option value="ME">ME (Mechanical)</option>
                <option value="CIVIL">CIVIL (Civil Engg)</option>
                <option value="CHEMICAL">CHEMICAL (Chemical Engg)</option>
                <option value="BIOMEDICAL">BIOMEDICAL (Biomedical Engg)</option>
                <option value="Humanities/Any">Humanities / Any Department</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddSubj(false)}
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
                    <div className="flex items-center space-x-2.5 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold">
                        TD: {s.department || (activeCourseCode === "ECE" ? "ECE" : activeCourseCode === "EEE" ? "EEE" : activeCourseCode === "ME" ? "ME" : activeCourseCode.includes("CIV") ? "CIVIL" : activeCourseCode.includes("CH") ? "CHEMICAL" : activeCourseCode.includes("BM") ? "BIOMEDICAL" : "CS Allied")}
                      </span>
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
                    <div className="flex items-center space-x-2.5 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#00A3FF]/10 text-[#00A3FF] font-mono font-bold">
                        TD: {s.department || (activeCourseCode === "ECE" ? "ECE" : activeCourseCode === "EEE" ? "EEE" : activeCourseCode === "ME" ? "ME" : activeCourseCode.includes("CIV") ? "CIVIL" : activeCourseCode.includes("CH") ? "CHEMICAL" : activeCourseCode.includes("BM") ? "BIOMEDICAL" : "CS Allied")}
                      </span>
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
