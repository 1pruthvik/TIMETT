"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Calendar, ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearScrollPickerProps {
  value: string;
  onChange: (year: string) => void;
}

// Comprehensive range of academic years
const ACADEMIC_YEARS = Array.from({ length: 16 }, (_, i) => {
  const start = 2021 + i;
  return `${start} - ${start + 1}`;
});

const ITEM_HEIGHT = 44; // Height of each year item in px
const CONTAINER_HEIGHT = 220; // Height of drum container in px
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 88px so 1st and last item center exactly

export function YearScrollPicker({ value, onChange }: YearScrollPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeIndex = ACADEMIC_YEARS.indexOf(value) !== -1 
    ? ACADEMIC_YEARS.indexOf(value) 
    : ACADEMIC_YEARS.indexOf("2026 - 2027");

  // Scroll drum list so target index is centered in the selection window
  const scrollToIndex = useCallback((index: number, smooth = true) => {
    if (!scrollRef.current) return;
    const targetScrollTop = index * ITEM_HEIGHT;
    isProgrammaticScrollRef.current = true;
    scrollRef.current.scrollTo({
      top: targetScrollTop,
      behavior: smooth ? "smooth" : "auto",
    });
    setScrollTop(targetScrollTop);

    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 300);
  }, []);

  // Sync scroll position when popover opens or value changes externally
  useEffect(() => {
    if (isOpen && activeIndex !== -1) {
      // Small timeout to allow DOM layout
      setTimeout(() => {
        scrollToIndex(activeIndex, false);
      }, 30);
    }
  }, [isOpen, activeIndex, scrollToIndex]);

  // Handle user scrolling through the drum
  const handleDrumScroll = () => {
    if (!scrollRef.current) return;
    const currentScroll = scrollRef.current.scrollTop;
    setScrollTop(currentScroll);

    if (isProgrammaticScrollRef.current) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const nearestIndex = Math.max(
        0,
        Math.min(ACADEMIC_YEARS.length - 1, Math.round(currentScroll / ITEM_HEIGHT))
      );
      if (ACADEMIC_YEARS[nearestIndex] && ACADEMIC_YEARS[nearestIndex] !== value) {
        onChange(ACADEMIC_YEARS[nearestIndex]);
      }
    }, 150);
  };

  // Step up / down functions
  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      const newYear = ACADEMIC_YEARS[activeIndex - 1];
      onChange(newYear);
      if (isOpen) scrollToIndex(activeIndex - 1, true);
    }
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < ACADEMIC_YEARS.length - 1) {
      const newYear = ACADEMIC_YEARS[activeIndex + 1];
      onChange(newYear);
      if (isOpen) scrollToIndex(activeIndex + 1, true);
    }
  };

  // Intercept wheel on the trigger box to roll years without triggering page overscroll
  const handleTriggerWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY > 0) {
      if (activeIndex < ACADEMIC_YEARS.length - 1) {
        onChange(ACADEMIC_YEARS[activeIndex + 1]);
      }
    } else if (e.deltaY < 0) {
      if (activeIndex > 0) {
        onChange(ACADEMIC_YEARS[activeIndex - 1]);
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
      {/* Interactive Year Box Trigger */}
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
            {value || "2026 - 2027"}
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

      {/* 3D Fixed-Center Selection Reel Drum Picker */}
      {isOpen && (
        <div
          data-no-wizard-scroll="true"
          onWheel={(e) => e.stopPropagation()}
          className="absolute left-0 top-[calc(100%+8px)] w-full z-50 rounded-2xl bg-[#0a0a0f]/95 dark:bg-[#08080c]/98 backdrop-blur-3xl border border-primary/35 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-2 tt-animate-pop overflow-hidden"
          style={{ height: `${CONTAINER_HEIGHT + 16}px` }}
        >
          {/* Top Fade Mask */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#0a0a0f] dark:from-[#08080c] via-[#0a0a0f]/75 to-transparent pointer-events-none z-20" />

          {/* FIXED Center Selection Window Highlight Frame */}
          <div
            className="absolute left-2 right-2 rounded-xl bg-primary/20 border-2 border-primary shadow-[0_0_20px_rgba(0,102,255,0.45)] pointer-events-none z-10"
            style={{
              top: `${PADDING_Y + 8}px`,
              height: `${ITEM_HEIGHT}px`,
            }}
          />

          {/* Scrollable Year Drum Reel */}
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
              // Calculate distance of this item's center from the drum's visual center
              const itemCenter = idx * ITEM_HEIGHT + ITEM_HEIGHT / 2;
              const drumCenter = scrollTop + PADDING_Y + ITEM_HEIGHT / 2 - PADDING_Y; // equals scrollTop + ITEM_HEIGHT / 2
              const diff = itemCenter - (scrollTop + ITEM_HEIGHT / 2);
              const distance = Math.abs(diff);

              const isCentered = distance < ITEM_HEIGHT / 2;
              const rotation = Math.max(-45, Math.min(45, (diff / PADDING_Y) * 35));
              const scale = Math.max(0.8, 1 - (distance / CONTAINER_HEIGHT) * 0.4);
              const opacity = Math.max(0.2, 1 - (distance / (CONTAINER_HEIGHT / 1.5)));

              return (
                <div
                  key={yr}
                  onClick={() => {
                    onChange(yr);
                    scrollToIndex(idx, true);
                  }}
                  className={cn(
                    "snap-center flex items-center justify-between px-4 transition-all duration-150 cursor-pointer font-mono",
                    isCentered
                      ? "text-primary-foreground font-extrabold text-base drop-shadow-[0_0_12px_rgba(0,102,255,0.8)]"
                      : "text-muted-foreground/60 font-semibold text-sm hover:text-foreground"
                  )}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    transform: `perspective(400px) rotateX(${rotation}deg) scale(${scale})`,
                    opacity: opacity,
                  }}
                >
                  <span className="tracking-wider">{yr}</span>
                  {isCentered && (
                    <Check className="h-4 w-4 text-primary stroke-[3]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Fade Mask */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0a0a0f] dark:from-[#08080c] via-[#0a0a0f]/75 to-transparent pointer-events-none z-20" />
        </div>
      )}
    </div>
  );
}
