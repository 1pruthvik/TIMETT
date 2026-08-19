"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function GenerationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/timetable");
  }, [router]);

  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingState text="Redirecting to Timetable Studio..." />
      </div>
    </AppShell>
  );
}