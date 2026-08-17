"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const fetchLiveCounts = async () => {
    setLoading(true);
    try {
      const [facRes, subRes, roomRes, secRes, ttRes, yrRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/faculty/`),
        fetch(`${API_BASE}/subjects/`),
        fetch(`${API_BASE}/rooms/`),
        fetch(`${API_BASE}/sections/`),
        fetch(`${API_BASE}/timetables/`),
        fetch(`${API_BASE}/academic-years/`),
        fetch(`${API_BASE}/semesters/`),
      ]);

      const facultyList = facRes.ok ? await facRes.json() : [];
      const subjectsList = subRes.ok ? await subRes.json() : [];
      const roomsList = roomRes.ok ? await roomRes.json() : [];
      const sectionsList = secRes.ok ? await secRes.json() : [];
      const timetablesList = ttRes.ok ? await ttRes.json() : [];
      const yearsList = yrRes.ok ? await yrRes.json() : [];
      const semsList = semRes.ok ? await semRes.json() : [];

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

  const stats = [
    { title: "Faculty Members", value: counts.faculty, icon: Users, href: "/faculty", label: "Teaching Staff" },
    { title: "Subjects", value: counts.subjects, icon: BookOpen, href: "/subjects", label: "Curriculum" },
    { title: "Rooms & Labs", value: counts.rooms, icon: DoorOpen, href: "/rooms", label: "Infrastructure" },
    { title: "Sections", value: counts.sections, icon: GraduationCap, href: "/sections", label: "Student Batches" },
  ];

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Institution Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time overview of academic resources and timetable solver optimization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={fetchLiveCounts} title="Refresh counts">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/generations">
              <Button variant="outline" className="gap-2">
                <Clock className="size-4" />
                Run History
              </Button>
            </Link>
            <Link href="/timetable">
              <Button className="gap-2">
                <Sparkles className="size-4" />
                Timetable Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Real-time Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="transition-all hover:border-zinc-400 hover:shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.title}
                  </CardTitle>
                  <item.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? (
                      <span className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      item.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="font-medium text-emerald-600">Live in Database</span> · {item.label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Status and Quick Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Timetable Status</CardTitle>
                  <CardDescription>Department of Computer Science & Engineering</CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <CheckCircle2 className="mr-1 size-3.5" />
                  {counts.timetables > 0 ? `${counts.timetables} Timetables Active` : "Ready to Solve"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Academic Year:</span>
                  <span className="font-medium">{counts.academicYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Semester:</span>
                  <span className="font-medium">{counts.semester}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Generated Runs:</span>
                  <span className="font-medium text-emerald-600">{counts.timetables} Solutions Saved</span>
                </div>
              </div>

              <Link href="/timetable" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Open Interactive Timetable Workspace
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage curriculum and scheduling constraints</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Link href="/faculty">
                <Button variant="outline" className="w-full justify-start gap-2 h-14">
                  <Users className="size-4 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Faculty</p>
                    <p className="text-[10px] text-muted-foreground">{counts.faculty} registered</p>
                  </div>
                </Button>
              </Link>

              <Link href="/subjects">
                <Button variant="outline" className="w-full justify-start gap-2 h-14">
                  <BookOpen className="size-4 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Subjects</p>
                    <p className="text-[10px] text-muted-foreground">{counts.subjects} in catalog</p>
                  </div>
                </Button>
              </Link>

              <Link href="/rooms">
                <Button variant="outline" className="w-full justify-start gap-2 h-14">
                  <DoorOpen className="size-4 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Rooms & Labs</p>
                    <p className="text-[10px] text-muted-foreground">{counts.rooms} configured</p>
                  </div>
                </Button>
              </Link>

              <Link href="/sections">
                <Button variant="outline" className="w-full justify-start gap-2 h-14">
                  <GraduationCap className="size-4 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Sections</p>
                    <p className="text-[10px] text-muted-foreground">{counts.sections} batches</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
