"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

const ROOM_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  Classroom: {
    bg: "bg-[#8B5CF6]/10 border-[#8B5CF6]/20",
    text: "text-[#8B5CF6] dark:text-[#A78BFA]",
  },
  Lab: {
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-600 dark:text-amber-300",
  },
  "Seminar Hall": {
    bg: "bg-[#6D28D9]/15 border-[#6D28D9]/30",
    text: "text-[#6D28D9] dark:text-[#DDD6FE]",
  },
  Auditorium: {
    bg: "bg-[#5B21B6]/20 border-[#5B21B6]/35",
    text: "text-[#5B21B6] dark:text-[#EDE9FE]",
  },
};

export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState<"facilities" | "mapping">("facilities");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Section to Room Mappings (Stored in state/localStorage)
  const [sectionRoomMap, setSectionRoomMap] = useState<Record<number, number>>({});
  const [mappingSaved, setMappingSaved] = useState(false);

  // Create Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("60");
  const [roomType, setRoomType] = useState("Classroom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("60");
  const [editRoomType, setEditRoomType] = useState("Classroom");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;
      setInstitutionId(userInstId);

      const [roomRes, secRes] = await Promise.all([
        fetch(`${API_BASE}/rooms/?institution_id=${userInstId}`).catch(() => null),
        fetch(`${API_BASE}/sections/?institution_id=${userInstId}`).catch(() => null),
      ]);

      if (roomRes && roomRes.ok) {
        setRooms(await roomRes.json());
      }
      if (secRes && secRes.ok) {
        setSections(await secRes.json());
      }

      // Load saved mapping from localStorage
      const savedMap = localStorage.getItem(`timett_room_mapping_${userInstId}`);
      if (savedMap) {
        setSectionRoomMap(JSON.parse(savedMap));
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

  const handleMapChange = (sectionId: number, roomId: number) => {
    const updated = { ...sectionRoomMap, [sectionId]: roomId };
    setSectionRoomMap(updated);
    localStorage.setItem(`timett_room_mapping_${institutionId}`, JSON.stringify(updated));
    setMappingSaved(true);
    setTimeout(() => setMappingSaved(false), 2000);
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
      setError(err instanceof Error ? err.message : "Error creating room");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (room: Room) => {
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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      const res = await fetch(`${API_BASE}/rooms/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete room", err);
    }
  };

  const classrooms = rooms.filter((r) => r.room_type !== "Lab");
  const labRooms = rooms.filter((r) => r.room_type === "Lab");
  const theorySections = sections.filter((s) => !s.name.toLowerCase().includes("lab"));
  const labSections = sections.filter((s) => s.name.toLowerCase().includes("lab"));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Rooms, Laboratories & Section Facility Mapping"
          description="Manage institutional infrastructure and map theory sections to classrooms & lab cohorts to specialized laboratories."
          icon={DoorOpen}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh rooms"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" /> Add Room / Lab
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Facility Architecture</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Add Physical Space
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Define a classroom, computer lab, or auditorium for schedule allocation.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddRoom} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Room Identifier / Number *
                  </label>
                  <Input
                    placeholder="e.g. Room 301, LH-102, or Advanced Computing Lab"
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
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                      Max Student Capacity *
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
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Registering Space..." : "Register Facility"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Tab Navigation: Infrastructure Catalog vs Section Facility Mapping */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border">
            <button
              onClick={() => setActiveTab("facilities")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "facilities"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Infrastructure Catalog ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("mapping")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "mapping"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="size-3.5 text-[#8B5CF6]" />
              Section & Lab Mapping ({sections.length})
            </button>
          </div>

          {mappingSaved && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="size-3.5" /> Mapping Updated Live
            </div>
          )}
        </div>

        {/* TAB 1: Infrastructure Spaces Catalog */}
        {activeTab === "facilities" && (
          <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
            <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
              <div>
                <h3 className="text-base font-bold text-foreground">Infrastructure Spaces</h3>
                <p className="text-xs text-muted-foreground">
                  {rooms.length} active spaces ({classrooms.length} classrooms, {labRooms.length} laboratories)
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <LoadingState text="Loading infrastructure records..." />
              ) : rooms.length === 0 ? (
                <EmptyState
                  icon={DoorOpen}
                  title="No rooms configured yet"
                  description='Click "Add Room / Lab" to configure classrooms and labs for scheduling.'
                />
              ) : (
                <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Room / Lab Name</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Type Category</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Capacity</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Assigned Cohorts</TableHead>
                        <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room, index) => {
                        const typeStyle = ROOM_TYPE_STYLES[room.room_type || "Classroom"] || ROOM_TYPE_STYLES["Classroom"];
                        const mappedSecs = sections.filter((s) => sectionRoomMap[s.id] === room.id);

                        return (
                          <TableRow key={room.id} className="border-border hover:bg-muted/20 transition-colors">
                            <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                              #{index + 1}
                            </TableCell>
                            <TableCell className="font-bold text-foreground text-sm">
                              {room.name}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${typeStyle.bg} ${typeStyle.text}`}
                              >
                                {room.room_type || "Classroom"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="size-3.5 text-muted-foreground" />
                                {room.capacity} seats
                              </span>
                            </TableCell>
                            <TableCell>
                              {mappedSecs.length === 0 ? (
                                <span className="text-xs text-muted-foreground italic">General pool</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {mappedSecs.map((s) => (
                                    <Badge key={s.id} variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                      {s.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                  onClick={() => openEditModal(room)}
                                  title="Edit room"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                  onClick={() => handleDelete(room.id)}
                                  title="Delete room"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </GlassPanel>
        )}

        {/* TAB 2: Section & Lab Facility Allocation Matrix (User Requirement) */}
        {activeTab === "mapping" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theory Section to Classroom Mapping */}
            <GlassPanel className="p-6 border-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Theory Section ➔ Classroom Mapping</h3>
                  <p className="text-xs text-muted-foreground">Map each lecture section cohort to its primary room number</p>
                </div>
              </div>

              {theorySections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No theory sections created yet. Add them in Departments.</p>
              ) : (
                <div className="space-y-3">
                  {theorySections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-card border border-border"
                    >
                      <div>
                        <span className="font-bold text-sm text-foreground block">{sec.name}</span>
                        <span className="text-[11px] text-muted-foreground">Cohort capacity: {sec.student_count || 60} students</span>
                      </div>

                      <div className="w-52">
                        <select
                          value={sectionRoomMap[sec.id] || ""}
                          onChange={(e) => handleMapChange(sec.id, Number(e.target.value))}
                          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <option value="">Auto-Allocate (Any Room)</option>
                          {classrooms.map((rm) => (
                            <option key={rm.id} value={rm.id}>
                              {rm.name} ({rm.capacity} seats)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>

            {/* Lab Cohort to Laboratory Room Mapping */}
            <GlassPanel className="p-6 border-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <FlaskConical className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Practical Lab ➔ Laboratory Facility Mapping</h3>
                  <p className="text-xs text-muted-foreground">Map practical lab batches to designated physical labs</p>
                </div>
              </div>

              {labSections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No lab cohorts created yet. Add them in Departments.</p>
              ) : (
                <div className="space-y-3">
                  {labSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-card border border-border"
                    >
                      <div>
                        <span className="font-bold text-sm text-foreground block">{sec.name}</span>
                        <span className="text-[11px] text-muted-foreground">Lab Batch: {sec.student_count || 30} students</span>
                      </div>

                      <div className="w-52">
                        <select
                          value={sectionRoomMap[sec.id] || ""}
                          onChange={(e) => handleMapChange(sec.id, Number(e.target.value))}
                          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        >
                          <option value="">Auto-Allocate (Any Lab)</option>
                          {labRooms.length > 0 ? (
                            labRooms.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name} ({rm.capacity} seats)
                              </option>
                            ))
                          ) : (
                            rooms.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name} ({rm.room_type || "Facility"})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </div>
        )}

        {/* Edit Room Modal */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Space</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Room / Facility
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
                    Max Student Capacity *
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
                  className="tt-gradient-btn rounded-xl font-bold"
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