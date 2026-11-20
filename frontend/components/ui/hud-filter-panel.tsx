"use client";

import { useState, useRef, useEffect } from "react";

const CATEGORIES = [
  { label: "WEBSITES", count: 12 },
  { label: "INSTALLATIONS", count: 8 },
  { label: "XR / VR / AI", count: 6 },
  { label: "MULTIPLAYER", count: 4 },
  { label: "GAMES", count: 10 },
];

export function HudFilterPanel() {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="fixed bottom-6 left-6 z-40 pointer-events-auto max-w-[320px]"
      aria-label="Filter and search panel"
    >
      <div className="at-glass p-5">
        {/* Category Label */}
        <p className="at-eyebrow mb-4">
          WHAT ARE YOU LOOKING FOR?
        </p>

        {/* Category List */}
        <ul className="space-y-1 mb-5" role="list" aria-label="Project categories">
          {CATEGORIES.map((cat) => (
            <li key={cat.label}>
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-left text-[11px] font-medium tracking-wider uppercase text-white/50 hover:text-white transition-colors duration-200 rounded-xl hover:bg-white/[0.03]"
                aria-label={`${cat.label} - ${cat.count} projects`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full bg-gradient-to-br from-[#7c4dff] to-[#00bcd4] opacity-60"
                    aria-hidden="true"
                  />
                  <span className="font-mono">{cat.label}</span>
                </span>
                <span className="text-[10px] font-mono text-white/25 tabular-nums">
                  {cat.count}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Search Input */}
        <div className="relative">
          <label htmlFor="hud-search" className="sr-only">
            Search projects
          </label>
          <input
            ref={inputRef}
            id="hud-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="ASK ME ANYTHING..."
            className={`
              w-full bg-white/[0.02] backdrop-blur-xl border rounded-xl px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-white placeholder:text-white/30 outline-none transition-all duration-300
              border-white/[0.06]
              ${isInputFocused
                ? "border-[#7c4dff]/40 shadow-[0_0_0_1px_rgba(124,77,255,0.25),0_0_30px_rgba(124,77,255,0.1)] placeholder:text-transparent"
                : ""
              }
            `}
            autoComplete="off"
            spellCheck={false}
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/25 pointer-events-none"
            aria-hidden="true"
          >
            ⌘K
          </div>
        </div>
      </div>
    </div>
  );
}