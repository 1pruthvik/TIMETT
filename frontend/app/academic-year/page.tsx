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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 tt-animate-fade">
        
        {/* Clean Page Header */}
        <div className="border-b border-border/60 pb-3.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Academic Year & Institution Type
          </h1>
        </div>

        {/* Institution Scheme Selection */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Institution Scheme Affiliation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div
              onClick={() => setInstitutionType("vtu")}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                institutionType === "vtu"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                  : "border-border bg-card/60 hover:bg-muted/30 opacity-70"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">VTU Affiliated College</h3>
              </div>
              {institutionType === "vtu" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  Selected
                </span>
              )}
            </div>

            <div
              onClick={() => setInstitutionType("university")}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                institutionType === "university"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                  : "border-border bg-card/60 hover:bg-muted/30 opacity-70"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">Autonomous University</h3>
              </div>
              {institutionType === "university" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  Selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Session & Term Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Academic Year with Scroll Wheel Animation */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Academic Year
            </label>
            <YearScrollPicker
              value={academicYear}
              onChange={(newYear) => setAcademicYear(newYear)}
            />
          </div>

          {/* Academic Level */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Select Year Level
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-8.5 px-3 text-xs font-semibold rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition cursor-pointer"
            >
              <option value="1">1st Year (Sem 1 & 2)</option>
              <option value="2">2nd Year (Sem 3 & 4)</option>
              <option value="3">3rd Year (Sem 5 & 6)</option>
              <option value="4">4th Year (Sem 7 & 8)</option>
            </select>
          </div>

          {/* Target Semester */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Target Semester
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSemType("odd")}
                className={`h-8.5 px-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center font-mono ${
                  selectedSemType === "odd"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {selectedYear === "1"
                  ? "Sem 1"
                  : selectedYear === "2"
                  ? "Sem 3"
                  : selectedYear === "3"
                  ? "Sem 5"
                  : "Sem 7"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemType("even")}
                className={`h-8.5 px-2 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center justify-center font-mono ${
                  selectedSemType === "even"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {selectedYear === "1"
                  ? "Sem 2"
                  : selectedYear === "2"
                  ? "Sem 4"
                  : selectedYear === "3"
                  ? "Sem 6"
                  : "Sem 8"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <WizardFooter
          prevHref="/dashboard"
          nextHref="/courses"
          nextLabel="Next: Degree Courses"
        />

      </div>
    </AppShell>
  );
}
