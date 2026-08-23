"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export function WorkspaceBoot() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    const key = "timett-workspace-boot-v2";
    if (sessionStorage.getItem(key)) return;
    setVisible(true);
    setProgress(0);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const duration = reduceMotion ? 250 : 4800;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(100, Math.round(((now - started) / duration) * 100));
      setProgress(next);
      if (next < 100) frame = requestAnimationFrame(tick);
      else {
        sessionStorage.setItem(key, "shown");
        window.setTimeout(() => setVisible(false), reduceMotion ? 80 : 650);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!visible) return null;
  return <div className="tt-boot fixed inset-0 z-[100] grid place-items-center bg-[#f8f5f0] text-[#171a22] dark:bg-[#090c12] dark:text-white" role="status" aria-live="polite">
    <div className="tt-boot-grid absolute inset-0 opacity-80 dark:opacity-60" />
    <div className="relative w-[min(88vw,500px)]">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500 dark:text-slate-400"><span>TIMETT / Secure Workspace</span><span>0x{progress.toString(16).padStart(2, "0")}</span></div>
      <div className="mt-8 flex items-center gap-5"><div className="tt-boot-mark grid size-16 place-items-center rounded-2xl border border-[#c84b57]/50 bg-[#c84b57]/10"><ShieldCheck className="size-7 text-[#b93740] dark:text-[#ef9aa3]" /></div><div><p className="font-serif text-3xl font-medium tracking-tight">Preparing your workspace</p><p className="mt-1 text-sm text-slate-500">Loading your academic scheduling environment.</p></div></div>
      <div className="mt-10 h-px overflow-hidden bg-white/10"><div className="h-full bg-gradient-to-r from-[#7f1d2d] via-[#d95b66] to-[#f0b767] transition-[width] duration-100" style={{ width: `${progress}%` }} /></div>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[.16em] text-slate-500"><span>{progress < 35 ? "Initializing environment" : progress < 75 ? "Synchronizing scheduling data" : "Workspace ready"}</span><span>{progress}%</span></div>
      <button onClick={() => { sessionStorage.setItem("timett-workspace-boot-v2", "shown"); setVisible(false); }} className="mt-9 text-xs text-slate-500 transition hover:text-[#a52e37] dark:hover:text-white">Skip introduction</button>
    </div>
  </div>;
}
