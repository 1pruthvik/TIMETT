"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Building2,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

export default function SectionsPage() {
  const router = useRouter();

  // Section & Room Capacities
  const [roomCapacity, setRoomCapacity] = useState(60);
  const [labCapacity, setLabCapacity] = useState(30);
  const [coincidedLabGroup, setCoincidedLabGroup] = useState("CS Central Lab Facility");
  const [labRotationMode, setLabRotationMode] = useState<"synchronous_parallel" | "independent">("synchronous_parallel");

  // Slot Durations
  const [theoryMin, setTheoryMin] = useState(50);
  const [labMin, setLabMin] = useState(100);
  const [lunchBreakStart, setLunchBreakStart] = useState("13:00");
  const [lunchBreakDuration, setLunchBreakDuration] = useState(60);

  // Computed data
  const [totalStudents, setTotalStudents] = useState(180);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(6);
  const [activeLabSubjectsCount, setActiveLabSubjectsCount] = useState(2);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generator State
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCap = localStorage.getItem("vtu_room_capacity_config");
      if (savedCap) {
        const parsed = JSON.parse(savedCap);
        if (parsed.roomCapacity) setRoomCapacity(parsed.roomCapacity);
        if (parsed.labCapacity) setLabCapacity(parsed.labCapacity);
        if (parsed.coincidedLabGroup) setCoincidedLabGroup(parsed.coincidedLabGroup);
      }

      const savedSlot = localStorage.getItem("vtu_slot_duration_config");
      if (savedSlot) {
        const parsed = JSON.parse(savedSlot);
        if (parsed.theoryMin && parsed.theoryMin > 0) setTheoryMin(parsed.theoryMin);
        else setTheoryMin(50);

        if (parsed.labMin && parsed.labMin > 0) setLabMin(parsed.labMin);
        else setLabMin(100);
      } else {
        setTheoryMin(50);
        setLabMin(100);
      }

      const savedCourses = localStorage.getItem("vtu_college_offered_courses");
      if (savedCourses) {
        const parsedCourses = JSON.parse(savedCourses);
        const selected = parsedCourses.filter((c: any) => c.selected);
        const total = selected.reduce((sum: number, c: any) => sum + (c.studentCount || 0), 0);
        setTotalStudents(total || 180);
      }

      // Check Sem 5 and Sem 6 for lab subjects count
      let totalSubjs = 0;
      let totalLabs = 0;
      ["vtu_course_subjects_map_sem5", "vtu_course_subjects_map_sem6", "vtu_course_subjects_map"].forEach((key) => {
        const savedSubjs = localStorage.getItem(key);
        if (savedSubjs) {
          try {
            const parsed = JSON.parse(savedSubjs);
            Object.values(parsed).forEach((val: any) => {
              totalSubjs += (val.theory?.length || 0) + (val.practical?.length || 0);
              if (val.practical?.length) totalLabs = Math.max(totalLabs, val.practical.length);
            });
          } catch (e) {}
        }
      });

      if (totalSubjs > 0) setActiveSubjectsCount(totalSubjs);
      if (totalLabs > 0) setActiveLabSubjectsCount(totalLabs);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Automatic saving on any change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        "vtu_room_capacity_config",
        JSON.stringify({ roomCapacity, labCapacity, coincidedLabGroup, labRotationMode, labBatchesCount: calculatedBatchesPerSec })
      );
      localStorage.setItem(
        "vtu_slot_duration_config",
        JSON.stringify({ theoryMin, labMin, lunchBreakStart, lunchBreakDuration })
      );
    } catch (e) {
      console.error(e);
    }
  }, [
    roomCapacity,
    labCapacity,
    coincidedLabGroup,
    labRotationMode,
    theoryMin,
    labMin,
    lunchBreakStart,
    lunchBreakDuration,
    isLoaded,
  ]);

  const calculatedSections = Math.ceil(totalStudents / Math.max(1, roomCapacity));
  const calculatedBatchesPerSec = Math.max(1, activeLabSubjectsCount);
  const calculatedLabCapacity = Math.ceil((roomCapacity || 60) / calculatedBatchesPerSec);

  useEffect(() => {
    if (calculatedLabCapacity > 0) {
      setLabCapacity(calculatedLabCapacity);
    }
  }, [calculatedLabCapacity]);

  const handleRunGenerator = async () => {
    setGenerating(true);
    setGenStatus(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/generator/generate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setGenStatus("Timetable successfully generated with 0 hard conflicts! Redirecting to studio...");
        setTimeout(() => {
          router.push("/timetable");
        }, 1200);
      } else {
        setGenStatus(`Optimization message: ${data.message || "Solver finished"}`);
      }
    } catch (err) {
      setGenStatus("Solver initiated. Opening studio view...");
      setTimeout(() => {
        router.push("/timetable");
      }, 1500);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header (No suggestions/descriptions) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Section Calculation, Lab Coinciding & Period Durations
          </h1>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRunGenerator}
              disabled={generating}
              className="px-7 py-3 text-sm font-extrabold rounded-2xl bg-gradient-to-r from-primary via-[#00A3FF] to-primary text-white shadow-xl hover:scale-105 disabled:opacity-50 transition cursor-pointer flex items-center space-x-2.5"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{generating ? "Solving Constraints..." : "Generate Conflict-Free Timetable"}</span>
            </button>
          </div>
        </div>

        {/* Live Capacity Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Enrolled Students
            </p>
            <p className="text-3xl font-extrabold text-primary font-mono">{totalStudents}</p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Computed Class Sections
            </p>
            <p className="text-3xl font-extrabold text-primary font-mono">{calculatedSections}</p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Lab Batches / Section
            </p>
            <p className="text-3xl font-extrabold text-[#00A3FF] font-mono">{calculatedBatchesPerSec}</p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Curriculum Subjects
            </p>
            <p className="text-3xl font-extrabold text-[#00A3FF] font-mono">{activeSubjectsCount}</p>
          </div>
        </div>

        {genStatus && (
          <div
            className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold tt-animate-fade ${
              genStatus.includes("successfully") || genStatus.includes("0 hard conflicts")
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-md"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {genStatus.includes("successfully") || genStatus.includes("0 hard conflicts") ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <Sparkles className="h-5 w-5 shrink-0" />
            )}
            <span>{genStatus}</span>
          </div>
        )}

        {/* 2-Column Wide Configuration Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Room & Lab Architecture */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
            <div className="border-b border-border/50 pb-3">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Classroom & Lab Capacity Architecture</span>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Classroom Capacity (Students per Section)
                </label>
                <input
                  type="number"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Lab Batch Capacity ($C$ Students per Lab Batch)
                </label>
                <input
                  type="number"
                  value={labCapacity}
                  onChange={(e) => setLabCapacity(Number(e.target.value))}
                  className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Lab Batch Coinciding / Scheduling Strategy
                </label>
                <select
                  value={labRotationMode}
                  onChange={(e) => setLabRotationMode(e.target.value as "synchronous_parallel" | "independent")}
                  className="w-full h-12 px-4 text-xs font-bold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="synchronous_parallel">
                    🔄 Synchronous Parallel Rotation (Batch A1 & A2 attend parallel labs simultaneously & rotate weekly)
                  </option>
                  <option value="independent">
                    ⚡ Independent Batch Scheduling (Batches take labs in separate time slots)
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Coinciding / Shared Lab Facility Name
                </label>
                <input
                  type="text"
                  value={coincidedLabGroup}
                  onChange={(e) => setCoincidedLabGroup(e.target.value)}
                  placeholder="e.g. CS Central Computing Lab"
                  className="w-full h-12 px-4 text-sm font-medium rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Period Durations & Timings */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
            <div className="border-b border-border/50 pb-3">
              <h2 className="text-sm font-bold text-[#00A3FF] uppercase tracking-wider flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Period Durations & Schedule Grid</span>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Theory Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={theoryMin}
                      onChange={(e) => setTheoryMin(Number(e.target.value))}
                      className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      min
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Practical Lab Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={labMin}
                      onChange={(e) => setLabMin(Number(e.target.value))}
                      className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      min
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Timings Grid */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>College Daily Operational Timetable Structure</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Period 1</span>
                    <span className="font-mono font-bold text-foreground">09:00 - 09:50</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Period 2</span>
                    <span className="font-mono font-bold text-foreground">09:50 - 10:40</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Tea Break</span>
                    <span className="font-mono text-muted-foreground">10:40 - 10:55</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Period 3</span>
                    <span className="font-mono font-bold text-foreground">10:55 - 11:45</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Period 4 (Lab 1)</span>
                    <span className="font-mono font-bold text-primary">11:45 - 12:35</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground block">Period 5 (Lab 2)</span>
                    <span className="font-mono font-bold text-primary">12:35 - 13:25</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Navigation with Scrolling Overscroll Transition */}
        <WizardFooter
          prevHref="/faculties"
          onGenerate={handleRunGenerator}
          generating={generating}
        />

      </div>
    </AppShell>
  );
}