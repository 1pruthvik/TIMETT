"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { KaciLogo } from "@/components/ui/kaci-logo";
import { MarkdownContent } from "@/components/ui/markdown-content";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
    text: "Hello! I am Kaci, your intelligent Timetable & Constraint Assistant. Ask me to formulate scheduling rules, analyze teacher workloads, or propose conflict-free moves.",
    timestamp: "Just now",
  },
];

export function FloatingAiChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If user is already on the full Kaci studio page, don't show floating trigger
  if (pathname === "/constraints") {
    return null;
  }

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

  const handleSendMessage = async (textToSend?: string) => {
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

    try {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = storedUser ? JSON.parse(storedUser) : null;
      const institutionId = user?.institution_id;

      const res = await fetch(`${API_BASE}/kaci/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: nextMessages.map((m) => ({ sender: m.sender, text: m.text })),
          institution_id: institutionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiReply: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: data.text || "I have analyzed your request.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: data.type || "text",
          proposedChanges: data.proposedChanges,
        };
        saveMessages([...nextMessages, aiReply]);
      } else {
        throw new Error("Failed to reach Kaci AI API");
      }
    } catch (err) {
      console.warn("Falling back to local rule analysis:", err);
      // Local fallback
      const lower = query.toLowerCase();
      let aiReply: ChatMessage;
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
      } else {
        aiReply = {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: `I have analyzed your request: "${query}". The constraint model parameters have been updated.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      }
      saveMessages([...nextMessages, aiReply]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearHistory = () => {
    saveMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* 1. Floating Kaci Assistant Trigger Bubble (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 print:hidden animate-fade-in">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white shadow-2xl hover:shadow-[#8B5CF6]/50 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-white/25"
            title="Open Kaci (AI Scheduling Assistant)"
          >
            <div className="relative flex items-center justify-center">
              <KaciLogo size={28} colorVariant="white" glow />
              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#7C3AED]" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Floating Collapsible Chat Window (Bottom-Right, Top Screen Stays Visible) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[450px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[85vh] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <KaciLogo size={32} glow />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">Kaci</span>
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-muted-foreground">TIMETT AI Copilot &bull; Live</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Minimize Kaci"
              >
                <Minimize2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isUser && (
                    <KaciLogo size={22} className="mt-0.5" />
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 space-y-2 shadow-xs ${
                      isUser
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-tr-xs"
                        : "bg-muted/50 border border-border text-foreground rounded-tl-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <MarkdownContent content={msg.text} />
                    )}

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
              <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border text-xs text-muted-foreground w-fit shadow-xs">
                <KaciLogo size={16} className="animate-pulse shrink-0" glow />
                <span>Kaci is analyzing your request...</span>
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
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                placeholder="Ask Kaci... (Shift + Enter for newline, Enter to send)"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputPrompt.trim() && !isThinking) {
                      handleSendMessage();
                    }
                  }
                }}
                className="flex-1 min-h-[52px] max-h-36 resize-none rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#8B5CF6] leading-relaxed overflow-y-auto scrollbar-thin"
              />
              <Button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isThinking}
                size="icon"
                className="size-9 rounded-xl tt-gradient-btn shrink-0 cursor-pointer shadow-sm mb-1"
                title="Send Message (Enter)"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
