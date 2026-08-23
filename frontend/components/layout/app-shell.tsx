"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  DoorOpen,
  Home,
  Layers,
  Layers3,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/theme/theme-provider";
import { WorkspaceBoot } from "@/components/feedback/workspace-boot";
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";
import { cn } from "@/lib/utils";

const navigation = [
  ["Overview", "/dashboard", Home],
  ["Schedule", "/timetable", CalendarDays],
  ["Generate", "/generations", Zap],
  ["Resources", "/faculty", Box],
  ["Constraints", "/constraints", SlidersHorizontal],
  ["Versions", "/versions", Layers3],
] as const;

const resourcePaths = [
  "/faculty",
  "/subjects",
  "/sections",
  "/rooms",
  "/departments",
  "/time-slots",
  "/offerings",
];

const RESOURCE_SUB_NAV = [
  { label: "Faculty", href: "/faculty", icon: Users },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Sections", href: "/sections", icon: Users },
  { label: "Rooms & Labs", href: "/rooms", icon: DoorOpen },
  { label: "Time Slots", href: "/time-slots", icon: Clock },
  { label: "Offerings & Curriculum", href: "/offerings", icon: Layers },
];

const DEPARTMENTS = [
  { id: "cse", name: "CSE Department", code: "CSE" },
  { id: "aiml", name: "AI & ML Department", code: "AIML" },
  { id: "ece", name: "ECE Department", code: "ECE" },
  { id: "ise", name: "ISE Department", code: "ISE" },
  { id: "eee", name: "EEE Department", code: "EEE" },
];

const TERMS = [
  { id: "2026-27-sem1", label: "2026-27 · Semester I" },
  { id: "2026-27-sem2", label: "2026-27 · Semester II" },
  { id: "2025-26-sem1", label: "2025-26 · Semester I" },
  { id: "2025-26-sem2", label: "2025-26 · Semester II" },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Timetable Solution Generated",
    desc: "OR-Tools CP-SAT generated 20 conflict-free entries for Section E.",
    time: "Just now",
    type: "success",
    unread: true,
  },
  {
    id: 2,
    title: "Faculty Constraints Saved",
    desc: "Updated faculty availability for Semester I.",
    time: "10 mins ago",
    type: "info",
    unread: true,
  },
  {
    id: 3,
    title: "Room Capacity Verified",
    desc: "Room LH-101 capacity matches 60 students.",
    time: "1 hour ago",
    type: "info",
    unread: false,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [initials, setInitials] = useState("M");
  const [userName, setUserName] = useState("Main Admin");
  const [userEmail, setUserEmail] = useState("admin@cse.edu");

  // Dropdown States
  const [deptOpen, setDeptOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);

  const [termOpen, setTermOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [profileOpen, setProfileOpen] = useState(false);
  const [resDropdownOpen, setResDropdownOpen] = useState(false);

  // Click Outside Handler
  const deptRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const resRef = useRef<HTMLDivElement>(null);

  const isResourcePage = resourcePaths.includes(pathname);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) {
          setUserName(u.name);
          setInitials(
            u.name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          );
        }
        if (u.email) setUserEmail(u.email);
      }

      // Load selected dept & term
      const savedDeptId = localStorage.getItem("timett_dept");
      if (savedDeptId) {
        const found = DEPARTMENTS.find((d) => d.id === savedDeptId);
        if (found) setSelectedDept(found);
      }

      const savedTermId = localStorage.getItem("timett_term");
      if (savedTermId) {
        const found = TERMS.find((t) => t.id === savedTermId);
        if (found) setSelectedTerm(found);
      }
    } catch {}
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
      if (termRef.current && !termRef.current.contains(e.target as Node)) {
        setTermOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (resRef.current && !resRef.current.contains(e.target as Node)) {
        setResDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCommand = () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      })
    );

  const handleSelectDept = (dept: (typeof DEPARTMENTS)[0]) => {
    setSelectedDept(dept);
    localStorage.setItem("timett_dept", dept.id);
    setDeptOpen(false);
  };

  const handleSelectTerm = (term: (typeof TERMS)[0]) => {
    setSelectedTerm(term);
    localStorage.setItem("timett_term", term.id);
    setTermOpen(false);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <WorkspaceBoot />

      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="flex h-[56px] items-center gap-3 px-5 lg:px-8">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 shrink-0"
          >
            <span className="grid size-8 place-items-center rounded-xl border border-primary/50 bg-primary/10 text-primary">
              <span className="font-heading text-sm font-bold italic">T</span>
            </span>
            <span className="font-heading text-base font-bold tracking-tight">
              TIMETT
            </span>
          </Link>

          <span className="text-muted-foreground/40 select-none">·</span>

          {/* ── Department Selector Dropdown ── */}
          <div className="relative hidden md:block" ref={deptRef}>
            <button
              onClick={() => setDeptOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium hover:bg-card transition-colors cursor-pointer"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {selectedDept.name}
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            {deptOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-border bg-background p-1.5 shadow-2xl z-50 tt-animate-pop">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Department
                </div>
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => handleSelectDept(dept)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span>{dept.name}</span>
                    {selectedDept.id === dept.id && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Academic Term Selector Dropdown ── */}
          <div className="relative hidden xl:block" ref={termRef}>
            <button
              onClick={() => setTermOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium hover:bg-card transition-colors cursor-pointer"
            >
              {selectedTerm.label}
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            {termOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-border bg-background p-1.5 shadow-2xl z-50 tt-animate-pop">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Academic Term
                </div>
                {TERMS.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => handleSelectTerm(term)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span>{term.label}</span>
                    {selectedTerm.id === term.id && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={openCommand}
            aria-label="Search"
          >
            <Search className="size-[18px]" />
          </Button>

          {/* ── Notifications Popover ── */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-primary animate-pulse" />
              )}
            </Button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-background p-3 shadow-2xl z-50 tt-animate-pop">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-2 px-1">
                  <span className="text-xs font-bold text-foreground">
                    Notifications ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        n.unread
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 bg-card/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-foreground">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* ── User Profile Avatar & Dropdown ── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <Avatar className="size-8 border border-primary/40 transition-transform hover:scale-105">
                <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-background p-2 shadow-2xl z-50 tt-animate-pop">
                {/* Profile Header */}
                <div className="flex items-center gap-3 p-2.5 border-b border-border mb-1">
                  <Avatar className="size-10 border border-primary/40">
                    <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {userEmail}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary">
                      {selectedDept.name}
                    </span>
                  </div>
                </div>

                {/* Profile Links */}
                <div className="space-y-0.5">
                  <Link
                    href="/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <User className="size-4 text-muted-foreground" />
                    Account Settings
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    System Preferences
                  </Link>

                  <Link
                    href="/departments"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    Departments & Roles
                  </Link>
                </div>

                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* ── Horizontal Tab Navigation ── */}
        <nav
          className="hidden lg:flex items-center gap-0 px-5 lg:px-8 -mb-px overflow-x-auto"
          aria-label="Primary navigation"
        >
          {navigation.map(([label, href, Icon]) => {
            const active =
              pathname === href ||
              (label === "Overview" && pathname === "/dashboard") ||
              (label === "Resources" && isResourcePage);

            if (label === "Resources") {
              return (
                <div key={label} className="relative" ref={resRef}>
                  <button
                    onClick={() => setResDropdownOpen((v) => !v)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Resources
                    <ChevronDown className="size-3 text-muted-foreground" />
                    {active && (
                      <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-primary" />
                    )}
                  </button>

                  {resDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-56 rounded-2xl border border-border bg-background p-1.5 shadow-2xl z-50 tt-animate-pop">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Resource Modules
                      </div>
                      {RESOURCE_SUB_NAV.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setResDropdownOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                            pathname === sub.href
                              ? "bg-primary/10 text-primary font-bold"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <sub.icon className="size-3.5" />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Sub-Navigation Bar for Resource Pages ── */}
        {isResourcePage && (
          <div className="border-t border-border/50 bg-card/40 px-5 lg:px-8 py-2 overflow-x-auto">
            <div className="flex items-center gap-1 max-w-7xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-2">
                Manage:
              </span>
              {RESOURCE_SUB_NAV.map((sub) => {
                const isSubActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                      isSubActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-card"
                    )}
                  >
                    <sub.icon className="size-3.5" />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <nav className="fixed inset-x-3 top-[60px] z-50 rounded-2xl border border-border bg-background p-2 shadow-2xl lg:hidden">
          {navigation.map(([label, href, Icon]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-muted transition-colors"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-border pt-2 mt-2 space-y-1">
            <p className="px-4 text-[10px] font-bold uppercase text-muted-foreground">
              Resource Modules
            </p>
            {RESOURCE_SUB_NAV.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2 text-xs hover:bg-muted transition-colors"
              >
                <sub.icon className="size-3.5 text-primary" />
                {sub.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <main className="relative min-h-[calc(100vh-100px)] px-5 py-8 lg:px-9">
        {children}
      </main>

      <CommandPalette />
      <FloatingAiChat />
    </div>
  );
}
