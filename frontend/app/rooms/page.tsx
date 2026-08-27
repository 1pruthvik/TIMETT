"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DoorOpen,
  Layers,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

export default function RoomsPage() {
  const router = useRouter();

  const [roomCapacity, setRoomCapacity] = useState(60);
  const [labCapacity, setLabCapacity] = useState(30);
  const [coincidedLabGroup, setCoincidedLabGroup] = useState("CS Central Lab Facility");

  const [totalStudents, setTotalStudents] = useState(180);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(5);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("vtu_room_capacity_config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.roomCapacity) setRoomCapacity(parsed.roomCapacity);
        if (parsed.labCapacity) setLabCapacity(parsed.labCapacity);
        if (parsed.coincidedLabGroup) setCoincidedLabGroup(parsed.coincidedLabGroup);
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
    }
  }, []);

  const saveConfig = () => {
    try {
      localStorage.setItem(
        "vtu_room_capacity_config",
        JSON.stringify({ roomCapacity, labCapacity, coincidedLabGroup })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const calculatedSections = Math.ceil(totalStudents / Math.max(1, roomCapacity));
  const calculatedBatchesPerSec = Math.ceil((roomCapacity || 60) / Math.max(1, labCapacity));

  const handleNext = () => {
    saveConfig();
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
                  Step 5 of 5 — VTU Institutional Flow (Rooms & Labs)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                {calculatedSections} Sections ({calculatedBatchesPerSec} Batches/sec)
              </span>
            </div>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full bg-muted/40 h-1">
            <div
              className="bg-gradient-to-r from-primary to-[#00A3FF] h-full transition-all duration-500 shadow-[0_0_12px_rgba(0,102,255,0.8)]"
              style={{ width: "90%" }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-border/50 pb-4 space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                5. Section Calculation, Lab Coinciding & Capacity Architecture
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configure room capacities and shared lab facilities. The engine computes section counts and lab sub-batches ($B_1, B_2 \dots$).
              </p>
            </div>

            {/* Calculated Metrics Summary Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-border/60 bg-primary/5 text-center shadow-xs">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Total Students
                </p>
                <p className="text-2xl font-extrabold text-primary font-mono mt-1">{totalStudents}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-primary/5 text-center shadow-xs">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Required Sections
                </p>
                <p className="text-2xl font-extrabold text-primary font-mono mt-1">{calculatedSections}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-[#00A3FF]/5 text-center shadow-xs">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Batches / Section
                </p>
                <p className="text-2xl font-extrabold text-[#00A3FF] font-mono mt-1">
                  {calculatedBatchesPerSec} <span className="text-xs font-normal opacity-80">(B1, B2)</span>
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-[#00A3FF]/5 text-center shadow-xs">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Active Subjects
                </p>
                <p className="text-2xl font-extrabold text-[#00A3FF] font-mono mt-1">{activeSubjectsCount}</p>
              </div>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Classroom Room Capacity (Students / Section)
                </label>
                <input
                  type="number"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none"
                />
                <span className="text-[11px] text-muted-foreground">Standard VTU benchmark: 60 students per section</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Lab Capacity ($C$ Students / Lab Batch)
                </label>
                <input
                  type="number"
                  value={labCapacity}
                  onChange={(e) => setLabCapacity(Number(e.target.value))}
                  className="w-full h-12 px-4 text-sm font-mono font-bold rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none"
                />
                <span className="text-[11px] text-muted-foreground">Standard VTU benchmark: 30 students per practical lab</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Coinciding / Shared Lab Facility
              </label>
              <input
                type="text"
                value={coincidedLabGroup}
                onChange={(e) => setCoincidedLabGroup(e.target.value)}
                placeholder="e.g. DSA Lab, OS Lab share CS Central Computing Lab"
                className="w-full h-12 px-4 text-sm font-medium rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none"
              />
              <span className="text-[11px] text-muted-foreground">
                Specifies shared computer labs or engineering workshops coinciding across parallel batches.
              </span>
            </div>
          </div>

          {/* Footer Navigation with Scrolling Overscroll Transition */}
          <WizardFooter
            prevHref="/faculty"
            nextHref="/time-slots"
            nextLabel="Next: Time Slots"
            onNext={handleNext}
          />

        </div>
      </div>
    </AppShell>
  );
}