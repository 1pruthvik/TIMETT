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
  const [activeSemester, setActiveSemester] = useState<string>("3");
  const [courseSubjectsMap, setCourseSubjectsMap] = useState<
    Record<string, Record<string, { theory: Subject[]; practical: Subject[] }>>
  >({});
  const [parsingScheme, setParsingScheme] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Manual Add Subject
  const [showAddSubj, setShowAddSubj] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCategory, setNewSubjCategory] = useState<"theory" | "practical">("theory");
  const [newSubjHours, setNewSubjHours] = useState(4);

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

      // Clean up old storage key if present to avoid conflicts
      localStorage.removeItem("vtu_course_subjects_map");
      localStorage.removeItem("vtu_course_subjects_map_v2");
      localStorage.removeItem("vtu_course_subjects_map_v3");
      localStorage.removeItem("vtu_course_subjects_map_v4");
      localStorage.removeItem("vtu_course_subjects_map_v5");
      localStorage.removeItem("vtu_course_subjects_map_v6");
      localStorage.removeItem("vtu_course_subjects_map_v7");
      localStorage.removeItem("vtu_course_subjects_map_v8");
      localStorage.removeItem("vtu_course_subjects_map_v9");
      localStorage.removeItem("vtu_course_subjects_map_v10");
      localStorage.removeItem("vtu_course_subjects_map_v12");

      const savedSubjects = localStorage.getItem("vtu_course_subjects_map_v13");
      if (savedSubjects) {
        setCourseSubjectsMap(JSON.parse(savedSubjects));
      } else {
        const initialMap = {
          CSE: {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BCSL307A", name: "Project Management (with Git)", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BCS401", name: "Discrete Mathematics and Graph Theory", category: "theory", weekly_hours: 5 },
                { code: "1BCS402", name: "Database Management Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS403", name: "Computer Networks", category: "theory", weekly_hours: 4 },
                { code: "1BCS404", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BCS402", name: "Database Management Systems Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL405", name: "Algorithms Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          "CSE-AIML": {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL307x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BAI401", name: "Discrete Mathematics and Optimization Techniques", category: "theory", weekly_hours: 5 },
                { code: "1BAI402", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BAI403", name: "Database Management Systems", category: "theory", weekly_hours: 5 },
                { code: "1BAI404", name: "Machine Learning", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BAI402", name: "Design and Analysis of Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BAIL405", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          "CSE-DS": {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL307x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BAI401", name: "Discrete Mathematics and Optimization Techniques", category: "theory", weekly_hours: 5 },
                { code: "1BAI402", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BAI403", name: "Database Management Systems", category: "theory", weekly_hours: 5 },
                { code: "1BAI404", name: "Machine Learning", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BAI402", name: "Design and Analysis of Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BAIL405", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          ECE: {
            "3": {
              theory: [
                { code: "1BMATEC301", name: "Transform Techniques and Optimization Theory", category: "theory", weekly_hours: 5 },
                { code: "1BEC302", name: "Digital System Design Using Verilog", category: "theory", weekly_hours: 3 },
                { code: "1BEC303", name: "Network Analysis", category: "theory", weekly_hours: 5 },
                { code: "1BEC304", name: "Analog Electronics and Linear Integrated Circuits", category: "theory", weekly_hours: 3 },
                { code: "1BEC305", name: "Python Programming", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BEC302", name: "Digital System Design Using Verilog Lab", category: "practical", weekly_hours: 2 },
                { code: "1BECL306", name: "Analog Electronics and Linear Integrated Circuits Lab", category: "practical", weekly_hours: 2 },
                { code: "1BECL307x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BMATEC401", name: "Mathematics for Machine Learning", category: "theory", weekly_hours: 3 },
                { code: "1BEC402", name: "Applied Computer Organization and Microcontroller", category: "theory", weekly_hours: 3 },
                { code: "1BEC403", name: "Control Systems", category: "theory", weekly_hours: 5 },
                { code: "1BEC404", name: "Signals and Systems", category: "theory", weekly_hours: 3 },
                { code: "1BEC407", name: "Biology for Electrical and Electronics Engineers", category: "theory", weekly_hours: 2 },
                { code: "1BEC409", name: "Introduction to Analog Communication Systems", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BEC402", name: "Applied Computer Organization and Microcontroller Lab", category: "practical", weekly_hours: 2 },
                { code: "1BECL405", name: "Signals and Analog Communications Lab", category: "practical", weekly_hours: 2 },
                { code: "1BECL406", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          EEE: {
            "3": { theory: [], practical: [] },
            "4": {
              theory: [
                { code: "1BEE401", name: "Electric Motors", category: "theory", weekly_hours: 3 },
                { code: "1BEE402", name: "Microcontroller", category: "theory", weekly_hours: 3 },
                { code: "1BEE403", name: "Field Theory", category: "theory", weekly_hours: 5 },
                { code: "1BEE404", name: "Transmission and Distribution", category: "theory", weekly_hours: 3 },
                { code: "1BEE407", name: "Biology for Electrical Engineers", category: "theory", weekly_hours: 2 },
                { code: "1BEE409", name: "Electric Power Generation and Economics", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BEE402", name: "Microcontroller Lab", category: "practical", weekly_hours: 2 },
                { code: "1BEEL405", name: "Electric Motors Lab", category: "practical", weekly_hours: 2 },
                { code: "1BEEL406", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          ISE: {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BCSL307A", name: "Project Management (with Git)", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BCS401", name: "Discrete Mathematics and Graph Theory", category: "theory", weekly_hours: 5 },
                { code: "1BCS402", name: "Database Management Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS403", name: "Computer Networks", category: "theory", weekly_hours: 4 },
                { code: "1BCS404", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BCS402", name: "Database Management Systems Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL405", name: "Algorithms Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          "AI-DS": {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL307x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BAI401", name: "Discrete Mathematics and Optimization Techniques", category: "theory", weekly_hours: 5 },
                { code: "1BAI402", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BAI403", name: "Database Management Systems", category: "theory", weekly_hours: 5 },
                { code: "1BAI404", name: "Machine Learning", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BAI402", name: "Design and Analysis of Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BAIL405", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          "AI&DS": {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL307x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BAI401", name: "Discrete Mathematics and Optimization Techniques", category: "theory", weekly_hours: 5 },
                { code: "1BAI402", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BAI403", name: "Database Management Systems", category: "theory", weekly_hours: 5 },
                { code: "1BAI404", name: "Machine Learning", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BAI402", name: "Design and Analysis of Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BAIL405", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          AIDS: {
            "3": {
              theory: [
                { code: "1BMATCS301", name: "Probability, Distributions and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCS302", name: "Object Oriented Programming with Java", category: "theory", weekly_hours: 3 },
                { code: "1BCS303", name: "Digital Design and Computer Organization", category: "theory", weekly_hours: 4 },
                { code: "1BCS304", name: "Operating Systems", category: "theory", weekly_hours: 3 },
                { code: "1BCS305", name: "Data Structures and Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCS302", name: "Object Oriented Programming with Java Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCSL306", name: "Data Structures Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL307x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BAI401", name: "Discrete Mathematics and Optimization Techniques", category: "theory", weekly_hours: 5 },
                { code: "1BAI402", name: "Design and Analysis of Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BAI403", name: "Database Management Systems", category: "theory", weekly_hours: 5 },
                { code: "1BAI404", name: "Machine Learning", category: "theory", weekly_hours: 5 },
                { code: "1BCS407", name: "Biology for Computer Engineers", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BAI402", name: "Design and Analysis of Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BAIL405", name: "Machine Learning Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BXXL406x", name: "Ability Enhancement Course", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          ME: {
            "3": {
              theory: [
                { code: "1BMATM301", name: "Transforms and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BME302", name: "Materials Science and Metallurgy", category: "theory", weekly_hours: 3 },
                { code: "1BME303", name: "Basic Thermodynamics", category: "theory", weekly_hours: 3 },
                { code: "1BME304", name: "Mechanics of Materials", category: "theory", weekly_hours: 3 },
                { code: "1BME305", name: "Manufacturing Technology - I", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BME302", name: "Materials Science and Metallurgy Lab", category: "practical", weekly_hours: 2 },
                { code: "1BMEL306", name: "Computer Aided Machine Drawing Lab", category: "practical", weekly_hours: 4 },
                { code: "1BMEL307x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BMATM401", name: "Complex Analysis and Probability Distributions", category: "theory", weekly_hours: 3 },
                { code: "1BME402", name: "Manufacturing Technology - II", category: "theory", weekly_hours: 3 },
                { code: "1BME403", name: "Applied Thermodynamics", category: "theory", weekly_hours: 5 },
                { code: "1BME404", name: "Fluid Mechanics", category: "theory", weekly_hours: 3 },
                { code: "1BME407", name: "Biology for Engineers", category: "theory", weekly_hours: 2 },
                { code: "1BME409", name: "Kinematics of Machines", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BME402", name: "Manufacturing Technology - II Lab", category: "practical", weekly_hours: 2 },
                { code: "1BMEL405", name: "Mechanical Measurements and Metrology Lab", category: "practical", weekly_hours: 2 },
                { code: "1BMEL406x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          CIV: {
            "3": {
              theory: [
                { code: "1BMATCV301", name: "Probability and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCV302", name: "Fluid Mechanics and Hydraulic Machinery", category: "theory", weekly_hours: 3 },
                { code: "1BCV303", name: "Solid Mechanics", category: "theory", weekly_hours: 5 },
                { code: "1BCV304", name: "Building Materials and Construction Methods", category: "theory", weekly_hours: 3 },
                { code: "1BCV305", name: "Engineering Geology for Infrastructure Projects", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCV302", name: "Fluid Mechanics and Hydraulic Machinery Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCVL306", name: "Building CAD and 3D Modelling Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCVL307x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BCV401", name: "Surveying and Geospatial Techniques", category: "theory", weekly_hours: 3 },
                { code: "1BCV402", name: "Water Supply and Sanitary Engineering", category: "theory", weekly_hours: 3 },
                { code: "1BCV403", name: "Analysis of Structures", category: "theory", weekly_hours: 5 },
                { code: "1BCV404", name: "Building Information Modelling (BIM)", category: "theory", weekly_hours: 3 },
                { code: "1BCV407", name: "Biology for Civil Engineers", category: "theory", weekly_hours: 2 },
                { code: "1BCV409", name: "Concrete Technology", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BCV402", name: "Water Supply and Sanitary Engineering Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCVL405", name: "Surveying and Geospatial Engineering Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BCVL406", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          Civil: {
            "3": {
              theory: [
                { code: "1BMATCV301", name: "Probability and Statistics", category: "theory", weekly_hours: 5 },
                { code: "1BCV302", name: "Fluid Mechanics and Hydraulic Machinery", category: "theory", weekly_hours: 3 },
                { code: "1BCV303", name: "Solid Mechanics", category: "theory", weekly_hours: 5 },
                { code: "1BCV304", name: "Building Materials and Construction Methods", category: "theory", weekly_hours: 3 },
                { code: "1BCV305", name: "Engineering Geology for Infrastructure Projects", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCV302", name: "Fluid Mechanics and Hydraulic Machinery Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCVL306", name: "Building CAD and 3D Modelling Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCVL307x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BCV401", name: "Surveying and Geospatial Techniques", category: "theory", weekly_hours: 3 },
                { code: "1BCV402", name: "Water Supply and Sanitary Engineering", category: "theory", weekly_hours: 3 },
                { code: "1BCV403", name: "Analysis of Structures", category: "theory", weekly_hours: 5 },
                { code: "1BCV404", name: "Building Information Modelling (BIM)", category: "theory", weekly_hours: 3 },
                { code: "1BCV407", name: "Biology for Civil Engineers", category: "theory", weekly_hours: 2 },
                { code: "1BCV409", name: "Concrete Technology", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BCV402", name: "Water Supply and Sanitary Engineering Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCVL405", name: "Surveying and Geospatial Engineering Laboratory", category: "practical", weekly_hours: 2 },
                { code: "1BCVL406", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          CH: {
            "3": {
              theory: [
                { code: "1BMATCH301", name: "Applied Differential Calculus in Chemical Engineering", category: "theory", weekly_hours: 5 },
                { code: "1BCH302", name: "Mechanical Operations", category: "theory", weekly_hours: 3 },
                { code: "1BCH303", name: "Momentum Transfer", category: "theory", weekly_hours: 5 },
                { code: "1BCH304", name: "Process Principles and Calculations", category: "theory", weekly_hours: 3 },
                { code: "1BCH305", name: "Materials Chemistry and its Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCH302", name: "Mechanical Operations Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCHL306", name: "Momentum Transfer Lab (Professional Core Course Lab)", category: "practical", weekly_hours: 2 },
                { code: "1BCHL307x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BMATCH401", name: "Probability and Statistics for Chemical Engineering", category: "theory", weekly_hours: 3 },
                { code: "1BCH402", name: "Heat Transfer", category: "theory", weekly_hours: 3 },
                { code: "1BCH403", name: "Chemical Engineering Thermodynamics", category: "theory", weekly_hours: 4 },
                { code: "1BCH404", name: "Industrial Pollution Control and Management", category: "theory", weekly_hours: 3 },
                { code: "1BCH405", name: "Chemical Reaction Engineering-I", category: "theory", weekly_hours: 3 },
                { code: "1BRM408", name: "Program Specific Biology", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BCH402", name: "Heat Transfer Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCHL406", name: "Instrument Analysis and Pollution control lab (PCC Lab)", category: "practical", weekly_hours: 2 },
                { code: "1BCHL407", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          Chemical: {
            "3": {
              theory: [
                { code: "1BMATCH301", name: "Applied Differential Calculus in Chemical Engineering", category: "theory", weekly_hours: 5 },
                { code: "1BCH302", name: "Mechanical Operations", category: "theory", weekly_hours: 3 },
                { code: "1BCH303", name: "Momentum Transfer", category: "theory", weekly_hours: 5 },
                { code: "1BCH304", name: "Process Principles and Calculations", category: "theory", weekly_hours: 3 },
                { code: "1BCH305", name: "Materials Chemistry and its Applications", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BCH302", name: "Mechanical Operations Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCHL306", name: "Momentum Transfer Lab (Professional Core Course Lab)", category: "practical", weekly_hours: 2 },
                { code: "1BCHL307x", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BMATCH401", name: "Probability and Statistics for Chemical Engineering", category: "theory", weekly_hours: 3 },
                { code: "1BCH402", name: "Heat Transfer", category: "theory", weekly_hours: 3 },
                { code: "1BCH403", name: "Chemical Engineering Thermodynamics", category: "theory", weekly_hours: 4 },
                { code: "1BCH404", name: "Industrial Pollution Control and Management", category: "theory", weekly_hours: 3 },
                { code: "1BCH405", name: "Chemical Reaction Engineering-I", category: "theory", weekly_hours: 3 },
                { code: "1BRM408", name: "Program Specific Biology", category: "theory", weekly_hours: 2 },
              ],
              practical: [
                { code: "1BCH402", name: "Heat Transfer Lab", category: "practical", weekly_hours: 2 },
                { code: "1BCHL406", name: "Instrument Analysis and Pollution control lab (PCC Lab)", category: "practical", weekly_hours: 2 },
                { code: "1BCHL407", name: "Ability Enhancement Course Laboratory", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          BME: {
            "3": {
              theory: [
                { code: "1BBM301", name: "Transform Techniques and Fourier Series", category: "theory", weekly_hours: 5 },
                { code: "1BBM302", name: "Digital Design and HDL", category: "theory", weekly_hours: 3 },
                { code: "1BBM303", name: "Analog Electronic Circuits", category: "theory", weekly_hours: 5 },
                { code: "1BBM304", name: "Human Anatomy and Physiology", category: "theory", weekly_hours: 3 },
                { code: "1BBM305", name: "Instrumentation, Measurements and Biomedical Transducers", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BBM302", name: "Digital Design and HDL Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML306", name: "Analog Electronic Circuits Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML307", name: "Instrumentation, Measurements and Biomedical Transducers Lab", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BBM401", name: "Data Acquisition Circuits", category: "theory", weekly_hours: 3 },
                { code: "1BBM402", name: "Data Structures and Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BBM403", name: "Biomechanics", category: "theory", weekly_hours: 5 },
                { code: "1BBM404", name: "Embedded Controllers", category: "theory", weekly_hours: 3 },
                { code: "1BBM407", name: "Biology for Engineers", category: "theory", weekly_hours: 2 },
                { code: "1Bxx409", name: "Control Systems Engineering", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BBM402", name: "Data Structures and Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML405", name: "Data Acquisition Circuits Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML406", name: "Embedded Controllers Lab", category: "practical", weekly_hours: 2 },
              ],
            }
          },
          Biomedical: {
            "3": {
              theory: [
                { code: "1BBM301", name: "Transform Techniques and Fourier Series", category: "theory", weekly_hours: 5 },
                { code: "1BBM302", name: "Digital Design and HDL", category: "theory", weekly_hours: 3 },
                { code: "1BBM303", name: "Analog Electronic Circuits", category: "theory", weekly_hours: 5 },
                { code: "1BBM304", name: "Human Anatomy and Physiology", category: "theory", weekly_hours: 3 },
                { code: "1BBM305", name: "Instrumentation, Measurements and Biomedical Transducers", category: "theory", weekly_hours: 3 },
                { code: "1BMATDIP310", name: "Mathematics course for Lateral Entry Students", category: "theory", weekly_hours: 1 },
              ],
              practical: [
                { code: "1BBM302", name: "Digital Design and HDL Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML306", name: "Analog Electronic Circuits Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML307", name: "Instrumentation, Measurements and Biomedical Transducers Lab", category: "practical", weekly_hours: 2 },
              ],
            },
            "4": {
              theory: [
                { code: "1BBM401", name: "Data Acquisition Circuits", category: "theory", weekly_hours: 3 },
                { code: "1BBM402", name: "Data Structures and Algorithms", category: "theory", weekly_hours: 3 },
                { code: "1BBM403", name: "Biomechanics", category: "theory", weekly_hours: 5 },
                { code: "1BBM404", name: "Embedded Controllers", category: "theory", weekly_hours: 3 },
                { code: "1BBM407", name: "Biology for Engineers", category: "theory", weekly_hours: 2 },
                { code: "1Bxx409", name: "Control Systems Engineering", category: "theory", weekly_hours: 3 },
              ],
              practical: [
                { code: "1BBM402", name: "Data Structures and Algorithms Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML405", name: "Data Acquisition Circuits Lab", category: "practical", weekly_hours: 2 },
                { code: "1BBML406", name: "Embedded Controllers Lab", category: "practical", weekly_hours: 2 },
              ],
            }
          },
        };
        setCourseSubjectsMap(initialMap as any);
        localStorage.setItem("vtu_course_subjects_map_v13", JSON.stringify(initialMap));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSubjectsToStorage = (updatedMap: any) => {
    try {
      localStorage.setItem("vtu_course_subjects_map_v13", JSON.stringify(updatedMap));
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
          const currentCourse = prev[activeCourseCode] || {};
          const updated = {
            ...prev,
            [activeCourseCode]: {
              ...currentCourse,
              [activeSemester]: { theory: tSubjs, practical: pSubjs },
            },
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
      const currentCourse = prev[activeCourseCode] || {};
      const currentSem = currentCourse[activeSemester] || { theory: [], practical: [] };
      const updated = {
        ...prev,
        [activeCourseCode]: {
          ...currentCourse,
          [activeSemester]: {
            theory:
              newSubjCategory === "theory"
                ? [...currentSem.theory, newSubj]
                : currentSem.theory,
            practical:
              newSubjCategory === "practical"
                ? [...currentSem.practical, newSubj]
                : currentSem.practical,
          }
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
      const currentCourse = prev[activeCourseCode] || {};
      const currentSem = currentCourse[activeSemester] || { theory: [], practical: [] };
      const updated = {
        ...prev,
        [activeCourseCode]: {
          ...currentCourse,
          [activeSemester]: {
            theory:
              category === "theory"
                ? currentSem.theory.filter((_, i) => i !== index)
                : currentSem.theory,
            practical:
              category === "practical"
                ? currentSem.practical.filter((_, i) => i !== index)
                : currentSem.practical,
          }
        },
      };
      saveSubjectsToStorage(updated);
      return updated;
    });
  };

  const selectedCourses = courses.filter((c) => c.selected);
  const activeCourseData = courseSubjectsMap[activeCourseCode] || {};
  const activeData = activeCourseData[activeSemester] || { theory: [], practical: [] };

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header (No suggestions/descriptions) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            VTU Scheme Document Upload & Subject Ingestion
          </h1>

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

        {/* Semester Selector Tabs Bar */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Target Semester
          </h2>
          <div className="flex gap-2.5">
            {[
              { id: "3", label: "III Semester (3rd Sem)" },
              { id: "4", label: "IV Semester (4th Sem)" },
            ].map((sem) => (
              <button
                key={sem.id}
                type="button"
                onClick={() => setActiveSemester(sem.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSemester === sem.id
                    ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30"
                    : "bg-card/70 border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {sem.label}
              </button>
            ))}
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
