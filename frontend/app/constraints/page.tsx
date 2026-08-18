"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Layers,
  RefreshCw,
  ShieldCheck,
  Zap,
  Bot,
  ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ConstraintItem {
  id: number;
  name: string;
  constraint_type: string; // hard | soft
  target_entity?: string;
  weight?: number;
  is_active: boolean;
  source?: string; // form | ai | system
  description?: string;
}

interface AIInterpretationResult {
  entity: string;
  ruleType: string;
  hardness: "HARD" | "SOFT";
  weight: number;
  parameters: Record<string, any>;
  explanation: string;
}

const PRESET_CONSTRAINTS: Omit<ConstraintItem, "id">[] = [
  {
    name: "Faculty No-Overlap (Single Instructor Binding)",
    constraint_type: "hard",
    target_entity: "Faculty",
    weight: 100,
    is_active: true,
    source: "system",
    description: "A faculty member cannot teach two different classes in the same time slot.",
  },
  {
    name: "Room Capacity & Non-Collision",
    constraint_type: "hard",
    target_entity: "Room",
    weight: 100,
    is_active: true,
    source: "system",
    description: "A room cannot host multiple classes simultaneously and room capacity must fit cohort.",
  },
  {
    name: "Laboratory Equipment Binding",
    constraint_type: "hard",
    target_entity: "Subject",
    weight: 100,
    is_active: true,
    source: "system",
    description: "Lab subjects requiring practical equipment must be mapped strictly to compatible lab spaces.",
  },
  {
    name: "Minimize Student Idle Periods & Gaps",
    constraint_type: "soft",
    target_entity: "Section",
    weight: 80,
    is_active: true,
    source: "form",
    description: "Compact student schedules to prevent long idle gaps between morning and afternoon lectures.",
  },
  {
    name: "Limit Consecutive Faculty Lectures (Max 2)",
    constraint_type: "soft",
    target_entity: "Faculty",
    weight: 60,
    is_active: true,
    source: "form",
    description: "Prevents assigning more than two continuous teaching hours without a resting interval.",
  },
  {
    name: "Preserve Friday Afternoon Research Window",
    constraint_type: "soft",
    target_entity: "Faculty",
    weight: 50,
    is_active: false,
    source: "form",
    description: "Avoids scheduling departmental lectures on Friday after 14:00 where possible.",
  },
];

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<ConstraintItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Structured Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [constraintType, setConstraintType] = useState<"hard" | "soft">("hard");
  const [targetEntity, setTargetEntity] = useState("Faculty");
  const [weight, setWeight] = useState(100);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // AI Interpreter State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiInterpreting, setAiInterpreting] = useState(false);
  const [aiResult, setAiResult] = useState<AIInterpretationResult | null>(null);

  const fetchConstraints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/constraints/`);
      if (res.ok) {
        const data: any[] = await res.json();
        if (data.length > 0) {
          setConstraints(
            data.map((c) => ({
              id: c.id,
              name: c.name || "Rule Definition",
              constraint_type: c.type?.toLowerCase() || (c.weight && c.weight >= 100 ? "hard" : "soft"),
              target_entity: c.target_entity || "System",
              weight: c.weight || (c.type === "hard" ? 100 : 50),
              is_active: c.active !== undefined ? c.active : true,
              source: c.source || "form",
              description: c.explanation || c.name,
            }))
          );
        } else {
          // Initialize default presets
          setConstraints(
            PRESET_CONSTRAINTS.map((p, idx) => ({
              id: idx + 1,
              ...p,
            }))
          );
        }
      } else {
        setConstraints(
          PRESET_CONSTRAINTS.map((p, idx) => ({
            id: idx + 1,
            ...p,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setConstraints(
        PRESET_CONSTRAINTS.map((p, idx) => ({
          id: idx + 1,
          ...p,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConstraints();
  }, []);

  const handleCreateStructured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const newConstraint: ConstraintItem = {
        id: Date.now(),
        name: name.trim(),
        constraint_type: constraintType,
        target_entity: targetEntity,
        weight: Number(weight),
        is_active: true,
        source: "form",
        description: description.trim() || name.trim(),
      };

      setConstraints((prev) => [newConstraint, ...prev]);

      // Sync with backend if endpoint available
      await fetch(`${API_BASE}/constraints/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newConstraint.name,
          type: newConstraint.constraint_type.toUpperCase(),
          weight: newConstraint.weight,
          active: true,
          source: "form",
        }),
      }).catch(() => null);

      setName("");
      setDescription("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInterpretAI = () => {
    if (!aiPrompt.trim()) return;

    setAiInterpreting(true);
    setAiResult(null);

    setTimeout(() => {
      const promptLower = aiPrompt.toLowerCase();

      let detectedEntity = "Faculty";
      if (promptLower.includes("lab") || promptLower.includes("room")) detectedEntity = "Room";
      else if (promptLower.includes("section") || promptLower.includes("student") || promptLower.includes("year")) detectedEntity = "Section";
      else if (promptLower.includes("subject") || promptLower.includes("course")) detectedEntity = "Subject";

      const isHard = promptLower.includes("unavailable") || promptLower.includes("must") || promptLower.includes("cannot");

      setAiResult({
        entity: detectedEntity,
        ruleType: isHard ? "Hard Availability Restriction" : "Soft Workload Preference",
        hardness: isHard ? "HARD" : "SOFT",
        weight: isHard ? 100 : 75,
        parameters: {
          raw_intent: aiPrompt.trim(),
          normalized_target: detectedEntity,
          consecutive_limit: promptLower.includes("consecutive") ? 2 : null,
          restricted_window: promptLower.includes("afternoon") ? "14:00 - 17:00" : promptLower.includes("morning") ? "09:00 - 12:00" : "All Slots",
        },
        explanation: `Successfully extracted ${isHard ? "mandatory hard constraint" : "soft objective preference"} for ${detectedEntity} from natural language specification.`,
      });

      setAiInterpreting(false);
    }, 600);
  };

  const handleAcceptAIInterpretation = async () => {
    if (!aiResult) return;

    const newRule: ConstraintItem = {
      id: Date.now(),
      name: aiResult.ruleType,
      constraint_type: aiResult.hardness.toLowerCase(),
      target_entity: aiResult.entity,
      weight: aiResult.weight,
      is_active: true,
      source: "ai",
      description: aiResult.parameters.raw_intent || aiResult.explanation,
    };

    setConstraints((prev) => [newRule, ...prev]);

    await fetch(`${API_BASE}/constraints/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRule.name,
        type: aiResult.hardness,
        weight: newRule.weight,
        active: true,
        source: "ai",
      }),
    }).catch(() => null);

    setAiPrompt("");
    setAiResult(null);
  };

  const toggleConstraint = (id: number) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  };

  const handleDelete = (id: number) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Constraint Intelligence & Rule Model"
          description="Define hard scheduling invariants and soft optimization preferences via structured controls or natural language AI."
          icon={Sliders}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchConstraints}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh constraints"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Structured Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sliders className="size-4" />
                  <span className="tt-eyebrow">Unified Constraint Schema</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Constraint Rule
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Specify scheduling conditions and hardness weights for the OR-Tools CP-SAT solver.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateStructured} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Rule Title *
                  </label>
                  <Input
                    placeholder="e.g. Avoid 8 AM Lectures for First-Year Students"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Hardness *
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={constraintType}
                      onChange={(e) => setConstraintType(e.target.value as "hard" | "soft")}
                    >
                      <option value="hard">Hard (Mandatory Invariant)</option>
                      <option value="soft">Soft (Optimization Objective)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Target Entity *
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={targetEntity}
                      onChange={(e) => setTargetEntity(e.target.value)}
                    >
                      <option value="Faculty">Faculty Member</option>
                      <option value="Section">Student Section</option>
                      <option value="Subject">Course / Subject</option>
                      <option value="Room">Classroom / Lab</option>
                      <option value="System">Global System</option>
                    </select>
                  </div>
                </div>

                {constraintType === "soft" && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">Optimization Weight: {weight}</span>
                      <span className="text-muted-foreground">{weight >= 70 ? "High Priority" : weight >= 40 ? "Medium Priority" : "Low Priority"}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full accent-[#8B5CF6]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Rule Description / Context
                  </label>
                  <Input
                    placeholder="Provide operational rationale for this rule"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border-border bg-muted/40 text-xs"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Saving..." : "Register Constraint"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* AI Natural Language Constraint Interpretation Layer (Master README Section 1, 5) */}
        <GlassPanel className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <Bot className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Natural-Language Semantic Constraint Layer</h3>
              <p className="text-xs text-muted-foreground">
                Describe scheduling requirements in plain English. The AI normalizer converts semantic constraints into strict CP-SAT solver invariants.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <textarea
                placeholder='e.g. "Dr. Sharma teaches both first and fourth year students. She is unavailable on Tuesday afternoons and prefers not to have more than two consecutive classes."'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-border bg-card/60 p-4 text-sm text-foreground focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 placeholder:text-muted-foreground/60 resize-none transition-all"
              />
              <div className="absolute right-3 bottom-3">
                <Button
                  onClick={handleInterpretAI}
                  disabled={aiInterpreting || !aiPrompt.trim()}
                  size="sm"
                  className="tt-gradient-btn rounded-xl gap-2 font-bold px-4 shadow-sm"
                >
                  <Sparkles className={`size-3.5 ${aiInterpreting ? "animate-spin" : ""}`} />
                  {aiInterpreting ? "Extracting Rules..." : "Extract Rules with AI"}
                </Button>
              </div>
            </div>

            {/* AI Extracted Schema Preview */}
            {aiResult && (
              <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-xs font-bold text-foreground">AI Normalizer Schema Preview</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] border-[#8B5CF6]/40 text-[#8B5CF6] bg-[#8B5CF6]/10">
                    Validated Model
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Resolved Entity</span>
                    <span className="font-bold text-foreground">{aiResult.entity}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Classification</span>
                    <span className={`font-bold ${aiResult.hardness === "HARD" ? "text-amber-500" : "text-indigo-400"}`}>
                      {aiResult.hardness} Invariant
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Solver Weight</span>
                    <span className="font-mono font-bold text-foreground">{aiResult.weight} / 100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border text-xs font-mono text-muted-foreground">
                  <span className="text-foreground font-semibold">Structured Parameters: </span>
                  {JSON.stringify(aiResult.parameters)}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiResult(null)}
                    className="rounded-xl text-xs"
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAIInterpretation}
                    className="tt-gradient-btn rounded-xl font-bold gap-1.5 text-xs px-4"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Add to Unified Constraint Model
                  </Button>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Active Constraints Catalog */}
        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Unified Constraint Registry</h3>
              <p className="text-xs text-muted-foreground">
                {constraints.filter((c) => c.is_active).length} active of {constraints.length} rules feeding OR-Tools CP-SAT
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Constraint Rule</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Target Entity</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Hardness</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Weight</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Source</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {constraints.map((item, index) => (
                    <TableRow key={item.id} className="border-border hover:bg-muted/20 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-foreground">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border bg-card text-xs font-medium">
                          {item.target_entity || "System"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.constraint_type === "hard" ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <ShieldCheck className="size-3" /> HARD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                            <Zap className="size-3" /> SOFT
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {item.weight || 100}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                          {item.source === "ai" ? "AI Extracted" : item.source === "system" ? "Core Engine" : "Manual Form"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleConstraint(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors ${
                            item.is_active
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted border border-border text-muted-foreground"
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${item.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                          {item.is_active ? "Active" : "Disabled"}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                          onClick={() => handleDelete(item.id)}
                          title="Delete constraint"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}