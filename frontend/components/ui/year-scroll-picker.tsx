"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearScrollPickerProps {
  value: string;
  onChange: (year: string) => void;
}

// Generate range of academic years e.g. 2022-2023 ... 2035-2036
const ACADEMIC_YEARS = Array.from({ length: 14 }, (_, i) => {
  const start = 2022 + i;
  return `${start} - ${start + 1}`;
});

export function YearScrollPicker({ value, onChange }: YearScrollPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Default to 2026 - 2027 if value not found
  const currentIndex = ACADEMIC_YEARS.indexOf(value) !== -1 
    ? ACADEMIC_YEARS.indexOf(value) 
    : ACADEMIC_YEARS.indexOf("2026 - 2027");

  // Step up / down functions
  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onChange(ACADEMIC_YEARS[currentIndex - 1]);
    }
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < ACADEMIC_YEARS.length - 1) {
      onChange(ACADEMIC_YEARS[currentIndex + 1]);
    }
  };

  // Direct wheel scrolling on the input box
  const handleBoxWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      if (currentIndex < ACADEMIC_YEARS.length - 1) {
        onChange(ACADEMIC_YEARS[currentIndex + 1]);
      }
    } else if (e.deltaY < 0) {
      if (currentIndex > 0) {
        onChange(ACADEMIC_YEARS[currentIndex - 1]);
      }
    }
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto scroll drum list to center active year when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-year="${value}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [isOpen, value]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Interactive Year Selector Box with Wheel Trigger */}
      <div
        onWheel={handleBoxWheel}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 px-4 rounded-xl border bg-background/80 flex items-center justify-between transition-all cursor-pointer select-none group",
          isOpen
            ? "border-primary ring-2 ring-primary/40 shadow-[0_0_16px_rgba(0,102,255,0.25)]"
            : "border-border hover:border-primary/50 hover:bg-card/90"
        )}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-primary shrink-0 transition-transform group-hover:scale-110" />
          <span className="text-base font-extrabold font-mono tracking-tight text-foreground">
            {value || "2026 - 2027"}
          </span>
        </div>

        {/* Up / Down Mini Roller Steppers */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={currentIndex <= 0}
            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition disabled:opacity-30 cursor-pointer"
            title="Previous Academic Year"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            disabled={currentIndex >= ACADEMIC_YEARS.length - 1}
            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition disabled:opacity-30 cursor-pointer"
            title="Next Academic Year"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3D Drum Roller Wheel Scroll Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] w-full z-50 rounded-2xl bg-card/95 backdrop-blur-2xl border border-primary/30 shadow-[0_16px_50px_rgba(0,0,0,0.6)] p-3 tt-animate-pop overflow-hidden">
          {/* Top Fade Mask */}
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-card to-transparent pointer-events-none z-10" />

          {/* Scrollable Drum Column */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto space-y-1 py-4 scroll-smooth pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {ACADEMIC_YEARS.map((yr, idx) => {
              const isSelected = yr === value;
              const distance = Math.abs(idx - currentIndex);
              
              return (
                <div
                  key={yr}
                  data-year={yr}
                  onClick={() => {
                    onChange(yr);
                    setIsOpen(false);
                  }}
                  style={{
                    transform: isSelected ? "scale(1.04)" : `scale(${Math.max(0.88, 1 - distance * 0.04)})`,
                    opacity: isSelected ? 1 : Math.max(0.35, 1 - distance * 0.2),
                  }}
                  className={cn(
                    "h-11 px-4 rounded-xl flex items-center justify-between text-sm font-mono font-bold transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/40"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span className="tracking-wide">{yr}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary-foreground stroke-[3]" />}
                </div>
              );
            })}
          </div>

          {/* Bottom Fade Mask */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none z-10" />
        </div>
      )}
    </div>
  );
}
