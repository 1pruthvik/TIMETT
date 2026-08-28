"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { WizardModal } from "@/components/dashboard/wizard-modal";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("Mob-max30");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.name) setUserName(user.name.split(" ")[0]);
    } catch {}
  }, []);

  return (
    <AppShell>
      <div className="h-[calc(100vh-120px)] w-full flex flex-col justify-center items-center text-center px-6 sm:px-12 relative tt-animate-fade">
        <div className="max-w-3xl w-full space-y-6">
          {/* Greeting Typography */}
          <div className="space-y-2">
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              {getGreeting()},
            </h1>
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold italic tracking-tight">
              <span className="tt-gradient-text">{userName}.</span>
            </h1>
          </div>

          {/* Prominent Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <Link href="/academic-year">
              <Button
                className="h-10 rounded-xl tt-gradient-btn px-6 text-sm font-bold gap-2 cursor-pointer shadow-md hover:opacity-95 transition-all"
              >
                <Plus className="size-4" />
                Generate New
                <ArrowRight className="size-4" />
              </Button>
            </Link>

            <Link href="/timetable">
              <Button
                variant="outline"
                className="h-10 rounded-xl border border-border bg-card/60 hover:bg-muted px-6 text-sm font-semibold text-foreground cursor-pointer gap-2"
              >
                <CalendarDays className="size-4 text-[#38BDF8]" />
                Open Timetable Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Multi-Step Setup Wizard */}
      <WizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </AppShell>
  );
}
