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
  Layers,
  Search,
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
}

const ROOM_TYPES = [
  { value: "Classroom", label: "Lecture Classroom" },
  { value: "Lab", label: "Computer / Tech Lab" },
  { value: "Seminar Hall", label: "Seminar / Audio-Visual Hall" },
  { value: "Auditorium", label: "Large Auditorium" },
];

function getDeptAcronym(name: string): string {
  if (!name.trim()) return "SEC";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].toUpperCase().slice(0, 4);
  }
  return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
}

function getDeptLabs(dept: Department, allRooms: Room[]): Room[] {
  const acronym = getDeptAcronym(dept.name).toLowerCase();
  const fullName = dept.name.toLowerCase();

  return allRooms.filter((r) => {
    if (r.room_type !== "Lab") return false;
    const roomName = r.name.toLowerCase();
    return (
      roomName.includes(fullName) ||
      roomName.startsWith(acronym) ||
      roomName.includes(` ${acronym} `) ||
      roomName.includes(`${acronym}-`) ||
      roomName.includes(`${acronym} `)
    );
  });
}

export default function RoomsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Mappings: sectionId -> roomId, and labId -> targetPhysicalRoomId
  const [sectionRoomMap, setSectionRoomMap] = useState<Record<number, number>>({});
  const [labRoomMap, setLabRoomMap] = useState<Record<number, number>>({});
  const [savedIndicator, setSavedIndicator] = useState("");

  // Create Physical Space Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("60");
  const [roomType, setRoomType] = useState("Classroom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Room Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("60");
  const [editRoomType, setEditRoomType] = useState("Classroom");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Edit Section Modal
  const [editSecOpen, setEditSecOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editSecName, setEditSecName] = useState("");
  const [editSecCount, setEditSecCount] = useState("60");
  const [editSecRoomId, setEditSecRoomId] = useState<number | "">("");
  const [submittingSecEdit, setSubmittingSecEdit] = useState(false);
  const [editSecError, setEditSecError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;
      setInstitutionId(userInstId);

      const [deptRes, roomRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/departments/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        setDepartments(await deptRes.json());
      }
      if (roomRes && roomRes.ok) {
        setRooms(await roomRes.json());
      }
      if (secRes && secRes.ok) {
        setSections(await secRes.json());
      }

      // Load saved mappings from localStorage
      const savedSecMap = localStorage.getItem(`timett_section_room_map_${userInstId}`);
      if (savedSecMap) {
        setSectionRoomMap(JSON.parse(savedSecMap));
      }
      const savedLabMap = localStorage.getItem(`timett_lab_room_map_${userInstId}`);
      if (savedLabMap) {
        setLabRoomMap(JSON.parse(savedLabMap));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLinkSectionRoom = (sectionId: number, roomId: number) => {
    const updated = { ...sectionRoomMap, [sectionId]: roomId };
    setSectionRoomMap(updated);
    localStorage.setItem(`timett_section_room_map_${institutionId}`, JSON.stringify(updated));
    setSavedIndicator("Section room mapping updated");
    setTimeout(() => setSavedIndicator(""), 2200);
  };

  const handleLinkLabRoom = (labId: number, targetRoomId: number) => {
    const updated = { ...labRoomMap, [labId]: targetRoomId };
    setLabRoomMap(updated);
    localStorage.setItem(`timett_lab_room_map_${institutionId}`, JSON.stringify(updated));
    setSavedIndicator("Lab facility room mapping updated");
    setTimeout(() => setSavedIndicator(""), 2200);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !capacity) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/rooms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          capacity: parseInt(capacity) || 60,
          room_type: roomType,
          institution_id: institutionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create room");
      }

      setName("");
      setCapacity("60");
      setRoomType("Classroom");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating space");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setEditName(room.name);
    setEditCapacity(room.capacity.toString());
    setEditRoomType(room.room_type || "Classroom");
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editName.trim() || !editCapacity) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          capacity: parseInt(editCapacity) || 60,
          room_type: editRoomType,
          institution_id: institutionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update room");
      }

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating room");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openEditSectionModal = (sec: Section) => {
    setEditingSection(sec);
    setEditSecName(sec.name);
    setEditSecCount((sec.student_count || 60).toString());
    setEditSecRoomId(sectionRoomMap[sec.id] || "");
    setEditSecError("");
    setEditSecOpen(true);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editSecName.trim()) return;

    setSubmittingSecEdit(true);
    setEditSecError("");

    try {
      const res = await fetch(`${API_BASE}/sections/${editingSection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSecName.trim(),
          department_id: editingSection.department_id,
          student_count: parseInt(editSecCount) || 60,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update section");
      }

      // Update room link if changed
      if (editSecRoomId !== "") {
        handleLinkSectionRoom(editingSection.id, Number(editSecRoomId));
      }

      setEditSecOpen(false);
      await fetchData();
    } catch (err) {
      setEditSecError(err instanceof Error ? err.message : "Error updating section");
    } finally {
      setSubmittingSecEdit(false);
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

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Are you sure you want to delete this space?")) return;
    try {
      const res = await fetch(`${API_BASE}/rooms/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete space", err);
    }
  };

  // Filter classrooms & physical rooms for select options
  const physicalClassrooms = rooms.filter((r) => r.room_type !== "Lab");
  const physicalLabs = rooms.filter((r) => r.room_type === "Lab");

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Rooms & Laboratories Allocation"
          description="View department structures, edit sections & labs, link room numbers, and manage physical infrastructure."
          icon={DoorOpen}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh allocation"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Room / Lab Space
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Physical Facility Setup</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Register Room / Space
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Define a physical classroom, lecture hall, or lab space to link to sections.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddRoom} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Room Number / Space Name *
                  </label>
                  <Input
                    placeholder="e.g. Room 301, LH-102, or Lab 2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Facility Type *
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                    >
                      {ROOM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Capacity (Seats) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="60"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      required
                      className="rounded-xl border-border bg-muted/40 font-mono"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim() || !capacity}
                    className="tt-gradient-btn rounded-xl font-bold w-full"
                  >
                    {submitting ? "Registering..." : "Register Physical Space"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Search & Live Status Bar */}
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
              {physicalClassrooms.length} Classrooms
            </Badge>
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
              {physicalLabs.length} Labs
            </Badge>
          </div>
        </div>

        {/* Hierarchical Departments List (User Required Format) */}
        {loading ? (
          <LoadingState text="Loading departments, sections, and room allocations..." />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments found"
            description="Create academic departments first to configure and map rooms to sections & labs."
          />
        ) : (
          <div className="space-y-6">
            {filteredDepartments.map((dept) => {
              const deptSections = sections.filter((s) => s.department_id === dept.id);
              const deptLabs = getDeptLabs(dept, rooms);

              return (
                <GlassPanel key={dept.id} className="p-0 overflow-hidden border-border shadow-sm">
                  {/* Department Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border bg-card/60">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#6D28D9]/20 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Department Allocation Matrix
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 font-semibold gap-1.5 px-3 py-1">
                        <GraduationCap className="size-3.5" />
                        {deptSections.length} Sections
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 font-semibold gap-1.5 px-3 py-1">
                        <FlaskConical className="size-3.5" />
                        {deptLabs.length} Labs
                      </Badge>
                    </div>
                  </div>

                  {/* Department Body: Sections + Labs Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border bg-card/30">
                    {/* 1. SECTIONS UNDER THIS DEPARTMENT */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-4 text-[#8B5CF6]" />
                          <h4 className="text-sm font-bold text-foreground">
                            Theory Sections ({deptSections.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Link Room No. & Actions
                        </span>
                      </div>

                      {deptSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-3">
                          No theory sections provisioned. Configure sections in Departments.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {deptSections.map((sec) => {
                            const linkedRoomId = sectionRoomMap[sec.id];
                            const linkedRoom = rooms.find((r) => r.id === linkedRoomId);

                            return (
                              <div
                                key={sec.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">
                                      {sec.name}
                                    </span>
                                    {linkedRoom ? (
                                      <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
                                        {linkedRoom.name}
                                      </Badge>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground italic">
                                        Dynamic Room
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground block">
                                    Strength: {sec.student_count || 60} students
                                  </span>
                                </div>

                                <div className="w-full sm:w-60 flex items-center gap-1.5">
                                  <select
                                    value={sectionRoomMap[sec.id] || ""}
                                    onChange={(e) =>
                                      handleLinkSectionRoom(sec.id, Number(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                                  >
                                    <option value="">Unassigned (Auto)</option>
                                    {physicalClassrooms.length > 0 ? (
                                      physicalClassrooms.map((rm) => (
                                        <option key={rm.id} value={rm.id}>
                                          {rm.name} ({rm.capacity} seats)
                                        </option>
                                      ))
                                    ) : (
                                      rooms.map((rm) => (
                                        <option key={rm.id} value={rm.id}>
                                          {rm.name} ({rm.capacity} seats)
                                        </option>
                                      ))
                                    )}
                                  </select>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditSectionModal(sec)}
                                    className="size-8 rounded-lg text-muted-foreground hover:text-primary shrink-0 cursor-pointer"
                                    title="Edit section details"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSection(sec.id)}
                                    className="size-8 rounded-lg text-muted-foreground hover:text-red-500 shrink-0 cursor-pointer"
                                    title="Delete section"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. LABS UNDER THIS DEPARTMENT */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="size-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-foreground">
                            Department Laboratories ({deptLabs.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Link Lab Space & Actions
                        </span>
                      </div>

                      {deptLabs.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-3">
                          No laboratories registered for this department. Add labs in Departments.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {deptLabs.map((lab) => {
                            const linkedRoomId = labRoomMap[lab.id] || lab.id;
                            const linkedRoom = rooms.find((r) => r.id === linkedRoomId);

                            return (
                              <div
                                key={lab.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border hover:border-amber-500/40 transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">
                                      {lab.name}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30">
                                      {lab.capacity} seats
                                    </Badge>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground block">
                                    Physical Space: {linkedRoom?.name || lab.name}
                                  </span>
                                </div>

                                <div className="w-full sm:w-60 flex items-center gap-1.5">
                                  <select
                                    value={labRoomMap[lab.id] || lab.id}
                                    onChange={(e) =>
                                      handleLinkLabRoom(lab.id, Number(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                                  >
                                    <option value={lab.id}>{lab.name} (Default)</option>
                                    {physicalLabs
                                      .filter((r) => r.id !== lab.id)
                                      .map((rm) => (
                                        <option key={rm.id} value={rm.id}>
                                          {rm.name} ({rm.capacity} seats)
                                        </option>
                                      ))}
                                    {physicalClassrooms.map((rm) => (
                                      <option key={rm.id} value={rm.id}>
                                        {rm.name} (Classroom - {rm.capacity} seats)
                                      </option>
                                    ))}
                                  </select>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditRoomModal(lab)}
                                    className="size-8 rounded-lg text-muted-foreground hover:text-primary shrink-0 cursor-pointer"
                                    title="Edit lab details"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRoom(lab.id)}
                                    className="size-8 rounded-lg text-muted-foreground hover:text-red-500 shrink-0 cursor-pointer"
                                    title="Delete lab space"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
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
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Student Section</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Section Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update section name, student strength, and linked classroom.
              </DialogDescription>
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

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Designated Classroom / Room Number
                </label>
                <select
                  value={editSecRoomId}
                  onChange={(e) => setEditSecRoomId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="">Unassigned (Dynamic Room)</option>
                  {physicalClassrooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              {editSecError && <p className="text-xs text-red-500">{editSecError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingSecEdit || !editSecName.trim()}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingSecEdit ? "Saving Changes..." : "Save Section Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Room / Lab Space Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Physical Space</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Room / Lab Space
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateRoom} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Room Identifier *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Facility Type *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none"
                    value={editRoomType}
                    onChange={(e) => setEditRoomType(e.target.value)}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Capacity (Seats) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 font-mono"
                  />
                </div>
              </div>

              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submittingEdit || !editName.trim() || !editCapacity}
                  className="tt-gradient-btn rounded-xl font-bold w-full"
                >
                  {submittingEdit ? "Updating..." : "Update Room"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}