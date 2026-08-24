"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers3, Plus, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function VersionsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const versions = [
    {
      id: "v1.0",
      timetable: "CSE Semester 1 — Final Production",
      status: "Active Production",
      updated: "Just now",
      conflicts: 0,
      active: true,
    },
    {
      id: "v0.9-draft",
      timetable: "CSE Semester 1 — Faculty Review Draft",
      status: "Archived Draft",
      updated: "2 days ago",
      conflicts: 0,
      active: false,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Timetable Version Control"
          icon={Layers3}
        >
          <Link href="/timetable">
            <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
              <Plus className="size-4" />
              Snapshot New Version
            </Button>
          </Link>
        </PageHeader>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Saved Version History</h3>
              <p className="text-xs text-muted-foreground">Snapshot revisions recorded for current academic year</p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-bold text-muted-foreground">Version Tag</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Schedule Context</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Deployment Status</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">Last Updated</TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((ver) => (
                    <TableRow key={ver.id} className="border-border hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <span className="inline-flex items-center rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                          {ver.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-foreground text-sm">
                        {ver.timetable}
                      </TableCell>
                      <TableCell>
                        {ver.active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            {ver.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            <Clock className="size-3.5" />
                            {ver.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {ver.updated}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href="/timetable">
                          <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold hover:text-primary">
                            View Grid <ArrowUpRight className="size-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}