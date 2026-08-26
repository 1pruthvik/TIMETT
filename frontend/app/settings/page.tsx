"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=settings");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black text-muted-foreground text-sm">
      Redirecting to Settings...
    </div>
  );
}