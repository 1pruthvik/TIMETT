"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Clock,
  DoorOpen,
  Layers3,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-provider";
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";
import { TechBackground } from "@/components/ui/tech-background";
import { TimettLogo } from "@/components/ui/timett-logo";
import { cn } from "@/lib/utils";

const RESOURCE_SUB_NAV = [
  { label: "Document Ingestion", href: "/documents", icon: FileText },
  { label: "Academic Terms", href: "/academic-terms", icon: CalendarRange },
  { label: "Departments", href: "/departments", icon: Building2 },
  { label: "Rooms & Labs", href: "/rooms", icon: DoorOpen },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Faculty", href: "/faculty", icon: Users },
  { label: "Time Slots", href: "/time-slots", icon: Clock },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [initials, setInitials] = useState("U");
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("admin@timett.io");

  const [menuOpen, setMenuOpen] = useState(false);
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isResourcePage = [
    "/documents",
    "/academic-terms",
    "/departments",
    "/rooms",
    "/subjects",
    "/faculty",
    "/time-slots",
  ].some((p) => pathname.startsWith(p));

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
      setResDropdownOpen(false);
    }, 350);
  };

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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Deep Space Ambient Chromatic Glow */}
      <TechBackground />

      {/* ── Fixed Header Overlay (Logo on Left, Controls on Right) ── */}
      <header className="fixed top-0 inset-x-0 z-50 w-full px-6 py-4 flex items-center justify-between pointer-events-none">
        {/* Top Left: Logo with Vertical 3D Rotation on hover & Right-Expanding Menu with Blur Shadow */}
        <div
          className="pointer-events-auto relative flex items-center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Link
            href="/dashboard"
            className="flex items-center cursor-pointer p-1"
            title="TIMETT Dashboard"
          >
            <TimettLogo
              className={cn(
                "size-11 drop-shadow-[0_0_16px_rgba(0,112,243,0.8)] transition-transform duration-500 ease-out",
                menuOpen ? "[transform:rotateY(180deg)]" : ""
              )}
            />
          </Link>

          {/* Expanding Navigation Menu (Frosted Glass Neutral Tint Blur Background) */}
          <nav
            className={cn(
              "flex items-center gap-5 ml-4 transition-all duration-300 py-2.5 px-6 rounded-2xl bg-white/80 dark:bg-[#121212]/90 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.8)]",
              menuOpen
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 -translate-x-4 pointer-events-none"
            )}
            aria-label="Expanded navigation"
          >
            {/* Studio Link */}
            <Link
              href="/timetable"
              className={cn(
                "text-xs font-bold tracking-wide uppercase transition-colors whitespace-nowrap",
                pathname === "/timetable"
                  ? "text-[#0070F3] dark:text-[#38BDF8] font-extrabold"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              Studio
            </Link>

            {/* Resources with Hover Dropdown */}
            <div
              className="relative py-1"
              onMouseEnter={() => setResDropdownOpen(true)}
              onMouseLeave={() => setResDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  setResDropdownOpen((v) => !v);
                  if (!isResourcePage) router.push("/academic-terms");
                }}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase transition-colors whitespace-nowrap cursor-pointer",
                  isResourcePage
                    ? "text-[#0070F3] dark:text-[#38BDF8] font-extrabold"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                Resources
                <ChevronDown
                  className={cn(
                    "size-3 text-foreground/50 transition-transform duration-200",
                    resDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Resources Dropdown (With Clear Gap & Invisible Hover Bridge) */}
              {resDropdownOpen && (
                <div
                  className="absolute left-0 top-[calc(100%+16px)] w-52 z-50 tt-animate-pop before:content-[''] before:absolute before:-top-5 before:inset-x-0 before:h-5"
                  onMouseEnter={() => {
                    handleMouseEnter();
                    setResDropdownOpen(true);
                  }}
                  onMouseLeave={() => setResDropdownOpen(false)}
                >
                  <div className="py-2.5 px-2 space-y-1 rounded-2xl bg-white/90 dark:bg-[#121212]/95 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.9)]">
                    {RESOURCE_SUB_NAV.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => {
                          setResDropdownOpen(false);
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold transition-all rounded-xl",
                          pathname === sub.href
                            ? "text-[#0070F3] dark:text-[#38BDF8] font-bold bg-black/[0.04] dark:bg-white/[0.06]"
                            : "text-foreground/80 hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:translate-x-1"
                        )}
                      >
                        <sub.icon className="size-3.5 text-[#0070F3]" />
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kaci */}
            <Link
              href="/constraints"
              className={cn(
                "text-xs font-bold tracking-wide uppercase transition-colors whitespace-nowrap",
                pathname === "/constraints"
                  ? "text-[#0070F3] dark:text-[#38BDF8] font-extrabold"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              Kaci
            </Link>

            {/* Versions */}
            <Link
              href="/versions"
              className={cn(
                "text-xs font-bold tracking-wide uppercase transition-colors whitespace-nowrap",
                pathname === "/versions"
                  ? "text-[#0070F3] dark:text-[#38BDF8] font-extrabold"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              Versions
            </Link>
          </nav>
        </div>

        {/* Top Right: Theme Toggle & User Account Dropdown */}
        <div className="pointer-events-auto flex items-center gap-3">
          <ThemeToggle />

          {/* User Profile Avatar & Dropdown (Hover Triggered) */}
          <div
            className="relative"
            ref={profileRef}
            onMouseEnter={() => {
              if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
              setProfileOpen(true);
            }}
            onMouseLeave={() => {
              profileTimeoutRef.current = setTimeout(() => setProfileOpen(false), 300);
            }}
          >
            <button
              onClick={() => {
                setProfileOpen(false);
                router.push("/account");
              }}
              className="rounded-full cursor-pointer focus:outline-none p-0.5"
              aria-label="User profile"
            >
              <Avatar className="size-8.5 border-0 shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-transform hover:scale-105">
                <AvatarFallback className="bg-gradient-to-br from-[#0052FF] via-[#0070F3] to-[#0A1B4F] text-[11px] font-black text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-[calc(100%+16px)] w-60 rounded-2xl bg-white/90 dark:bg-[#121212]/95 backdrop-blur-3xl p-2 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.9)] z-50 tt-animate-pop before:content-[''] before:absolute before:-top-5 before:inset-x-0 before:h-5"
                onMouseEnter={() => {
                  if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
                  setProfileOpen(true);
                }}
                onMouseLeave={() => {
                  profileTimeoutRef.current = setTimeout(() => setProfileOpen(false), 300);
                }}
              >
                {/* Header: Name and Email Together */}
                <div className="flex items-center gap-3 p-2.5 border-b border-black/[0.08] dark:border-white/[0.08] mb-1.5">
                  <Avatar className="size-9 shadow-[0_0_15px_rgba(0,112,243,0.4)]">
                    <AvatarFallback className="bg-gradient-to-br from-[#0052FF] to-[#0A1B4F] text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>

                {/* Profile and Settings Combined Link */}
                <div className="space-y-0.5">
                  <Link
                    href="/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors text-foreground/90"
                  >
                    <Settings className="size-4 text-[#0070F3]" />
                    Profile & Settings
                  </Link>
                </div>

                {/* Sign Out Action */}
                <div className="border-t border-black/[0.08] dark:border-white/[0.08] mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content (Shrunk with comfortable side gutters to flow naturally between logo and right controls) */}
      <main className="relative z-10 flex-1 pt-20 pb-12 px-14 sm:px-20 lg:px-24 max-w-[1550px] w-full mx-auto">
        {children}
      </main>

      {/* Floating AI Assistant */}
      <FloatingAiChat />
    </div>
  );
}