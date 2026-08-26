"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Clock,
  CalendarDays,
  RefreshCw,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Coffee,
  BookOpen,
  FlaskConical,
  Sun,
  Moon,
  ChevronRight,
  ArrowRight,
  Sliders,
  Timer,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ALL_DAYS = [
  { id: "Monday", label: "Mon", full: "Monday" },
  { id: "Tuesday", label: "Tue", full: "Tuesday" },
  { id: "Wednesday", label: "Wed", full: "Wednesday" },
  { id: "Thursday", label: "Thu", full: "Thursday" },
  { id: "Friday", label: "Fri", full: "Friday" },
  { id: "Saturday", label: "Sat", full: "Saturday" },
  { id: "Sunday", label: "Sun", full: "Sunday" },
];

export interface DurationHMS {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Time12H {
  hour: number; // 1 - 12
  minute: number; // 0 - 59
  period: "AM" | "PM";
}

export interface DailyBreak {
  id: string;
  name: string;
  startTime: Time12H;
  duration: DurationHMS;
}

export interface GeneratedSlot {
  type: "theory" | "lab" | "break";
  label: string;
  startTime: string; // 12h display e.g. "09:00 AM"
  endTime: string; // 12h display e.g. "10:00 AM"
  startTime24: string; // "09:00"
  endTime24: string; // "10:00"
  durationMinutes: number;
}

interface SavedTimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

// Format Duration HMS to string
function formatDuration(d: DurationHMS): string {
  const parts = [];
  if (d.hours > 0) parts.push(`${d.hours}h`);
  if (d.minutes > 0 || (d.hours === 0 && d.seconds === 0)) parts.push(`${d.minutes}m`);
  if (d.seconds > 0) parts.push(`${d.seconds}s`);
  return parts.join(" ");
}

function durationToMinutes(d: DurationHMS): number {
  return d.hours * 60 + d.minutes + Math.round(d.seconds / 60);
}

// Convert 12H to 24H string "HH:MM"
function time12To24(t: Time12H): string {
  let h = t.hour;
  if (t.period === "AM" && h === 12) h = 0;
  if (t.period === "PM" && h !== 12) h += 12;
  const hh = h.toString().padStart(2, "0");
  const mm = t.minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// Convert 12H to string e.g. "09:00 AM"
function formatTime12(t: Time12H): string {
  const hh = t.hour.toString().padStart(2, "0");
  const mm = t.minute.toString().padStart(2, "0");
  return `${hh}:${mm} ${t.period}`;
}

// Convert 12H to total minutes from midnight
function time12ToTotalMinutes(t: Time12H): number {
  let h = t.hour;
  if (t.period === "AM" && h === 12) h = 0;
  if (t.period === "PM" && h !== 12) h += 12;
  return h * 60 + t.minute;
}

// Convert total minutes from midnight back to 12H
function minutesToTime12(totalMin: number): Time12H {
  const norm = ((totalMin % 1440) + 1440) % 1440;
  let h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { hour: h12, minute: m, period };
}

// ==========================================
// 12-Hour Clock Selection Component
// ==========================================
function Clock12Picker({
  value,
  onChange,
  label,
}: {
  value: Time12H;
  onChange: (val: Time12H) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-sm font-semibold text-foreground transition-colors cursor-pointer shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <span className="font-mono text-sm tracking-wide">{formatTime12(value)}</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          12-hr
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4 rounded-2xl border-border bg-card/95 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {label || "Select 12-Hour Time"}
          </span>
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {formatTime12(value)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Hours Column */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block text-center mb-1.5">
              Hour
            </label>
            <div className="h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange({ ...value, hour: h })}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    value.hour === h
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {h.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes Column */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block text-center mb-1.5">
              Minute
            </label>
            <div className="h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...value, minute: m })}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    value.minute === m
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {m.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* AM / PM Column */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block text-center mb-1.5">
              AM / PM
            </label>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onChange({ ...value, period: "AM" })}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  value.period === "AM"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                    : "border border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Sun className="size-3.5" /> AM
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...value, period: "PM" })}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  value.period === "PM"
                    ? "bg-gradient-to-r from-[#0052FF] to-[#0070F3] text-white shadow-md"
                    : "border border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Moon className="size-3.5" /> PM
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs rounded-lg px-3 font-semibold bg-primary text-primary-foreground cursor-pointer"
          >
            Apply Time
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ==========================================
// Hours, Minutes, Seconds Duration Selection Window
// ==========================================
function DurationHMSPicker({
  value,
  onChange,
  title,
}: {
  value: DurationHMS;
  onChange: (val: DurationHMS) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-sm font-semibold text-foreground transition-colors cursor-pointer shadow-xs">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-[#0070F3]" />
          <span className="font-mono text-sm font-bold">{formatDuration(value)}</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          (H:M:S) ▾
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4 rounded-2xl border-border bg-card/95 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </span>
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {value.hours}h {value.minutes}m {value.seconds}s
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {[
            { label: "45m", h: 0, m: 45, s: 0 },
            { label: "50m", h: 0, m: 50, s: 0 },
            { label: "55m", h: 0, m: 55, s: 0 },
            { label: "1h 00m", h: 1, m: 0, s: 0 },
            { label: "1h 30m", h: 1, m: 30, s: 0 },
            { label: "2h 00m", h: 2, m: 0, s: 0 },
            { label: "3h 00m", h: 3, m: 0, s: 0 },
          ].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange({ hours: p.h, minutes: p.m, seconds: p.s })}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 3 Columns: Hours, Minutes, Seconds */}
        <div className="grid grid-cols-3 gap-2">
          {/* Hours (0 - 8) */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block text-center mb-1">
              Hours
            </label>
            <div className="h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {Array.from({ length: 9 }, (_, i) => i).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange({ ...value, hours: h })}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    value.hours === h
                      ? "bg-[#0070F3] text-white shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {h} hr
                </button>
              ))}
            </div>
          </div>

          {/* Minutes (0 - 59) */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block text-center mb-1">
              Minutes
            </label>
            <div className="h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...value, minutes: m })}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    value.minutes === m
                      ? "bg-[#0070F3] text-white shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {m.toString().padStart(2, "0")} min
                </button>
              ))}
            </div>
          </div>

          {/* Seconds (0 - 59) */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground block text-center mb-1">
              Seconds
            </label>
            <div className="h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {[0, 15, 30, 45].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ ...value, seconds: s })}
                  className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    value.seconds === s
                      ? "bg-[#0070F3] text-white shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {s.toString().padStart(2, "0")} sec
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs rounded-lg px-3 font-semibold bg-[#0070F3] text-white hover:bg-[#0052FF] cursor-pointer"
          >
            Apply Duration
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ==========================================
// Main Time Slots Page
// ==========================================
export default function TimeSlotsPage() {
  const [loading, setLoading] = useState(true);
  const [existingSlots, setExistingSlots] = useState<SavedTimeSlot[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 1. Number of working days & selected days
  const [numWorkingDays, setNumWorkingDays] = useState<number>(5);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);

  // 2. Day Start & End Time (12-Hour Clock)
  const [dayStartTime, setDayStartTime] = useState<Time12H>({
    hour: 9,
    minute: 0,
    period: "AM",
  });
  const [dayEndTime, setDayEndTime] = useState<Time12H>({
    hour: 4,
    minute: 30,
    period: "PM",
  });

  // 3. Day Structure: Theory & Lab Durations (HMS)
  const [theoryDuration, setTheoryDuration] = useState<DurationHMS>({
    hours: 1,
    minutes: 0,
    seconds: 0,
  });
  const [labDuration, setLabDuration] = useState<DurationHMS>({
    hours: 2,
    minutes: 0,
    seconds: 0,
  });

  // 4. Breaks in a Day: Number of breaks and Duration of each break
  const [breaks, setBreaks] = useState<DailyBreak[]>([
    {
      id: "b1",
      name: "Morning Tea Break",
      startTime: { hour: 11, minute: 0, period: "AM" },
      duration: { hours: 0, minutes: 15, seconds: 0 },
    },
    {
      id: "b2",
      name: "Lunch Break",
      startTime: { hour: 1, minute: 0, period: "PM" },
      duration: { hours: 0, minutes: 45, seconds: 0 },
    },
  ]);

  // Computed generated schedule timeline
  const [generatedTimeline, setGeneratedTimeline] = useState<GeneratedSlot[]>([]);
  const [savingGrid, setSavingGrid] = useState(false);

  const fetchExisting = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/time-slots/`).catch(() => null);
      if (res && res.ok) {
        setExistingSlots(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExisting();

    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem("timett_time_slot_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.selectedDays) setSelectedDays(parsed.selectedDays);
        if (parsed.numWorkingDays) setNumWorkingDays(parsed.numWorkingDays);
        if (parsed.dayStartTime) setDayStartTime(parsed.dayStartTime);
        if (parsed.dayEndTime) setDayEndTime(parsed.dayEndTime);
        if (parsed.theoryDuration) setTheoryDuration(parsed.theoryDuration);
        if (parsed.labDuration) setLabDuration(parsed.labDuration);
        if (parsed.breaks) setBreaks(parsed.breaks);
      } catch (e) {
        console.error("Failed to parse saved time slot config", e);
      }
    }
  }, []);

  // Update selected days when numWorkingDays changes
  const handleNumDaysChange = (num: number) => {
    setNumWorkingDays(num);
    if (num === 5) {
      setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    } else if (num === 6) {
      setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    } else if (num === 7) {
      setSelectedDays(ALL_DAYS.map((d) => d.id));
    } else {
      setSelectedDays(ALL_DAYS.slice(0, num).map((d) => d.id));
    }
  };

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length <= 1) return; // Keep at least one day
      const next = selectedDays.filter((d) => d !== dayId);
      setSelectedDays(next);
      setNumWorkingDays(next.length);
    } else {
      const next = [...selectedDays, dayId];
      setSelectedDays(next);
      setNumWorkingDays(next.length);
    }
  };

  // Breaks Handlers
  const addBreak = () => {
    const newId = `b_${Date.now()}`;
    setBreaks((prev) => [
      ...prev,
      {
        id: newId,
        name: `Break ${prev.length + 1}`,
        startTime: { hour: 3, minute: 0, period: "PM" },
        duration: { hours: 0, minutes: 15, seconds: 0 },
      },
    ]);
  };

  const removeBreak = (id: string) => {
    setBreaks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBreak = (id: string, field: keyof DailyBreak, value: any) => {
    setBreaks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // ==========================================
  // Timeline Auto-Generator Engine
  // ==========================================
  useEffect(() => {
    const dayStartMin = time12ToTotalMinutes(dayStartTime);
    const dayEndMin = time12ToTotalMinutes(dayEndTime);

    if (dayEndMin <= dayStartMin) {
      setGeneratedTimeline([]);
      return;
    }

    const theoryMin = Math.max(15, durationToMinutes(theoryDuration));
    const sortedBreaks = [...breaks].sort(
      (a, b) => time12ToTotalMinutes(a.startTime) - time12ToTotalMinutes(b.startTime)
    );

    const timeline: GeneratedSlot[] = [];
    let currentMin = dayStartMin;
    let periodIndex = 1;

    // Simulate stepping through the day
    while (currentMin < dayEndMin) {
      // Check if currentMin matches or overlaps a break
      const activeBreak = sortedBreaks.find(
        (b) => Math.abs(time12ToTotalMinutes(b.startTime) - currentMin) < 15
      );

      if (activeBreak) {
        const breakDur = Math.max(5, durationToMinutes(activeBreak.duration));
        const endBreakMin = Math.min(dayEndMin, currentMin + breakDur);

        timeline.push({
          type: "break",
          label: activeBreak.name || "Break",
          startTime: formatTime12(minutesToTime12(currentMin)),
          endTime: formatTime12(minutesToTime12(endBreakMin)),
          startTime24: time12To24(minutesToTime12(currentMin)),
          endTime24: time12To24(minutesToTime12(endBreakMin)),
          durationMinutes: endBreakMin - currentMin,
        });

        currentMin = endBreakMin;
        continue;
      }

      // Next is a Theory Lecture Period
      const nextPeriodEnd = Math.min(dayEndMin, currentMin + theoryMin);

      // Check if there is an upcoming break before nextPeriodEnd
      const upcomingBreak = sortedBreaks.find(
        (b) =>
          time12ToTotalMinutes(b.startTime) > currentMin &&
          time12ToTotalMinutes(b.startTime) < nextPeriodEnd
      );

      const actualEndMin = upcomingBreak
        ? time12ToTotalMinutes(upcomingBreak.startTime)
        : nextPeriodEnd;

      timeline.push({
        type: "theory",
        label: `Period ${periodIndex}`,
        startTime: formatTime12(minutesToTime12(currentMin)),
        endTime: formatTime12(minutesToTime12(actualEndMin)),
        startTime24: time12To24(minutesToTime12(currentMin)),
        endTime24: time12To24(minutesToTime12(actualEndMin)),
        durationMinutes: actualEndMin - currentMin,
      });

      periodIndex++;
      currentMin = actualEndMin;
    }

    setGeneratedTimeline(timeline);
  }, [dayStartTime, dayEndTime, theoryDuration, labDuration, breaks]);

  // Save generated schedule to backend time-slots & localStorage
  const handleSaveAndApplyGrid = async () => {
    setSavingGrid(true);
    setSavedSuccess(false);

    try {
      // 1. Save architecture config and active timeline to localStorage
      const config = {
        selectedDays,
        numWorkingDays,
        dayStartTime,
        dayEndTime,
        theoryDuration,
        labDuration,
        breaks,
      };
      localStorage.setItem("timett_time_slot_config", JSON.stringify(config));
      localStorage.setItem("timett_active_timeline", JSON.stringify(generatedTimeline));

      // 2. Delete old slots and register new generated theory periods in backend
      const existingRes = await fetch(`${API_BASE}/time-slots/`).catch(() => null);
      if (existingRes && existingRes.ok) {
        const oldSlots: SavedTimeSlot[] = await existingRes.json();
        for (const oldSlot of oldSlots) {
          await fetch(`${API_BASE}/time-slots/${oldSlot.id}`, { method: "DELETE" }).catch(() => null);
        }
      }

      const theorySlots = generatedTimeline.filter((s) => s.type === "theory");

      for (const day of selectedDays) {
        for (const slot of theorySlots) {
          await fetch(`${API_BASE}/time-slots/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              day_of_week: day,
              start_time: slot.startTime24,
              end_time: slot.endTime24,
            }),
          }).catch(() => null);
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
      await fetchExisting();
    } catch (err) {
      console.error("Failed to save time slots", err);
    } finally {
      setSavingGrid(false);
    }
  };

  const totalOperatingMinutes = Math.max(
    0,
    time12ToTotalMinutes(dayEndTime) - time12ToTotalMinutes(dayStartTime)
  );
  const operatingHours = Math.floor(totalOperatingMinutes / 60);
  const operatingMins = totalOperatingMinutes % 60;

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto tt-animate-fade pb-12">
        <PageHeader
          title="Time Slots Architecture & Schedule Setup"
          icon={Clock}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchExisting}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh slots"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          {/* SINGLE PRIMARY APPLY BUTTON AT TOP */}
          <Button
            onClick={handleSaveAndApplyGrid}
            disabled={savingGrid || generatedTimeline.length === 0}
            className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-5 cursor-pointer shadow-md"
          >
            {savingGrid ? (
              <>
                <RefreshCw className="size-4 animate-spin" /> Saving Architecture...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-400" /> Applied Successfully!
              </>
            ) : (
              <>
                <Save className="size-4" /> Save & Apply Daily Grid
              </>
            )}
          </Button>
        </PageHeader>

        {/* 4-Step Interactive Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Setup (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Institutional Working Days */}
            <GlassPanel className="p-6 rounded-3xl border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-[#0070F3]/10 border border-[#0070F3]/20 text-[#0070F3] font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Working Days in a Week
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Set how many days the institution operates weekly
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {selectedDays.length} Days Active
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Quick Select:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleNumDaysChange(5)}
                    className={`h-7 text-xs rounded-lg font-semibold border-border cursor-pointer ${
                      numWorkingDays === 5 ? "bg-primary/20 text-primary border-primary/30" : "bg-card"
                    }`}
                  >
                    5 Days (Mon - Fri)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleNumDaysChange(6)}
                    className={`h-7 text-xs rounded-lg font-semibold border-border cursor-pointer ${
                      numWorkingDays === 6 ? "bg-primary/20 text-primary border-primary/30" : "bg-card"
                    }`}
                  >
                    6 Days (Mon - Sat)
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {ALL_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                          isSelected
                            ? "bg-gradient-to-b from-[#0070F3]/20 to-[#0052FF]/20 border-[#0070F3] text-foreground shadow-xs"
                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span>{day.label}</span>
                        {isSelected && <span className="size-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassPanel>

            {/* Step 2: Day Start & End Time (12-Hour Clock Selection) */}
            <GlassPanel className="p-6 rounded-3xl border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-[#0070F3]/10 border border-[#0070F3]/20 text-[#0070F3] font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Daily Operating Hours (12-Hour Clock)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Select official institutional start and end timestamps
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono bg-muted/60 text-muted-foreground">
                  Span: {operatingHours}h {operatingMins > 0 ? `${operatingMins}m` : ""}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sun className="size-3.5 text-amber-500" /> Day Start Time (12h) *
                  </label>
                  <Clock12Picker
                    value={dayStartTime}
                    onChange={setDayStartTime}
                    label="Institutional Start Time"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Moon className="size-3.5 text-indigo-500" /> Day End Time (12h) *
                  </label>
                  <Clock12Picker
                    value={dayEndTime}
                    onChange={setDayEndTime}
                    label="Institutional End Time"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Step 3: Day Structure & Academic Session Durations (HMS) */}
            <GlassPanel className="p-6 rounded-3xl border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-[#0070F3]/10 border border-[#0070F3]/20 text-[#0070F3] font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Academic Class Durations (Hours : Mins : Secs)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Configure standard lecture period and laboratory block lengths
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <BookOpen className="size-3.5 text-primary" /> Theory Class Duration *
                  </label>
                  <DurationHMSPicker
                    value={theoryDuration}
                    onChange={setTheoryDuration}
                    title="Theory Class Duration"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FlaskConical className="size-3.5 text-[#0070F3]" /> Lab Session Duration *
                  </label>
                  <DurationHMSPicker
                    value={labDuration}
                    onChange={setLabDuration}
                    title="Laboratory Block Duration"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Step 4: Daily Breaks & Durations (HMS) */}
            <GlassPanel className="p-6 rounded-3xl border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-[#0070F3]/10 border border-[#0070F3]/20 text-[#0070F3] font-bold text-xs">
                    4
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Daily Breaks & Recess Intervals
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Specify number of breaks, start times, and duration windows (H:M:S)
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBreak}
                  className="h-8 rounded-lg gap-1 text-xs font-semibold border-border bg-card cursor-pointer"
                >
                  <Plus className="size-3.5" /> Add Break
                </Button>
              </div>

              <div className="space-y-3">
                {breaks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No daily breaks currently added. Click &ldquo;Add Break&rdquo; to define tea, recess, or lunch intervals.
                  </p>
                ) : (
                  breaks.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 rounded-2xl border border-border bg-card/60 p-3.5 shadow-xs"
                    >
                      {/* Break Label */}
                      <div className="w-full sm:w-44">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                          Break Name
                        </label>
                        <Input
                          value={b.name}
                          onChange={(e) => updateBreak(b.id, "name", e.target.value)}
                          placeholder="e.g. Lunch Break"
                          className="h-9 rounded-xl border-border bg-muted/40 text-xs font-semibold"
                        />
                      </div>

                      {/* Start Time */}
                      <div className="w-full sm:w-36">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                          Start Time (12h)
                        </label>
                        <Clock12Picker
                          value={b.startTime}
                          onChange={(t) => updateBreak(b.id, "startTime", t)}
                          label={`${b.name} Start Time`}
                        />
                      </div>

                      {/* Duration (H:M:S) */}
                      <div className="flex-1 w-full">
                        <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                          Duration (H:M:S)
                        </label>
                        <DurationHMSPicker
                          value={b.duration}
                          onChange={(d) => updateBreak(b.id, "duration", d)}
                          title={`${b.name} Duration`}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBreak(b.id)}
                        className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 sm:mt-4 cursor-pointer shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>
          </div>

          {/* Right Column: Live Schedule Generator Preview (Fully Expanded without Scrolling) */}
          <div className="lg:col-span-5 space-y-6">
            <GlassPanel className="p-0 overflow-hidden rounded-3xl border-border shadow-md">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-card/70">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Sparkles className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Generated Daily Schedule
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {generatedTimeline.filter((s) => s.type === "theory").length} Periods & {breaks.length} Breaks
                    </p>
                  </div>
                </div>

                <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs px-2.5 py-0.5">
                  Live Preview
                </Badge>
              </div>

              {/* Timeline Sequence Expanded to Full Length */}
              <div className="p-5 space-y-2.5">
                {generatedTimeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    Please ensure end time is later than start time to preview schedule.
                  </p>
                ) : (
                  generatedTimeline.map((slot, sIdx) => {
                    const isBreak = slot.type === "break";

                    return (
                      <div
                        key={sIdx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isBreak
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                            : "bg-card border-border hover:border-primary/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-8 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                              isBreak
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {isBreak ? <Coffee className="size-4" /> : `#${sIdx + 1}`}
                          </div>

                          <div>
                            <span className="font-bold text-xs block">
                              {slot.label}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {slot.startTime} &mdash; {slot.endTime}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
                            isBreak
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300"
                              : "bg-muted/60 text-muted-foreground border-border"
                          }`}
                        >
                          {slot.durationMinutes} mins
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
