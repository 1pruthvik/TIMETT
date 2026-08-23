"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body className="m-0 bg-[#050507] text-zinc-100"><main className="grid min-h-screen place-items-center p-6"><section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">TIMETT</p><h1 className="mt-3 text-2xl font-semibold">Your workspace hit a snag.</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Nothing has been changed. Try loading the workspace again.</p><button onClick={reset} className="mt-6 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white">Try again</button></section></main></body></html>;
}
