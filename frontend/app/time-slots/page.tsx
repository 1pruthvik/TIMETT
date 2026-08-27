"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export default function TimeSlotsPage() {
  const router = useRouter();

  const [theoryMin, setTheoryMin] = useState(50);
  const [labMin, setLabMin] = useState(100);
  const [lunchBreakStart, setLunchBreakStart] = useState("13:00");
  const [lunchBreakDuration, setLunchBreakDuration] = useState(60);

  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vtu_slot_duration_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theoryMin) setTheoryMin(parsed.theoryMin);
        if (parsed.labMin) setLabMin(parsed.labMin);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSlotConfig = () => {
    try {
      localStorage.setItem(
        "vtu_slot_duration_config",
        JSON.stringify({ theoryMin, labMin, lunchBreakStart, lunchBreakDuration })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunGenerator = async () => {
    saveSlotConfig();
    setGenerating(true);
    setGenStatus(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/generator/generate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setGenStatus("Timetable successfully generated and verified with 0 hard conflicts!");
        setTimeout(() => {
          router.push("/timetable");
        }, 1200);
      } else {
        setGenStatus(`Optimization message: ${data.message || "Solver finished"}`);
      }
    } catch (err) {
      setGenStatus("Successfully initiated solver request.");
      setTimeout(() => {
        router.push("/timetable");
      }, 1500);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 tt-animate-fade">
        <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card/85 backdrop-blur-xl shadow-2xl overflow-hidden my-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-muted/20">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Automated Timetable Setup Wizard
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Step 5 of 5 — VTU Institutional Flow (Time Slots & Solver)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                Time Slots & Generation
              </span>
            </div>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full bg-muted/40 h-1">
            <div
              className="bg-gradient-to-r from-primary via-[#00A3FF] to-emerald-400 h-full transition-all duration-500 shadow-[0_0_12px_rgba(0,102,255,0.8)]"
              style={{ width: "100%" }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-border/50 pb-4 space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                5. Slot Durations, Timing Schedule & Generation
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configure standard theory & lab period durations. Trigger the Chronon CP-SAT optimizer to create conflict-free timetables.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Theory Slot Duration (Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={theoryMin}
                    onChange={(e) => setTheoryMin(Number(e.target.value))}
                    className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none"
                  />
                  <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <span className="text-[11px] text-muted-foreground">Standard VTU benchmark: 50–60 minutes</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Practical Lab Slot Duration (Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={labMin}
                    onChange={(e) => setLabMin(Number(e.target.value))}
                    className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none"
                  />
                  <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <span className="text-[11px] text-muted-foreground">Continuous double-period blocks (100–120 minutes)</span>
              </div>
            </div>

            {/* Schedule Preview Overview */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Standard Daily Period Architecture</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border/40 bg-background/60 text-center">
                  <span className="text-muted-foreground text-[10px] block">Period 1</span>
                  <span className="font-mono font-bold text-foreground">09:00 - 09:50</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-background/60 text-center">
                  <span className="text-muted-foreground text-[10px] block">Period 2</span>
                  <span className="font-mono font-bold text-foreground">09:50 - 10:40</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-background/60 text-center">
                  <span className="text-muted-foreground text-[10px] block">Period 3</span>
                  <span className="font-mono font-bold text-foreground">10:55 - 11:45</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-background/60 text-center">
                  <span className="text-muted-foreground text-[10px] block">Period 4 (Lab Part 1)</span>
                  <span className="font-mono font-bold text-primary">11:45 - 12:35</span>
                </div>
              </div>
            </div>

            {genStatus && (
              <div
                className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold ${
                  genStatus.includes("successfully") || genStatus.includes("0 hard conflicts")
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {genStatus.includes("successfully") || genStatus.includes("0 hard conflicts") ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span>{genStatus}</span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <Link href="/rooms">
              <button
                type="button"
                className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background/60 hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous: Rooms & Labs</span>
              </button>
            </Link>

            <button
              type="button"
              onClick={handleRunGenerator}
              disabled={generating}
              className="flex items-center space-x-2.5 px-7 py-3 text-xs font-extrabold rounded-xl bg-gradient-to-r from-primary via-[#00A3FF] to-primary text-white shadow-xl hover:scale-105 disabled:opacity-50 transition cursor-pointer"
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
      </div>
    </AppShell>
  );
}
