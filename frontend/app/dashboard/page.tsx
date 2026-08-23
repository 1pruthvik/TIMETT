"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock,
  DoorOpen,
  Layers,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { api, friendlyApiError, institutionId } from "@/lib/api";
import { OrbitalDiagram } from "@/components/dashboard/orbital-diagram";

/* ── Types ── */
type Counts = {
  faculty: number;
  subjects: number;
  rooms: number;
  sections: number;
  timeSlots: number;
  offerings: number;
  timetables: number;
  academicYear: string;
  semester: string;
};

const initial: Counts = {
  faculty: 0,
  subjects: 0,
  rooms: 0,
  sections: 0,
  timeSlots: 0,
  offerings: 0,
  timetables: 0,
  academicYear: "Academic year",
  semester: "Semester",
};

/* ── Time-aware greeting ── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Stat Card Component ── */
function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card/60 dark:bg-white/[0.025] p-4 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:bg-card/80 dark:hover:bg-white/[0.04] cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card/80 dark:bg-white/[0.04] text-muted-foreground group-hover:text-primary transition-colors">
          <Icon className="size-4" />
        </div>
        <ArrowUpRight className="size-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </div>
      <p className="mt-3 font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        {value.toString().padStart(2, "0")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}

/* ── Dashboard Page ── */
export default function DashboardPage() {
  const router = useRouter();
  const [counts, setCounts] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Mob-max30");

  const load = async () => {
    setLoading(true);
    setError("");
    const id = institutionId();
    try {
      const [
        faculty,
        subjects,
        rooms,
        sections,
        timeSlots,
        offerings,
        timetables,
        years,
        semesters,
      ] = await Promise.all([
        api<unknown[]>(`/faculty/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/subjects/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/rooms/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/sections/?institution_id=${id}`).catch(() => []),
        api<unknown[]>(`/time-slots/`).catch(() => []),
        api<unknown[]>(`/subject-offerings/?institution_id=${id}`).catch(
          () => []
        ),
        api<unknown[]>("/timetables/").catch(() => []),
        api<{ name: string }[]>(`/academic-years/?institution_id=${id}`).catch(
          () => []
        ),
        api<{ name: string }[]>(`/semesters/`).catch(() => []),
      ]);

      setCounts({
        faculty: faculty.length,
        subjects: subjects.length,
        rooms: rooms.length,
        sections: sections.length,
        timeSlots: timeSlots.length,
        offerings: offerings.length,
        timetables: timetables.length,
        academicYear: years[0]?.name || "Academic year",
        semester: semesters[0]?.name || "Semester",
      });
    } catch (reason) {
      setError(friendlyApiError(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.name) setUserName(user.name.split(" ")[0]);
    } catch {}
  }, []);

  const handleGenerateTimetable = async () => {
    setGenerating(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      const res = await fetch(
        `${API_BASE}/generator/generate?institution_id=${userInstId}`,
        {
          method: "POST",
        }
      );

      if (res.ok) {
        const result = await res.json();
        if (result.status === "error" || result.status === "infeasible") {
          setError(
            result.message ||
              "Optimization constraint infeasible. Please review offerings & availability."
          );
        } else {
          router.push("/timetable");
        }
      } else {
        setError("Solver returned an error or timeout.");
      }
    } catch {
      setError("Error executing CP-SAT generator.");
    } finally {
      setGenerating(false);
    }
  };

  const checks = useMemo(
    () => [
      {
        label: "Academic term configured",
        ok: counts.academicYear !== "Academic year",
      },
      { label: "Subjects configured", ok: counts.subjects > 0 },
      { label: "Faculty assigned", ok: counts.faculty > 0 },
      { label: "Rooms available", ok: counts.rooms > 0 },
      { label: "Student sections configured", ok: counts.sections > 0 },
    ],
    [counts]
  );

  const ready = Math.round(
    (checks.filter((c) => c.ok).length / checks.length) * 100
  );

  const readinessMessage =
    ready === 100
      ? "Every constraint is reconciled and the department's calendar is ready to be composed."
      : ready >= 60
        ? "Most resources are configured. Review remaining items before generating."
        : "Your workspace needs more configuration before generating a timetable.";

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] space-y-8 tt-animate-fade">
        {/* ── Hero Section ── */}
        <section className="grid min-h-[300px] items-center gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Left: Greeting */}
          <div className="space-y-5 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="h-px w-5 bg-muted-foreground/30" />
              <span className="tt-eyebrow">Scheduling workspace</span>
            </div>

            <div>
              <h1 className="font-heading text-4xl font-bold leading-[1.15] text-foreground sm:text-5xl">
                {getGreeting()},
              </h1>
              <h1 className="font-heading text-4xl font-bold italic leading-[1.15] sm:text-5xl">
                <span className="tt-gradient-text">{userName}.</span>
              </h1>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {readinessMessage}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={handleGenerateTimetable}
                disabled={generating}
                className="h-11 rounded-xl tt-gradient-btn px-5 text-sm font-semibold gap-2 cursor-pointer disabled:opacity-75"
              >
                {generating ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate timetable
                  </>
                )}
              </Button>
              <Link href="/timetable">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-border bg-card/60 dark:bg-white/[0.03] px-5 text-sm font-semibold text-foreground hover:bg-card gap-2 cursor-pointer"
                >
                  <CalendarDays className="size-4" />
                  Open timetable
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Orbital Diagram */}
          <div className="hidden lg:block">
            <OrbitalDiagram />
          </div>
        </section>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={load}>
              Retry
            </Button>
          </div>
        )}

        {/* ── Scheduling Readiness ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Scheduling readiness
            </span>
            <span className="font-mono text-sm font-semibold text-primary">
              {ready}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 overflow-hidden rounded-full bg-border/60 dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
              style={{ width: `${ready}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1 rounded-full bg-primary/60" />
              {ready === 100
                ? "Everything required for generation is in place."
                : `${checks.filter((c) => c.ok).length} of ${checks.length} requirements met.`}
            </span>
            <Link
              href="/faculty"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-card transition-colors"
            >
              Review Issues <ArrowRight className="size-3" />
            </Link>
          </div>
        </section>

        {/* ── 6 Resource Stat Cards ── */}
        <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={Users}
            label="Faculty"
            value={counts.faculty}
            href="/faculty"
          />
          <StatCard
            icon={BookOpen}
            label="Subjects"
            value={counts.subjects}
            href="/subjects"
          />
          <StatCard
            icon={Users}
            label="Sections"
            value={counts.sections}
            href="/sections"
          />
          <StatCard
            icon={DoorOpen}
            label="Rooms & labs"
            value={counts.rooms}
            href="/rooms"
          />
          <StatCard
            icon={Clock}
            label="Time slots"
            value={counts.timeSlots}
            href="/time-slots"
          />
          <StatCard
            icon={Layers}
            label="Offerings"
            value={counts.offerings}
            href="/offerings"
          />
        </section>
      </div>
    </AppShell>
  );
}
