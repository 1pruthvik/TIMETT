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
import { Plus, Trash2, Pencil, Clock, CalendarDays, RefreshCw, Wand2, Sparkles } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [open, setOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editDayOfWeek, setEditDayOfWeek] = useState("Monday");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/time-slots/`).catch(() => null);
      if (res && res.ok) {
        setSlots(await res.json());
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

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/time-slots/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: dayOfWeek,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add time slot");
      }

      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating time slot");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setEditDayOfWeek(slot.day_of_week);
    setEditStartTime(slot.start_time);
    setEditEndTime(slot.end_time);
    setEditError("");
    setEditOpen(true);
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !editStartTime.trim() || !editEndTime.trim()) return;

    setSubmittingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/time-slots/${editingSlot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: editDayOfWeek,
          start_time: editStartTime.trim(),
          end_time: editEndTime.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update time slot");
      }

      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating time slot");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleAutoGenerateStandard = async () => {
    if (!confirm("Populate standard Monday-Friday timetable slots (09:00 - 16:00)?")) return;
    setLoading(true);

    const standardPeriods = [
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:15", end: "12:15" },
      { start: "12:15", end: "13:15" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
    ];

    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    try {
      for (const day of weekDays) {
        for (const period of standardPeriods) {
          await fetch(`${API_BASE}/time-slots/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              day_of_week: day,
              start_time: period.start,
              end_time: period.end,
            }),
          });
        }
      }
      await fetchData();
    } catch (err) {
      console.error("Auto populating slots failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      const res = await fetch(`${API_BASE}/time-slots/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete slot", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto tt-animate-fade">
        <PageHeader
          title="Time Slot Architecture"
          description="Configure discrete daily time intervals, lecture period durations, and break windows."
          icon={Clock}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="size-10 rounded-xl border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh slots"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Button
            variant="outline"
            className="h-10 rounded-xl gap-2 font-bold px-4 border-border bg-card/80 hover:bg-muted cursor-pointer"
            onClick={handleAutoGenerateStandard}
          >
            <Wand2 className="size-4 text-purple-600 dark:text-purple-400" />
            Auto-Populate 5-Day Grid
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="tt-gradient-btn h-10 rounded-xl gap-2 font-bold px-4 cursor-pointer">
                <Plus className="size-4" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                  <Sparkles className="size-4" />
                  <span className="tt-eyebrow">Temporal Period Node</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Create Time Slot
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select day of week and configure start/end timestamps.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddSlot} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Day of the Week *
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Start Time (24h) *
                    </label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="rounded-xl border-border bg-muted/40 focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      End Time (24h) *
                    </label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="rounded-xl border-border bg-muted/40 focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="tt-gradient-btn rounded-xl font-bold"
                  >
                    {submitting ? "Saving..." : "Save Time Slot"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Edit Time Slot Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#8B5CF6] mb-1">
                <Pencil className="size-4" />
                <span className="tt-eyebrow">Modify Slot</span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Time Slot
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update day of week or period start/end time.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateSlot} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Day of the Week *
                </label>
                <select
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={editDayOfWeek}
                  onChange={(e) => setEditDayOfWeek(e.target.value)}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Start Time (24h) *
                  </label>
                  <Input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    End Time (24h) *
                  </label>
                  <Input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    required
                    className="rounded-xl border-border bg-muted/40 focus:border-primary font-mono"
                  />
                </div>
              </div>

              {editError && <p className="text-xs text-red-500">{editError}</p>}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingEdit || !editStartTime.trim() || !editEndTime.trim()}
                  className="tt-gradient-btn rounded-xl font-bold"
                >
                  {submittingEdit ? "Updating..." : "Update Time Slot"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <GlassPanel className="overflow-hidden p-0 shadow-sm border-border">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 bg-card/40">
            <div>
              <h3 className="text-base font-bold text-foreground">Active Time Grid Intervals</h3>
              <p className="text-xs text-muted-foreground">
                {slots.length} {slots.length === 1 ? "interval" : "intervals"} defined
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState text="Loading time slots..." />
            ) : slots.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No time slots configured"
                description='Click "Auto-Populate 5-Day Grid" to instantly generate standard 09:00-16:00 lecture periods.'
              >
                <Button onClick={handleAutoGenerateStandard} className="rounded-xl font-semibold bg-primary text-primary-foreground">
                  Auto-Populate Standard Grid
                </Button>
              </EmptyState>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground w-20">Sl. No.</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Day of Week</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Period Window</TableHead>
                      <TableHead className="text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot, index) => (
                      <TableRow key={slot.id} className="border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-lg bg-purple-500/10 border border-purple-500/30 px-3 py-1 font-bold text-xs text-purple-700 dark:text-purple-300">
                            {slot.day_of_week}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-foreground">
                          {slot.start_time} — {slot.end_time}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => openEditModal(slot)}
                              title="Edit time slot"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              onClick={() => handleDelete(slot.id)}
                              title="Delete slot"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
