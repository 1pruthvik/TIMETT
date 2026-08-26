"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

/* ── Time-aware greeting ── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.name) setUserName(user.name.split(" ")[0]);
    } catch {}
  }, []);

  return (
    <AppShell>
      <div className="h-[calc(100vh-140px)] w-full flex flex-col justify-center items-center text-center px-6 sm:px-12 relative tt-animate-fade">
        <div className="max-w-4xl w-full space-y-8">
          {/* Greeting Typography */}
          <div className="space-y-3">
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
              {getGreeting()},
            </h1>
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold italic tracking-tight">
              <span className="tt-gradient-text">{userName}.</span>
            </h1>
          </div>

          {/* Action Buttons: Generate New & Open Timetable Studio */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Link href="/academic-terms?wizard=true">
              <Button className="h-14 rounded-2xl tt-gradient-btn px-8 text-base font-bold gap-3 cursor-pointer shadow-xl hover:scale-105 transition-all">
                <Plus className="size-5" />
                Generate New
                <ArrowRight className="size-5" />
              </Button>
            </Link>

            <Link href="/timetable">
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-8 text-base font-semibold text-white cursor-pointer gap-3"
              >
                <CalendarDays className="size-5 text-[#38BDF8]" />
                Open Timetable Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
