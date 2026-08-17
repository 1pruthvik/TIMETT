"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
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

const mainItems = [
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

const managementItems = [
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
    title: "Constraints",
    url: "/constraints",
    icon: ClipboardList,
  },
  {
    title: "Versions",
    url: "/versions",
    icon: Layers3,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="size-4" />
            </div>

            <div>
              <p className="text-sm font-semibold">TimeTT</p>
              <p className="text-xs text-muted-foreground">
                Timetable Planner
              </p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Academic Setup</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/account" />}>
                  <Users />
                  <span>Account</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/settings" />}>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}