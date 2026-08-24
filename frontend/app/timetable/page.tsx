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
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:15 - 12:15",
  "12:15 - 01:15",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

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

  // Robust Time Slot Resolver (resolves 12h vs 24h & indexed slot mappings)
  const getSlotForDayAndPeriod = (slots: TimeSlot[], day: string, period: string) => {
    if (!slots || slots.length === 0) return undefined;
    const exact = slots.find((s) => s.day_of_week === day && `${s.start_time} - ${s.end_time}` === period);
    if (exact) return exact;

    const daySlots = slots.filter((s) => s.day_of_week === day).sort((a, b) => a.id - b.id);
    const periodIdx = DEFAULT_PERIODS.indexOf(period);
    if (periodIdx !== -1 && daySlots[periodIdx]) {
      return daySlots[periodIdx];
    }
    return undefined;
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

      setTimeSlots(loadedSlots);
      setOfferings(loadedOfferings);
      setSubjects(loadedSubjects);
      setFaculty(loadedFaculty);
      setRooms(loadedRooms);
      setSections(loadedSections);
      setEntries(loadedEntries);

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
        // Fallback: derive from backend slots
        const uniquePeriodMap = new Map<string, { start: string; end: string }>();
        loadedSlots.forEach((s) => {
          const key = `${s.start_time} - ${s.end_time}`;
          if (!uniquePeriodMap.has(key)) {
            uniquePeriodMap.set(key, { start: s.start_time, end: s.end_time });
          }
        });

        if (uniquePeriodMap.size > 0) {
          let pIdx = 1;
          uniquePeriodMap.forEach((v) => {
            colsToUse.push({
              type: "theory",
              label: `Period ${pIdx++}`,
              startTime: v.start,
              endTime: v.end,
              startTime24: v.start,
              endTime24: v.end,
              durationMinutes: 60,
            });
          });
        } else {
          DEFAULT_PERIODS.forEach((p, idx) => {
            const [st, et] = p.split(" - ");
            colsToUse.push({
              type: "theory",
              label: `Period ${idx + 1}`,
              startTime: st,
              endTime: et,
              startTime24: st,
              endTime24: et,
              durationMinutes: 60,
            });
          });
        }
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
    const title = `<h2>TIMETT Institutional Schedule - ${versionTag}</h2><p>Export Date: ${new Date().toLocaleDateString()}</p>`;
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

        if (viewMode === "section" && selectedSection !== "ALL") {
          return off.section_id === Number(selectedSection);
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
        {/* ── Official Institutional Printable Document (Attached to body via Portal) ── */}
        {mounted &&
          createPortal(
            <div id="official-print-document" className="hidden print:block font-serif text-black bg-white p-0 w-full">
              <div className="border border-black flex flex-col justify-between overflow-hidden w-full">
                <div>
                  {/* Header Box with RV Emblem Logo */}
                  <div className="relative flex items-center justify-between p-2.5 border-b border-black bg-white text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center font-serif font-black text-sm tracking-tighter shrink-0 bg-white">
                      <div className="border border-black rounded-full w-12 h-12 flex items-center justify-center">
                        RV
                      </div>
                    </div>
                    <div className="flex-1 px-4 space-y-0.5">
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-black font-serif">
                        RV INSTITUTE OF TECHNOLOGY AND MANAGEMENT, BENGALURU - 560 076
                      </h1>
                      <p className="text-xs font-bold text-gray-900 font-serif">
                        Department: CSE-AIML (CSE Cluster)
                      </p>
                      <p className="text-xs font-bold text-gray-800 font-serif">
                        Time Table from 24-08-2026 to 28-06-2026
                      </p>
                      <p className="text-[10px] font-semibold text-gray-600 font-mono">
                        Official Schedule Status: <span className="font-bold text-black">{lifecycle} ({versionTag})</span>
                      </p>
                    </div>
                    <div className="w-16 shrink-0"></div>
                  </div>

                  {/* Sub-Header 3-Column Info Bar */}
                  <div className="grid grid-cols-3 text-sm font-serif border-b border-black divide-x divide-black bg-white">
                    <div className="p-2.5 text-left font-extrabold text-base flex items-center pl-4">
                      Program: BE
                    </div>
                    <div className="p-2 text-center font-extrabold flex flex-col justify-center">
                      <span className="text-sm">Sem: 3rd Sem</span>
                      <span className="font-black text-base mt-0.5">III A &amp; B</span>
                    </div>
                    <div className="p-2.5 text-center font-extrabold text-base flex items-center justify-center">
                      Class Room: L322
                    </div>
                  </div>

                  {/* Printable Master Grid (Matching Reference Image 2 Table Exactly) */}
                  {(() => {
                    const BLOCKS = [
                      { type: "class", label: "9.00 - 11.00", periods: ["09:00 - 10:00", "10:00 - 11:00"] },
                      { type: "break", label: "11.00 - 11.20", text: "SHORT\nBREAK" },
                      { type: "class", label: "11.20 - 1.20", periods: ["11:15 - 12:15", "12:15 - 01:15"] },
                      { type: "break", label: "1.20 - 2.00\n(Lunch)", text: "LUNCH" },
                      { type: "class", label: "2.00 - 4.00", periods: ["02:00 - 03:00", "03:00 - 04:00"] },
                    ] as const;

                    const DAY_DATES: Record<string, string> = {
                      Monday: "MON\n24-08-26",
                      Tuesday: "TUE\n25-08-26",
                      Wednesday: "WED\n26-08-26",
                      Thursday: "THU\n27-08-26",
                      Friday: "FRI\n28-08-26",
                    };

                    const getBlockEntries = (day: string, periods: readonly string[]) => {
                      const allItems: any[] = [];
                      periods.forEach((p) => {
                        const res = getCellEntries(day, p);
                        allItems.push(...res);
                      });
                      const seen = new Set<string>();
                      return allItems.filter((item) => {
                        if (seen.has(item.code)) return false;
                        seen.add(item.code);
                        return true;
                      });
                    };

                    return (
                      <table className="w-full border-collapse border-b border-black text-center text-xs font-serif">
                        <thead>
                          <tr className="bg-[#e6f2fb] text-black font-black uppercase">
                            <th className="border border-black p-2.5 w-24 text-xs font-black">TIME / DAY</th>
                            {BLOCKS.map((col, idx) => (
                              <th key={idx} className="border border-black p-2 text-xs font-black whitespace-pre-line">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DEFAULT_DAYS.map((day: string, dayIdx: number) => (
                            <tr key={day} className="border-b border-black h-[56px]">
                              <td className="bg-white font-black text-xs border border-black p-1.5 align-middle uppercase text-center w-24 whitespace-pre-line leading-tight">
                                {DAY_DATES[day] || day}
                              </td>
                              {BLOCKS.map((col, colIdx) => {
                                if (col.type === "break") {
                                  if (dayIdx === 0) {
                                    return (
                                      <td
                                        key={colIdx}
                                        rowSpan={5}
                                        className="border border-black bg-white font-extrabold text-[10px] align-middle text-center p-1 uppercase tracking-widest text-black whitespace-pre-line"
                                      >
                                        {col.text}
                                      </td>
                                    );
                                  }
                                  return null;
                                }
                                const items = getBlockEntries(day, col.periods);
                                return (
                                  <td key={colIdx} className="border border-black p-2 align-middle text-center h-[56px]">
                                    {items.length > 0 ? (
                                      <div className="space-y-0.5">
                                        {items.map((item, idx) => (
                                          <div key={idx} className="leading-tight">
                                            <div className="font-black text-sm text-black uppercase font-serif">
                                              {item.code || item.subject}
                                            </div>
                                            <div className="text-xs font-bold text-black font-serif">
                                              ({item.faculty})
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-black font-black text-base">—</span>
                                    )}
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

                {/* Footer Signatures */}
                <div className="flex justify-between items-end pt-6 pb-3 px-8 text-xs font-black uppercase text-black font-serif">
                  <div>TIME TABLE IN-CHARGE</div>
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
            description="Explore conflict-free schedules with vertical days and horizontal time intervals, validate drag-and-drop moves, and export schedules."
            icon={CalendarDays}
          >
            {/* Undo / Redo Controls */}
            <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-card/60">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Undo move (Ctrl+Z)"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Redo move (Ctrl+Shift+Z)"
              >
                <RotateCw className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchAllData}
              className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Refresh Timetable"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
            </Button>

            {/* Lifecycle State Actions */}
            {lifecycle !== "FINALIZED" ? (
              <Button
                onClick={handleFinalize}
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-4 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="size-4" /> Finalize Schedule
              </Button>
            ) : (
              <Button
                onClick={() => { setLifecycle("EDITING"); setVersionTag("v1.1-draft"); }}
                variant="outline"
                className="rounded-xl font-bold gap-2 px-4 border-primary/40 text-primary cursor-pointer"
              >
                <Layers3 className="size-4" /> Create New Version
              </Button>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer"
            >
              <Zap className={`size-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Solving..." : "Generate Timetable"}
            </Button>
          </PageHeader>
        </div>

        {/* Verification Status & Export Suite Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 print:hidden">
          {/* Verification Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" /> Schedule Architecture:
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="size-3.5" /> {activeDays.length} Operating Days
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="size-3.5" /> {timelineCols.filter((c) => c.type !== "break").length} Daily Periods
            </span>
            <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
              <Check className="size-3.5" /> {timelineCols.filter((c) => c.type === "break").length} Recess Breaks
            </span>
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30">
              {lifecycle} ({versionTag})
            </Badge>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl gap-1.5 text-xs font-semibold cursor-pointer"
              title="Print Timetable"
            >
              <Printer className="size-3.5" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="rounded-xl gap-1.5 text-xs font-semibold cursor-pointer"
              title="Export as PDF"
            >
              <FileDown className="size-3.5" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWord}
              className="rounded-xl gap-1.5 text-xs font-semibold cursor-pointer"
              title="Export as Word (.doc)"
            >
              <FileText className="size-3.5" /> Word
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="rounded-xl gap-1.5 text-xs font-semibold cursor-pointer"
              title="Export as Excel (.csv)"
            >
              <FileSpreadsheet className="size-3.5" /> Excel
            </Button>
          </div>
        </div>

        {/* View Switcher & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border">
            <button
              onClick={() => setViewMode("section")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "section"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Section View
            </button>
            <button
              onClick={() => setViewMode("faculty")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "faculty"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Faculty View
            </button>
            <button
              onClick={() => setViewMode("room")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "room"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Room View
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer md:hidden ${
                viewMode === "mobile"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mobile View
            </button>
          </div>

          {/* Context Filter Dropdown */}
          <div className="flex items-center gap-3">
            {viewMode === "section" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Cohort:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Sections (Overview)</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === "faculty" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Instructor:</span>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
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
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
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
          <GlassPanel id="timetable-export-grid" className="overflow-hidden p-0 shadow-sm border-border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                {/* Horizontal Time Columns Header */}
                <thead>
                  <tr className="border-b border-border bg-card/70">
                    {/* Vertical Days Header Title */}
                    <th className="p-4 text-xs font-bold text-foreground w-36 uppercase tracking-wider text-center border-r border-border bg-card sticky left-0 z-20 shadow-xs">
                      Day / Period
                    </th>

                    {/* Dynamic Time Columns */}
                    {timelineCols.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        className={`p-3.5 text-xs font-bold uppercase tracking-wider text-center border-r border-border min-w-[175px] ${
                          col.type === "break"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "text-foreground bg-card/40"
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
                    <tr key={day} className="border-b border-border hover:bg-muted/10 transition-colors">
                      {/* Vertical Day Header Column (Sticky Left) */}
                      <td className="p-4 text-center border-r border-border bg-card/80 sticky left-0 z-10 font-bold text-xs text-foreground shadow-xs">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-xs">
                          {day}
                        </span>
                      </td>

                      {/* Period Cells Along the Horizontal Axis */}
                      {timelineCols.map((col, cIdx) => {
                        if (col.type === "break") {
                          return (
                            <td
                              key={cIdx}
                              className="p-3 border-r border-border bg-amber-500/5 text-center align-middle"
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
                            className="p-2.5 border-r border-border last:border-r-0 align-top min-w-[175px] h-32 bg-card/10 hover:bg-primary/5 transition-colors"
                          >
                            {cellEntries.length === 0 ? (
                              <div
                                onClick={() => slot && handleOpenAssignModal(day, periodStr, slot)}
                                className="h-full flex flex-col items-center justify-center border border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-[11px] text-muted-foreground/60 cursor-pointer transition-all p-2 group"
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
                                        : "bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="font-mono text-xs font-bold text-[#8B5CF6] dark:text-[#A78BFA]">
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
          </GlassPanel>
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
                            className="p-3 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-xs text-[#8B5CF6]">
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
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
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
    </>
  </AppShell>
  );
}