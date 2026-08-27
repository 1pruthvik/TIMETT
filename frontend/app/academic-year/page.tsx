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

export default function AcademicYearPage() {
  const router = useRouter();

  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [institutionType, setInstitutionType] = useState<"vtu" | "university">("vtu");
  const [selectedYear, setSelectedYear] = useState("2");
  const [selectedSemType, setSelectedSemType] = useState<"odd" | "even">("odd");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vtu_academic_setup");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.academicYear) setAcademicYear(parsed.academicYear);
        if (parsed.institutionType) setInstitutionType(parsed.institutionType);
        if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
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
        selectedYear,
        selectedSemType,
      };
      localStorage.setItem("vtu_academic_setup", JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [academicYear, institutionType, selectedYear, selectedSemType, isLoaded]);

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

        {/* Session & Term Details (No suggestion text) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Academic Year */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Academic Year
            </label>
            <div className="relative">
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026 - 2027"
                className="w-full h-12 px-4 text-base font-semibold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition"
              />
              <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Academic Level */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Select Year Level
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition cursor-pointer"
            >
              <option value="1">1st Year (Physics & Chemistry Cycle)</option>
              <option value="2">2nd Year (3rd & 4th Sem)</option>
              <option value="3">3rd Year (5th & 6th Sem)</option>
              <option value="4">4th Year (7th & 8th Sem)</option>
            </select>
          </div>

          {/* Semester Type */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Target Semester
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedSemType("odd")}
                className={`h-12 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center ${
                  selectedSemType === "odd"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {selectedYear === "1"
                  ? "1st Sem"
                  : selectedYear === "2"
                  ? "3rd Sem"
                  : selectedYear === "3"
                  ? "5th Sem"
                  : "7th Sem"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemType("even")}
                className={`h-12 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center ${
                  selectedSemType === "even"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {selectedYear === "1"
                  ? "2nd Sem"
                  : selectedYear === "2"
                  ? "4th Sem"
                  : selectedYear === "3"
                  ? "6th Sem"
                  : "8th Sem"}
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
