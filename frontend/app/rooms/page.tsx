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
import { Plus, Trash2, DoorOpen, Users, RefreshCw, Sparkles } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Room {
  id: number;
  name: string;
  capacity: number;
  room_type?: string | null;
  institution_id: number;
}

const ROOM_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  Classroom: { bg: "bg-cyan-500/10 border-cyan-500/30", text: "text-cyan-700 dark:text-cyan-300" },
  "Computer Lab": { bg: "bg-violet-500/10 border-violet-500/30", text: "text-violet-700 dark:text-violet-300" },
  "Hardware Lab": { bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-700 dark:text-purple-300" },
  "Seminar Hall": { bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-700 dark:text-indigo-300" },
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [institutionId, setInstitutionId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("60");
  const [roomType, setRoomType] = useState("Classroom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userInstId = user?.institution_id || 1;
      setInstitutionId(userInstId);

      const roomUrl = `${API_BASE}/rooms/?institution_id=${userInstId}`;
      const roomRes = await fetch(roomUrl);
      if (roomRes.ok) {
        setRooms(await roomRes.json());
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
          capacity: parseInt(capacity, 10) || 60,
          room_type: roomType,
          institution_id: institutionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add room");
      }

      setName("");
      setCapacity("60");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating room");
    } finally {
      setSubmitting(false);
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Rooms & Laboratories"
          description="Configure physical lecture halls, computer laboratories, seat capacities, and hardware spaces."
          icon={DoorOpen}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh room list"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" />
                Add Room / Lab
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">New Infrastructure Node</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Add Room or Laboratory
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Enter space identifier, student capacity, and facility type.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddRoom} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Room Name / Identifier *
                  </label>
                  <Input
                    placeholder="e.g. CS Lab 204 or Lecture Hall A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Space Type *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                  >
                    <option value="Classroom">Lecture Classroom</option>
                    <option value="Computer Lab">Computer Laboratory</option>
                    <option value="Hardware Lab">Hardware / Electronics Lab</option>
                    <option value="Seminar Hall">Seminar Hall / Auditorium</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Seating Capacity *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 60"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Saving..." : "Save Room"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Configured Physical Spaces</h3>
              <p className="text-xs text-muted-foreground">
                {rooms.length} {rooms.length === 1 ? "space" : "spaces"} active for timetable slot allocation
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
                      <TableHead className="text-xs font-bold text-muted-foreground">#</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Room / Lab Name</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Type Category</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Student Capacity</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room, index) => {
                      const typeStyle = ROOM_TYPE_STYLES[room.room_type || "Classroom"] || ROOM_TYPE_STYLES["Classroom"];

                      return (
                        <TableRow key={room.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-sm">
                            {room.name}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${typeStyle.bg} ${typeStyle.text}`}>
                              {room.room_type || "Classroom"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                              <Users className="size-3.5 text-muted-foreground" />
                              <span>{room.capacity} seats</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDelete(room.id)}
                              title="Delete room"
                            >
                              <Trash2 className="size-4" />
                            </Button>
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
      </div>
    </AppShell>
  );
}