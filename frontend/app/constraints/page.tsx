"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface Constraint {
  id: number;
  scope: string;
  type: string;
  hardness: string;
  source: string;
  explanation?: string | null;
  active: boolean;
}

const DEFAULT_SYSTEM_RULES = [
  {
    name: "Faculty No-Overlap",
    scope: "faculty",
    type: "no_simultaneous_classes",
    hardness: "HARD",
    explanation: "A faculty member cannot teach two classes simultaneously in the same time slot.",
  },
  {
    name: "Room No-Overlap",
    scope: "room",
    type: "no_simultaneous_classes",
    hardness: "HARD",
    explanation: "A classroom/laboratory cannot host two classes simultaneously.",
  },
  {
    name: "Section No-Overlap",
    scope: "section",
    type: "no_simultaneous_classes",
    hardness: "HARD",
    explanation: "A student cohort/section cannot attend two subjects at the same time.",
  },
  {
    name: "Faculty Availability",
    scope: "faculty",
    type: "respect_working_hours",
    hardness: "HARD",
    explanation: "Prevent scheduling faculty outside their specified availability windows.",
  },
  {
    name: "Minimize Student Gaps",
    scope: "section",
    type: "minimize_idle_periods",
    hardness: "SOFT",
    explanation: "Aim to keep student daily schedule continuous and minimize free period gaps.",
  },
];

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [scope, setScope] = useState("faculty");
  const [type, setType] = useState("custom_rule");
  const [hardness, setHardness] = useState("HARD");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchConstraints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/constraints/`);
      if (res.ok) {
        const data = await res.json();
        setConstraints(data);
      }
    } catch (err) {
      console.error("Failed to fetch constraints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConstraints();
  }, []);

  const handleAddConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) return;

    setSubmitting(true);
    setError("");

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
        throw new Error(errData.detail || "Failed to add constraint");
      }

      setExplanation("");
      setOpen(false);
      await fetchConstraints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating constraint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this custom constraint?")) return;

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

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Unified Constraint Model</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Define hard rules (non-negotiable) and soft preferences (optimization penalties).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchConstraints} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Custom Constraint
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Add Scheduling Rule</DialogTitle>
                  <DialogDescription>
                    Define a hard or soft constraint for the OR-Tools solver.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddConstraint} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Target Scope *
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                      >
                        <option value="faculty">Faculty</option>
                        <option value="room">Room</option>
                        <option value="section">Section</option>
                        <option value="institution">Institution</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Constraint Hardness *
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={hardness}
                        onChange={(e) => setHardness(e.target.value)}
                      >
                        <option value="HARD">HARD (Must Satisfy)</option>
                        <option value="SOFT">SOFT (Preference)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Rule Type *
                    </label>
                    <Input
                      placeholder="e.g. max_consecutive_hours or avoid_morning_slots"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Rule Description / Context *
                    </label>
                    <Input
                      placeholder="e.g. Dr. Sharma cannot teach more than 2 consecutive hours on Monday."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={submitting || !explanation.trim()}>
                      {submitting ? "Saving..." : "Save Constraint"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* System Core Rules */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Core Engine Hard Constraints (Active)
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_SYSTEM_RULES.map((rule) => (
              <Card key={rule.name} className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{rule.name}</CardTitle>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]">
                      {rule.hardness}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rule.explanation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom User Constraints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Custom User & AI-Derived Constraints
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">{constraints.length} custom rules</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading custom constraints...</div>
          ) : constraints.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No custom constraints added yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add specific faculty preferences, lab requirements, or time restrictions using the button above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {constraints.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs capitalize">
                          {c.scope}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">{c.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            c.hardness === "HARD"
                              ? "bg-red-500/10 text-red-700 border-red-500/20 text-[10px]"
                              : "bg-blue-500/10 text-blue-700 border-blue-500/20 text-[10px]"
                          }
                        >
                          {c.hardness}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{c.explanation || "No description provided."}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}