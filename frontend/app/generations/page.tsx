"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CalendarDays, ArrowUpRight, RefreshCw, CheckCircle2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface Timetable {
  id: number;
  name: string;
  semester_id: number;
  status: string;
}

export default function GenerationsPage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/timetables/`);
      if (res.ok) {
        const data = await res.json();
        setTimetables(data);
      }
    } catch (err) {
      console.error("Failed to fetch generated timetables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Generation Runs & Solutions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              History of solved timetable models and generated schedule versions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchTimetables} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Link href="/timetable">
              <Button className="gap-2">
                <Sparkles className="size-4" />
                Generate New Timetable
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Schedules</CardTitle>
                <CardDescription>
                  {timetables.length} {timetables.length === 1 ? "run" : "runs"} recorded in database
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading generation history...</p>
              </div>
            ) : timetables.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <CalendarDays className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No generated timetables yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Head over to the Timetable Workspace and click "Generate Timetable" to create your first schedule.
                </p>
                <Link href="/timetable" className="mt-4 inline-block">
                  <Button size="sm" className="gap-2">
                    <Sparkles className="size-4" />
                    Open Timetable Workspace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {timetables.map((tt) => (
                  <div
                    key={tt.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition hover:bg-muted/20"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{tt.name}</p>
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <CheckCircle2 className="mr-1 size-3" />
                          {tt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Schedule ID #{tt.id} · Semester #{tt.semester_id}
                      </p>
                    </div>

                    <Link href="/timetable">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        View Schedule
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}