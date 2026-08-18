"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  CalendarDays,
  Users,
  BookOpen,
  DoorOpen,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  Zap,
  Sliders,
  Cpu,
  Layers,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface DashboardCounts {
  faculty: number;
  subjects: number;
  rooms: number;
  sections: number;
  timetables: number;
  academicYear: string;
  semester: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>({
    faculty: 0,
    subjects: 0,
    rooms: 0,
    sections: 0,
    timetables: 0,
    academicYear: "2026 - 2027",
    semester: "Semester 1",
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const fetchLiveCounts = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;
      if (user?.name) setUserName(user.name.split(" ")[0]);

      const facUrl = `${API_BASE}/faculty/?institution_id=${userInstId}`;
      const subUrl = `${API_BASE}/subjects/?institution_id=${userInstId}`;
      const roomUrl = `${API_BASE}/rooms/?institution_id=${userInstId}`;
      const secUrl = `${API_BASE}/sections/?institution_id=${userInstId}`;

      const [facRes, subRes, roomRes, secRes, ttRes, yrRes, semRes] = await Promise.all([
        fetch(facUrl).catch(() => null),
        fetch(subUrl).catch(() => null),
        fetch(roomUrl).catch(() => null),
        fetch(secUrl).catch(() => null),
        fetch(`${API_BASE}/timetables/`).catch(() => null),
        fetch(`${API_BASE}/academic-years/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/semesters/?institution_id=${userInstId}`).catch(() => null),
      ]);

      const facultyList = (facRes && facRes.ok) ? await facRes.json() : [];
      const subjectsList = (subRes && subRes.ok) ? await subRes.json() : [];
      const roomsList = (roomRes && roomRes.ok) ? await roomRes.json() : [];
      const sectionsList = (secRes && secRes.ok) ? await secRes.json() : [];
      const timetablesList = (ttRes && ttRes.ok) ? await ttRes.json() : [];
      const yearsList = (yrRes && yrRes.ok) ? await yrRes.json() : [];
      const semsList = (semRes && semRes.ok) ? await semRes.json() : [];

      setCounts({
        faculty: facultyList.length,
        subjects: subjectsList.length,
        rooms: roomsList.length,
        sections: sectionsList.length,
        timetables: timetablesList.length,
        academicYear: yearsList.length > 0 ? yearsList[0].name : "2026 - 2027",
        semester: semsList.length > 0 ? semsList[0].name : "Semester 1",
      });
    } catch (err) {
      console.error("Error fetching live dashboard counts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCounts();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto tt-animate-fade">
        {/* Vercel/Linear Centered Hero Section */}
        <div className="tt-floating-glass relative overflow-hidden rounded-3xl p-6 sm:p-10">
          {/* Subtle glow layer */}
          <div className="absolute top-0 right-1/4 -z-10 h-48 w-96 rounded-full bg-gradient-to-r from-[#8B5CF6]/15 to-[#EC4899]/15 blur-3xl opacity-60 pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {/* Eyebrow pill label */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1 text-[11px] font-bold text-[#8B5CF6] dark:text-[#A78BFA]">
                <Sparkles className="size-3.5" />
                <span className="tracking-wide">INTELLIGENT TIMETABLE OPERATING SYSTEM</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                {getGreeting()}{userName ? `, ${userName}` : ""}. <br className="hidden sm:inline" />
                <span className="tt-gradient-text">Conflict-free scheduling</span> at scale.
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Google OR-Tools CP-SAT discrete constraint optimizer is synchronized with real-time faculty availability and department quotas.
              </p>
            </div>

            {/* Dual CTAs & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchLiveCounts}
                className="size-10 rounded-xl border-border bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground cursor-pointer"
                title="Refresh metrics"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
              </Button>

              <Link href="/generations">
                <Button
                  variant="outline"
                  className="h-10 rounded-xl gap-2 font-semibold border-border bg-card hover:bg-muted text-foreground"
                >
                  <Clock className="size-4 text-[#8B5CF6]" />
                  Run Logs
                </Button>
              </Link>

              <Link href="/timetable">
                <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-5 cursor-pointer">
                  <Zap className="size-4" />
                  Launch Timetable Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Feature / KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/faculty" className="block">
            <StatCard
              title="Faculty Staff"
              value={counts.faculty}
              icon={Users}
              label="Teaching Roster"
              loading={loading}
            />
          </Link>
          <Link href="/subjects" className="block">
            <StatCard
              title="Subject Catalog"
              value={counts.subjects}
              icon={BookOpen}
              label="Curriculum Courses"
              loading={loading}
            />
          </Link>
          <Link href="/rooms" className="block">
            <StatCard
              title="Rooms & Labs"
              value={counts.rooms}
              icon={DoorOpen}
              label="Physical Spaces"
              loading={loading}
            />
          </Link>
          <Link href="/sections" className="block">
            <StatCard
              title="Student Cohorts"
              value={counts.sections}
              icon={GraduationCap}
              label="Active Batches"
              loading={loading}
            />
          </Link>
        </div>

        {/* Overview & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Schedule Status (2 cols) */}
          <GlassPanel glow="purple" className="p-6 lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Active Term & Solution State</h3>
                  <span className="rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] px-2 py-0.5 text-[10px] font-bold border border-[#8B5CF6]/20">
                    CSE Dept
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Automated conflict-free discrete scheduling</p>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-3.5" />
                {counts.timetables > 0 ? `${counts.timetables} Timetables Active` : "Solver Ready"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-1">
                <span className="tt-eyebrow text-muted-foreground">Academic Year</span>
                <p className="text-base font-bold text-foreground">{counts.academicYear}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Live Session</span>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-1">
                <span className="tt-eyebrow text-muted-foreground">Active Semester</span>
                <p className="text-base font-bold text-foreground">{counts.semester}</p>
                <span className="text-[10px] text-[#8B5CF6] dark:text-[#A78BFA] font-semibold">● Primary Term</span>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-1">
                <span className="tt-eyebrow text-muted-foreground">Generated Solves</span>
                <p className="text-base font-bold text-foreground">{counts.timetables} Models</p>
                <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">● 0 Hard Overlaps</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/timetable" className="flex-1">
                <Button className="tt-gradient-btn w-full h-11 rounded-xl font-bold justify-between px-4">
                  <span>Open Interactive Timetable Grid</span>
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="h-11 rounded-xl font-semibold border-border bg-card hover:bg-muted px-4">
                  <Sliders className="size-4 text-[#8B5CF6] mr-2" />
                  Constraint Engine
                </Button>
              </Link>
            </div>
          </GlassPanel>

          {/* Quick Hub (1 col) */}
          <GlassPanel glow="pink" className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Management Hub</h3>
                <Cpu className="size-4 text-[#EC4899]" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Fast navigation to curriculum resources:
              </p>
            </div>

            <div className="space-y-2.5">
              <Link href="/faculty" className="block">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 transition-all hover:bg-card hover:border-[#8B5CF6]/30 group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] group-hover:scale-110 transition-transform">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Faculty Roster</p>
                      <p className="text-[10px] text-muted-foreground">{counts.faculty} staff members</p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-[#8B5CF6] transition-colors" />
                </div>
              </Link>

              <Link href="/subjects" className="block">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 transition-all hover:bg-card hover:border-[#EC4899]/30 group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#EC4899]/10 text-[#EC4899] dark:text-[#F472B6] group-hover:scale-110 transition-transform">
                      <BookOpen className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Course Catalog</p>
                      <p className="text-[10px] text-muted-foreground">{counts.subjects} curriculum courses</p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-[#EC4899] transition-colors" />
                </div>
              </Link>

              <Link href="/rooms" className="block">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 transition-all hover:bg-card hover:border-[#8B5CF6]/30 group">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] group-hover:scale-110 transition-transform">
                      <DoorOpen className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Rooms & Labs</p>
                      <p className="text-[10px] text-muted-foreground">{counts.rooms} physical spaces</p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-[#8B5CF6] transition-colors" />
                </div>
              </Link>
            </div>

            <Link href="/generations" className="block pt-2">
              <Button variant="outline" className="w-full text-xs font-semibold rounded-xl border-border bg-card/60">
                <Layers className="size-3.5 text-[#8B5CF6] mr-2" />
                Generation History
              </Button>
            </Link>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}
