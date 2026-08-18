"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Sliders, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ConstraintsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to Settings where constraints now live
    router.replace("/settings");
  }, [router]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sliders className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Constraints has moved to Settings</h2>
        <p className="text-sm text-muted-foreground">
          Constraint rules and solver optimization preferences are now managed in the unified Settings panel.
        </p>
        <Link href="/settings">
          <Button className="rounded-xl font-semibold gap-2">
            Open Settings <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}