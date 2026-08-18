"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  BookOpen,
  Layers3,
  Sparkles,
  Building2,
  Clock,
  CalendarRange,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItemDef {
  title: string;
  url: string;
  icon: React.ElementType;
}

const mainItems: NavItemDef[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Timetable",
    url: "/timetable",
    icon: CalendarDays,
  },
  {
    title: "Generations",
    url: "/generations",
    icon: Sparkles,
  },
];

const managementItems: NavItemDef[] = [
  {
    title: "Academic Terms",
    url: "/academic-terms",
    icon: CalendarRange,
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Building2,
  },
  {
    title: "Faculty",
    url: "/faculty",
    icon: Users,
  },
  {
    title: "Subjects",
    url: "/subjects",
    icon: BookOpen,
  },
  {
    title: "Sections",
    url: "/sections",
    icon: GraduationCap,
  },
  {
    title: "Rooms & Labs",
    url: "/rooms",
    icon: DoorOpen,
  },
  {
    title: "Time Slots",
    url: "/time-slots",
    icon: Clock,
  },
  {
    title: "Versions",
    url: "/versions",
    icon: Layers3,
  },
];

function NavItem({ item, pathname }: { item: NavItemDef; pathname: string }) {
  const isActive = pathname === item.url;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.url} />}
        className={cn(
          "relative group/nav transition-all duration-200 rounded-xl px-3 py-2 text-xs font-semibold",
          isActive
            ? "bg-[#4C1D95]/12 dark:bg-[#8B5CF6]/12 text-[#4C1D95] dark:text-[#A78BFA] shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-card/70"
        )}
      >
        {/* Active glowing indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-[#3B0764] to-[#581C87] dark:from-[#7C3AED] dark:to-[#A855F7] shadow-[0_0_12px_rgba(76,29,149,0.8)] dark:shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
        )}
        <item.icon className={cn(
          "size-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-115",
          isActive ? "text-[#4C1D95] dark:text-[#A78BFA]" : "text-muted-foreground group-hover/nav:text-foreground"
        )} />
        <span className="truncate">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-border bg-sidebar/85 backdrop-blur-xl">
      <SidebarContent>
        {/* Brand Header */}
        <div className="px-4 py-5">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#6D28D9] dark:from-[#6D28D9] dark:via-[#8B5CF6] dark:to-[#C084FC] text-white shadow-[0_0_20px_-3px_rgba(76,29,149,0.5)] dark:shadow-[0_0_20px_-3px_rgba(139,92,246,0.5)] transition-transform duration-300 group-hover:scale-105">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-base font-extrabold tracking-tight bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#6D28D9] dark:from-[#8B5CF6] dark:via-[#A855F7] dark:to-[#C084FC] bg-clip-text text-transparent">
                  TIMETT
                </p>
                <span className="rounded-full bg-[#4C1D95]/15 dark:bg-[#8B5CF6]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#4C1D95] dark:text-[#A78BFA]">
                  OS
                </span>
              </div>
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
                Intelligent Scheduler
              </p>
            </div>
          </Link>
        </div>

        {/* Workspace group */}
        <SidebarGroup>
          <SidebarGroupLabel className="tt-eyebrow text-muted-foreground px-3">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <NavItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Academic Setup group */}
        <SidebarGroup>
          <SidebarGroupLabel className="tt-eyebrow text-muted-foreground px-3">
            Academic Setup
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {managementItems.map((item) => (
                <NavItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom items */}
        <div className="mt-auto">
          <div className="mx-3 mb-2 border-t border-border" />
          <SidebarGroup>
            <SidebarMenu className="space-y-0.5">
              <NavItem
                item={{
                  title: "Account",
                  url: "/account",
                  icon: User,
                }}
                pathname={pathname}
              />
              <NavItem
                item={{
                  title: "Settings",
                  url: "/settings",
                  icon: Settings,
                }}
                pathname={pathname}
              />
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}