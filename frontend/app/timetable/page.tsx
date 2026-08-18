"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  RefreshCw,
  Printer,
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
  Terminal,
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

interface TimeSlot { id: number; day_of_week: string; start_time: string; end_time: string; }
interface SubjectOffering { id: number; subject_id: number; faculty_id: number; section_id: number; semester_id: number; weekly_hours: number; }
interface TimetableEntry { id?: number; timetable_id?: number; subject_offering_id: number; room_id: number; time_slot_id: number; }
interface Subject { id: number; name: string; code: string; }
interface Faculty { id: number; name: string; designation?: string; }
interface Room { id: number; name: string; room_type?: string; }
interface Section { id: number; name: string; }

interface SlotDetail {
  subject: string;
  code: string;
  faculty: string;
  room: string;
  section: string;
  day: string;
  period: string;
  subjectId: number;
}

// Pure Colorless Transparent Glass Period Cells
const SUBJECT_PALETTES = [
  {
    bg: "bg-white/[0.05] dark:bg-white/[0.035] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]",
    border: "border-border/80 hover:border-foreground/30",
    text: "text-foreground",
    badge: "bg-black/[0.05] dark:bg-white/[0.08] text-foreground border border-border",
    glow: "hover:shadow-[0_12px_28px_-5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]",
  },
  {
    bg: "bg-white/[0.05] dark:bg-white/[0.035] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]",
    border: "border-border/80 hover:border-foreground/30",
    text: "text-foreground",
    badge: "bg-black/[0.05] dark:bg-white/[0.08] text-foreground border border-border",
    glow: "hover:shadow-[0_12px_28px_-5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]",
  },
  {
    bg: "bg-white/[0.05] dark:bg-white/[0.035] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]",
    border: "border-border/80 hover:border-foreground/30",
    text: "text-foreground",
    badge: "bg-black/[0.05] dark:bg-white/[0.08] text-foreground border border-border",
    glow: "hover:shadow-[0_12px_28px_-5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]",
  },
  {
    bg: "bg-white/[0.05] dark:bg-white/[0.035] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]",
    border: "border-border/80 hover:border-foreground/30",
    text: "text-foreground",
    badge: "bg-black/[0.05] dark:bg-white/[0.08] text-foreground border border-border",
    glow: "hover:shadow-[0_12px_28px_-5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]",
  },
  {
    bg: "bg-white/[0.05] dark:bg-white/[0.035] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]",
    border: "border-border/80 hover:border-foreground/30",
    text: "text-foreground",
    badge: "bg-black/[0.05] dark:bg-white/[0.08] text-foreground border border-border",
    glow: "hover:shadow-[0_12px_28px_-5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]",
  },
];

export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStepIndex, setGenStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | "ALL">("ALL");

  const [activeSlot, setActiveSlot] = useState<SlotDetail | null>(null);

  const solverSteps = [
    "Formulating CP-SAT Linear Constraints...",
    "Validating Faculty Workload & Availability...",
    "Enforcing Single-Instructor Room Binding...",
    "Executing Branch-and-Bound Schedule Search...",
    "Minimizing Student Cohort Idle Periods...",
    "Emitting Globally Optimal Timetable...",
  ];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userDeptId = user?.department_id;
      const userInstId = user?.institution_id;

      const subUrl = userDeptId ? `${API_BASE}/subjects/?department_id=${userDeptId}` : `${API_BASE}/subjects/`;
      const facUrl = userDeptId ? `${API_BASE}/faculty/?department_id=${userDeptId}` : `${API_BASE}/faculty/`;
      const roomUrl = userInstId ? `${API_BASE}/rooms/?institution_id=${userInstId}` : `${API_BASE}/rooms/`;
      const secUrl = userDeptId ? `${API_BASE}/sections/?department_id=${userDeptId}` : `${API_BASE}/sections/`;

      const [slotRes, offRes, subRes, facRes, roomRes, secRes, entryRes] = await Promise.all([
        fetch(`${API_BASE}/time-slots/`),
        fetch(`${API_BASE}/subject-offerings/`),
        fetch(subUrl),
        fetch(facUrl),
        fetch(roomUrl),
        fetch(secUrl),
        fetch(`${API_BASE}/timetable-entries/`),
      ]);

      let loadedSlots: TimeSlot[] = slotRes.ok ? await slotRes.json().catch(() => []) : [];
      let loadedOfferings: SubjectOffering[] = offRes.ok ? await offRes.json().catch(() => []) : [];
      let loadedSubjects: Subject[] = subRes.ok ? await subRes.json().catch(() => []) : [];
      let loadedFaculty: Faculty[] = facRes.ok ? await facRes.json().catch(() => []) : [];
      let loadedRooms: Room[] = roomRes.ok ? await roomRes.json().catch(() => []) : [];
      let loadedSections: Section[] = secRes.ok ? await secRes.json().catch(() => []) : [];
      let loadedEntries: TimetableEntry[] = entryRes.ok ? await entryRes.json().catch(() => []) : [];

      setTimeSlots(loadedSlots);
      setOfferings(loadedOfferings);
      setSubjects(loadedSubjects);
      setFaculty(loadedFaculty);
      setRooms(loadedRooms);
      setSections(loadedSections);
      setEntries(loadedEntries);

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

      let { slots, offerings: offs, subjects: subs, faculty: facs, rooms: rms, sections: secs } = current;

      let institutionId = 1;
      const instRes = await fetch(`${API_BASE}/institutions/`);
      if (instRes.ok) {
        const insts = await instRes.json();
        if (insts.length > 0) { institutionId = insts[0].id; }
        else {
          const createInst = await fetch(`${API_BASE}/institutions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "College of Engineering" }),
          });
          if (createInst.ok) { const newInst = await createInst.json(); institutionId = newInst.id; }
        }
      }

      let semesterId = 1;
      const semRes = await fetch(`${API_BASE}/semesters/`);
      if (semRes.ok) {
        const sems = await semRes.json();
        if (sems.length > 0) { semesterId = sems[0].id; }
        else {
          let yearId = 1;
          const yrRes = await fetch(`${API_BASE}/academic-years/`);
          if (yrRes.ok) {
            const yrs = await yrRes.json();
            if (yrs.length > 0) { yearId = yrs[0].id; }
            else {
              const createYr = await fetch(`${API_BASE}/academic-years/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ institution_id: institutionId, name: "2026-27" }),
              });
              if (createYr.ok) { const newYr = await createYr.json(); yearId = newYr.id; }
            }
          }
          const createSem = await fetch(`${API_BASE}/semesters/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ academic_year_id: yearId, name: "Semester 1" }),
          });
          if (createSem.ok) { const newSem = await createSem.json(); semesterId = newSem.id; }
        }
      }

      if (rms.length === 0) {
        const createRoom = await fetch(`${API_BASE}/rooms/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ institution_id: institutionId, name: "Room 101", capacity: 60, room_type: "Classroom" }),
        });
        if (createRoom.ok) { rms = [await createRoom.json()]; setRooms(rms); }
      }

      if (secs.length === 0) {
        const createSec = await fetch(`${API_BASE}/sections/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_id: 1, name: "CSE-A" }),
        });
        if (createSec.ok) { secs = [await createSec.json()]; setSections(secs); }
      }

      if (subs.length === 0) {
        const createSub = await fetch(`${API_BASE}/subjects/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_id: 1, name: "Data Structures", code: "CS201" }),
        });
        if (createSub.ok) { subs = [await createSub.json()]; setSubjects(subs); }
      }

      if (facs.length === 0) {
        const createFac = await fetch(`${API_BASE}/faculty/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_id: 1, name: "Dr. Rajesh Kumar", designation: "Professor" }),
        });
        if (createFac.ok) { facs = [await createFac.json()]; setFaculty(facs); }
      }

      if (slots.length === 0) {
        const slotData = [
          { day_of_week: "Monday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Monday", start_time: "10:00", end_time: "11:00" },
          { day_of_week: "Tuesday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Tuesday", start_time: "10:00", end_time: "11:00" },
          { day_of_week: "Wednesday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Thursday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Friday", start_time: "09:00", end_time: "10:00" },
        ];
        for (const s of slotData) {
          const res = await fetch(`${API_BASE}/time-slots/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          });
          if (res.ok) { slots.push(await res.json()); }
        }
        setTimeSlots([...slots]);
      }

      if (offs.length === 0 && subs.length > 0 && facs.length > 0 && secs.length > 0) {
        for (let i = 0; i < subs.length; i++) {
          const sub = subs[i];
          const fac = facs[i % facs.length];
          const sec = secs[i % secs.length];
          const res = await fetch(`${API_BASE}/subject-offerings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject_id: sub.id,
              faculty_id: fac.id,
              section_id: sec.id,
              semester_id: semesterId,
              weekly_hours: 1,
            }),
          });
          if (res.ok) { offs.push(await res.json()); }
        }
        setOfferings([...offs]);
      }

      const genUrl = `${API_BASE}/generator/generate?semester_id=${semesterId}&institution_id=${institutionId}`;
      const genRes = await fetch(genUrl, { method: "POST" });
      const data = await genRes.json();

      if (data.status === "success") {
        setEntries(data.entries);
        setStatusMessage({
          type: "success",
          text: `Optimized schedule computed! OR-Tools placed ${data.entries.length} scheduled periods with zero hard conflicts.`,
        });
        await fetchAllData();
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Optimization engine could not find a feasible schedule.",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Error running timetable optimizer." });
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  };

  const getEntryForSlot = (day: string, periodIndex: number) => {
    const slot = timeSlots.find((s) => {
      if (s.day_of_week.toLowerCase() !== day.toLowerCase()) return false;
      const startHour = s.start_time.split(":")[0];
      if (periodIndex === 0 && (startHour === "09" || startHour === "9")) return true;
      if (periodIndex === 1 && startHour === "10") return true;
      if (periodIndex === 2 && startHour === "11") return true;
      if (periodIndex === 3 && startHour === "12") return true;
      if (periodIndex === 4 && (startHour === "14" || startHour === "02" || startHour === "2")) return true;
      if (periodIndex === 5 && (startHour === "15" || startHour === "03" || startHour === "3")) return true;
      return false;
    });

    if (!slot) return null;
    const entry = entries.find((e) => e.time_slot_id === slot.id);
    if (!entry) return null;
    const offering = offerings.find((o) => o.id === entry.subject_offering_id);
    if (!offering) return null;
    if (selectedSection !== "ALL" && offering.section_id !== selectedSection) return null;

    const sub = subjects.find((s) => s.id === offering.subject_id);
    const fac = faculty.find((f) => f.id === offering.faculty_id);
    const rm = rooms.find((r) => r.id === entry.room_id);
    const sec = sections.find((sc) => sc.id === offering.section_id);

    return {
      entry,
      subject: sub?.name || `Subject #${offering.subject_id}`,
      code: sub?.code || "SUB",
      faculty: fac?.name || `Faculty #${offering.faculty_id}`,
      room: rm?.name || `Room #${entry.room_id}`,
      section: sec?.name || `Sec #${offering.section_id}`,
      day,
      period: DEFAULT_PERIODS[periodIndex],
      subjectId: offering.subject_id,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        {/* Page Header with Eyebrow and Gradient Pill Actions */}
        <PageHeader
          title="Interactive Timetable Grid"
          description="Discrete constraint-optimized scheduling studio powered by Google OR-Tools CP-SAT."
          icon={CalendarDays}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAllData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh schedule"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>

          <Button
            variant="outline"
            className="h-10 rounded-xl gap-2 font-semibold border-border bg-card hover:bg-muted text-foreground"
            onClick={() => window.print()}
          >
            <Printer className="size-4 text-[#8B5CF6]" />
            Print Matrix
          </Button>

          <Button
            className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-5 cursor-pointer"
            onClick={handleGenerate}
            disabled={generating}
          >
            <Wand2 className={`size-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Solving Constraints..." : "Generate Timetable"}
          </Button>
        </PageHeader>

        {/* Animated Optimization Progress Banner */}
        {generating && (
          <GlassPanel glow="purple" className="p-6 space-y-4 tt-animate-pop border-[#8B5CF6]/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#A78BFA]">
                  <Sparkles className="size-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">OR-Tools CP-SAT Optimizer In Progress</h4>
                  <p className="text-xs text-muted-foreground">Solving discrete multi-resource allocation constraints</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#8B5CF6] dark:text-[#A78BFA] animate-pulse">
                STEP {genStepIndex + 1}/{solverSteps.length}
              </span>
            </div>

            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899] transition-all duration-300"
                style={{ width: `${((genStepIndex + 1) / solverSteps.length) * 100}%` }}
              />
            </div>

            <p className="text-xs font-semibold text-[#8B5CF6] dark:text-[#A78BFA] flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#8B5CF6] animate-ping" />
              {solverSteps[genStepIndex]}
            </p>
          </GlassPanel>
        )}

        {/* Status Alert */}
        {statusMessage && !generating && (
          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-semibold tt-animate-pop ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                : "bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-[#8B5CF6] dark:text-[#A78BFA]"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-red-500 shrink-0" />
            )}
            <p>{statusMessage.text}</p>
          </div>
        )}

        {/* Section Filter Pills */}
        <GlassPanel className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 tt-eyebrow text-muted-foreground mr-1">
                <Filter className="size-3.5 text-[#8B5CF6]" />
                Section:
              </span>
              <Button
                size="sm"
                variant={selectedSection === "ALL" ? "default" : "outline"}
                className={`h-8 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  selectedSection === "ALL"
                    ? "tt-gradient-btn"
                    : "border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setSelectedSection("ALL")}
              >
                All Sections
              </Button>
              {sections.map((sec) => (
                <Button
                  key={sec.id}
                  size="sm"
                  variant={selectedSection === sec.id ? "default" : "outline"}
                  className={`h-8 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    selectedSection === sec.id
                      ? "tt-gradient-btn"
                      : "border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedSection(sec.id)}
                >
                  {sec.name}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="size-3.5 text-[#8B5CF6]" />
                <strong className="text-foreground">{entries.length}</strong> Placed Periods
              </span>
              <span>•</span>
              <span className="font-medium">
                <strong className="text-foreground">{rooms.length}</strong> Rooms
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Master Interactive Timetable Grid */}
        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Weekly Master Schedule Matrix</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Click any scheduled card to inspect allocation details</p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/10 px-2.5 py-1 text-[11px] font-bold text-[#8B5CF6] dark:text-[#A78BFA] border border-[#8B5CF6]/20">
                <Check className="size-3" />
                Zero Overlap Enforced
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[1000px]"
              style={{
                gridTemplateColumns: "130px repeat(5, minmax(170px, 1fr))",
              }}
            >
              {/* Day Header Row */}
              <div className="border-b border-r border-border bg-muted/40 p-3.5 text-center tt-eyebrow text-muted-foreground">
                Period
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-border bg-muted/40 p-3.5 text-center tt-eyebrow text-muted-foreground last:border-r-0"
                >
                  {day}
                </div>
              ))}

              {/* Time Period Rows */}
              {DEFAULT_PERIODS.map((period, periodIdx) => (
                <div key={period} className="contents">
                  <div className="flex items-center justify-center border-b border-r border-border bg-muted/20 p-3 font-mono text-xs font-semibold text-muted-foreground">
                    {period}
                  </div>

                  {DAYS.map((day) => {
                    const item = getEntryForSlot(day, periodIdx);
                    const paletteIdx = item ? (item.subjectId % SUBJECT_PALETTES.length) : 0;
                    const pal = SUBJECT_PALETTES[paletteIdx];

                    return (
                      <div
                        key={`${day}-${period}`}
                        className="min-h-28 border-b border-r border-border p-2 transition-colors hover:bg-muted/15 last:border-r-0"
                      >
                        {item ? (
                          <button
                            type="button"
                            onClick={() => setActiveSlot(item)}
                            className={`group flex h-full w-full flex-col justify-between rounded-xl border p-3 text-left transition-all duration-300 hover:scale-[1.03] cursor-pointer ${pal.bg} ${pal.border} ${pal.glow}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-extrabold ${pal.badge}`}>
                                  {item.code}
                                </span>
                                <span className="rounded-md bg-card/80 border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {item.section}
                                </span>
                              </div>
                              <p className={`line-clamp-2 text-xs font-bold tracking-tight leading-snug ${pal.text}`}>
                                {item.subject}
                              </p>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-1.5">
                              <span className="line-clamp-1 font-semibold">{item.faculty}</span>
                              <span className="shrink-0 rounded-md bg-card/90 border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                                {item.room}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-2 text-center">
                            <span className="text-[11px] font-medium text-muted-foreground/40">Free Period</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* IDE-Style Detailed Cell Inspection Dialog */}
        <Dialog open={!!activeSlot} onOpenChange={(open) => !open && setActiveSlot(null)}>
          <DialogContent className="sm:max-w-[460px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            {activeSlot && (
              <div className="space-y-5">
                <DialogHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#A78BFA] border border-[#8B5CF6]/25 px-2.5 py-0.5 font-mono text-xs font-bold">
                      {activeSlot.code}
                    </span>
                    <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground font-mono">
                      {activeSlot.day} · {activeSlot.period}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground pt-2">
                    {activeSlot.subject}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Scheduled lecture period verified with zero faculty/room overlaps.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#A78BFA]">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="tt-eyebrow text-muted-foreground">Faculty Instructor</p>
                      <p className="text-sm font-bold text-foreground">{activeSlot.faculty}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#EC4899]/15 text-[#EC4899] dark:text-[#F472B6]">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <p className="tt-eyebrow text-muted-foreground">Assigned Room</p>
                      <p className="text-sm font-bold text-foreground">{activeSlot.room}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#A855F7]/15 text-[#A855F7] dark:text-[#C4B5FD]">
                      <BookOpen className="size-4" />
                    </div>
                    <div>
                      <p className="tt-eyebrow text-muted-foreground">Student Section Batch</p>
                      <p className="text-sm font-bold text-foreground">{activeSlot.section}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setActiveSlot(null)}
                    className="tt-gradient-btn rounded-xl px-5 font-bold"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}