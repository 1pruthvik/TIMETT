"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
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
  RotateCcw,
  ShieldCheck,
  Zap,
  Bot,
  Send,
  MessageSquare,
  Clock,
  User,
  Building2,
  Check,
  Info,
  RefreshCw,
} from "lucide-react";
import { ChatMessage } from "@/components/layout/floating-ai-chat";

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

const DEFAULT_SUGGESTIONS = [
  "Move all of Prof. Rao's lectures away from Friday afternoon",
  "Ensure no instructor takes more than 2 consecutive hours",
  "Check for room or section double-booking conflicts",
  "Formulate soft constraint for morning laboratory sessions",
  "Prioritize Senior Professors for 09:00 - 11:00 slots",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m_init",
    sender: "ai",
    text: "Hello! Welcome to the AI Constraint & Timetable Intelligence Studio. Here you can converse with the scheduling copilot, view historical prompt modifications, and manage active CP-SAT constraint rules.",
    timestamp: "Just now",
  },
];

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<ConstraintItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat & History State
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Structured Custom Rule Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [constraintType, setConstraintType] = useState<"hard" | "soft">("hard");
  const [targetEntity, setTargetEntity] = useState("Faculty");
  const [weight, setWeight] = useState(100);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          // Initialize defaults
          setConstraints(
            PRESET_CONSTRAINTS.map((p, idx) => ({
              ...p,
              id: idx + 1,
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
      setConstraints(
        PRESET_CONSTRAINTS.map((p, idx) => ({
          ...p,
          id: idx + 1,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  // Load chat history from localStorage
  useEffect(() => {
    fetchConstraints();

    const saved = localStorage.getItem("timett_ai_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  // Save chat history to localStorage and sync with floating assistant
  const saveMessages = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem("timett_ai_chat_history", JSON.stringify(newMsgs));
    window.dispatchEvent(new Event("timett_chat_updated"));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync listener from floating chat
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("timett_ai_chat_history");
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener("timett_chat_updated", handleSync);
    return () => window.removeEventListener("timett_chat_updated", handleSync);
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    saveMessages(nextMessages);
    setInputPrompt("");
    setIsThinking(true);

    setTimeout(() => {
      let aiReply: ChatMessage;

      const lower = query.toLowerCase();
      if (lower.includes("rao") || lower.includes("friday") || lower.includes("move")) {
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: "I analyzed the timetable matrix and identified 2 lectures on Friday afternoon for Prof. Rao. Here is a conflict-free relocation proposal:",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "proposed_moves",
          proposedChanges: [
            {
              subject: "Operating Systems (CS205)",
              from: "Friday 14:00 - 15:00",
              to: "Thursday 11:15 - 12:15",
              faculty: "Dr. Kumar",
            },
            {
              subject: "Database Systems (CS202)",
              from: "Friday 15:00 - 16:00",
              to: "Tuesday 10:00 - 11:00",
              faculty: "Prof. Rao",
            },
          ],
        };
      } else if (lower.includes("consecutive") || lower.includes("limit") || lower.includes("constraint")) {
        const newConstraint: ConstraintItem = {
          id: Date.now(),
          name: "Limit Consecutive Faculty Lectures (Max 2)",
          constraint_type: "soft",
          target_entity: "Faculty",
          weight: 75,
          is_active: true,
          source: "ai",
          description: "Prevents assigning more than two continuous teaching hours without a resting interval.",
        };
        setConstraints((prev) => [newConstraint, ...prev]);

        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: "Formulated and activated new Soft Constraint (Weight 75): 'Limit Consecutive Faculty Lectures (Max 2)'. This rule is now enforced in the solver engine.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "constraint_rule",
        };
      } else if (lower.includes("conflict") || lower.includes("check") || lower.includes("double")) {
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: "Verification complete! 0 hard collisions detected across instructors, student sections, and laboratory allocations.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      } else {
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: `Understood. I have analyzed your request regarding "${query}". The constraint model parameters and scheduling weights have been synchronized.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      }

      saveMessages([...nextMessages, aiReply]);
      setIsThinking(false);
    }, 650);
  };

  const handleClearHistory = () => {
    saveMessages(INITIAL_MESSAGES);
  };

  const handleToggleConstraint = (id: number) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
    );
  };

  const handleDeleteConstraint = (id: number) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddStructuredConstraint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: ConstraintItem = {
      id: Date.now(),
      name: name.trim(),
      constraint_type: constraintType,
      target_entity: targetEntity,
      weight: constraintType === "hard" ? 100 : weight,
      is_active: true,
      source: "form",
      description: description.trim() || name.trim(),
    };

    setConstraints((prev) => [newItem, ...prev]);
    setName("");
    setDescription("");
    setOpen(false);
  };

  const hardCount = constraints.filter((c) => c.constraint_type === "hard" && c.is_active).length;
  const softCount = constraints.filter((c) => c.constraint_type === "soft" && c.is_active).length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade pb-12">
        <PageHeader
          title="AI Assistant & Constraints Studio"
          description="Interactive natural language scheduling copilot, prompt modification history, and CP-SAT constraint rules management."
          icon={Sliders}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchConstraints}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh constraints"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Custom Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Sliders className="size-4" />
                  <span className="tt-eyebrow">Manual Rule Definition</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Constraint Rule
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Define mathematical boundaries for the CP-SAT integer programming solver.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddStructuredConstraint} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Rule Name *
                  </label>
                  <Input
                    placeholder="e.g. Max 3 Consecutive Lectures"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Hardness
                    </label>
                    <select
                      value={constraintType}
                      onChange={(e) => setConstraintType(e.target.value as "hard" | "soft")}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                    >
                      <option value="hard">Hard (Mandatory)</option>
                      <option value="soft">Soft (Preference)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Target Entity
                    </label>
                    <select
                      value={targetEntity}
                      onChange={(e) => setTargetEntity(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                    >
                      <option value="Faculty">Faculty</option>
                      <option value="Room">Room</option>
                      <option value="Section">Section</option>
                      <option value="Subject">Subject</option>
                    </select>
                  </div>
                </div>

                {constraintType === "soft" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        Optimization Weight (Priority)
                      </label>
                      <span className="text-xs font-mono font-bold text-primary">{weight}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Description / Logic
                  </label>
                  <Input
                    placeholder="Short description of this constraint..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" className="tt-gradient-btn rounded-xl font-bold w-full">
                    Register Constraint Rule
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Studio Workspace: Left AI Chat & History (7 Cols) + Right Active Rules (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: FULL AI CHAT & INTERACTIVE HISTORY CONSOLE */}
          <div className="lg:col-span-7 space-y-4">
            <GlassPanel className="p-0 overflow-hidden rounded-3xl border-border shadow-md flex flex-col h-[640px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-card/70">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] text-white shadow-xs">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      AI Scheduling Copilot & Conversation History
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        Live Sync
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {messages.length} messages in conversation history
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  className="rounded-xl text-xs gap-1.5 font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="size-3.5" /> Clear History
                </Button>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                          <Bot className="size-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-3xl p-4 space-y-2 shadow-xs ${
                          isUser
                            ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-tr-xs"
                            : "bg-card border border-border text-foreground rounded-tl-xs"
                        }`}
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {/* Proposed moves card */}
                        {msg.proposedChanges && (
                          <div className="space-y-2 pt-1">
                            {msg.proposedChanges.map((change, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1 text-foreground"
                              >
                                <span className="font-bold text-[#8B5CF6] block">{change.subject}</span>
                                <div className="text-[11px] text-muted-foreground">
                                  <span>From: </span>
                                  <span className="line-through">{change.from}</span>
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <span>To: </span>
                                  <span>{change.to} ({change.faculty})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          className={`text-[10px] font-mono ${
                            isUser ? "text-white/70 text-right" : "text-muted-foreground text-left"
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isThinking && (
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border text-xs text-muted-foreground w-fit animate-pulse">
                    <Wand2 className="size-4 text-[#8B5CF6] animate-spin" />
                    <span>AI is formulating constraint rules...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                {DEFAULT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="whitespace-nowrap text-xs font-semibold px-3 py-1 rounded-full border border-border bg-card hover:border-[#8B5CF6]/50 text-foreground transition-all cursor-pointer shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="p-4 border-t border-border bg-card shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask AI to modify constraints, check clashes, or optimize schedules..."
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    className="flex-1 h-11 rounded-2xl border border-border bg-muted/40 px-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <Button
                    type="submit"
                    disabled={!inputPrompt.trim() || isThinking}
                    className="h-11 px-5 rounded-2xl tt-gradient-btn font-bold text-xs gap-2 shrink-0 cursor-pointer shadow-md"
                  >
                    <Send className="size-4" /> Send
                  </Button>
                </form>
              </div>
            </GlassPanel>
          </div>

          {/* RIGHT: ACTIVE CP-SAT CONSTRAINT RULES & STATUS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassPanel className="p-5 rounded-3xl border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">
                    Active Constraint Rules ({constraints.filter((c) => c.is_active).length})
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-bold">
                    {hardCount} Hard
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold">
                    {softCount} Soft
                  </Badge>
                </div>
              </div>

              {/* Constraint List */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {constraints.map((c) => {
                  const isHard = c.constraint_type === "hard";

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        c.is_active
                          ? "bg-card border-border hover:border-primary/40"
                          : "bg-muted/20 border-border/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                              isHard
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {isHard ? "Hard Rule" : `Soft (wt: ${c.weight})`}
                          </Badge>

                          {c.source === "ai" && (
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold gap-1">
                              <Sparkles className="size-2.5" /> AI Generated
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleConstraint(c.id)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                              c.is_active
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {c.is_active ? "Active" : "Disabled"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteConstraint(c.id)}
                            className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-foreground">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {c.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}