"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, Search, User, Sparkles } from "lucide-react";
import { TechBackground } from "@/components/ui/tech-background";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/theme/theme-provider";
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";

interface UserProfile {
  name: string;
  email: string;
  role?: string;
}

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
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
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Radial Purple/Pink Ambient Glow */}
        <TechBackground />

        {/* Vercel/Linear Styled Top Navigation Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-foreground tracking-tight">TIMETT Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Trigger */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground border-border bg-card/60 backdrop-blur-md hover:border-[#4C1D95]/40 dark:hover:border-[#8B5CF6]/40 rounded-xl px-3 cursor-pointer"
                    onClick={() => {
                      document.dispatchEvent(
                        new KeyboardEvent("keydown", {
                          key: "k",
                          ctrlKey: true,
                          bubbles: true,
                        })
                      );
                    }}
                    aria-label="Search"
                  >
                    <Search className="size-3.5 text-[#4C1D95] dark:text-[#8B5CF6]" />
                    <span className="hidden md:inline">Quick Search...</span>
                    <kbd className="hidden md:inline-flex rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                      ⌘K
                    </kbd>
                  </Button>
                }
              />
              <TooltipContent side="bottom" className="text-xs">
                Open Command Palette
              </TooltipContent>
            </Tooltip>

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 backdrop-blur-md p-1.5 pr-3 transition-all duration-200 hover:border-[#4C1D95]/40 dark:hover:border-[#8B5CF6]/40 hover:bg-card/90"
                >
                  <Avatar className="size-7 border border-[#4C1D95]/30 dark:border-[#8B5CF6]/30">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#3B0764] to-[#581C87] dark:from-[#7C3AED] dark:to-[#A855F7] text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-bold leading-none text-foreground">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate">
                      {user.email}
                    </p>
                  </div>
                </Link>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        onClick={handleLogout}
                        aria-label="Sign out"
                      >
                        <LogOut className="size-4" />
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom" className="text-xs">
                    Sign out
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="tt-gradient-btn h-8 rounded-xl px-3 text-xs font-bold cursor-pointer"
                >
                  <User className="size-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Global Floating AI Assistant */}
        <FloatingAiChat />
      </SidebarInset>

      {/* Command palette overlay */}
      <CommandPalette />
    </SidebarProvider>
  );
}