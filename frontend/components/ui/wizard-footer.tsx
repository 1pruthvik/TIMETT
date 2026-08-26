"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardFooterProps {
  currentStep?: number;
  totalSteps?: number;
  prevHref?: string;
  nextHref?: string;
  nextLabel?: string;
  onNext?: () => void;
  onGenerate?: () => Promise<void>;
  generating?: boolean;
}

const SCROLL_THRESHOLD = 480; // Required deliberate scroll offset

export function WizardFooter({
  prevHref,
  nextHref,
  nextLabel = "Next",
  onNext,
  onGenerate,
  generating = false,
}: WizardFooterProps) {
  const router = useRouter();
  const navigationLockRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [topProgress, setTopProgress] = useState(0);
  const [bottomProgress, setBottomProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let topDelta = 0;
    let bottomDelta = 0;
    let resetTimer: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      if (navigationLockRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      const isAtBottom = windowHeight + scrollTop >= scrollHeight - 40;
      const isAtTop = scrollTop <= 15;

      // ── Overscroll Bottom (Scroll Down further past end of page) ──
      if (isAtBottom && e.deltaY > 0 && (nextHref || onGenerate || onNext)) {
        bottomDelta += e.deltaY;
        const progress = Math.min(1, bottomDelta / SCROLL_THRESHOLD);
        setBottomProgress(progress);

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          bottomDelta = 0;
          setBottomProgress(0);
        }, 450);

        if (progress >= 1) {
          navigationLockRef.current = true;
          setBottomProgress(1);
          if (onGenerate) {
            onGenerate();
          } else if (nextHref) {
            router.push(nextHref);
          } else if (onNext) {
            onNext();
          }
        }
      }
      // ── Overscroll Top (Scroll Up further beyond start of page) ──
      else if (isAtTop && e.deltaY < 0 && prevHref) {
        topDelta += Math.abs(e.deltaY);
        const progress = Math.min(1, topDelta / SCROLL_THRESHOLD);
        setTopProgress(progress);

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          topDelta = 0;
          setTopProgress(0);
        }, 450);

        if (progress >= 1) {
          navigationLockRef.current = true;
          setTopProgress(1);
          router.push(prevHref);
        }
      } else {
        // Natural scrolling within page body: reset indicators
        if (topDelta > 0 || bottomDelta > 0) {
          topDelta = 0;
          bottomDelta = 0;
          setTopProgress(0);
          setBottomProgress(0);
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(resetTimer);
    };
  }, [prevHref, nextHref, onGenerate, onNext, router]);

  return (
    <>
      {/* ── Overscroll Indicators Portaled directly to document.body ── */}
      {mounted &&
        createPortal(
          <>
            {/* Top Display Screen Edge (ChevronUp) */}
            {prevHref && (
              <div
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none transition-all duration-100 ease-out"
                style={{
                  opacity: topProgress > 0.03 ? topProgress : 0,
                  transform: `translate(-50%, ${40 - topProgress * 40}px)`,
                }}
              >
                <ChevronUp className="size-11 text-[#38BDF8] stroke-[3] drop-shadow-[0_0_18px_rgba(56,189,248,1)]" />
              </div>
            )}

            {/* Bottom Display Screen Edge (ChevronDown) */}
            {(nextHref || onGenerate || onNext) && (
              <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none transition-all duration-100 ease-out"
                style={{
                  opacity: bottomProgress > 0.03 ? bottomProgress : 0,
                  transform: `translate(-50%, ${-40 + bottomProgress * 40}px)`,
                }}
              >
                <ChevronDown className="size-11 text-[#38BDF8] stroke-[3] drop-shadow-[0_0_18px_rgba(56,189,248,1)]" />
              </div>
            )}
          </>,
          document.body
        )}

      {/* ── Standard Bottom Page Navigation Buttons ── */}
      <div className="w-full flex items-center justify-center gap-4 pt-12 pb-16">
        {prevHref && (
          <Link href={prevHref}>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-8 text-sm font-semibold text-white cursor-pointer gap-2 transition-all hover:scale-105"
            >
              <ArrowLeft className="size-4" />
              Previous
            </Button>
          </Link>
        )}

        {onGenerate ? (
          <Button
            onClick={onGenerate}
            disabled={generating}
            className="tt-gradient-btn h-12 rounded-2xl px-10 text-sm font-bold gap-2 cursor-pointer shadow-xl hover:scale-105 transition-all disabled:opacity-75"
          >
            {generating ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Generating Timetable...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        ) : nextHref ? (
          <Link href={nextHref}>
            <Button
              onClick={onNext}
              className="tt-gradient-btn h-12 rounded-2xl px-10 text-sm font-bold gap-2 cursor-pointer shadow-xl hover:scale-105 transition-all"
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onNext}
            className="tt-gradient-btn h-12 rounded-2xl px-10 text-sm font-bold gap-2 cursor-pointer shadow-xl hover:scale-105 transition-all"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </>
  );
}
