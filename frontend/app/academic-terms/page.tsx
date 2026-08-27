"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

export default function AcademicTermsPage() {
  const router = useRouter();

  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [institutionType, setInstitutionType] = useState<"vtu" | "university">("vtu");
  const [selectedYear, setSelectedYear] = useState("2");
  const [selectedSemType, setSelectedSemType] = useState<"odd" | "even">("odd");
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    }
  }, []);

  const saveSetup = () => {
    const config = {
      academicYear,
      institutionType,
      selectedYear,
      selectedSemType,
    };
    try {
      localStorage.setItem("vtu_academic_setup", JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleNext = () => {
    saveSetup();
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
                  Step 1 of 5 — VTU Institutional Flow
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-block text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                Academic Terms
              </span>
            </div>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full bg-muted/40 h-1">
            <div
              className="bg-gradient-to-r from-primary to-[#00A3FF] h-full transition-all duration-500 shadow-[0_0_12px_rgba(0,102,255,0.8)]"
              style={{ width: "20%" }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-7">
            <div className="space-y-1.5 border-b border-border/50 pb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                1. Choose Academic Year & Institution Type
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select your institution affiliation and active academic session.
              </p>
            </div>

            {/* Row 1: Academic Year & Institution Scheme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Academic Year
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026 - 2027"
                    className="w-full h-12 px-4 text-sm font-medium rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none"
                  />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Institution Scheme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInstitutionType("vtu")}
                    className={`h-12 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                      institutionType === "vtu"
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-[0_0_16px_rgba(0,102,255,0.25)]"
                        : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">VTU Affiliated College</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstitutionType("university")}
                    className={`h-12 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                      institutionType === "university"
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-[0_0_16px_rgba(0,102,255,0.25)]"
                        : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="truncate">Autonomous University</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Select Year & Semester Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium rounded-xl border border-border bg-background/80 focus:ring-2 focus:ring-primary/40 focus:border-primary transition outline-none cursor-pointer"
                >
                  <option value="1">1st Year (Physics & Chemistry Cycle)</option>
                  <option value="2">2nd Year (3rd & 4th Sem)</option>
                  <option value="3">3rd Year (5th & 6th Sem)</option>
                  <option value="4">4th Year (7th & 8th Sem)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Semester Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSemType("odd")}
                    className={`h-12 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center ${
                      selectedSemType === "odd"
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-[0_0_16px_rgba(0,102,255,0.25)]"
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
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-[0_0_16px_rgba(0,102,255,0.25)]"
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

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Academic term preferences saved successfully!</span>
              </div>
            )}
          </div>

          {/* Footer Navigation with Scrolling Overscroll Transition */}
          <WizardFooter
            prevHref="/dashboard"
            nextHref="/departments"
            nextLabel="Next: Departments"
            onNext={handleNext}
          />

        </div>
      </div>
    </AppShell>
  );
}
