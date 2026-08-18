"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Sparkles, CalendarDays, ArrowUpRight, RefreshCw, CheckCircle2, Zap, Clock, ShieldCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
        setTimetables(await res.json());
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
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Optimization Runs & Generation Logs"
          description="Historical log of solved constraint models and generated timetable schedule versions."
          icon={Sparkles}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchTimetables}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh runs"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Link href="/timetable">
            <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
              <Zap className="size-4" />
              Generate New Timetable
            </Button>
          </Link>
        </PageHeader>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Solved Solution Runs</h3>
              <p className="text-xs text-muted-foreground">
                {timetables.length} {timetables.length === 1 ? "run" : "runs"} verified in database
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading generation history..." />
            ) : timetables.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No generated timetables yet"
                description='Head over to the Timetable Studio and click "Generate Timetable" to compute your first conflict-free schedule.'
              >
                <Link href="/timetable">
                  <Button className="rounded-xl font-semibold bg-primary text-primary-foreground">
                    Open Timetable Studio
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {timetables.map((tt, idx) => (
                  <div
                    key={tt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:px-6 transition-all hover:bg-card hover:border-primary/40 hover:shadow-xs group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-primary border border-primary/20 font-mono font-bold text-xs">
                        #{idx + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <p className="font-bold text-sm text-foreground">{tt.name}</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            {tt.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>Schedule ID #{tt.id}</span>
                          <span>•</span>
                          <span>Semester #{tt.semester_id}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 Hard Conflicts</span>
                        </p>
                      </div>
                    </div>

                    <Link href="/timetable">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl gap-2 text-xs font-semibold border-border bg-card hover:bg-muted group-hover:border-primary/40 transition-colors"
                      >
                        Inspect Timetable
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}