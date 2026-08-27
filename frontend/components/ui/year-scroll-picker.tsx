"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { Calendar, ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearScrollPickerProps {
  value: string;
  onChange: (year: string) => void;
}

// Range of academic years
const ACADEMIC_YEARS = Array.from({ length: 16 }, (_, i) => {
  const start = 2021 + i;
  return `${start} - ${start + 1}`;
});

const ITEM_HEIGHT = 44; // Exact height of each item in px
const CONTAINER_HEIGHT = 220; // Height of drum viewport in px
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 88px so top & bottom items can center

export function YearScrollPicker({ value, onChange }: YearScrollPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(value || "2026 - 2027");

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state with prop
  useEffect(() => {
    if (value) setSelectedYear(value);
  }, [value]);

  const activeIndex = ACADEMIC_YEARS.indexOf(selectedYear) !== -1 
    ? ACADEMIC_YEARS.indexOf(selectedYear) 
    : ACADEMIC_YEARS.indexOf("2026 - 2027");

  // Immediate positioning to avoid starting from the first year
  const setInitialScroll = useCallback(() => {
    if (scrollRef.current && activeIndex !== -1) {
      scrollRef.current.scrollTop = activeIndex * ITEM_HEIGHT;
    }
  }, [activeIndex]);

  // Position drum immediately when opened
  useLayoutEffect(() => {
    if (isOpen) {
      setInitialScroll();
      // Double check in next frame in case DOM needed layout measurement
      requestAnimationFrame(() => {
        setInitialScroll();
      });
    }
  }, [isOpen, setInitialScroll]);

  // Scroll smoothly to a specific year index
  const scrollToIndex = (index: number, smooth = true) => {
    if (!scrollRef.current) return;
    isScrollingRef.current = true;
    scrollRef.current.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "auto",
    });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 250);
  };

  // Handle scroll without thrashing state on every pixel
  const handleDrumScroll = () => {
    if (!scrollRef.current) return;

    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);

    scrollEndTimerRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const currentScroll = scrollRef.current.scrollTop;
      const nearestIndex = Math.max(
        0,
        Math.min(ACADEMIC_YEARS.length - 1, Math.round(currentScroll / ITEM_HEIGHT))
      );
      const newYear = ACADEMIC_YEARS[nearestIndex];
      if (newYear && newYear !== selectedYear) {
        setSelectedYear(newYear);
        onChange(newYear);
      }
    }, 80);
  };

  // Step up / down steppers
  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      const newYear = ACADEMIC_YEARS[activeIndex - 1];
      setSelectedYear(newYear);
      onChange(newYear);
      if (isOpen) scrollToIndex(activeIndex - 1, true);
    }
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < ACADEMIC_YEARS.length - 1) {
      const newYear = ACADEMIC_YEARS[activeIndex + 1];
      setSelectedYear(newYear);
      onChange(newYear);
      if (isOpen) scrollToIndex(activeIndex + 1, true);
    }
  };

  // Direct wheel scrolling on trigger box
  const handleTriggerWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY > 0) {
      if (activeIndex < ACADEMIC_YEARS.length - 1) {
        const newYear = ACADEMIC_YEARS[activeIndex + 1];
        setSelectedYear(newYear);
        onChange(newYear);
      }
    } else if (e.deltaY < 0) {
      if (activeIndex > 0) {
        const newYear = ACADEMIC_YEARS[activeIndex - 1];
        setSelectedYear(newYear);
        onChange(newYear);
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

  return (
    <div
      className="relative w-full"
      ref={containerRef}
      data-no-wizard-scroll="true"
      data-year-picker="true"
    >
      {/* Interactive Trigger Box */}
      <div
        onWheel={handleTriggerWheel}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 px-4 rounded-xl border bg-background/80 flex items-center justify-between transition-all cursor-pointer select-none group",
          isOpen
            ? "border-primary ring-2 ring-primary/40 shadow-[0_0_18px_rgba(0,102,255,0.25)]"
            : "border-border hover:border-primary/50 hover:bg-card/90"
        )}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-primary shrink-0 transition-transform group-hover:scale-110" />
          <span className="text-base font-extrabold font-mono tracking-tight text-foreground">
            {selectedYear}
          </span>
        </div>

        {/* Steppers */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={activeIndex <= 0}
            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition disabled:opacity-30 cursor-pointer"
            title="Previous Year"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            disabled={activeIndex >= ACADEMIC_YEARS.length - 1}
            className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition disabled:opacity-30 cursor-pointer"
            title="Next Year"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3D Drum Roller Popover */}
      {isOpen && (
        <div
          data-no-wizard-scroll="true"
          onWheel={(e) => e.stopPropagation()}
          className="absolute left-0 top-[calc(100%+8px)] w-full z-50 rounded-2xl bg-[#09090e]/98 dark:bg-[#07070b]/98 backdrop-blur-3xl border border-primary/40 shadow-[0_24px_60px_rgba(0,0,0,0.9)] p-2 tt-animate-pop overflow-hidden"
          style={{ height: `${CONTAINER_HEIGHT + 16}px` }}
        >
          {/* Top Fade Gradient Mask */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#09090e] dark:from-[#07070b] via-[#09090e]/80 to-transparent pointer-events-none z-20" />

          {/* FIXED Center Selection Window Highlight Frame */}
          <div
            className="absolute left-2 right-2 rounded-xl bg-primary/25 border-2 border-primary shadow-[0_0_24px_rgba(0,102,255,0.5)] pointer-events-none z-10"
            style={{
              top: `${PADDING_Y + 8}px`,
              height: `${ITEM_HEIGHT}px`,
            }}
          />

          {/* Scrollable Year Drum */}
          <div
            ref={scrollRef}
            onScroll={handleDrumScroll}
            className="h-full overflow-y-auto scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
            style={{
              paddingTop: `${PADDING_Y}px`,
              paddingBottom: `${PADDING_Y}px`,
            }}
          >
            {ACADEMIC_YEARS.map((yr, idx) => {
              const isSelected = yr === selectedYear;

              return (
                <div
                  key={yr}
                  onClick={() => {
                    setSelectedYear(yr);
                    onChange(yr);
                    scrollToIndex(idx, true);
                  }}
                  className={cn(
                    "snap-center flex items-center justify-between px-4 cursor-pointer font-mono transition-colors duration-150",
                    isSelected
                      ? "text-white font-black text-base drop-shadow-[0_0_12px_rgba(0,102,255,0.9)]"
                      : "text-muted-foreground/60 font-semibold text-sm hover:text-foreground hover:opacity-100"
                  )}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                  }}
                >
                  <span className="tracking-wider">{yr}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary stroke-[3]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Fade Gradient Mask */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#09090e] dark:from-[#07070b] via-[#09090e]/80 to-transparent pointer-events-none z-20" />
        </div>
      )}
    </div>
  );
}
