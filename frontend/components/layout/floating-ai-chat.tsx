"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  CalendarDays,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  type?: "text" | "proposed_moves" | "constraint_rule";
  proposedChanges?: {
    subject: string;
    from: string;
    to: string;
    faculty: string;
  }[];
}

const DEFAULT_SUGGESTIONS = [
  "Move all of Prof. Rao's lectures away from Friday afternoon",
  "Ensure no instructor takes more than 2 consecutive hours",
  "Check for room or section double-booking conflicts",
  "Formulate soft constraint for morning laboratory sessions",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m_init",
    sender: "ai",
    text: "Hello! I am your AI Timetable & Constraint Assistant. Ask me to formulate scheduling rules, analyze teacher workloads, or propose conflict-free moves.",
    timestamp: "Just now",
  },
];

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
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

  // Save chat history to localStorage
  const saveMessages = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem("timett_ai_chat_history", JSON.stringify(newMsgs));
    // Trigger custom event so full constraints page stays in sync
    window.dispatchEvent(new Event("timett_chat_updated"));
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Listen for updates from full constraints page
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
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: "I have formulated a new Soft Constraint with weight 75: 'Limit Consecutive Faculty Lectures to Maximum 2 Hours'. This has been registered in your AI Constraints rules.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "constraint_rule",
        };
      } else if (lower.includes("conflict") || lower.includes("check") || lower.includes("double")) {
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: "Verification complete! All 0 hard collisions detected. Instructors, student cohorts, and laboratory spaces comply with single-occupancy invariants.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      } else {
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: `Understood. I have analyzed your request regarding "${query}". The constraint model parameters have been updated to optimize your timetable schedule.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      }

      saveMessages([...nextMessages, aiReply]);
      setIsThinking(false);
    }, 700);
  };

  const handleClearHistory = () => {
    saveMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* 1. Floating AI Assistant Trigger Bubble (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 print:hidden animate-fade-in">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 px-4 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white shadow-2xl hover:shadow-[#8B5CF6]/40 hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20"
            title="Open AI Timetable & Constraint Assistant"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="size-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-400 border border-white" />
            </div>
            <span className="font-bold text-xs tracking-wide pr-1 hidden sm:inline-block">
              AI Assistant
            </span>
            <Sparkles className="size-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. Floating Collapsible Chat Window (Bottom-Right, Top Screen Stays Visible) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[80vh] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] text-white shadow-xs">
                <Bot className="size-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  AI Timetable Assistant
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Online
                  </Badge>
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Natural language constraint & schedule solver
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link href="/constraints" title="Open Full AI & Constraints Studio">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="size-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-7 rounded-lg text-muted-foreground hover:text-red-500 cursor-pointer"
                title="Minimize assistant"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isUser && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                      <Bot className="size-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 space-y-2 shadow-xs ${
                      isUser
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-tr-xs"
                        : "bg-muted/50 border border-border text-foreground rounded-tl-xs"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Proposed moves card */}
                    {msg.proposedChanges && (
                      <div className="space-y-1.5 pt-1">
                        {msg.proposedChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-card border border-border/80 text-[11px] space-y-0.5 text-foreground"
                          >
                            <span className="font-bold text-[#8B5CF6] block">{change.subject}</span>
                            <span className="text-muted-foreground block">
                              From: <span className="line-through">{change.from}</span>
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                              To: {change.to} ({change.faculty})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[9px] font-mono ${
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
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground w-fit animate-pulse">
                <Wand2 className="size-3.5 text-[#8B5CF6] animate-spin" />
                <span>AI is analyzing scheduling rules...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {DEFAULT_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug)}
                className="whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border bg-card/80 hover:bg-card hover:border-[#8B5CF6]/50 text-foreground transition-all cursor-pointer shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-border bg-card shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask AI to modify schedules or rules..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-border bg-muted/40 px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#8B5CF6]"
              />
              <Button
                type="submit"
                disabled={!inputPrompt.trim() || isThinking}
                size="icon"
                className="size-9 rounded-xl tt-gradient-btn shrink-0 cursor-pointer shadow-sm"
              >
                <Send className="size-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
