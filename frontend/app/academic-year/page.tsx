"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";
import { YearScrollPicker } from "@/components/ui/year-scroll-picker";

export default function AcademicYearPage() {
  const router = useRouter();

  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [institutionType, setInstitutionType] = useState<"vtu" | "university">("vtu");
  const [selectedSemType, setSelectedSemType] = useState<"odd" | "even">("odd");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vtu_academic_setup");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.academicYear) setAcademicYear(parsed.academicYear);
        if (parsed.institutionType) setInstitutionType(parsed.institutionType);
        if (parsed.selectedSemType) setSelectedSemType(parsed.selectedSemType);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Automatic saving on any change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const config = {
        academicYear,
        institutionType,
        selectedSemType,
        activeSemesters: selectedSemType === "even" ? [2, 4, 6, 8] : [1, 3, 5, 7],
      };
      localStorage.setItem("vtu_academic_setup", JSON.stringify(config));
      localStorage.setItem("vtu_active_sem_cycle", selectedSemType);
      localStorage.setItem("vtu_active_sem", selectedSemType === "even" ? "4" : "3");
    } catch (e) {
      console.error(e);
    }
  }, [academicYear, institutionType, selectedSemType, isLoaded]);

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Clean Page Header (No suggestions/descriptions) */}
        <div className="border-b border-border/60 pb-5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Academic Year & Institution Type
          </h1>
        </div>

        {/* Institution Scheme Selection (No suggestion text) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Institution Scheme Affiliation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              onClick={() => setInstitutionType("vtu")}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                institutionType === "vtu"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-[0_0_24px_rgba(0,102,255,0.15)]"
                  : "border-border bg-card/60 hover:bg-muted/30 opacity-70"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">VTU Affiliated College</h3>
              </div>
              {institutionType === "vtu" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  Selected
                </span>
              )}
            </div>

            <div
              onClick={() => setInstitutionType("university")}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                institutionType === "university"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-[0_0_24px_rgba(0,102,255,0.15)]"
                  : "border-border bg-card/60 hover:bg-muted/30 opacity-70"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Autonomous University</h3>
              </div>
              {institutionType === "university" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  Selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Session & Term Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Year with Scroll Wheel Animation */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Academic Year
            </label>
            <YearScrollPicker
              value={academicYear}
              onChange={(newYear) => setAcademicYear(newYear)}
            />
          </div>

          {/* College Semester Term (Odd vs Even Semesters) */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              College Semester Term
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelectedSemType("odd")}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                  selectedSemType === "odd"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="text-sm font-extrabold text-foreground">Odd Semesters</span>
                <span className="text-xs font-semibold text-primary">1st, 3rd, 5th & 7th Sem</span>
                <span className="text-[10px] text-muted-foreground">Whole College Term</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSemType("even")}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                  selectedSemType === "even"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="text-sm font-extrabold text-foreground">Even Semesters</span>
                <span className="text-xs font-semibold text-primary">2nd, 4th, 6th & 8th Sem</span>
                <span className="text-[10px] text-muted-foreground">Whole College Term</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation with Scrolling Overscroll Transition */}
        <WizardFooter
          prevHref="/dashboard"
          nextHref="/courses"
          nextLabel="Next: Courses & Intake"
        />

      </div>
    </AppShell>
  );
}
