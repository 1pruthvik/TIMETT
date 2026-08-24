"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  DoorOpen,
  Users,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  GraduationCap,
  FlaskConical,
  Building2,
  Search,
  Check,
  CalendarRange,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Department {
  id: number;
  name: string;
  institution_id: number;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  room_type?: string;
  institution_id: number;
}

interface Section {
  id: number;
  name: string;
  department_id: number;
  student_count?: number;
  room_number?: string;
}

interface AcademicSemester {
  id: number;
  name: string;
  academic_year_id: number;
}

function getDeptAcronym(name: string): string {
  if (!name.trim()) return "SEC";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].toUpperCase().slice(0, 4);
  }
  return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
}

function getDeptLabs(dept: Department, allRooms: Room[], allDepts: Department[]): Room[] {
  const isLab = (r: Room) => (r.room_type || "").toUpperCase() === "LAB" || (r.room_type || "").toUpperCase() === "LABORATORY";
  const acronym = getDeptAcronym(dept.name).toLowerCase();
  const fullName = dept.name.toLowerCase();

  const explicitDeptLabs = allRooms.filter((r) => {
    if (!isLab(r)) return false;
    const roomName = r.name.toLowerCase();
    return (
      roomName.includes(fullName) ||
      roomName.startsWith(acronym) ||
      roomName.includes(` ${acronym} `) ||
      roomName.includes(`${acronym}-`) ||
      roomName.includes(`${acronym} `)
    );
  });

  if (explicitDeptLabs.length > 0) return explicitDeptLabs;

  // If labs follow standard floor codes (e.g. L106, L107, L206), distribute campus labs across departments
  const allGeneralLabs = allRooms.filter(isLab);
  if (allGeneralLabs.length === 0) return [];

  const deptIndex = allDepts.findIndex((d) => d.id === dept.id);
  const safeIndex = deptIndex >= 0 ? deptIndex : 0;
  const countPerDept = Math.max(2, Math.ceil(allGeneralLabs.length / (allDepts.length || 1)));
  const start = safeIndex * countPerDept;
  return allGeneralLabs.slice(start, start + countPerDept);
}

function isSectionForSemester(secName: string, semName: string): boolean {
  const normSec = secName.trim().toLowerCase();
  const normSem = semName.trim().toLowerCase();

  if (normSec.includes(normSem)) return true;

  const digits = normSem.match(/\d+/);
  if (digits) {
    const d = digits[0];
    const pattern = new RegExp(`(^|\\s|Sem|sem|[A-Za-z])${d}([A-Za-z]|\\s|$)`, "i");
    return pattern.test(normSec);
  }

  return false;
}

function groupSectionsBySemester(
  deptSections: Section[],
  academicSemesters: AcademicSemester[]
): { semTitle: string; sections: Section[] }[] {
  const groups: { semTitle: string; sections: Section[] }[] = [];
  const assigned = new Set<number>();

  // 1. Check user configured academic semesters first
  if (academicSemesters.length > 0) {
    for (const sem of academicSemesters) {
      const matching = deptSections.filter(
        (s) => !assigned.has(s.id) && isSectionForSemester(s.name, sem.name)
      );
      if (matching.length > 0) {
        matching.forEach((s) => assigned.add(s.id));
        groups.push({ semTitle: sem.name, sections: matching });
      }
    }
  }

  // 2. Check standard numbered semesters (1 through 8) for remaining
  for (let num = 1; num <= 8; num++) {
    const semName = `Semester ${num}`;
    const matching = deptSections.filter(
      (s) => !assigned.has(s.id) && isSectionForSemester(s.name, String(num))
    );
    if (matching.length > 0) {
      matching.forEach((s) => assigned.add(s.id));
      groups.push({ semTitle: semName, sections: matching });
    }
  }

  // 3. Catch all other custom cohorts
  const remaining = deptSections.filter((s) => !assigned.has(s.id));
  if (remaining.length > 0) {
    groups.push({ semTitle: "Other Sections", sections: remaining });
  }

  return groups;
}

export default function RoomsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicSemesters, setAcademicSemesters] = useState<AcademicSemester[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Direct text room numbers for sections and labs
  const [sectionRoomText, setSectionRoomText] = useState<Record<number, string>>({});
  const [labRoomText, setLabRoomText] = useState<Record<number, string>>({});
  const [savedIndicator, setSavedIndicator] = useState("");

  // Edit Section Modal
  const [editSecOpen, setEditSecOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editSecName, setEditSecName] = useState("");
  const [editSecCount, setEditSecCount] = useState("60");
  const [editSecRoomNumber, setEditSecRoomNumber] = useState("");
  const [submittingSecEdit, setSubmittingSecEdit] = useState(false);
  const [editSecError, setEditSecError] = useState("");

  // Edit Lab Modal
  const [editLabOpen, setEditLabOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Room | null>(null);
  const [editLabName, setEditLabName] = useState("");
  const [editLabRoomNumber, setEditLabRoomNumber] = useState("");
  const [editLabCapacity, setEditLabCapacity] = useState("35");
  const [submittingLabEdit, setSubmittingLabEdit] = useState(false);
  const [editLabError, setEditLabError] = useState("");

  // Create Physical Space Modal
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceType, setSpaceType] = useState("Classroom");
  const [spaceCapacity, setSpaceCapacity] = useState("60");
  const [submittingSpace, setSubmittingSpace] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;
      setInstitutionId(userInstId);

      const [deptRes, roomRes, secRes, semRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/semesters/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (roomRes && roomRes.ok) {
        setRooms(await roomRes.json());
      }
      if (deptRes && deptRes.ok) {
        setDepartments(await deptRes.json());
      }
      if (secRes && secRes.ok) {
        const secsData: Section[] = await secRes.json();
        setSections(secsData);

        const newSecMap: Record<number, string> = {};
        secsData.forEach((s) => {
          if (s.room_number) {
            newSecMap[s.id] = s.room_number;
          }
        });
        setSectionRoomText(newSecMap);
        localStorage.setItem(
          `timett_section_room_names_${userInstId}`,
          JSON.stringify(newSecMap)
        );
      }
      if (semRes && semRes.ok) {
        setAcademicSemesters(await semRes.json());
      }

      const savedLabMap = localStorage.getItem(`timett_lab_room_names_${userInstId}`);
      if (savedLabMap) {
        setLabRoomText(JSON.parse(savedLabMap));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ensureAndSaveRoom = async (
    roomName: string,
    type: "Classroom" | "Lab" = "Classroom"
  ): Promise<Room | null> => {
    const trimmed = roomName.trim();
    if (!trimmed) return null;

    const existing = rooms.find(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    try {
      const res = await fetch(`${API_BASE}/rooms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          capacity: type === "Lab" ? 35 : 60,
          room_type: type,
          institution_id: institutionId,
        }),
      });

      if (res.ok) {
        const created: Room = await res.json();
        setRooms((prev) => [...prev, created]);
        return created;
      }
    } catch (err) {
      console.error("Error creating physical room", err);
    }
    return null;
  };

  const handleSectionRoomChange = (secId: number, val: string) => {
    setSectionRoomText((prev) => ({ ...prev, [secId]: val }));
  };

  const handleSectionRoomBlur = async (secId: number, val: string) => {
    const trimmed = val.trim();
    const updated = { ...sectionRoomText, [secId]: trimmed };
    setSectionRoomText(updated);
    localStorage.setItem(
      `timett_section_room_names_${institutionId}`,
      JSON.stringify(updated)
    );

    const sec = sections.find((s) => s.id === secId);
    if (sec) {
      await fetch(`${API_BASE}/sections/${secId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sec.name,
          department_id: sec.department_id,
          student_count: sec.student_count || 60,
          room_number: trimmed || null,
        }),
      }).catch(() => null);
    }

    if (trimmed) {
      await ensureAndSaveRoom(trimmed, "Classroom");
    }

    setSavedIndicator("Room number saved");
    setTimeout(() => setSavedIndicator(""), 2000);
  };

  const handleLabRoomChange = (labId: number, val: string) => {
    setLabRoomText((prev) => ({ ...prev, [labId]: val }));
  };

  const handleLabRoomBlur = async (labId: number, val: string) => {
    const trimmed = val.trim();
    const updated = { ...labRoomText, [labId]: trimmed };
    setLabRoomText(updated);
    localStorage.setItem(
      `timett_lab_room_names_${institutionId}`,
      JSON.stringify(updated)
    );

    if (trimmed) {
      await ensureAndSaveRoom(trimmed, "Lab");
    }

    setSavedIndicator("Lab room saved");
    setTimeout(() => setSavedIndicator(""), 2000);
  };

  const openEditSectionModal = (sec: Section) => {
    setEditingSection(sec);
    setEditSecName(sec.name);
    setEditSecCount((sec.student_count || 60).toString());
    setEditSecRoomNumber(sectionRoomText[sec.id] || sec.room_number || "");
    setEditSecError("");
    setEditSecOpen(true);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editSecName.trim()) return;

    setSubmittingSecEdit(true);
    setEditSecError("");

    try {
      const trimmedRoom = editSecRoomNumber.trim();
      const res = await fetch(`${API_BASE}/sections/${editingSection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSecName.trim(),
          department_id: editingSection.department_id,
          student_count: parseInt(editSecCount) || 60,
          room_number: trimmedRoom || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update section");
      }

      // Save room number text
      const updated = { ...sectionRoomText, [editingSection.id]: trimmedRoom };
      setSectionRoomText(updated);
      localStorage.setItem(
        `timett_section_room_names_${institutionId}`,
        JSON.stringify(updated)
      );

      if (trimmedRoom) {
        await ensureAndSaveRoom(trimmedRoom, "Classroom");
      }

      setEditSecOpen(false);
      await fetchData();
    } catch (err) {
      setEditSecError(err instanceof Error ? err.message : "Error updating section");
    } finally {
      setSubmittingSecEdit(false);
    }
  };

  const openEditLabModal = (lab: Room) => {
    setEditingLab(lab);
    setEditLabName(lab.name);
    setEditLabRoomNumber(labRoomText[lab.id] || lab.name);
    setEditLabCapacity(lab.capacity.toString());
    setEditLabError("");
    setEditLabOpen(true);
  };

  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab || !editLabName.trim()) return;

    setSubmittingLabEdit(true);
    setEditLabError("");

    try {
      const res = await fetch(`${API_BASE}/rooms/${editingLab.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editLabName.trim(),
          capacity: parseInt(editLabCapacity) || 35,
          room_type: "Lab",
          institution_id: institutionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update lab");
      }

      const trimmedLabRoom = editLabRoomNumber.trim();
      const updated = { ...labRoomText, [editingLab.id]: trimmedLabRoom };
      setLabRoomText(updated);
      localStorage.setItem(
        `timett_lab_room_names_${institutionId}`,
        JSON.stringify(updated)
      );

      setEditLabOpen(false);
      await fetchData();
    } catch (err) {
      setEditLabError(err instanceof Error ? err.message : "Error updating lab");
    } finally {
      setSubmittingLabEdit(false);
    }
  };

  const handleDeleteSection = async (secId: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      const res = await fetch(`${API_BASE}/sections/${secId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== secId));
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to delete section", err);
    }
  };

  const handleDeleteLab = async (labId: number) => {
    if (!confirm("Are you sure you want to delete this laboratory?")) return;
    try {
      const res = await fetch(`${API_BASE}/rooms/${labId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== labId));
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to delete lab", err);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    setSubmittingSpace(true);
    try {
      await ensureAndSaveRoom(spaceName, spaceType as "Classroom" | "Lab");
      setSpaceName("");
      setCreateSpaceOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSpace(false);
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Rooms & Laboratories Allocation"
          icon={DoorOpen}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh allocation"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
          </Button>

          <Dialog open={createSpaceOpen} onOpenChange={setCreateSpaceOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Room Space
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Physical Space Setup</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Register Room Number
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateSpace} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Room Number / Space Name *
                  </label>
                  <Input
                    placeholder="e.g. Room 301, 302, LH-1, or Lab 4"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Space Type
                    </label>
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="Lab">Laboratory</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Capacity
                    </label>
                    <Input
                      type="number"
                      value={spaceCapacity}
                      onChange={(e) => setSpaceCapacity(e.target.value)}
                      className="rounded-xl border-border bg-muted/40 font-mono"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submittingSpace || !spaceName.trim()}
                    className="tt-gradient-btn rounded-xl font-bold w-full"
                  >
                    {submittingSpace ? "Adding..." : "Add Room"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Search & Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card border-border text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            {savedIndicator && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in">
                <CheckCircle2 className="size-3.5" /> {savedIndicator}
              </div>
            )}
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
              {rooms.filter((r) => (r.room_type || "").toUpperCase() !== "LAB" && !r.room_type?.toUpperCase().includes("AUD") && !r.room_type?.toUpperCase().includes("SEM")).length} Classrooms
            </Badge>
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
              {rooms.filter((r) => (r.room_type || "").toUpperCase() === "LAB").length} Labs
            </Badge>
            {rooms.some((r) => r.room_type?.toUpperCase().includes("AUD") || r.room_type?.toUpperCase().includes("SEM")) && (
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
                {rooms.filter((r) => r.room_type?.toUpperCase().includes("AUD") || r.room_type?.toUpperCase().includes("SEM")).length} Halls
              </Badge>
            )}
          </div>
        </div>

        {/* Hierarchical Departments */}
        {loading ? (
          <LoadingState text="Loading departments and semester-segregated sections..." />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments found"
          />
        ) : (
          <div className="space-y-6">
            {filteredDepartments.map((dept) => {
              const deptSections = sections.filter((s) => s.department_id === dept.id);
              const deptLabs = getDeptLabs(dept, rooms, departments);
              const semesterGroups = groupSectionsBySemester(deptSections, academicSemesters);

              return (
                <GlassPanel key={dept.id} className="p-0 overflow-hidden border-border shadow-sm">
                  {/* Department Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border bg-card/60">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0070F3]/20 to-[#0052FF]/20 border border-[#0070F3]/30 text-[#0070F3]">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Department Allocation Matrix ({semesterGroups.length} Active Semesters)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-[#0070F3]/10 text-[#0070F3] dark:text-[#38BDF8] border-[#0070F3]/30 font-semibold gap-1.5 px-3 py-1">
                        <GraduationCap className="size-3.5" />
                        {deptSections.length} Sections
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 font-semibold gap-1.5 px-3 py-1">
                        <FlaskConical className="size-3.5" />
                        {deptLabs.length} Labs
                      </Badge>
                    </div>
                  </div>

                  {/* Department Body: Semester-Segregated Sections & Labs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border bg-card/30">
                    {/* 1. SECTIONS SEGREGATED BY SEMESTER (User Requirement) */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-4 text-[#0070F3]" />
                          <h4 className="text-sm font-bold text-foreground">
                            Theory Sections by Semester ({deptSections.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Allocated Room No.
                        </span>
                      </div>

                      {deptSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-3">
                          No theory sections provisioned in this department.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {semesterGroups.map((group) => (
                            <div
                              key={group.semTitle}
                              className="rounded-2xl border border-border/70 bg-card/50 p-3 space-y-2.5"
                            >
                              {/* Semester Group Header Badge */}
                              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <GraduationCap className="size-3.5 text-[#0070F3]" />
                                  {group.semTitle}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold bg-[#0070F3]/10 text-[#0070F3] dark:text-[#38BDF8] border-[#0070F3]/20"
                                >
                                  {group.sections.length} {group.sections.length === 1 ? "Section" : "Sections"}
                                </Badge>
                              </div>

                              {/* Section Items under this Semester */}
                              <div className="space-y-2">
                                {group.sections.map((sec) => (
                                  <div
                                    key={sec.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
                                  >
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-xs text-foreground block">
                                        {sec.name}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground block">
                                        Strength: {sec.student_count || 60} students
                                      </span>
                                    </div>

                                    {/* Non-editable Room Display Box + Edit Pencil Icon */}
                                    <div className="w-full sm:w-56 flex items-center justify-end gap-1.5">
                                      <div className="flex-1 h-8 px-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-center font-mono text-xs font-bold text-foreground select-none">
                                        {sec.room_number || sectionRoomText[sec.id] ? (
                                          <span>{sec.room_number || sectionRoomText[sec.id]}</span>
                                        ) : (
                                          <span className="text-muted-foreground/40 font-normal italic text-[11px]">Unassigned</span>
                                        )}
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditSectionModal(sec)}
                                        className="size-8 rounded-lg text-muted-foreground hover:text-[#0070F3] hover:bg-[#0070F3]/10 shrink-0 cursor-pointer"
                                        title="Edit section & room number"
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteSection(sec.id)}
                                        className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0 cursor-pointer"
                                        title="Delete section"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. LABS UNDER THIS DEPARTMENT */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="size-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-foreground">
                            Department Laboratories ({deptLabs.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Allocated Lab Room No.
                        </span>
                      </div>

                      {deptLabs.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-3">
                          No laboratories registered for this department.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {deptLabs.map((lab) => (
                            <div
                              key={lab.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border hover:border-amber-500/40 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-sm text-foreground block">
                                  {lab.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground block">
                                  Capacity: {lab.capacity} seats
                                </span>
                              </div>

                              {/* Non-editable Lab Room Display Box + Edit Pencil Icon */}
                              <div className="w-full sm:w-56 flex items-center justify-end gap-1.5">
                                <div className="flex-1 h-8 px-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-center font-mono text-xs font-bold text-foreground select-none">
                                  {labRoomText[lab.id] ? (
                                    <span>{labRoomText[lab.id]}</span>
                                  ) : (
                                    <span>{lab.name}</span>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditLabModal(lab)}
                                  className="size-8 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                                  title="Edit lab & room number"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteLab(lab.id)}
                                  className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0 cursor-pointer"
                                  title="Delete lab"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        )}

        {/* Edit Section Modal */}
        <Dialog open={editSecOpen} onOpenChange={setEditSecOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#0070F3] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Student Section</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Section Details
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateSection} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Section Name *
                </label>
                <Input
                  value={editSecName}
                  onChange={(e) => setEditSecName(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Room Number *
                </label>
                <Input
                  placeholder="Enter Room Number (e.g. 301, LH-102)"
                  value={editSecRoomNumber}
                  onChange={(e) => setEditSecRoomNumber(e.target.value)}
                  className="rounded-xl border-border bg-muted/40 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Student Strength / Capacity *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={editSecCount}
                  onChange={(e) => setEditSecCount(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40 font-mono"
                />
              </div>

              {editSecError && <p className="text-xs text-red-500">{editSecError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingSecEdit || !editSecName.trim()}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingSecEdit ? "Saving..." : "Save Section Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Lab Modal */}
        <Dialog open={editLabOpen} onOpenChange={setEditLabOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Laboratory</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Laboratory Details
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateLab} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Laboratory Title *
                </label>
                <Input
                  value={editLabName}
                  onChange={(e) => setEditLabName(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Physical Lab Room Number
                </label>
                <Input
                  placeholder="Enter Lab Room (e.g. Lab 201, AI Space)"
                  value={editLabRoomNumber}
                  onChange={(e) => setEditLabRoomNumber(e.target.value)}
                  className="rounded-xl border-border bg-muted/40 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Max Student Capacity *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={editLabCapacity}
                  onChange={(e) => setEditLabCapacity(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40 font-mono"
                />
              </div>

              {editLabError && <p className="text-xs text-red-500">{editLabError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingLabEdit || !editLabName.trim()}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingLabEdit ? "Saving..." : "Save Lab Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}