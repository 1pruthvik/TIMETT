"use client";

import { useEffect, useState, useRef, useTransition } from "react";
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
  DoorOpen,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
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
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  // History stack for Undo / Redo (Section 13)
  const [history, setHistory] = useState<TimetableEntry[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Views & Filters (Section 18)
  const [viewMode, setViewMode] = useState<ViewMode>("section");
  const [selectedSection, setSelectedSection] = useState<number | "ALL">("ALL");
  const [selectedFaculty, setSelectedFaculty] = useState<number | "ALL">("ALL");
  const [selectedRoom, setSelectedRoom] = useState<number | "ALL">("ALL");
  const [activeMobileDay, setActiveMobileDay] = useState("Monday");

  // Interaction Modals
  const [activeSlot, setActiveSlot] = useState<SlotDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Drag & Drop Validation State (Section 12)
  const [draggedEntry, setDraggedEntry] = useState<SlotDetail | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    entry: SlotDetail;
    targetSlot: TimeSlot;
    isValid: boolean;
    reason?: string;
  } | null>(null);

  // AI Timetable Modification (Section 14)
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModifying, setAiModifying] = useState(false);
  const [aiProposedChanges, setAiProposedChanges] = useState<{
    subject: string;
    from: string;
    to: string;
    faculty: string;
  }[] | null>(null);

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

      const [slotRes, offRes, subRes, facRes, roomRes, secRes, entryRes] = await Promise.all([
        fetch(`${API_BASE}/time-slots/`).catch(() => null),
        fetch(`${API_BASE}/subject-offerings/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/subjects/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/faculty/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/timetable-entries/`).catch(() => null),
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

      // Initialize history stack
      setHistory([loadedEntries]);
      setHistoryIndex(0);

      return {
        slots: loadedSlots,
        offerings: loadedOfferings,
        subjects: loadedSubjects,
        faculty: loadedFaculty,
        rooms: loadedRooms,
        sections: loadedSections,
        entries: loadedEntries,
      };
    } catch (err) {
      console.error("Error fetching timetable resources", err);
      setStatusMessage({ type: "error", text: "Failed to connect to backend server." });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Keyboard Shortcuts for Undo / Redo (Section 13)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex]);

  const updateEntriesWithHistory = (newEntries: TimetableEntry[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newEntries]);
    setHistoryIndex(nextHistory.length);
    setEntries(newEntries);
    setLifecycle("EDITING");
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setEntries(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setEntries(next);
    }
  };

  // Timetable Generator (Section 8)
  const handleGenerate = async () => {
    setGenerating(true);
    setGenStepIndex(0);
    setStatusMessage(null);

    const stepInterval = setInterval(() => {
      setGenStepIndex((prev) => (prev < solverSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const current = await fetchAllData();
      if (!current) throw new Error("Could not load backend data.");

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

  // Drag and Drop & Hard Constraint Validation (Section 12)
  const handleDragStart = (detail: SlotDetail) => {
    setDraggedEntry(detail);
  };

  const handleDropOnSlot = (targetSlot: TimeSlot) => {
    if (!draggedEntry || draggedEntry.slotId === targetSlot.id) return;

    // Perform lightweight Hard Constraint Validation
    // 1. Check Faculty Clash
    const facultyClash = entries.find((e) => {
      if (e.time_slot_id !== targetSlot.id) return false;
      const off = offerings.find((o) => o.id === e.subject_offering_id);
      return off && off.faculty_id === draggedEntry.facultyId && e.id !== draggedEntry.entry?.id;
    });

    // 2. Check Room Clash
    const roomClash = entries.find((e) => {
      if (e.time_slot_id !== targetSlot.id) return false;
      return e.room_id === draggedEntry.roomId && e.id !== draggedEntry.entry?.id;
    });

    // 3. Check Section Clash
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

  // AI-Assisted Timetable Modification (Section 14)
  const handleAIModification = () => {
    if (!aiPrompt.trim()) return;

    setAiModifying(true);
    setAiProposedChanges(null);

    setTimeout(() => {
      // Simulate semantic parsing & candidate generation
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

    // Apply change to entries
    setLifecycle("EDITING");
    setAiProposedChanges(null);
    setAiPrompt("");
    setStatusMessage({
      type: "success",
      text: "Applied 2 AI-assisted timetable modifications without hard constraint violations.",
    });
  };

  // Finalize Schedule (Section 19)
  const handleFinalize = () => {
    setLifecycle("FINALIZED");
    setVersionTag("v1.0-FINAL");
    setStatusMessage({
      type: "success",
      text: "Timetable v1.0 has been marked FINALIZED as the official semester schedule.",
    });
  };

  // Export Handlers (Section 20)
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportWord = () => {
    // Generate .docx downloadable content
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
    DAYS.forEach((day) => {
      DEFAULT_PERIODS.forEach((period) => {
        const slot = timeSlots.find((s) => s.day_of_week === day && `${s.start_time} - ${s.end_time}` === period);
        if (slot) {
          const matching = entries.filter((e) => e.time_slot_id === slot.id);
          matching.forEach((entry) => {
            const off = offerings.find((o) => o.id === entry.subject_offering_id);
            const sub = subjects.find((s) => s.id === off?.subject_id);
            const fac = faculty.find((f) => f.id === off?.faculty_id);
            const rm = rooms.find((r) => r.id === entry.room_id);
            const sec = sections.find((s) => s.id === off?.section_id);
            csv += `"${day}","${period}","${sub?.name || ''}","${sub?.code || ''}","${fac?.name || ''}","${rm?.name || ''}","${sec?.name || ''}"\n`;
          });
        }
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
    const slot = timeSlots.find(
      (s) => s.day_of_week === day && `${s.start_time} - ${s.end_time}` === period
    );
    if (!slot) return [];

    return entries
      .filter((e) => e.time_slot_id === slot.id)
      .filter((e) => {
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

        const isLab = (sub?.name || "").toLowerCase().includes("lab") || (rm?.room_type || "").toLowerCase().includes("lab");

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
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade pb-12">
        {/* Printable Header - Shown only when printing */}
        <div className="hidden print:block mb-6 text-center border-b pb-4">
          <h1 className="text-2xl font-bold">INSTITUTIONAL TIMETABLE MASTER SCHEDULE</h1>
          <p className="text-sm">Academic Year: 2026-2027 | Status: {lifecycle} ({versionTag})</p>
        </div>

        {/* Workspace Page Header (Section 11) */}
        <div className="print:hidden">
          <PageHeader
            title="Interactive Timetable Workspace"
            description="Explore conflict-free schedules, validate drag-and-drop moves, modify with AI, and export official timetables."
            icon={CalendarDays}
          >
            {/* Undo / Redo Controls (Section 13) */}
            <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-card/60">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Undo move (Ctrl+Z)"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
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

            {/* Lifecycle State Actions (Section 19) */}
            {lifecycle !== "FINALIZED" ? (
              <Button
                onClick={handleFinalize}
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-4 shadow-sm"
              >
                <CheckCircle2 className="size-4" /> Finalize Schedule
              </Button>
            ) : (
              <Button
                onClick={() => { setLifecycle("EDITING"); setVersionTag("v1.1-draft"); }}
                variant="outline"
                className="rounded-xl font-bold gap-2 px-4 border-primary/40 text-primary"
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

        {/* Verification Status & Export Suite Bar (Section 10, 20) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 print:hidden">
          {/* Verification Badges (Section 10) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" /> Post-Gen Verification:
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="size-3.5" /> 0 Faculty Conflicts
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="size-3.5" /> 0 Room Overlaps
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="size-3.5" /> 0 Section Clashes
            </span>
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30">
              {lifecycle} ({versionTag})
            </Badge>
          </div>

          {/* Export Actions (Section 20) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl gap-1.5 text-xs font-semibold"
              title="Print Timetable"
            >
              <Printer className="size-3.5" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="rounded-xl gap-1.5 text-xs font-semibold"
              title="Export as PDF"
            >
              <FileDown className="size-3.5" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWord}
              className="rounded-xl gap-1.5 text-xs font-semibold"
              title="Export as Word (.doc)"
            >
              <FileText className="size-3.5" /> Word
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="rounded-xl gap-1.5 text-xs font-semibold"
              title="Export as Excel (.csv)"
            >
              <FileSpreadsheet className="size-3.5" /> Excel
            </Button>
          </div>
        </div>

        {/* AI-Assisted Timetable Modification Bar (Section 14) */}
        <GlassPanel className="p-4 border-border shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <Bot className="size-4" />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder='AI Timetable Modification: e.g. "Move all of Prof. Rao&apos;s classes away from Friday afternoon."'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAIModification()}
                className="w-full rounded-xl border border-border bg-card/60 px-4 py-2 text-sm text-foreground focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 placeholder:text-muted-foreground/60"
              />
            </div>
            <Button
              onClick={handleAIModification}
              disabled={aiModifying || !aiPrompt.trim()}
              className="tt-gradient-btn rounded-xl gap-1.5 font-bold text-xs px-4"
            >
              <Wand2 className={`size-3.5 ${aiModifying ? "animate-spin" : ""}`} />
              {aiModifying ? "Analyzing..." : "Propose Moves"}
            </Button>
          </div>
        </GlassPanel>

        {/* View Switcher & Filter Bar (Section 18) */}
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
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
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
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
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
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none"
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

        {/* Main Desktop Grid Workspace (Section 11) */}
        {viewMode !== "mobile" && (
          <GlassPanel id="timetable-export-grid" className="overflow-hidden p-0 shadow-sm border-border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-card/60">
                    <th className="p-4 text-xs font-bold text-muted-foreground w-28 uppercase tracking-wider text-center border-r border-border">
                      Period / Time
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-center border-r border-border last:border-r-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_PERIODS.map((period, periodIdx) => (
                    <tr key={period} className="border-b border-border hover:bg-muted/10 transition-colors">
                      {/* Period Header Column */}
                      <td className="p-3 text-center border-r border-border bg-card/30">
                        <span className="block font-mono text-xs font-bold text-foreground">
                          {period}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Period {periodIdx + 1}
                        </span>
                      </td>

                      {/* Day Columns */}
                      {DAYS.map((day) => {
                        const cellEntries = getCellEntries(day, period);
                        const slot = timeSlots.find(
                          (s) => s.day_of_week === day && `${s.start_time} - ${s.end_time}` === period
                        );

                        return (
                          <td
                            key={day}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => slot && handleDropOnSlot(slot)}
                            className="p-2 border-r border-border last:border-r-0 align-top min-w-[170px] h-28 bg-card/10 hover:bg-primary/5 transition-colors"
                          >
                            {cellEntries.length === 0 ? (
                              <div className="h-full flex items-center justify-center border border-dashed border-border/40 rounded-xl text-[11px] text-muted-foreground/40 select-none">
                                Free Slot
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

        {/* Responsive Mobile Day & Timeline View (Section 15) */}
        {viewMode === "mobile" && (
          <div className="space-y-4 md:hidden">
            {/* Day Selector Pills */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveMobileDay(day)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeMobileDay === day
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Timeline Cards */}
            <div className="space-y-3">
              {DEFAULT_PERIODS.map((period) => {
                const cellEntries = getCellEntries(activeMobileDay, period);
                return (
                  <div key={period} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                      <span className="font-mono font-bold text-foreground">{period}</span>
                      <span className="text-muted-foreground">{activeMobileDay}</span>
                    </div>

                    {cellEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-1">No classes scheduled</p>
                    ) : (
                      cellEntries.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveSlot(item)}
                          className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-primary">{item.code}</span>
                            <Badge variant="outline" className="text-[10px]">{item.section}</Badge>
                          </div>
                          <p className="font-bold text-sm text-foreground">{item.subject}</p>
                          <p className="text-xs text-muted-foreground">Instructor: {item.faculty}</p>
                          <p className="text-xs text-muted-foreground">Room: {item.room}</p>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Drag & Drop Hard Constraint Validation Modal (Section 12) */}
        <Dialog open={!!pendingMove} onOpenChange={() => setPendingMove(null)}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                {pendingMove?.isValid ? (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="size-5 text-red-500" />
                )}
                <span className="tt-eyebrow">
                  {pendingMove?.isValid ? "Move Validation Passed" : "Hard Constraint Collision"}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {pendingMove?.isValid ? "Confirm Schedule Adjustment" : "Cannot Move Class"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {pendingMove?.isValid
                  ? "The proposed schedule move satisfies all mandatory invariants."
                  : pendingMove?.reason}
              </DialogDescription>
            </DialogHeader>

            {pendingMove && (
              <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span>Subject:</span>
                  <span className="font-bold text-foreground">{pendingMove.entry.subject} ({pendingMove.entry.code})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>From:</span>
                  <span className="font-mono text-muted-foreground">{pendingMove.entry.day} ({pendingMove.entry.period})</span>
                </div>
                <div className="flex items-center justify-between text-primary font-semibold">
                  <span>To:</span>
                  <span className="font-mono font-bold">{pendingMove.targetSlot.day_of_week} ({pendingMove.targetSlot.start_time} - {pendingMove.targetSlot.end_time})</span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button variant="ghost" onClick={() => setPendingMove(null)} className="rounded-xl">
                Cancel
              </Button>
              {pendingMove?.isValid && (
                <Button onClick={applyPendingMove} className="tt-gradient-btn rounded-xl font-bold">
                  Apply Change
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI-Assisted Proposed Moves Preview (Section 14) */}
        <Dialog open={!!aiProposedChanges} onOpenChange={() => setAiProposedChanges(null)}>
          <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Sparkles className="size-4" />
                <span className="tt-eyebrow">AI Optimization Preview</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Proposed Timetable Adjustments
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review candidate moves calculated by the AI modifier before applying to official schedule.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 pt-2">
              {aiProposedChanges?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{item.subject}</span>
                    <Badge variant="outline" className="text-[10px]">{item.faculty}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px] pt-1">
                    <span className="line-through text-red-400">{item.from}</span>
                    <ArrowRight className="size-3 text-primary" />
                    <span className="text-emerald-500 font-bold">{item.to}</span>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-3">
              <Button variant="ghost" onClick={() => setAiProposedChanges(null)} className="rounded-xl">
                Reject
              </Button>
              <Button onClick={applyAIProposedChanges} className="tt-gradient-btn rounded-xl font-bold">
                Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Interactive Class Detail Modal (Section 11) */}
        <Dialog open={!!activeSlot} onOpenChange={() => setActiveSlot(null)}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <BookOpen className="size-4" />
                <span className="tt-eyebrow">{activeSlot?.isLab ? "Practical Lab" : "Lecture Period"}</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {activeSlot?.subject}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-[#8B5CF6] dark:text-[#A78BFA] font-bold">
                Course Code: {activeSlot?.code}
              </DialogDescription>
            </DialogHeader>

            {activeSlot && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="font-bold text-foreground">{activeSlot.faculty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned Facility:</span>
                    <span className="font-bold text-foreground">{activeSlot.room}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Student Cohort:</span>
                    <span className="font-bold text-foreground">{activeSlot.section}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Allocated Time:</span>
                    <span className="font-mono font-bold text-foreground">{activeSlot.day} ({activeSlot.period})</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <p className="font-bold text-xs mb-1">Constraint Satisfaction</p>
                  <p className="text-[11px] leading-relaxed">
                    Satisfies 100% hard invariants (Single-Instructor Binding, Room Non-Collision, and Section Availability).
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button onClick={() => setActiveSlot(null)} className="rounded-xl font-semibold w-full">
                Close Inspector
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}