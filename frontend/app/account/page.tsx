"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Shield, LogOut, CheckCircle2, Building, Sparkles } from "lucide-react";

interface UserProfile {
  id?: number;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 tt-animate-fade">
        <PageHeader
          title="User Account & Security Profile"
          icon={User}
        />

        <GlassPanel glow="indigo" className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2 border-primary/40 shadow-md">
                <AvatarFallback className="text-xl font-extrabold bg-gradient-to-tr from-[#0052FF] via-[#0070F3] to-[#38BDF8] text-white">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{user?.name || "Administrator"}</h3>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Active Session
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email || "admin@institution.edu"}</p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="h-10 rounded-xl gap-2 font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign Out Session
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <User className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{user?.name || "TIMETT Planner"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#0070F3]/10 text-[#0070F3] dark:text-[#38BDF8]">
                <Shield className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Role</p>
                <p className="text-sm font-bold text-foreground mt-0.5 capitalize">{user?.role || "Timetable Administrator"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Building className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department Context</p>
                <p className="text-sm font-bold text-foreground mt-0.5">Computer Science & Engineering</p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
