"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Layers3,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

interface ReleaseVersion {
  id: string;
  tag: string;
  type: "Major Release" | "Minor Update" | "Patch / Revision";
  releaseDate: string;
  status: "Active Production" | "Archived Release";
  features: string[];
  active: boolean;
}

const VERSIONS: ReleaseVersion[] = [
  {
    id: "v1.0",
    tag: "v1.0",
    type: "Major Release",
    releaseDate: "August 2026",
    status: "Active Production",
    active: true,
    features: [
      "Discrete Linear CP-SAT automated timetable optimization solver (Google OR-Tools)",
      "Multi-department academic workspace with isolated cohort quotas and syllabus matrix",
      "Interactive drag-and-drop Timetable Studio grid with real-time hard/soft conflict detection",
      "Comprehensive resource management: Academic Terms, Rooms & Labs, Subjects, and Faculty rosters",
      "Autonomous Kaci AI constraint tuning engine for faculty happiness and room load balancing",
      "Multi-view schedule inspection: Department, Student Section, Physical Room, and Instructor views",
      "High-fidelity export pipeline for PDF schedules, Excel workbooks, and raw JSON data",
    ],
  },
];

export default function VersionsPage() {
  const currentVersion = VERSIONS.find((v) => v.active) || VERSIONS[0];

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto tt-animate-fade">
        <PageHeader title="Version & Release Notes" icon={Layers3} />

        {/* ── Active Current Version Banner ── */}
        <div className="p-6 sm:p-8 rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-card/60 dark:bg-white/[0.025] backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-4xl font-mono font-extrabold text-foreground tracking-tight">
                  {currentVersion.tag}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  {currentVersion.status}
                </span>
              </div>
              <p className="text-xs font-mono font-medium text-muted-foreground">
                {currentVersion.type} • Deployed {currentVersion.releaseDate}
              </p>
            </div>

            <div className="shrink-0">
              <Link href="/timetable">
                <Button className="tt-gradient-btn h-11 rounded-xl px-5 text-xs font-bold gap-2 cursor-pointer shadow-md">
                  Open Timetable Studio
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Current Version Added Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Added Features & Capabilities in this Version
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentVersion.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]"
                >
                  <Sparkles className="size-4 text-[#38BDF8] shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground/90 font-medium leading-relaxed">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Version History Archive ── */}
        <div className="space-y-4 pt-4">
          <h3 className="text-base font-bold text-foreground">
            Deployment History ({VERSIONS.length})
          </h3>

          <div className="space-y-4">
            {VERSIONS.map((ver) => (
              <div
                key={ver.id}
                className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-card/40 dark:bg-white/[0.015] backdrop-blur-md space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.04] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-foreground">
                      {ver.tag}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {ver.type}
                    </span>
                    {ver.active ? (
                      <span className="text-[11px] font-bold text-emerald-400">
                        • Current Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        • Archived
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {ver.releaseDate}
                  </span>
                </div>

                <ul className="space-y-1.5 pl-2">
                  {ver.features.map((feat, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-[#0070F3] font-bold">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}