"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Clock, CalendarDays, RefreshCw, Wand2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

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
  const [open, setOpen] = useState(false);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/time-slots/`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch time slots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayOfWeek || !startTime || !endTime) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/time-slots/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
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

  const handleQuickStandardSetup = async () => {
    setSubmitting(true);
    try {
      const standard = [
        { day_of_week: "Monday", start_time: "09:00", end_time: "10:00" },
        { day_of_week: "Monday", start_time: "10:00", end_time: "11:00" },
        { day_of_week: "Monday", start_time: "11:15", end_time: "12:15" },
        { day_of_week: "Monday", start_time: "14:00", end_time: "15:00" },
        { day_of_week: "Tuesday", start_time: "09:00", end_time: "10:00" },
        { day_of_week: "Tuesday", start_time: "10:00", end_time: "11:00" },
        { day_of_week: "Tuesday", start_time: "11:15", end_time: "12:15" },
        { day_of_week: "Tuesday", start_time: "14:00", end_time: "15:00" },
        { day_of_week: "Wednesday", start_time: "09:00", end_time: "10:00" },
        { day_of_week: "Wednesday", start_time: "10:00", end_time: "11:00" },
        { day_of_week: "Wednesday", start_time: "11:15", end_time: "12:15" },
        { day_of_week: "Thursday", start_time: "09:00", end_time: "10:00" },
        { day_of_week: "Thursday", start_time: "10:00", end_time: "11:00" },
        { day_of_week: "Friday", start_time: "09:00", end_time: "10:00" },
        { day_of_week: "Friday", start_time: "10:00", end_time: "11:00" },
      ];

      for (const s of standard) {
        await fetch(`${API_BASE}/time-slots/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
      }
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
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
      console.error("Failed to delete time slot", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Time Slots & Working Periods</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure daily lecture periods, laboratory slots, and college timings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            {slots.length === 0 && (
              <Button variant="secondary" className="gap-2" onClick={handleQuickStandardSetup} disabled={submitting}>
                <Wand2 className="size-4" />
                Add Standard Mon-Fri Periods
              </Button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Time Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Period / Slot</DialogTitle>
                  <DialogDescription>
                    Define the day and timing for class scheduling.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddSlot} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Day of the Week *
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Start Time *
                      </label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        End Time *
                      </label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Saving..." : "Save Time Slot"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schedule Periods Matrix</CardTitle>
                <CardDescription>
                  {slots.length} {slots.length === 1 ? "period" : "periods"} available across weekly timetable
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading schedule slots...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Clock className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No time slots created</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Add period timings or click "Add Standard Mon-Fri Periods" to generate college timings.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Period Window</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {slots.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{s.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="font-medium text-xs">
                            {s.day_of_week}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <Clock className="size-3.5 text-muted-foreground" />
                            <span>
                              {s.start_time} - {s.end_time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(s.id)}
                            title="Delete slot"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
