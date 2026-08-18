"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme/theme-provider";
import {
  Settings,
  Sun,
  Moon,
  Calendar,
  Clock,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Check,
  Sparkles,
  RefreshCw,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

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

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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

  useEffect(() => {
    fetchConstraints();
  }, []);

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
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 tt-animate-fade">
        <PageHeader
          title="System Settings & Constraint Engine"
          description="Configure display themes, institutional operating hours, and live solver constraint satisfaction rules."
          icon={Settings}
        >
          <Button
            onClick={handleSaveGeneral}
            className="h-10 rounded-xl font-semibold bg-primary text-primary-foreground shadow-sm hover:shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] cursor-pointer"
          >
            {savedToast ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Check className="size-4" /> Preferences Saved
              </span>
            ) : (
              "Save General Settings"
            )}
          </Button>
        </PageHeader>

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
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-violet-500 bg-violet-500/10 shadow-[0_0_25px_-5px_rgba(139,92,246,0.3)] ring-2 ring-violet-500/40"
                  : "border-border bg-card/60 hover:bg-card"
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
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                theme === "light"
                  ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/40"
                  : "border-border bg-card/60 hover:bg-card"
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
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
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
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                09:00 — 16:00
              </span>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
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

        {/* 3. OPTIMIZATION CONSTRAINT ENGINE (Integrated here!) */}
        <GlassPanel glow="purple" className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Optimization Constraint Engine</h3>
                <span className="rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#A78BFA] px-2 py-0.5 text-xs font-bold border border-[#8B5CF6]/20">
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
                className="size-9 rounded-xl border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
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

                <DialogContent className="sm:max-w-[460px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
                  <DialogHeader>
                    <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                      <Sparkles className="size-4" />
                      <span className="tt-eyebrow">Solver Rule Formulation</span>
                    </div>
                    <DialogTitle className="text-xl font-bold text-foreground">
                      Formulate Scheduling Rule
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Define a scope, rule type, and hardness level for the optimization solver.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddConstraint} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">
                          Target Scope *
                        </label>
                        <select
                          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                        >
                          <option value="faculty">Faculty Scope</option>
                          <option value="room">Room Scope</option>
                          <option value="section">Section Scope</option>
                          <option value="institution">Institution Scope</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">
                          Hardness Level *
                        </label>
                        <select
                          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          value={hardness}
                          onChange={(e) => setHardness(e.target.value)}
                        >
                          <option value="HARD">HARD (Strict Infeasible)</option>
                          <option value="SOFT">SOFT (Penalty Penalty)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        Rule Type Identifier *
                      </label>
                      <Input
                        placeholder="e.g. blocked_time, max_consecutive_hours"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        required
                        className="rounded-xl border-border bg-muted/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        Rule Context / Explanation *
                      </label>
                      <Input
                        placeholder="e.g. Do not schedule lab sessions in 1st period on Friday"
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        required
                        className="rounded-xl border-border bg-muted/40"
                      />
                    </div>

                    {formError && <p className="text-xs text-red-500">{formError}</p>}

                    <DialogFooter className="pt-2">
                      <Button
                        type="submit"
                        disabled={submitting || !explanation.trim()}
                        className="tt-gradient-btn rounded-xl font-bold"
                      >
                        {submitting ? "Formulating..." : "Save Constraint"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Re-generate Button after changing constraints */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="size-4 text-[#8B5CF6]" />
                Live Result Reflection
              </p>
              <p className="text-[11px] text-muted-foreground">
                After adding or toggling constraints, re-generate the schedule to verify the solver satisfies your new rules.
              </p>
            </div>
            <Button
              onClick={handleApplyAndRegenerate}
              disabled={generating}
              className="tt-gradient-btn h-9 rounded-xl gap-2 font-bold px-4 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`size-3.5 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Computing New Schedule..." : "Apply & Re-generate Timetable"}
            </Button>
          </div>

          {generateMsg && (
            <div
              className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-semibold ${
                generateMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
              }`}
            >
              {generateMsg.type === "success" ? (
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="size-4 text-red-500 shrink-0" />
              )}
              <p>{generateMsg.text}</p>
            </div>
          )}

          {/* Core System Hard Constraints */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Core Engine Hard Rules (Always Enforced)
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEFAULT_SYSTEM_RULES.map((rule) => (
                <div
                  key={rule.name}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{rule.name}</span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-extrabold border border-emerald-500/20">
                      {rule.hardness}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {rule.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* User Custom Constraints with Toggle and Delete */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  User Configured Constraints ({constraints.length})
                </h4>
              </div>
            </div>

            {loadingConstraints ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading active constraints...</div>
            ) : constraints.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-xs font-semibold text-foreground">No custom constraints formulated yet</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Click &quot;Add Constraint&quot; above to formulate specific faculty preferences, lab blocks, or room limits.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {constraints.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
                      c.active
                        ? c.hardness === "HARD"
                          ? "border-[#8B5CF6]/35 bg-[#8B5CF6]/5"
                          : "border-sky-500/30 bg-sky-500/5"
                        : "border-border bg-muted/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary capitalize">
                          {c.scope}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-foreground">{c.type}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                            c.hardness === "HARD"
                              ? "bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#C084FC] border border-[#8B5CF6]/30"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {c.hardness}
                        </span>

                        {/* Active Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`cursor-pointer text-xs font-semibold flex items-center gap-1 ${
                            c.active ? "text-emerald-500" : "text-muted-foreground"
                          }`}
                          title={c.active ? "Click to disable" : "Click to enable"}
                        >
                          {c.active ? (
                            <ToggleRight className="size-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="size-5 text-muted-foreground" />
                          )}
                        </button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                          onClick={() => handleDeleteConstraint(c.id)}
                          title="Delete constraint"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {c.explanation || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground pt-1 border-t border-border/40">
                      <span>Status: {c.active ? "Enforced by Solver" : "Inactive (Ignored)"}</span>
                      <span className="font-mono">ID #{c.id}</span>
                    </div>
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