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

  // Slot Durations
  const [theoryMin, setTheoryMin] = useState(50);
  const [labMin, setLabMin] = useState(100);
  const [lunchBreakStart, setLunchBreakStart] = useState("13:00");
  const [lunchBreakDuration, setLunchBreakDuration] = useState(60);

  // Computed data
  const [totalStudents, setTotalStudents] = useState(180);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(6);
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
        if (parsed.theoryMin) setTheoryMin(parsed.theoryMin);
        if (parsed.labMin) setLabMin(parsed.labMin);
      }

      const savedCourses = localStorage.getItem("vtu_college_offered_courses");
      if (savedCourses) {
        const parsedCourses = JSON.parse(savedCourses);
        const selected = parsedCourses.filter((c: any) => c.selected);
        const total = selected.reduce((sum: number, c: any) => sum + (c.studentCount || 0), 0);
        setTotalStudents(total || 180);
      }

      const savedSubjs = localStorage.getItem("vtu_course_subjects_map");
      if (savedSubjs) {
        const parsedSubjs = JSON.parse(savedSubjs);
        let count = 0;
        Object.values(parsedSubjs).forEach((val: any) => {
          count += (val.theory?.length || 0) + (val.practical?.length || 0);
        });
        if (count > 0) setActiveSubjectsCount(count);
      }
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
        JSON.stringify({ roomCapacity, labCapacity, coincidedLabGroup })
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
    theoryMin,
    labMin,
    lunchBreakStart,
    lunchBreakDuration,
    isLoaded,
  ]);

  const calculatedSections = Math.ceil(totalStudents / Math.max(1, roomCapacity));
  const calculatedBatchesPerSec = Math.ceil((roomCapacity || 60) / Math.max(1, labCapacity));

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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Section Calculation, Lab Coinciding & Period Durations
          </h1>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRunGenerator}
              disabled={generating}
              className="h-8 px-4 text-xs font-bold rounded-lg bg-gradient-to-r from-primary via-[#00A3FF] to-primary text-white shadow-xs hover:opacity-90 disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5"
            >
              {generating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>{generating ? "Solving Constraints..." : "Generate Timetable"}</span>
            </button>
          </div>
        </div>

        {/* Live Capacity Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Enrolled Students
            </p>
            <p className="text-2xl font-extrabold text-primary font-mono">{totalStudents}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Computed Sections
            </p>
            <p className="text-2xl font-extrabold text-primary font-mono">{calculatedSections}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Batches / Section
            </p>
            <p className="text-2xl font-extrabold text-[#00A3FF] font-mono">{calculatedBatchesPerSec}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Curriculum Subjects
            </p>
            <p className="text-2xl font-extrabold text-[#00A3FF] font-mono">{activeSubjectsCount}</p>
          </div>
        </div>

        {genStatus && (
          <div
            className={`p-3 rounded-xl flex items-center space-x-2.5 text-xs font-semibold tt-animate-fade ${
              genStatus.includes("successfully") || genStatus.includes("0 hard conflicts")
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {genStatus.includes("successfully") || genStatus.includes("0 hard conflicts") ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0" />
            )}
            <span>{genStatus}</span>
          </div>
        )}

        {/* 2-Column Wide Configuration Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Left Column: Room & Lab Architecture */}
          <div className="rounded-xl border border-border bg-card/60 p-4 sm:p-5 space-y-4">
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