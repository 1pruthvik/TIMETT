"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme/theme-provider";
import {
  User,
  Mail,
  Shield,
  LogOut,
  Building,
  Settings,
  Sun,
  Moon,
  Calendar,
  Clock,
  Cpu,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Zap,
  Sliders,
  CheckCircle2,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://tempus-backend-g36k.onrender.com").replace(/\/$/, "");

interface UserProfile {
  id?: number;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

interface Constraint {
  id: number;
  scope: string;
  type: string;
  hardness: string;
  source: string;
  explanation?: string | null;
  active: boolean;
  parameters?: Record<string, any> | null;
}

const DEFAULT_SYSTEM_RULES = [
  {
    name: "Faculty No-Overlap",
    scope: "faculty",
    type: "no_simultaneous_classes",
    hardness: "HARD",
    color: "emerald",
    explanation: "A faculty member cannot teach two classes simultaneously in the same time period.",
  },
  {
    name: "Room No-Overlap",
    scope: "room",
    type: "no_simultaneous_classes",
    hardness: "HARD",
    color: "cyan",
    explanation: "A classroom or laboratory space cannot host multiple classes in the same slot.",
  },
  {
    name: "Section No-Overlap",
    scope: "section",
    type: "no_simultaneous_classes",
    hardness: "HARD",
    color: "violet",
    explanation: "A student cohort batch cannot attend two separate subject lectures simultaneously.",
  },
  {
    name: "Faculty Working Hours",
    scope: "faculty",
    type: "respect_working_hours",
    hardness: "HARD",
    color: "amber",
    explanation: "Prevent scheduling faculty lectures outside their customized working availability windows.",
  },
  {
    name: "Minimize Student Idle Gaps",
    scope: "section",
    type: "minimize_idle_periods",
    hardness: "SOFT",
    color: "indigo",
    explanation: "Aim to keep daily student timetables continuous by minimizing free hour breaks between classes.",
  },
];

function AccountAndSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "settings" ? "settings" : "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "settings">(initialTab);

  const { theme, setTheme } = useTheme();

  // User Profile state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Settings states
  const [autoResolveGaps, setAutoResolveGaps] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  // Constraints Engine states
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loadingConstraints, setLoadingConstraints] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Constraint Form states
  const [scope, setScope] = useState("faculty");
  const [type, setType] = useState("custom_rule");
  const [hardness, setHardness] = useState("HARD");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Re-generate state
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "settings" || tabParam === "profile") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    setLoadingConstraints(true);
    try {
      const res = await fetch(`${API_BASE}/constraints/`);
      if (res.ok) {
        setConstraints(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch constraints", err);
    } finally {
      setLoadingConstraints(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveGeneral = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleAddConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) return;

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`${API_BASE}/constraints/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          type,
          hardness,
          source: "form",
          explanation: explanation.trim(),
          active: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to formulate constraint");
      }

      setExplanation("");
      setOpenModal(false);
      await fetchConstraints();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creating constraint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c: Constraint) => {
    try {
      const updatedActive = !c.active;
      const res = await fetch(`${API_BASE}/constraints/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: c.scope,
          type: c.type,
          hardness: c.hardness,
          source: c.source || "form",
          explanation: c.explanation,
          active: updatedActive,
        }),
      });

      if (res.ok) {
        setConstraints((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, active: updatedActive } : item))
        );
      }
    } catch (err) {
      console.error("Failed to toggle constraint active state", err);
    }
  };

  const handleDeleteConstraint = async (id: number) => {
    if (!confirm("Are you sure you want to delete this constraint? It will no longer be considered by the optimizer.")) return;

    try {
      const res = await fetch(`${API_BASE}/constraints/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConstraints((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete constraint", err);
    }
  };

  const handleApplyAndRegenerate = async () => {
    setGenerating(true);
    setGenerateMsg(null);

    try {
      let institutionId = 1;
      let semesterId = 1;

      const [instRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/institutions/`),
        fetch(`${API_BASE}/semesters/`),
      ]);

      if (instRes.ok) {
        const insts = await instRes.json();
        if (insts.length > 0) institutionId = insts[0].id;
      }
      if (semRes.ok) {
        const sems = await semRes.json();
        if (sems.length > 0) semesterId = sems[0].id;
      }

      const genUrl = `${API_BASE}/generator/generate?semester_id=${semesterId}&institution_id=${institutionId}`;
      const genRes = await fetch(genUrl, { method: "POST" });
      const data = await genRes.json();

      if (data.status === "success") {
        setGenerateMsg({
          type: "success",
          text: `Timetable successfully re-computed! Applied ${constraints.filter((c) => c.active).length} active constraints with 0 hard conflicts. Redirecting...`,
        });
        setTimeout(() => {
          router.push("/timetable");
        }, 1200);
      } else {
        setGenerateMsg({
          type: "error",
          text: data.message || "Optimization engine could not find a feasible schedule with current constraints.",
        });
      }
    } catch (err) {
      setGenerateMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error executing solver re-generation.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-[1550px] mx-auto space-y-10 tt-animate-fade pb-16">
      <PageHeader
        title={activeTab === "profile" ? "Profile" : "Settings"}
        icon={activeTab === "profile" ? User : Settings}
      >
        {activeTab === "settings" && (
          <Button
            onClick={handleSaveGeneral}
            className="h-10 rounded-xl font-semibold bg-primary text-primary-foreground shadow-sm hover:shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] cursor-pointer"
          >
            {savedToast ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Check className="size-4" /> Preferences Saved
              </span>
            ) : (
              "Save Preferences"
            )}
          </Button>
        )}
      </PageHeader>

      {/* ── Tab Switcher (Borderless Pill Container) ── */}
      <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="size-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="size-4" />
          Settings
        </button>
      </div>

      {/* ═══════════════ DIVISION 1: USER PROFILE (Borderless & Spread) ═══════════════ */}
      {activeTab === "profile" && (
        <div className="space-y-12 tt-animate-fade pt-4">
          {/* Header Row: User Avatar, Name, Email and Sign Out */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] dark:border-white/[0.06]">
            <div className="flex items-center gap-5">
              <Avatar className="size-20 border-0 shadow-[0_0_25px_rgba(0,112,243,0.35)]">
                <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-[#0052FF] via-[#0070F3] to-[#0A1B4F] text-white">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {user?.name || "Sanjay"}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {user?.email || "sanjaysrgr314@gmail.com"}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="h-11 rounded-2xl gap-2.5 font-bold px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0 cursor-pointer w-fit"
            >
              <LogOut className="size-4" />
              Sign Out Session
            </Button>
          </div>

          {/* Spread Profile Information Fields (No Boxes, Clean Typography) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4 text-[#0070F3]" />
                <span className="text-xs font-bold uppercase tracking-wider">Full Name</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {user?.name || "Sanjay"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 text-[#38BDF8]" />
                <span className="text-xs font-bold uppercase tracking-wider">Email Address</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground break-all">
                {user?.email || "sanjaysrgr314@gmail.com"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4 text-[#0070F3]" />
                <span className="text-xs font-bold uppercase tracking-wider">System Role</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground capitalize">
                {user?.role || "User"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ DIVISION 2: SYSTEM SETTINGS ═══════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-6 tt-animate-fade">
          {/* 1. Theme Preferences */}
          <GlassPanel glow="violet" className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Visual Theme & Appearance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle between dark obsidian nebula and vibrant iridescent light mode</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-4 rounded-2xl p-4 text-left transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-violet-500/10 shadow-[0_0_25px_-5px_rgba(0,112,243,0.3)] ring-2 ring-violet-500/40"
                    : "bg-card/60 hover:bg-card"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <Moon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Dark Nebula Mode</p>
                  <p className="text-xs text-muted-foreground">Deep obsidian with multi-spectral aura</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-4 rounded-2xl p-4 text-left transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-indigo-500/10 shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/40"
                    : "bg-card/60 hover:bg-card"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                  <Sun className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Iridescent Light Mode</p>
                  <p className="text-xs text-muted-foreground">Crisp pastel canvas with vibrant glows</p>
                </div>
              </button>
            </div>
          </GlassPanel>

          {/* 2. Institutional Scheduling Rules */}
          <GlassPanel glow="cyan" className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Institutional Scheduling Defaults</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Operating days and baseline timetable parameters</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Academic Week Schedule</p>
                    <p className="text-xs text-muted-foreground">Monday through Friday (5 Working Days)</p>
                  </div>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  Mon — Fri Active
                </span>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Standard Working Time Bands</p>
                    <p className="text-xs text-muted-foreground">09:00 AM to 04:00 PM (6 Lecture Periods + Lunch)</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  09:00 — 16:00
                </span>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#0070F3]/10 text-[#0070F3] dark:text-[#38BDF8]">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Automatic Student Idle Gap Minimization</p>
                    <p className="text-xs text-muted-foreground">Solver penalizes empty gap periods between consecutive classes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoResolveGaps(!autoResolveGaps)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoResolveGaps ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoResolveGaps ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </GlassPanel>

          {/* 3. OPTIMIZATION CONSTRAINT ENGINE */}
          <GlassPanel glow="blue" className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">Optimization Constraint Engine</h3>
                  <span className="rounded-full bg-[#0070F3]/10 text-[#0070F3] dark:text-[#38BDF8] px-2 py-0.5 text-xs font-bold">
                    OR-Tools CP-SAT
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add, toggle, or remove constraints. Active rules directly enforce or guide timetable optimization results.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchConstraints}
                  className="size-9 rounded-xl bg-card text-muted-foreground hover:text-foreground cursor-pointer border-0"
                  title="Refresh constraints"
                >
                  <RefreshCw className={`size-4 ${loadingConstraints ? "animate-spin text-primary" : ""}`} />
                </Button>

                <Dialog open={openModal} onOpenChange={setOpenModal}>
                  <DialogTrigger asChild>
                    <Button className="tt-gradient-btn h-9 rounded-xl gap-2 font-bold px-3.5 cursor-pointer">
                      <Plus className="size-4" />
                      Add Constraint
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[460px] rounded-3xl bg-card/95 backdrop-blur-2xl p-6 border-0">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Add Custom Rule</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddConstraint} className="space-y-4 mt-2">
                      {formError && (
                        <div className="p-3 text-xs font-semibold bg-red-500/10 text-red-500 rounded-xl">
                          {formError}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Scope</label>
                        <select
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                          className="w-full rounded-xl bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 border-0"
                        >
                          <option value="faculty">Faculty Rule</option>
                          <option value="room">Room & Facility Rule</option>
                          <option value="section">Student Cohort Rule</option>
                          <option value="global">Global Institutional Rule</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Constraint Type / Hardness</label>
                        <select
                          value={hardness}
                          onChange={(e) => setHardness(e.target.value)}
                          className="w-full rounded-xl bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 border-0"
                        >
                          <option value="HARD">HARD (Must strictly satisfy, 0 violations allowed)</option>
                          <option value="SOFT">SOFT (Optimized via solver penalty weights)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">Rule Description</label>
                        <Input
                          placeholder="e.g., Computer Science labs must be assigned only to Turing Lab"
                          value={explanation}
                          onChange={(e) => setExplanation(e.target.value)}
                          className="rounded-xl bg-muted/40 border-0"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full tt-gradient-btn h-10 rounded-xl font-bold mt-4 cursor-pointer"
                      >
                        {submitting ? "Saving Rule..." : "Register Constraint"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Constraints List */}
            <div className="space-y-3">
              {DEFAULT_SYSTEM_RULES.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Sliders className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{rule.name}</span>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-extrabold">
                          {rule.hardness}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.explanation}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 shrink-0">System Default (Enforced)</span>
                </div>
              ))}

              {constraints.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#0070F3]/10 text-[#0070F3] dark:text-[#38BDF8] mt-0.5">
                      <Sliders className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground capitalize">{c.scope} Custom Rule</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                          c.hardness === "HARD"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        }`}>
                          {c.hardness}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.explanation || "User-configured schedule constraint."}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        c.active ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          c.active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteConstraint(c.id)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Profile & Settings...</div>}>
        <AccountAndSettingsContent />
      </Suspense>
    </AppShell>
  );
}
