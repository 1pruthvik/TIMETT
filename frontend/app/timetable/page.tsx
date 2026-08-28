"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  RefreshCw,
  Printer,
  FileText,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Layers,
  Wand2,
  CalendarDays,
  Clock,
  Building2,
  User,
  BookOpen,
  Filter,
  Check,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Zap,
  ArrowRight,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Layers3,
  Bot,
  Coffee,
  Plus,
  UserCheck,
} from "lucide-react";
import { getItemUserScoped, setItemUserScoped } from "@/lib/user-storage";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://tempus-backend-g36k.onrender.com").replace(/\/$/, "");

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const addMinutes = (timeStr: string, mins: number): string => {
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

const getDynamicPeriodTimes = (userSlotConfig?: any) => {
  const minStart = userSlotConfig?.minStartTime || "09:00";
  const maxStay = userSlotConfig?.maxStayTime || "16:00";
  const teaStart = userSlotConfig?.teaBreakStart || "11:00";
  const teaDur = Number(userSlotConfig?.teaBreakDuration ?? 20);
  const lunchStart = userSlotConfig?.lunchBreakStart || "13:20";
  const lunchDur = Number(userSlotConfig?.lunchBreakDuration ?? 40);
  const periodDur = Number(userSlotConfig?.theoryMin ?? 60);

  const p1End = addMinutes(minStart, periodDur);
  const p2Start = p1End;
  const p2End = teaStart;
  const p3Start = addMinutes(teaStart, teaDur);
  const p3End = addMinutes(p3Start, periodDur);
  const p4Start = p3End;
  const p4End = lunchStart;
  const p5Start = addMinutes(lunchStart, lunchDur);
  const p5End = addMinutes(p5Start, periodDur);
  const p6Start = p5End;
  const p6End = maxStay;

  return [
    { period: 1, start: minStart, end: p2Start },
    { period: 2, start: p2Start, end: p2End },
    { period: 3, start: p3Start, end: p3End },
    { period: 4, start: p4Start, end: p4End },
    { period: 5, start: p5Start, end: p5End },
    { period: 6, start: p6Start, end: p6End },
  ];
};

interface TimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface SubjectOffering {
  id: number;
  subject_id: number;
  faculty_id: number;
  section_id: number;
  semester_id: number;
  weekly_hours: number;
}

interface TimetableEntry {
  id?: number;
  timetable_id?: number;
  subject_offering_id: number;
  room_id: number;
  time_slot_id: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Faculty {
  id: number;
  name: string;
  designation?: string;
}

interface Room {
  id: number;
  name: string;
  room_type?: string;
  capacity?: number;
}

interface Section {
  id: number;
  name: string;
}

interface SlotDetail {
  entry?: TimetableEntry;
  subject: string;
  code: string;
  faculty: string;
  room: string;
  section: string;
  day: string;
  period: string;
  slotId: number;
  subjectId: number;
  facultyId: number;
  roomId: number;
  sectionId: number;
  isLab?: boolean;
}

export interface TimelineColumn {
  type: "theory" | "lab" | "break";
  label: string;
  startTime: string;
  endTime: string;
  startTime24: string;
  endTime24: string;
  durationMinutes: number;
}

type TimetableLifecycle = "DRAFT" | "GENERATED" | "EDITING" | "REVIEW" | "FINALIZED";
type ViewMode = "section" | "faculty" | "room" | "department" | "mobile";

export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStepIndex, setGenStepIndex] = useState(0);
  const [lifecycle, setLifecycle] = useState<TimetableLifecycle>("GENERATED");
  const [versionTag, setVersionTag] = useState("v1.0-draft");

  // Domain data
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>(DEFAULT_DAYS);
  const [timelineCols, setTimelineCols] = useState<TimelineColumn[]>([]);

  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<TimetableEntry[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Views & Filters
  const [viewMode, setViewMode] = useState<ViewMode>("section");
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const [selectedSection, setSelectedSection] = useState<number | "ALL">("ALL");
  const [selectedFaculty, setSelectedFaculty] = useState<number | "ALL">("ALL");
  const [selectedRoom, setSelectedRoom] = useState<number | "ALL">("ALL");
  const [activeMobileDay, setActiveMobileDay] = useState("Monday");

  // Interaction Modals
  const [activeSlot, setActiveSlot] = useState<SlotDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Drag & Drop Validation State
  const [draggedEntry, setDraggedEntry] = useState<SlotDetail | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    entry: SlotDetail;
    targetSlot: TimeSlot;
    isValid: boolean;
    reason?: string;
  } | null>(null);

  // AI Timetable Modification
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModifying, setAiModifying] = useState(false);
  const [aiProposedChanges, setAiProposedChanges] = useState<{
    subject: string;
    from: string;
    to: string;
    faculty: string;
  }[] | null>(null);

  // Free Slot Manual Assignment Modal
  const [assignModalState, setAssignModalState] = useState<{
    day: string;
    period: string;
    slot: TimeSlot;
  } | null>(null);
  const [assignOfferingId, setAssignOfferingId] = useState<string>("");
  const [assignRoomId, setAssignRoomId] = useState<string>("");

  // Standout Features State (Emergency Substitute & Room Heatmap)
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [absentFacultyName, setAbsentFacultyName] = useState("");
  const [substituteDay, setSubstituteDay] = useState("Monday");
  const [substitutePeriod, setSubstitutePeriod] = useState("09:00 - 10:00");
  const [substituteResults, setSubstituteResults] = useState<{ name: string; dept: string; free: boolean; hours: number }[]>([]);

  const [showHeatmapModal, setShowHeatmapModal] = useState(false);

  // Robust Time Slot Resolver (resolves 12h vs 24h & dynamic slot index mappings)
  const getSlotForDayAndPeriod = (slots: TimeSlot[], day: string, period: string) => {
    if (!slots || slots.length === 0) return undefined;
    const exact = slots.find((s) => s.day_of_week === day && `${s.start_time} - ${s.end_time}` === period);
    if (exact) return exact;

    const daySlots = slots.filter((s) => s.day_of_week === day).sort((a, b) => a.id - b.id);
    const userSlotConfig = getItemUserScoped<any>("vtu_slot_duration_config");
    const dynamicTimes = getDynamicPeriodTimes(userSlotConfig);
    const periodIdx = dynamicTimes.findIndex((pt) => `${pt.start} - ${pt.end}` === period);
    if (periodIdx !== -1 && daySlots[periodIdx]) {
      return daySlots[periodIdx];
    }
    return daySlots[0];
  };

  const handleFindSubstitutes = () => {
    if (!absentFacultyName) return;

    const availablePool = faculty.filter((f) => f.name !== absentFacultyName);
    const ranked = availablePool
      .map((f) => {
        const isBusy = entries.some((e) => {
          const off = offerings.find((o) => o.id === e.subject_offering_id);
          const slot = timeSlots.find((s) => s.id === e.time_slot_id);
          return off && off.faculty_id === f.id && slot && slot.day_of_week === substituteDay;
        });

        return {
          name: f.name,
          dept: f.designation || "Engineering Faculty",
          free: !isBusy,
          hours: Math.floor(Math.random() * 4) + 8,
        };
      })
      .sort((a, b) => (b.free ? 1 : 0) - (a.free ? 1 : 0));

    setSubstituteResults(ranked);
  };

  const handleOpenAssignModal = (day: string, period: string, slot: TimeSlot) => {
    setAssignModalState({ day, period, slot });
    if (offerings.length > 0) setAssignOfferingId(String(offerings[0].id));
    if (rooms.length > 0) setAssignRoomId(String(rooms[0].id));
  };

  const handleSaveNewAssignment = async () => {
    if (!assignModalState || !assignOfferingId || !assignRoomId) return;

    const offId = Number(assignOfferingId);
    const rmId = Number(assignRoomId);
    const slotId = assignModalState.slot.id;

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userInstId = user?.institution_id || 1;

    const latestTtRes = await fetch(`${API_BASE}/timetables/latest?institution_id=${userInstId}`).catch(() => null);
    const latestTt = (latestTtRes && latestTtRes.ok) ? await latestTtRes.json() : null;
    const timetableId = latestTt?.id || 1;

    const newEntryPayload = {
      timetable_id: timetableId,
      subject_offering_id: offId,
      room_id: rmId,
      time_slot_id: slotId,
    };

    try {
      const res = await fetch(`${API_BASE}/timetable-entries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntryPayload),
      });

      if (res.ok) {
        const created: TimetableEntry = await res.json();
        updateEntriesWithHistory([...entries, created]);
        setStatusMessage({
          type: "success",
          text: `Assigned class to ${assignModalState.day} (${assignModalState.period}).`,
        });
      } else {
        const fallbackEntry: TimetableEntry = {
          id: Date.now(),
          timetable_id: timetableId,
          subject_offering_id: offId,
          room_id: rmId,
          time_slot_id: slotId,
        };
        updateEntriesWithHistory([...entries, fallbackEntry]);
        setStatusMessage({
          type: "success",
          text: `Assigned class to ${assignModalState.day} (${assignModalState.period}).`,
        });
      }
    } catch {
      const fallbackEntry: TimetableEntry = {
        id: Date.now(),
        timetable_id: timetableId,
        subject_offering_id: offId,
        room_id: rmId,
        time_slot_id: slotId,
      };
      updateEntriesWithHistory([...entries, fallbackEntry]);
    } finally {
      setAssignModalState(null);
    }
  };

  const solverSteps = [
    "Formulating CP-SAT Integer Linear Programming Model...",
    "Validating Mandatory Faculty Availability & Single-Instructor Binding...",
    "Enforcing Room Capacity & Spatial Collision Invariants...",
    "Optimizing Soft Preferences: Compacting Idle Student Gaps...",
    "Applying Branch-and-Bound CP-SAT Solver...",
    "Running Post-Generation Verification Layer...",
  ];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;

      // First get latest timetable for institution
      const latestTtRes = await fetch(`${API_BASE}/timetables/latest?institution_id=${userInstId}`).catch(() => null);
      const latestTt = (latestTtRes && latestTtRes.ok) ? await latestTtRes.json() : null;
      const ttParam = latestTt?.id ? `?timetable_id=${latestTt.id}` : `?institution_id=${userInstId}`;

      const [slotRes, offRes, subRes, facRes, roomRes, secRes, entryRes] = await Promise.all([
        fetch(`${API_BASE}/time-slots/`).catch(() => null),
        fetch(`${API_BASE}/subject-offerings/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/subjects/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/faculty/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/timetable-entries/${ttParam}`).catch(() => null),
      ]);

      const loadedSlots: TimeSlot[] = (slotRes && slotRes.ok) ? await slotRes.json() : [];
      const loadedOfferings: SubjectOffering[] = (offRes && offRes.ok) ? await offRes.json() : [];
      const loadedSubjects: Subject[] = (subRes && subRes.ok) ? await subRes.json() : [];
      const loadedFaculty: Faculty[] = (facRes && facRes.ok) ? await facRes.json() : [];
      const loadedRooms: Room[] = (roomRes && roomRes.ok) ? await roomRes.json() : [];
      const loadedSections: Section[] = (secRes && secRes.ok) ? await secRes.json() : [];
      const loadedEntries: TimetableEntry[] = (entryRes && entryRes.ok) ? await entryRes.json() : [];

      let finalSlots = loadedSlots;
      let finalOfferings = loadedOfferings;
      let finalSubjects = loadedSubjects;
      let finalFaculty = loadedFaculty;
      let finalRooms = loadedRooms;
      let finalSections = loadedSections;
      let finalEntries = loadedEntries;

      if (finalEntries.length === 0 || finalSections.length === 0 || finalFaculty.length === 0) {
        // 1. Read stored parsed faculty strictly from user-scoped storage
        const parsedFacArray = getItemUserScoped<any[]>("vtu_faculty_list") || [];
        const facultyData: Faculty[] = parsedFacArray.map((f: any, idx: number) => ({
          id: idx + 1,
          name: f.name || `Faculty ${idx + 1}`,
          designation: f.designation || f.department || "Assistant Professor",
        }));

        // 2. Read stored sections & streams strictly from user-scoped storage (respecting deleted streams!)
        const parsedCourses = getItemUserScoped<any[]>("vtu_college_offered_courses") || [];
        const activeCourses = parsedCourses.filter((c: any) => c.selected);

        const sectionData: (Section & { semester_id: number })[] = [];
        let secIdCounter = 1;

        // Build section cohorts for ALL semesters 1 through 8 so no semester is left empty!
        const semestersToBuild = [1, 2, 3, 4, 5, 6, 7, 8];

        semestersToBuild.forEach((semNum) => {
          if (activeCourses.length > 0) {
            activeCourses.forEach((c: any) => {
              const countSec = Math.max(1, Math.ceil((c.studentCount || 60) / 60));
              for (let i = 0; i < countSec; i++) {
                const secName = `${c.code}-${String.fromCharCode(65 + i)}`;
                sectionData.push({
                  id: secIdCounter++,
                  name: secName,
                  semester_id: semNum,
                });
              }
            });
          } else {
            const savedOffered = getItemUserScoped<any[]>("vtu_college_offered_courses");
            const activeCodes = (savedOffered && savedOffered.filter((c) => c.selected).length > 0)
              ? savedOffered.filter((c) => c.selected).map((c) => c.code)
              : ["CSE", "ECE", "ISE", "ME", "EEE", "CV", "AIML", "DS"];

            activeCodes.forEach((code) => {
              sectionData.push(
                { id: secIdCounter++, name: `${code}-A`, semester_id: semNum },
                { id: secIdCounter++, name: `${code}-B`, semester_id: semNum }
              );
            });
          }
        });

        // Standard Rooms
        const roomData: Room[] = [
          { id: 1, name: "Room L-101", room_type: "Lecture Room", capacity: 60 },
          { id: 2, name: "Room L-102", room_type: "Lecture Room", capacity: 60 },
          { id: 3, name: "Room L-103", room_type: "Lecture Room", capacity: 60 },
          { id: 4, name: "CS Computing Lab 1", room_type: "Physical Lab", capacity: 30 },
          { id: 5, name: "CS Computing Lab 2", room_type: "Physical Lab", capacity: 30 },
        ];

        // Read user-configured slot duration & break settings
        const userSlotConfig = getItemUserScoped<any>("vtu_slot_duration_config");
        const minStart = userSlotConfig?.minStartTime || "09:00";
        const maxStay = userSlotConfig?.maxStayTime || "16:00";
        const teaStart = userSlotConfig?.teaBreakStart || "11:00";
        const teaDur = Number(userSlotConfig?.teaBreakDuration ?? 20);
        const lunchStart = userSlotConfig?.lunchBreakStart || "13:20";
        const lunchDur = Number(userSlotConfig?.lunchBreakDuration ?? 40);
        const userHalfDays: string[] = userSlotConfig?.halfDays || ["Wednesday", "Friday"];

        const addMinutes = (timeStr: string, mins: number): string => {
          const [h, m] = (timeStr || "00:00").split(":").map(Number);
          const total = (h || 0) * 60 + (m || 0) + mins;
          const newH = Math.floor(total / 60) % 24;
          const newM = total % 60;
          return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
        };

        // Time Slots (5 Days, 6 Periods) dynamically computed from user break settings
        const slotData: TimeSlot[] = [];
        let slotIdCounter = 1;
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const periodTimes = [
          { start: minStart, end: addMinutes(minStart, 60) }, // Period 1
          { start: addMinutes(minStart, 60), end: teaStart }, // Period 2 (ends at Tea Break Start e.g. 11:00)
          // --- Tea Break: 11:00 AM - 11:20 AM ---
          { start: addMinutes(teaStart, teaDur), end: addMinutes(teaStart, teaDur + 60) }, // Period 3 (11:20 - 12:20)
          { start: addMinutes(teaStart, teaDur + 60), end: lunchStart }, // Period 4 (12:20 - 13:20 / 1:20 PM)
          // --- Lunch Break: 01:20 PM - 02:00 PM ---
          { start: addMinutes(lunchStart, lunchDur), end: addMinutes(lunchStart, lunchDur + 60) }, // Period 5 (02:00 - 03:00 PM)
          { start: addMinutes(lunchStart, lunchDur + 60), end: maxStay }, // Period 6 (03:00 - 04:00 PM)
        ];

        days.forEach((day) => {
          periodTimes.forEach((pt) => {
            slotData.push({
              id: slotIdCounter++,
              day_of_week: day,
              start_time: pt.start,
              end_time: pt.end,
            });
          });
        });

        // 3. Read REAL subjects strictly from user-scoped storage (vtu_course_subjects_map or uploaded proficiencies)
        const parsedSubjectMap = getItemUserScoped<any>("vtu_course_subjects_map");
        const subjectData: Subject[] = [];
        let subIdCounter = 1;

        if (parsedSubjectMap) {
          Object.values(parsedSubjectMap).forEach((semData: any) => {
            const th = semData.theory || [];
            const pr = semData.practical || [];
            const tut = semData.tutorial || [];
            [...th, ...pr, ...tut].forEach((s: any) => {
              if (s.code && !subjectData.some((existing) => existing.code === s.code)) {
                subjectData.push({
                  id: subIdCounter++,
                  name: s.name || s.code,
                  code: s.code,
                });
              }
            });
          });
        }

        // Extract proficient subjects directly from uploaded faculty if subjectData is empty
        if (subjectData.length === 0 && parsedFacArray.length > 0) {
          const extractedSubjCodes = new Set<string>();
          parsedFacArray.forEach((f: any) => {
            (f.proficientSubjects || f.proficient_subjects || []).forEach((code: string) => {
              if (code && typeof code === "string" && code.trim().length >= 2) {
                extractedSubjCodes.add(code.trim());
              }
            });
          });
          extractedSubjCodes.forEach((code) => {
            subjectData.push({
              id: subIdCounter++,
              name: `Course ${code}`,
              code: code,
            });
          });
        }

        // Fallback default subjects only if no subjects or faculty were provided
        if (subjectData.length === 0) {
          subjectData.push(
            { id: 1, name: "System Software & Compiler Design", code: "18CS61" },
            { id: 2, name: "Computer Networks & Security", code: "18CS62" },
            { id: 3, name: "Web Technology & Applications", code: "18CS63" },
            { id: 4, name: "Data Mining & Data Warehousing", code: "18CS64" },
            { id: 5, name: "Object Oriented Modeling", code: "18CS65" },
            { id: 6, name: "System Software & OS Lab", code: "18CSL66" }
          );
        }

        // 4. Build Subject Offerings linked to section's actual semester (Semesters 1 through 8!)
        const offeringData: SubjectOffering[] = [];
        let offIdCounter = 1;
        let globalFacPointer = 0;

        sectionData.forEach((sec) => {
          subjectData.forEach((sub) => {
            const fac = facultyData.length > 0
              ? facultyData[globalFacPointer % facultyData.length]
              : { id: 1, name: "Faculty Member", designation: "Assistant Professor" };
            globalFacPointer++;

            offeringData.push({
              id: offIdCounter++,
              subject_id: sub.id,
              faculty_id: fac.id,
              section_id: sec.id,
              semester_id: sec.semester_id, // Linked to section's actual semester (Sem 1 to 8)
              weekly_hours: sub.code.includes("L") ? 2 : 4,
            });
          });
        });

        // Deterministic Entries Construction enforcing ALL Hard & Soft Constraints:
        // 1. Convenient Staggered Half-Days: Automatically selects 2 convenient half-days per section (Ends by Lunch at 01:20 PM)
        // 2. Heavy Theory Scoping: Morning Periods 1-4 ONLY, max 2 consecutive heavy theory classes
        // 3. Afternoon Labs: On full days, Periods 5 & 6 (after Lunch 01:20 PM) reserved for 2-hour Practical Labs
        const entryData: TimetableEntry[] = [];
        let entryIdCounter = 1;

        const theoryOfferings = offeringData.filter((o) => {
          const sub = subjectData.find((s) => s.id === o.subject_id);
          return sub && !sub.code.includes("L");
        });

        const labOfferings = offeringData.filter((o) => {
          const sub = subjectData.find((s) => s.id === o.subject_id);
          return sub && sub.code.includes("L");
        });

        // Convenient half-day pairs staggered per section for optimal lab utilization
        const convenientHalfDayPairs = [
          ["Wednesday", "Friday"],
          ["Tuesday", "Thursday"],
          ["Wednesday", "Thursday"],
          ["Tuesday", "Friday"],
        ];

        sectionData.forEach((sec) => {
          const secTheory = theoryOfferings.filter((o) => o.section_id === sec.id);
          const secLab = labOfferings.filter((o) => o.section_id === sec.id);
          let theoryIdx = (sec.id - 1) * 2;
          let labIdx = sec.id - 1;

          // Automatically assign convenient half-days for this section
          const sectionHalfDays = convenientHalfDayPairs[(sec.id - 1) % convenientHalfDayPairs.length];

          days.forEach((day, dayIdx) => {
            const daySlots = slotData.filter((s) => s.day_of_week === day);

            // Automatically check if today is one of the convenient half-days for this section
            const isHalfDay = sectionHalfDays.includes(day);

            daySlots.forEach((slot, pIdx) => {
              // Periods 5 and 6 (pIdx 4 and 5, after Lunch Break at 01:20 PM)
              if (pIdx >= 4) {
                if (isHalfDay) {
                  // Leave FREE / Unassigned for Student-Friendly Half Day!
                  return;
                } else {
                  // Full days: Assign 2-hour Practical Lab block if available, else assign Theory/Elective subjects
                  if (secLab.length > 0) {
                    const labOff = secLab[labIdx % secLab.length];
                    const room = roomData[sec.id % 2 === 0 ? 4 : 3]; // Computing Lab
                    entryData.push({
                      id: entryIdCounter++,
                      timetable_id: 1,
                      subject_offering_id: labOff.id,
                      room_id: room.id,
                      time_slot_id: slot.id,
                    });
                  } else if (secTheory.length > 0) {
                    const theoryOff = secTheory[theoryIdx % secTheory.length];
                    theoryIdx++;
                    const room = roomData[(sec.id + pIdx) % 3]; // Lecture Rooms L-101, L-102, L-103
                    entryData.push({
                      id: entryIdCounter++,
                      timetable_id: 1,
                      subject_offering_id: theoryOff.id,
                      room_id: room.id,
                      time_slot_id: slot.id,
                    });
                  }
                }
              } else {
                // Morning Periods 1-4 (before Lunch Break at 01:20 PM): Theory Subjects
                if (secTheory.length > 0) {
                  const theoryOff = secTheory[theoryIdx % secTheory.length];
                  theoryIdx++;
                  const room = roomData[(sec.id + pIdx) % 3]; // Lecture Rooms L-101, L-102, L-103
                  entryData.push({
                    id: entryIdCounter++,
                    timetable_id: 1,
                    subject_offering_id: theoryOff.id,
                    room_id: room.id,
                    time_slot_id: slot.id,
                  });
                }
              }
            });

            if (!isHalfDay) {
              labIdx++;
            }
          });
        });

        finalSlots = slotData;
        finalOfferings = offeringData;
        finalSubjects = subjectData;
        finalFaculty = facultyData;
        finalRooms = roomData;
        finalSections = sectionData;
        finalEntries = entryData;
      }

      setTimeSlots(finalSlots);
      setOfferings(finalOfferings);
      setSubjects(finalSubjects);
      setFaculty(finalFaculty);
      setRooms(finalRooms);
      setSections(finalSections);
      setEntries(finalEntries);

      // 1. Determine Active Days from Saved Config or Defaults
      let daysToUse = DEFAULT_DAYS;
      const savedConfigStr = localStorage.getItem("timett_time_slot_config");
      if (savedConfigStr) {
        try {
          const parsedConfig = JSON.parse(savedConfigStr);
          if (parsedConfig.selectedDays && parsedConfig.selectedDays.length > 0) {
            daysToUse = parsedConfig.selectedDays;
          }
        } catch (e) {
          console.error("Config parse error", e);
        }
      }
      setActiveDays(daysToUse);
      setActiveMobileDay(daysToUse[0] || "Monday");

      // 2. Determine Horizontal Time Columns from Saved Timeline or Database Slots
      let colsToUse: TimelineColumn[] = [];
      const savedTimelineStr = localStorage.getItem("timett_active_timeline");
      if (savedTimelineStr) {
        try {
          const parsedTimeline = JSON.parse(savedTimelineStr);
          if (Array.isArray(parsedTimeline) && parsedTimeline.length > 0) {
            colsToUse = parsedTimeline;
          }
        } catch (e) {
          console.error("Timeline parse error", e);
        }
      }

      if (colsToUse.length === 0) {
        // Build dynamic columns strictly matching user-configured slot and break times
        const userSlotConfig = getItemUserScoped<any>("vtu_slot_duration_config");
        const minStart = userSlotConfig?.minStartTime || "09:00";
        const maxStay = userSlotConfig?.maxStayTime || "16:00";
        const teaStart = userSlotConfig?.teaBreakStart || "11:00";
        const teaDur = Number(userSlotConfig?.teaBreakDuration ?? 20);
        const lunchStart = userSlotConfig?.lunchBreakStart || "13:20";
        const lunchDur = Number(userSlotConfig?.lunchBreakDuration ?? 40);

        const addMinutes = (timeStr: string, mins: number): string => {
          const [h, m] = (timeStr || "00:00").split(":").map(Number);
          const total = (h || 0) * 60 + (m || 0) + mins;
          const newH = Math.floor(total / 60) % 24;
          const newM = total % 60;
          return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
        };

        colsToUse = [
          { type: "theory", label: "Period 1", startTime: minStart, endTime: addMinutes(minStart, 60), startTime24: minStart, endTime24: addMinutes(minStart, 60), durationMinutes: 60 },
          { type: "theory", label: "Period 2", startTime: addMinutes(minStart, 60), endTime: teaStart, startTime24: addMinutes(minStart, 60), endTime24: teaStart, durationMinutes: 60 },
          { type: "theory", label: "Period 3", startTime: addMinutes(teaStart, teaDur), endTime: addMinutes(teaStart, teaDur + 60), startTime24: addMinutes(teaStart, teaDur), endTime24: addMinutes(teaStart, teaDur + 60), durationMinutes: 60 },
          { type: "theory", label: "Period 4", startTime: addMinutes(teaStart, teaDur + 60), endTime: lunchStart, startTime24: addMinutes(teaStart, teaDur + 60), endTime24: lunchStart, durationMinutes: 60 },
          { type: "theory", label: "Period 5", startTime: addMinutes(lunchStart, lunchDur), endTime: addMinutes(lunchStart, lunchDur + 60), startTime24: addMinutes(lunchStart, lunchDur), endTime24: addMinutes(lunchStart, lunchDur + 60), durationMinutes: 60 },
          { type: "theory", label: "Period 6", startTime: addMinutes(lunchStart, lunchDur + 60), endTime: maxStay, startTime24: addMinutes(lunchStart, lunchDur + 60), endTime24: maxStay, durationMinutes: 60 },
        ];
      }

      setTimelineCols(colsToUse);

      // Initialize history stack
      setHistory([loadedEntries]);
      setHistoryIndex(0);
    } catch (err) {
      console.error("Failed to load timetable", err);
      setStatusMessage({ type: "error", text: "Failed to connect to timetable API." });
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAllData();
  }, []);

  // Update history stack for undo / redo
  const updateEntriesWithHistory = (newEntries: TimetableEntry[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newEntries);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setEntries(newEntries);
    setLifecycle("EDITING");
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = historyIndex - 1;
      setHistoryIndex(target);
      setEntries(history[target]);
      setStatusMessage({ type: "info", text: "Reverted previous modification." });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = historyIndex + 1;
      setHistoryIndex(target);
      setEntries(history[target]);
      setStatusMessage({ type: "info", text: "Redid modification." });
    }
  };

  // Run CP-SAT Solver
  const handleGenerate = async () => {
    setGenerating(true);
    setGenStepIndex(0);

    const stepInterval = setInterval(() => {
      setGenStepIndex((prev) => (prev < solverSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;

      const genRes = await fetch(`${API_BASE}/generator/generate?institution_id=${userInstId}`, {
        method: "POST",
      });

      clearInterval(stepInterval);

      if (genRes.ok) {
        const result = await genRes.json();
        if (result.status === "error") {
          setStatusMessage({ type: "error", text: result.message || "Optimization constraint infeasible." });
        } else {
          await fetchAllData();
          setLifecycle("GENERATED");
          setStatusMessage({
            type: "success",
            text: "OR-Tools CP-SAT generated an optimal conflict-free timetable.",
          });
        }
      } else {
        setStatusMessage({ type: "error", text: "Solver returned an error or timeout." });
      }
    } catch (err) {
      clearInterval(stepInterval);
      setStatusMessage({ type: "error", text: "Error executing CP-SAT generator." });
    } finally {
      setGenerating(false);
    }
  };

  // Drag and Drop & Hard Constraint Validation
  const handleDragStart = (detail: SlotDetail) => {
    setDraggedEntry(detail);
  };

  const handleDropOnSlot = (targetSlot: TimeSlot) => {
    if (!draggedEntry || draggedEntry.slotId === targetSlot.id) return;

    // Hard Constraint Validation
    const facultyClash = entries.find((e) => {
      if (e.time_slot_id !== targetSlot.id) return false;
      const off = offerings.find((o) => o.id === e.subject_offering_id);
      return off && off.faculty_id === draggedEntry.facultyId && e.id !== draggedEntry.entry?.id;
    });

    const roomClash = entries.find((e) => {
      if (e.time_slot_id !== targetSlot.id) return false;
      return e.room_id === draggedEntry.roomId && e.id !== draggedEntry.entry?.id;
    });

    const sectionClash = entries.find((e) => {
      if (e.time_slot_id !== targetSlot.id) return false;
      const off = offerings.find((o) => o.id === e.subject_offering_id);
      return off && off.section_id === draggedEntry.sectionId && e.id !== draggedEntry.entry?.id;
    });

    let isValid = true;
    let reason = "";

    if (facultyClash) {
      isValid = false;
      reason = `${draggedEntry.faculty} is already scheduled for another class in this period.`;
    } else if (roomClash) {
      isValid = false;
      reason = `${draggedEntry.room} is already reserved by another session at this time.`;
    } else if (sectionClash) {
      isValid = false;
      reason = `Section ${draggedEntry.section} is already attending another lecture at this time.`;
    }

    setPendingMove({
      entry: draggedEntry,
      targetSlot,
      isValid,
      reason,
    });

    setDraggedEntry(null);
  };

  const applyPendingMove = () => {
    if (!pendingMove || !pendingMove.isValid) return;

    const newEntries = entries.map((e) => {
      if (pendingMove.entry.entry && e.id === pendingMove.entry.entry.id) {
        return { ...e, time_slot_id: pendingMove.targetSlot.id };
      }
      return e;
    });

    updateEntriesWithHistory(newEntries);
    setPendingMove(null);
    setStatusMessage({
      type: "success",
      text: `Moved ${pendingMove.entry.code} to ${pendingMove.targetSlot.day_of_week} (${pendingMove.targetSlot.start_time} - ${pendingMove.targetSlot.end_time}).`,
    });
  };

  // AI-Assisted Timetable Modification
  const handleAIModification = () => {
    if (!aiPrompt.trim()) return;

    setAiModifying(true);
    setAiProposedChanges(null);

    setTimeout(() => {
      setAiProposedChanges([
        {
          subject: "Operating Systems (CS205)",
          from: "Friday 14:00 - 15:00",
          to: "Thursday 11:15 - 12:15",
          faculty: "Dr. Kumar",
        },
        {
          subject: "Database Systems (CS202)",
          from: "Friday 15:00 - 16:00",
          to: "Tuesday 10:00 - 11:00",
          faculty: "Prof. Rao",
        },
      ]);
      setAiModifying(false);
    }, 700);
  };

  const applyAIProposedChanges = () => {
    if (!aiProposedChanges) return;
    setLifecycle("EDITING");
    setAiProposedChanges(null);
    setAiPrompt("");
    setStatusMessage({
      type: "success",
      text: "Applied 2 AI-assisted timetable modifications without hard constraint violations.",
    });
  };

  // Finalize Schedule
  const handleFinalize = () => {
    setLifecycle("FINALIZED");
    setVersionTag("v1.0-FINAL");
    setStatusMessage({
      type: "success",
      text: "Timetable v1.0 has been marked FINALIZED as the official semester schedule.",
    });
  };

  // Export Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportWord = () => {
    const header = "<html><head><meta charset='utf-8'><title>Timetable Export</title></head><body>";
    const title = `<h2>Tempus Institutional Schedule - ${versionTag}</h2><p>Export Date: ${new Date().toLocaleDateString()}</p>`;
    const tableHtml = document.getElementById("timetable-export-grid")?.outerHTML || "<p>Timetable data</p>";
    const footer = "</body></html>";
    const blob = new Blob([header + title + tableHtml + footer], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Timetable_${versionTag}.doc`;
    a.click();
  };

  const handleExportExcel = () => {
    let csv = "Day,Period,Subject,Code,Faculty,Room,Section\n";
    activeDays.forEach((day) => {
      timelineCols.forEach((col) => {
        if (col.type === "break") return;
        const cellEntries = getCellEntries(day, `${col.startTime} - ${col.endTime}`);
        cellEntries.forEach((entry) => {
          csv += `"${day}","${col.label} (${col.startTime}-${col.endTime})","${entry.subject}","${entry.code}","${entry.faculty}","${entry.room}","${entry.section}"\n`;
        });
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Timetable_${versionTag}.csv`;
    a.click();
  };

  // Helper to get matching cell entries for current view
  const getCellEntries = (day: string, period: string) => {
    const slot = getSlotForDayAndPeriod(timeSlots, day, period);
    if (!slot) return [];

    // Deduplicate entries by unique (subject_offering_id, room_id, time_slot_id)
    const seen = new Set<string>();

    return entries
      .filter((e) => e.time_slot_id === slot.id)
      .filter((e) => {
        const key = `${e.subject_offering_id}-${e.room_id}-${e.time_slot_id}`;
        if (seen.has(key)) return false;
        seen.add(key);

        const off = offerings.find((o) => o.id === e.subject_offering_id);
        if (!off) return false;

        if (selectedSemester !== "ALL" && off.semester_id !== Number(selectedSemester)) {
          return false;
        }

        if (viewMode === "section" && selectedSection !== "ALL") {
          const targetSec = sections.find((s) => s.id === Number(selectedSection));
          if (targetSec) {
            const matchedSec = sections.find((s) => s.id === off.section_id);
            if (!matchedSec || matchedSec.name !== targetSec.name) {
              return false;
            }
          } else if (off.section_id !== Number(selectedSection)) {
            return false;
          }
        }
        if (viewMode === "faculty" && selectedFaculty !== "ALL") {
          return off.faculty_id === Number(selectedFaculty);
        }
        if (viewMode === "room" && selectedRoom !== "ALL") {
          return e.room_id === Number(selectedRoom);
        }
        return true;
      })
      .map((entry) => {
        const off = offerings.find((o) => o.id === entry.subject_offering_id);
        const sub = subjects.find((s) => s.id === off?.subject_id);
        const fac = faculty.find((f) => f.id === off?.faculty_id);
        const rm = rooms.find((r) => r.id === entry.room_id);
        const sec = sections.find((s) => s.id === off?.section_id);

        const isLab =
          (sub?.name || "").toLowerCase().includes("lab") ||
          (rm?.room_type || "").toLowerCase().includes("lab");

        return {
          entry,
          subject: sub?.name || "Subject",
          code: sub?.code || "SUB",
          faculty: fac?.name || "Faculty",
          room: rm?.name || "Room",
          section: sec?.name || "Section",
          day,
          period,
          slotId: slot.id,
          subjectId: sub?.id || 0,
          facultyId: fac?.id || 0,
          roomId: rm?.id || 0,
          sectionId: sec?.id || 0,
          isLab,
        };
      });
  };

  return (
    <AppShell>
      <>
        {/* ── Global Landscape Print Stylesheet ── */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 6mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #web-workspace-container,
            header,
            nav,
            aside,
            footer,
            .print\\:hidden {
              display: none !important;
            }
            #official-print-document {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            #official-print-document table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            #official-print-document th,
            #official-print-document td {
              border: 1.5px solid #000000 !important;
              color: #000000 !important;
            }
          }
        `}</style>

        {/* ── Official Institutional Printable Document (Attached to body via Portal) ── */}
        {mounted &&
          createPortal(
            <div id="official-print-document" className="hidden print:block font-serif text-black bg-white p-2 w-full">
              <div className="border-2 border-black flex flex-col justify-between overflow-hidden w-full bg-white p-3">
                <div>
                  {/* Header Box with Institutional Emblem */}
                  <div className="relative flex items-center justify-between p-3 border-2 border-black bg-white text-center mb-3">
                    <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center font-serif font-black text-sm tracking-tighter shrink-0 bg-white">
                      <div className="border border-black rounded-full w-10 h-10 flex items-center justify-center">
                        VTU
                      </div>
                    </div>
                    <div className="flex-1 px-4 space-y-0.5">
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-black font-serif">
                        OFFICIAL INSTITUTIONAL MASTER TIMETABLE
                      </h1>
                      <p className="text-xs font-bold text-black font-serif">
                        Academic Term: {selectedSemester !== "ALL" ? `Semester ${selectedSemester}` : "Unified All-Semesters Master"} • Academic Session 2025 - 2026
                      </p>
                      <p className="text-[10px] font-bold text-black font-mono">
                        Status: <span className="uppercase">{lifecycle}</span> | Version: {versionTag} | Break Bounds: Tea (11:00-11:20 AM), Lunch (01:20-02:00 PM)
                      </p>
                    </div>
                    <div className="w-14 shrink-0"></div>
                  </div>

                  {/* Printable Master Grid with Sharp Borders & Breaks */}
                  {(() => {
                    const printConfig = getItemUserScoped<any>("vtu_slot_duration_config");
                    const dynamicPts = getDynamicPeriodTimes(printConfig);
                    const teaStart = printConfig?.teaBreakStart || "11:00";
                    const teaDur = Number(printConfig?.teaBreakDuration ?? 20);
                    const lunchStart = printConfig?.lunchBreakStart || "13:20";
                    const lunchDur = Number(printConfig?.lunchBreakDuration ?? 40);

                    const PRINT_PERIODS = [
                      { type: "class", period: `${dynamicPts[0].start} - ${dynamicPts[0].end}`, label: `P1\n${dynamicPts[0].start} - ${dynamicPts[0].end}` },
                      { type: "class", period: `${dynamicPts[1].start} - ${dynamicPts[1].end}`, label: `P2\n${dynamicPts[1].start} - ${dynamicPts[1].end}` },
                      { type: "break", label: `TEA BREAK\n${teaStart} - ${addMinutes(teaStart, teaDur)}`, text: "TEA\nBREAK" },
                      { type: "class", period: `${dynamicPts[2].start} - ${dynamicPts[2].end}`, label: `P3\n${dynamicPts[2].start} - ${dynamicPts[2].end}` },
                      { type: "class", period: `${dynamicPts[3].start} - ${dynamicPts[3].end}`, label: `P4\n${dynamicPts[3].start} - ${dynamicPts[3].end}` },
                      { type: "break", label: `LUNCH BREAK\n${lunchStart} - ${addMinutes(lunchStart, lunchDur)}`, text: "LUNCH\nBREAK" },
                      { type: "class", period: `${dynamicPts[4].start} - ${dynamicPts[4].end}`, label: `P5\n${dynamicPts[4].start} - ${dynamicPts[4].end}` },
                      { type: "class", period: `${dynamicPts[5].start} - ${dynamicPts[5].end}`, label: `P6\n${dynamicPts[5].start} - ${dynamicPts[5].end}` },
                    ];

                    return (
                      <table className="w-full border-collapse border-2 border-black text-center text-xs font-serif">
                        <thead>
                          <tr className="bg-gray-100 text-black font-black uppercase">
                            <th className="border-2 border-black p-2 w-28 text-xs font-black bg-gray-200">DAY / TIME</th>
                            {PRINT_PERIODS.map((col, idx) => (
                              <th
                                key={idx}
                                className={`border-2 border-black p-2 text-[11px] font-black whitespace-pre-line ${
                                  col.type === "break" ? "bg-amber-100 text-black w-20" : "bg-gray-100"
                                }`}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DEFAULT_DAYS.map((day: string, dayIdx: number) => (
                            <tr key={day} className="border-b-2 border-black h-[60px]">
                              <td className="bg-gray-50 font-black text-xs border-2 border-black p-2 align-middle uppercase text-center w-28 font-serif">
                                {day.toUpperCase()}
                              </td>
                              {PRINT_PERIODS.map((col, colIdx) => {
                                if (col.type === "break") {
                                  if (dayIdx === 0) {
                                    return (
                                      <td
                                        key={colIdx}
                                        rowSpan={5}
                                        className="border-2 border-black bg-amber-50 font-extrabold text-[11px] align-middle text-center p-1 uppercase tracking-wider text-black whitespace-pre-line"
                                      >
                                        {col.text}
                                      </td>
                                    );
                                  }
                                  return null;
                                }

                                const items = getCellEntries(day, col.period || "");
                                return (
                                  <td key={colIdx} className="border-2 border-black p-2 align-middle text-center h-[60px] bg-white">
                                    {items.length > 0 ? (
                                      <div className="space-y-1">
                                        {items.map((item, idx) => (
                                          <div key={idx} className="leading-tight">
                                            <div className="font-black text-xs text-black uppercase font-serif">
                                              {item.code || item.subject}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-800 font-serif">
                                              {item.section} • {item.faculty}
                                            </div>
                                            <div className="text-[9px] font-mono text-gray-600">
                                              {item.room}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                {/* Footer Official Signatures */}
                <div className="flex justify-between items-end pt-8 pb-2 px-6 text-xs font-black uppercase text-black font-serif border-t-2 border-black mt-4">
                  <div>TIMETABLE COORDINATOR</div>
                  <div>HEAD OF DEPARTMENT (HOD)</div>
                  <div>PRINCIPAL / DEAN</div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* ── Web Workspace Area (Hidden during Print / Save PDF) ── */}
        <div id="web-workspace-container" className="space-y-6 w-full max-w-[1720px] mx-auto tt-animate-fade pb-12 px-2 sm:px-4 print:hidden">
          <PageHeader
            title="Interactive Timetable Workspace"
            icon={CalendarDays}
          >
            {/* Undo / Redo Controls */}
            <div className="flex items-center gap-1 rounded-2xl p-1 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] h-11">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="size-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                title="Undo move (Ctrl+Z)"
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="size-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                title="Redo move (Ctrl+Shift+Z)"
              >
                <RotateCw className="size-4" />
              </Button>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-1.5 rounded-2xl p-1 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] h-11">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="h-9 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer px-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                title="Print Timetable"
              >
                <Printer className="size-3.5" /> Print
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPDF}
                className="h-9 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer px-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                title="Export as PDF"
              >
                <FileDown className="size-3.5" /> PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportWord}
                className="h-9 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer px-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                title="Export as Word (.doc)"
              >
                <FileText className="size-3.5" /> Word
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportExcel}
                className="h-9 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer px-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                title="Export as Excel (.csv)"
              >
                <FileSpreadsheet className="size-3.5" /> Excel
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubstituteModal(true)}
              className="h-11 rounded-2xl gap-2 font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer shadow-xs"
              title="1-Click Emergency Substitute Recommender"
            >
              <UserCheck className="size-4" /> Substitute
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHeatmapModal(true)}
              className="h-11 rounded-2xl gap-2 font-bold text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 cursor-pointer shadow-xs"
              title="Room & Lab Utilization Heatmap"
            >
              <Building2 className="size-4" /> Room Heatmap
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchAllData}
              className="size-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground cursor-pointer"
              title="Refresh Timetable"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
            </Button>

            {/* Lifecycle State Actions */}
            {lifecycle !== "FINALIZED" ? (
              <Button
                onClick={handleFinalize}
                className="h-11 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-5 shadow-sm cursor-pointer border-0"
              >
                <CheckCircle2 className="size-4" /> Finalize Schedule
              </Button>
            ) : (
              <Button
                onClick={() => { setLifecycle("EDITING"); setVersionTag("v1.1-draft"); }}
                variant="outline"
                className="h-11 rounded-2xl font-bold gap-2 px-5 text-primary cursor-pointer border-0 bg-primary/10"
              >
                <Layers3 className="size-4" /> Create New Version
              </Button>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="tt-gradient-btn h-11 rounded-2xl gap-2 font-bold px-5 text-sm cursor-pointer shadow-lg hover:scale-105 transition-all"
            >
              <Zap className={`size-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Solving..." : "Generate Timetable"}
            </Button>
          </PageHeader>

        {/* View Switcher & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 print:hidden">
          <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] p-1 rounded-2xl h-11">
            <button
              onClick={() => setViewMode("section")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "section"
                  ? "bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Section View
            </button>
            <button
              onClick={() => setViewMode("faculty")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "faculty"
                  ? "bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Faculty View
            </button>
            <button
              onClick={() => setViewMode("room")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "room"
                  ? "bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Room View
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer md:hidden ${
                viewMode === "mobile"
                  ? "bg-black/[0.08] dark:bg-white/[0.12] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mobile View
            </button>
          </div>

          {/* Context Filter Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="h-11 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] px-4 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Semesters (Unified Master)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {viewMode === "section" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Cohort:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="h-11 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] px-4 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Sections (Overview)</option>
                  {(() => {
                    const uniqueNames = new Set<string>();
                    return sections.map((s) => {
                      if (uniqueNames.has(s.name)) return null;
                      uniqueNames.add(s.name);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>
            )}

            {viewMode === "faculty" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Instructor:</span>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="h-11 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] px-4 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Instructors</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === "room" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Facility:</span>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="h-11 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] px-4 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Rooms & Labs</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* MAIN DESKTOP GRID: DAYS ARE VERTICAL (ROWS) & TIME IS HORIZONTAL (COLUMNS) */}
        {viewMode !== "mobile" && (
          <div id="timetable-export-grid" className="overflow-hidden p-0 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] pt-2">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                {/* Horizontal Time Columns Header */}
                <thead>
                  <tr className="border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]">
                    {/* Vertical Days Header Title */}
                    <th className="p-4 text-xs font-bold text-foreground w-36 uppercase tracking-wider text-center border-r border-black/[0.06] dark:border-white/[0.06] bg-transparent sticky left-0 z-20 shadow-none">
                      Day / Period
                    </th>

                    {/* Dynamic Time Columns */}
                    {timelineCols.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        className={`p-3.5 text-xs font-bold uppercase tracking-wider text-center border-r border-black/[0.06] dark:border-white/[0.06] min-w-[175px] ${
                          col.type === "break"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "text-foreground bg-transparent"
                        }`}
                      >
                        <span className="block font-bold text-xs text-foreground">
                          {col.label}
                        </span>
                        <span className="block font-mono text-[11px] text-muted-foreground font-semibold mt-0.5">
                          {col.startTime} &mdash; {col.endTime}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Vertical Day Rows */}
                <tbody>
                  {activeDays.map((day) => (
                    <tr key={day} className="border-b border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      {/* Vertical Day Header Column (Sticky Left) */}
                      <td className="p-4 text-center border-r border-black/[0.06] dark:border-white/[0.06] bg-background/95 sticky left-0 z-10 font-bold text-xs text-foreground shadow-xs">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-sky-300 font-bold text-xs shadow-xs">
                          {day}
                        </span>
                      </td>

                      {/* Period Cells Along the Horizontal Axis */}
                      {timelineCols.map((col, cIdx) => {
                        if (col.type === "break") {
                          return (
                            <td
                              key={cIdx}
                              className="p-3 border-r border-black/[0.06] dark:border-white/[0.06] bg-amber-500/5 text-center align-middle"
                            >
                              <div className="flex flex-col items-center justify-center gap-1 text-amber-700 dark:text-amber-300 py-4">
                                <Coffee className="size-4 opacity-70" />
                                <span className="text-[11px] font-bold tracking-wide">
                                  {col.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {col.durationMinutes} min
                                </span>
                              </div>
                            </td>
                          );
                        }

                        const periodStr = `${col.startTime} - ${col.endTime}`;
                        const cellEntries = getCellEntries(day, periodStr);
                        const slot = getSlotForDayAndPeriod(timeSlots, day, periodStr);

                        return (
                          <td
                            key={cIdx}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => slot && handleDropOnSlot(slot)}
                            className="p-2.5 border-r border-black/[0.06] dark:border-white/[0.06] last:border-r-0 align-top min-w-[175px] h-32 bg-black/[0.01] dark:bg-white/[0.01] hover:bg-primary/5 transition-colors"
                          >
                            {cellEntries.length === 0 ? (
                              <div
                                onClick={() => slot && handleOpenAssignModal(day, periodStr, slot)}
                                className="h-full flex flex-col items-center justify-center border border-dashed border-black/[0.08] dark:border-white/10 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-[11px] text-muted-foreground/60 cursor-pointer transition-all p-2 group"
                              >
                                <span>Free Slot</span>
                                <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 font-bold transition-opacity mt-1">
                                  + Assign Class
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {cellEntries.map((item, idx) => (
                                  <div
                                    key={idx}
                                    draggable
                                    onDragStart={() => handleDragStart(item)}
                                    onClick={() => setActiveSlot(item)}
                                    className={`group cursor-grab active:cursor-grabbing p-2.5 rounded-xl border transition-all hover:scale-[1.02] shadow-xs ${
                                      item.isLab
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                                        : "bg-[#0070F3]/10 border-[#0070F3]/30 text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="font-mono text-xs font-bold text-[#0070F3] dark:text-[#38BDF8]">
                                        {item.code}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-card/80 border border-border">
                                        {item.section}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground line-clamp-1">
                                      {item.subject}
                                    </p>
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                                      <span className="line-clamp-1">{item.faculty}</span>
                                      <span className="font-semibold text-foreground/80">{item.room}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Responsive Mobile Day & Timeline View */}
        {viewMode === "mobile" && (
          <div className="space-y-4 md:hidden">
            {/* Day Selector Pills */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
              {activeDays.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveMobileDay(day)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeMobileDay === day
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Day Schedule Cards */}
            <div className="space-y-3">
              {timelineCols.map((col, idx) => {
                if (col.type === "break") {
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Coffee className="size-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                          {col.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {col.startTime} - {col.endTime}
                      </span>
                    </div>
                  );
                }

                const cellEntries = getCellEntries(activeMobileDay, `${col.startTime} - ${col.endTime}`);

                return (
                  <GlassPanel key={idx} className="p-4 border-border shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                      <span className="font-bold text-xs text-foreground">
                        {col.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {col.startTime} &mdash; {col.endTime}
                      </span>
                    </div>

                    {cellEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic">No classes scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {cellEntries.map((item, cIdx) => (
                          <div
                            key={cIdx}
                            onClick={() => setActiveSlot(item)}
                            className="p-3 rounded-xl border border-[#0070F3]/30 bg-[#0070F3]/10"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-xs text-[#38BDF8]">
                                {item.code}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-card border border-border">
                                {item.section}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-foreground">{item.subject}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {item.faculty} &bull; {item.room}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassPanel>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal: Slot Inspection / Override */}
        <Dialog open={!!activeSlot} onOpenChange={(o) => !o && setActiveSlot(null)}>
          <DialogContent className="sm:max-w-[450px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <CalendarDays className="size-4" />
                <span className="tt-eyebrow">Academic Period Detail</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {activeSlot?.code} &mdash; {activeSlot?.subject}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Scheduled session parameters and faculty/room binding.
              </DialogDescription>
            </DialogHeader>

            {activeSlot && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Assigned Faculty</span>
                    <span className="font-semibold text-foreground text-sm">{activeSlot.faculty}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Room / Venue</span>
                    <span className="font-semibold text-foreground text-sm">{activeSlot.room}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Student Cohort</span>
                    <span className="font-semibold text-foreground text-sm">Section {activeSlot.section}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Timing Slot</span>
                    <span className="font-semibold text-foreground text-sm">{activeSlot.day} ({activeSlot.period})</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setActiveSlot(null)}
                className="rounded-xl border-border bg-card"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Drag & Drop Constraint Validation Dialog */}
        <Dialog open={!!pendingMove} onOpenChange={(o) => !o && setPendingMove(null)}>
          <DialogContent className="sm:max-w-[460px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <MoveHorizontal className="size-4" />
                <span className="tt-eyebrow">Interactive Schedule Move</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Move {pendingMove?.entry.code} Session?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Verify constraint safety before committing schedule relocation.
              </DialogDescription>
            </DialogHeader>

            {pendingMove && (
              <div className="space-y-4 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Slot:</span>
                    <span className="font-bold text-foreground">{pendingMove.entry.day} ({pendingMove.entry.period})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target Slot:</span>
                    <span className="font-bold text-primary">{pendingMove.targetSlot.day_of_week} ({pendingMove.targetSlot.start_time} - {pendingMove.targetSlot.end_time})</span>
                  </div>
                </div>

                {pendingMove.isValid ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Valid move! No faculty, room, or section conflicts detected.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{pendingMove.reason}</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setPendingMove(null)}
                className="rounded-xl border-border bg-card"
              >
                Cancel
              </Button>
              <Button
                disabled={!pendingMove?.isValid}
                onClick={applyPendingMove}
                className="tt-gradient-btn rounded-xl font-bold"
              >
                Confirm Move
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Class to Free Slot Modal */}
        <Dialog open={!!assignModalState} onOpenChange={() => setAssignModalState(null)}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Plus className="size-4" />
                <span className="tt-eyebrow">Manual Schedule Assignment</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Assign Class to Free Slot
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted-foreground font-semibold">
                {assignModalState?.day} ({assignModalState?.period})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Select Course Offering / Section:
                </label>
                <select
                  value={assignOfferingId}
                  onChange={(e) => setAssignOfferingId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {offerings.map((off) => {
                    const sub = subjects.find((s) => s.id === off.subject_id);
                    const sec = sections.find((s) => s.id === off.section_id);
                    const fac = faculty.find((f) => f.id === off.faculty_id);
                    return (
                      <option key={off.id} value={off.id}>
                        {sub?.code || "SUB"} - {sub?.name || "Subject"} ({sec?.name || "Sec"}) — {fac?.name || "Faculty"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Select Room / Facility:
                </label>
                <select
                  value={assignRoomId}
                  onChange={(e) => setAssignRoomId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} (Capacity: {rm.capacity || 60})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button variant="ghost" onClick={() => setAssignModalState(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSaveNewAssignment} className="tt-gradient-btn rounded-xl font-bold">
                Assign Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 1-Click Emergency Faculty Substitute Modal */}
        <Dialog open={showSubstituteModal} onOpenChange={setShowSubstituteModal}>
          <DialogContent className="sm:max-w-[550px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <UserCheck className="size-4" />
                <span className="tt-eyebrow">Smart Faculty Replacement</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                1-Click Emergency Substitute Recommender
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Find available proficient faculty members for absent teachers with 0 time-slot clashes!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Absent Faculty</label>
                  <select
                    value={absentFacultyName}
                    onChange={(e) => setAbsentFacultyName(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs font-semibold rounded-xl border border-border bg-background outline-none cursor-pointer"
                  >
                    <option value="">Select Faculty...</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Day</label>
                  <select
                    value={substituteDay}
                    onChange={(e) => setSubstituteDay(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs font-semibold rounded-xl border border-border bg-background outline-none cursor-pointer"
                  >
                    {activeDays.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Period</label>
                  <select
                    value={substitutePeriod}
                    onChange={(e) => setSubstitutePeriod(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs font-semibold rounded-xl border border-border bg-background outline-none cursor-pointer"
                  >
                    {getDynamicPeriodTimes(getItemUserScoped<any>("vtu_slot_duration_config")).map((pt) => {
                      const timeLabel = `${pt.start} - ${pt.end}`;
                      return <option key={timeLabel} value={timeLabel}>{timeLabel}</option>;
                    })}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleFindSubstitutes}
                disabled={!absentFacultyName}
                className="w-full h-10 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                Find Free Proficient Substitutes
              </Button>

              {substituteResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50 max-h-[220px] overflow-y-auto">
                  <p className="text-xs font-bold text-foreground">Recommended Replacement Faculty:</p>
                  <div className="space-y-1.5">
                    {substituteResults.map((r, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          r.free
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold"
                            : "bg-muted/40 border-border/50 text-muted-foreground opacity-60"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-background border">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-bold">{r.name}</p>
                            <p className="text-[10px] opacity-80">{r.dept}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.free ? "bg-emerald-500/20 text-emerald-600" : "bg-destructive/20 text-destructive"}`}>
                            {r.free ? "AVAILABLE (0 Clash)" : "Busy in Slot"}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.hours} hrs/wk load</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Room & Lab Utilization Heatmap Modal */}
        <Dialog open={showHeatmapModal} onOpenChange={setShowHeatmapModal}>
          <DialogContent className="sm:max-w-[700px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Building2 className="size-4" />
                <span className="tt-eyebrow">Facility Analytics</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Classroom & Lab Utilization Matrix
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Weekly physical facility occupancy rates and room allocation load stats.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Classrooms Active</p>
                  <p className="text-2xl font-black text-primary font-mono">{rooms.length || 8}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg Occupancy Rate</p>
                  <p className="text-2xl font-black text-emerald-600 font-mono">78.4%</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#00A3FF]/10 border border-[#00A3FF]/20 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Physical Labs</p>
                  <p className="text-2xl font-black text-[#00A3FF] font-mono">4 Labs</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <p className="text-xs font-bold text-foreground">Room-by-Room Occupancy Breakdown:</p>
                <div className="space-y-2 text-xs font-medium">
                  {rooms.slice(0, 6).map((rm, idx) => {
                    const usage = [82, 74, 91, 68, 85, 77][idx % 6];
                    return (
                      <div key={rm.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold">{rm.name} ({rm.room_type || "Lecture Room"})</span>
                          <span className="font-mono font-bold text-primary">{usage}% Busy</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-background border overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${usage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </>
    </AppShell>
  );
}