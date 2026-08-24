"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Box,
  Building2,
  CalendarDays,
  CalendarRange,
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
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";
import { TechBackground } from "@/components/ui/tech-background";
import { TimettLogo } from "@/components/ui/timett-logo";
import { cn } from "@/lib/utils";

const navigation = [
  ["Dashboard", "/dashboard", Home],
  ["Timetable", "/timetable", CalendarDays],
  ["Resources", "/academic-terms", Box],
  ["Kaci", "/constraints", Sparkles],
  ["Versions", "/versions", Layers3],
] as const;

const resourcePaths = [
  "/academic-terms",
  "/departments",
  "/rooms",
  "/subjects",
  "/faculty",
  "/time-slots",
];

const RESOURCE_SUB_NAV = [
  { label: "Academic Terms", href: "/academic-terms", icon: CalendarRange },
  { label: "Departments", href: "/departments", icon: Building2 },
  { label: "Rooms & Labs", href: "/rooms", icon: DoorOpen },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Faculty", href: "/faculty", icon: Users },
  { label: "Time Slots", href: "/time-slots", icon: Clock },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Timetable Solution Ready",
    desc: "OR-Tools CP-SAT discrete solver ready for compilation.",
    time: "Just now",
    unread: true,
  },
  {
    id: 2,
    title: "Room Persistence Synchronized",
    desc: "Section allocated rooms mapped to level-based inventory.",
    time: "10 mins ago",
    unread: true,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [initials, setInitials] = useState("U");
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("admin@timett.io");

  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [profileOpen, setProfileOpen] = useState(false);

  // Click Outside Refs
  const resRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isResourcePage = resourcePaths.some((p) => pathname.startsWith(p));
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) {
          setUserName(parsed.name);
          const parts = parsed.name.trim().split(" ");
          setInitials(
            parts.length > 1
              ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
              : parts[0][0].toUpperCase()
          );
        }
        if (parsed.email) setUserEmail(parsed.email);
      }
    } catch {}

    const handleClickOutside = (event: MouseEvent) => {
      if (resRef.current && !resRef.current.contains(event.target as Node)) {
        setResDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCommand = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-foreground transition-colors duration-300">
      {/* Deep Space Ambient Chromatic Glow */}
      <TechBackground />

      {/* ── Frosted Glass Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/50 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex h-[58px] items-center gap-3.5 px-5 lg:px-8">
          {/* Logo (Geometric 3D Cyan-Blue Ribbon T) */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 shrink-0 group py-1"
          >
            <TimettLogo className="size-8 drop-shadow-[0_0_12px_rgba(0,112,243,0.7)] group-hover:scale-105 transition-transform" />
            <span className="font-heading text-base font-black tracking-tight text-white">
              TIMETT
            </span>
          </Link>

          <div className="h-4 w-px bg-white/[0.1] hidden lg:block mx-1.5" />

          {/* ── Horizontal Navigation Tabs (Beside Logo) ── */}
          <nav
            className="hidden lg:flex items-center gap-1 overflow-x-auto"
            aria-label="Primary navigation"
          >
            {navigation.map(([label, href, Icon]) => {
              const active =
                pathname === href ||
                (label === "Dashboard" && pathname === "/dashboard") ||
                (label === "Resources" && isResourcePage);

              if (label === "Resources") {
                return (
                  <div
                    key={label}
                    className="relative"
                    ref={resRef}
                    onMouseEnter={() => setResDropdownOpen(true)}
                    onMouseLeave={() => setResDropdownOpen(false)}
                  >
                    <button
                      onClick={() => {
                        setResDropdownOpen((v) => !v);
                        if (!isResourcePage) router.push("/academic-terms");
                      }}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer rounded-xl",
                        active
                          ? "text-white bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.1]"
                          : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      Resources
                      <ChevronDown className={cn("size-3 text-white/50 transition-transform duration-200", resDropdownOpen ? "rotate-180" : "")} />
                      {active && (
                        <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#0052FF] via-[#0070F3] to-[#38BDF8] shadow-[0_0_12px_#0070F3]" />
                      )}
                    </button>

                    {resDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-60 rounded-2xl border border-white/[0.1] bg-[#0A0A12]/95 backdrop-blur-2xl p-1.5 shadow-[0_16px_50px_rgba(0,0,0,0.9)] z-50 tt-animate-pop">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Resource Modules
                        </div>
                        {RESOURCE_SUB_NAV.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setResDropdownOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                              pathname === sub.href
                                ? "bg-[#0070F3]/20 text-[#38BDF8] font-bold border border-[#0070F3]/30"
                                : "hover:bg-white/[0.08] text-white/90 hover:text-white"
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
                    "relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap rounded-xl",
                    active
                      ? "text-white bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.1]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {label}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#0052FF] via-[#0070F3] to-[#38BDF8] shadow-[0_0_12px_#0070F3]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-white/70 hover:text-white transition-all cursor-pointer shadow-xs"
            onClick={openCommand}
            aria-label="Search"
          >
            <Search className="size-[17px]" />
          </Button>

          {/* ── Notifications Popover ── */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-white/70 hover:text-white transition-all cursor-pointer shadow-xs"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
            >
              <Bell className="size-[17px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#0070F3] shadow-[0_0_8px_#0070F3] animate-pulse" />
              )}
            </Button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/[0.1] bg-[#0A0A12]/95 backdrop-blur-2xl p-3 shadow-[0_16px_50px_rgba(0,0,0,0.9)] z-50 tt-animate-pop">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2 px-1">
                  <span className="text-xs font-bold text-white">
                    Notifications ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-[#38BDF8] hover:underline cursor-pointer"
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
                          ? "border-[#0070F3]/40 bg-[#0070F3]/10"
                          : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white">
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
              className="rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0070F3]/60 p-0.5"
            >
              <Avatar className="size-8.5 border border-white/[0.15] shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-transform hover:scale-105">
                <AvatarFallback className="bg-gradient-to-br from-[#0052FF] via-[#0070F3] to-[#0A1B4F] text-[11px] font-black text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.1] bg-[#0A0A12]/95 backdrop-blur-2xl p-2 shadow-[0_16px_50px_rgba(0,0,0,0.9)] z-50 tt-animate-pop">
                <div className="flex items-center gap-3 p-2.5 border-b border-white/[0.08] mb-1">
                  <Avatar className="size-10 border border-[#0070F3]/50 shadow-[0_0_15px_rgba(0,112,243,0.4)]">
                    <AvatarFallback className="bg-gradient-to-br from-[#0052FF] to-[#0A1B4F] text-sm font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {userEmail}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#38BDF8]">
                      CSE Department
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-white/[0.08] transition-colors text-white/90"
                  >
                    <User className="size-4 text-muted-foreground" />
                    Account Settings
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-white/[0.08] transition-colors text-white/90"
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    System Preferences
                  </Link>

                  <Link
                    href="/departments"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-white/[0.08] transition-colors text-white/90"
                  >
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    Departments & Roles
                  </Link>
                </div>

                <div className="border-t border-white/[0.08] mt-1 pt-1">
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

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden ml-1 text-muted-foreground hover:text-white cursor-pointer"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* ── Sub-Navigation Bar for Resource Pages ── */}
        {isResourcePage && (
          <div className="border-t border-white/[0.06] bg-black/40 backdrop-blur-xl px-5 lg:px-8 py-2.5 overflow-x-auto shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-2 max-w-7xl mx-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mr-1.5 select-none">
                MANAGE:
              </span>
              {RESOURCE_SUB_NAV.map((sub) => {
                const isSubActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs transition-all whitespace-nowrap",
                      isSubActive
                        ? "bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#00A3FF] text-white shadow-[0_0_20px_rgba(0,102,255,0.6)] border border-white/30 font-bold scale-[1.03]"
                        : "bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.18] text-white/70 hover:text-white font-medium shadow-xs"
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
        <nav className="fixed inset-x-3 top-[60px] z-50 rounded-2xl border border-white/[0.12] bg-[#0A0A12]/95 backdrop-blur-2xl p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] lg:hidden">
          {navigation.map(([label, href, Icon]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/[0.08] transition-colors text-white"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-white/[0.08] pt-2 mt-2 space-y-1">
            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Resource Modules
            </p>
            {RESOURCE_SUB_NAV.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2 text-xs font-medium hover:bg-white/[0.08] transition-colors text-white/90"
              >
                <sub.icon className="size-3.5 text-[#0070F3]" />
                {sub.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Main Page Content */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Command Palette & AI Assistant */}
      <CommandPalette />
      <FloatingAiChat />
    </div>
  );
}