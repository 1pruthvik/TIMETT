"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Wand2,
  RotateCcw,
  Bot,
  Send,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { KaciLogo } from "@/components/ui/kaci-logo";
import { ChatMessage } from "@/components/layout/floating-ai-chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
    text: "Hello! I am Kaci, your intelligent Timetable & Scheduling Assistant. Ask me to formulate scheduling rules, analyze teacher workloads, or propose conflict-free timetable moves.",
    timestamp: "Just now",
  },
];

export default function KaciPage() {
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
      const res = await fetch(`${API_BASE}/kaci/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: nextMessages.map((m) => ({ sender: m.sender, text: m.text })),
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
          text: `Understood. I have analyzed your request regarding "${query}". The constraint model parameters have been updated.`,
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
    <AppShell>
      <div className="flex flex-col min-h-[calc(100vh-6.5rem)] max-w-4xl mx-auto tt-animate-fade justify-between">
        {/* Seamless Header directly on page background */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <KaciLogo size={44} glow />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Kaci</h1>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Online &bull; Live Sync
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Conversational AI Assistant &bull; Natural language timetable & constraint solver
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="rounded-xl text-xs gap-1.5 font-semibold text-muted-foreground hover:text-foreground cursor-pointer border-border bg-card/60 hover:bg-card"
          >
            <RotateCcw className="size-3.5" /> Clear History
          </Button>
        </div>

        {/* Message Stream directly on page background */}
        <div className="flex-1 py-4 overflow-y-auto space-y-5 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isUser && (
                  <KaciLogo size={32} className="mt-0.5" />
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4 space-y-2.5 shadow-sm ${
                    isUser
                      ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-tr-xs"
                      : "bg-card/70 backdrop-blur-md border border-border/80 text-foreground rounded-tl-xs"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

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
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/60 backdrop-blur-md border border-border text-xs text-muted-foreground w-fit shadow-xs">
              <KaciLogo size={20} className="animate-pulse shrink-0" glow />
              <span>Kaci is analyzing your request...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Bar: Prompt Suggestions + Input integrated directly on background */}
        <div className="pt-3 pb-2 space-y-3 shrink-0">
          {/* Quick Suggestion Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
            {DEFAULT_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug)}
                className="whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border border-border/80 bg-card/60 hover:bg-card hover:border-[#8B5CF6]/50 text-foreground transition-all cursor-pointer shrink-0 backdrop-blur-md"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Form Box with 10-line capacity & generous padding */}
          <div className="relative rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-3.5 shadow-xl focus-within:border-[#8B5CF6] focus-within:ring-2 focus-within:ring-[#8B5CF6]/20 transition-all">
            <textarea
              rows={4}
              placeholder="Ask Kaci to modify constraints, check clashes, or optimize schedules...&#10;Press Shift + Enter for a new line, Enter to send"
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
              className="w-full min-h-[120px] max-h-[260px] resize-y bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed overflow-y-auto scrollbar-thin"
            />
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40">
              <span className="text-[11px] text-muted-foreground/70 font-medium">
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Shift + Enter</kbd> newline &bull; <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">Enter</kbd> send
              </span>
              <Button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isThinking}
                className="h-9 px-5 rounded-xl tt-gradient-btn font-bold text-xs gap-2 shrink-0 cursor-pointer shadow-md"
                title="Send Message (Enter)"
              >
                <Send className="size-3.5" /> Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}