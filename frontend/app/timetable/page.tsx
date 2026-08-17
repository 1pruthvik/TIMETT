"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Layers,
  Wand2,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_PERIODS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:15 - 12:15",
  "12:15 - 01:15",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

interface TimeSlot {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface SubjectOffering {
  id: number;
  subject_id: number;
  faculty_id: number;
  section_id: number;
  semester_id: number;
  weekly_hours: number;
}

interface TimetableEntry {
  id?: number;
  timetable_id?: number;
  subject_offering_id: number;
  room_id: number;
  time_slot_id: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Faculty {
  id: number;
  name: string;
  designation?: string;
}

interface Room {
  id: number;
  name: string;
  room_type?: string;
}

interface Section {
  id: number;
  name: string;
}

export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Entities
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  // Selected filter
  const [selectedSection, setSelectedSection] = useState<number | "ALL">("ALL");

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [slotRes, offRes, subRes, facRes, roomRes, secRes, entryRes] = await Promise.all([
        fetch(`${API_BASE}/time-slots/`),
        fetch(`${API_BASE}/subject-offerings/`),
        fetch(`${API_BASE}/subjects/`),
        fetch(`${API_BASE}/faculty/`),
        fetch(`${API_BASE}/rooms/`),
        fetch(`${API_BASE}/sections/`),
        fetch(`${API_BASE}/timetable-entries/`),
      ]);

      let loadedSlots: TimeSlot[] = [];
      let loadedOfferings: SubjectOffering[] = [];
      let loadedSubjects: Subject[] = [];
      let loadedFaculty: Faculty[] = [];
      let loadedRooms: Room[] = [];
      let loadedSections: Section[] = [];
      let loadedEntries: TimetableEntry[] = [];

      if (slotRes.ok) loadedSlots = await slotRes.json();
      if (offRes.ok) loadedOfferings = await offRes.json();
      if (subRes.ok) loadedSubjects = await subRes.json();
      if (facRes.ok) loadedFaculty = await facRes.json();
      if (roomRes.ok) loadedRooms = await roomRes.json();
      if (secRes.ok) loadedSections = await secRes.json();
      if (entryRes.ok) loadedEntries = await entryRes.json();

      setTimeSlots(loadedSlots);
      setOfferings(loadedOfferings);
      setSubjects(loadedSubjects);
      setFaculty(loadedFaculty);
      setRooms(loadedRooms);
      setSections(loadedSections);
      setEntries(loadedEntries);

      return {
        slots: loadedSlots,
        offerings: loadedOfferings,
        subjects: loadedSubjects,
        faculty: loadedFaculty,
        rooms: loadedRooms,
        sections: loadedSections,
        entries: loadedEntries,
      };
    } catch (err) {
      console.error("Error fetching timetable resources", err);
      setStatusMessage({ type: "error", text: "Failed to connect to backend server." });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Comprehensive Auto Setup and Generate Handler
  const handleGenerate = async () => {
    setGenerating(true);
    setStatusMessage({ type: "info", text: "Preparing resources & running OR-Tools CP-SAT optimizer..." });

    try {
      const current = await fetchAllData();
      if (!current) throw new Error("Could not load backend data.");

      let { slots, offerings: offs, subjects: subs, faculty: facs, rooms: rms, sections: secs } = current;

      // 1. Ensure Institution exists
      let institutionId = 1;
      const instRes = await fetch(`${API_BASE}/institutions/`);
      if (instRes.ok) {
        const insts = await instRes.json();
        if (insts.length > 0) {
          institutionId = insts[0].id;
        } else {
          const createInst = await fetch(`${API_BASE}/institutions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "College of Engineering" }),
          });
          if (createInst.ok) {
            const newInst = await createInst.json();
            institutionId = newInst.id;
          }
        }
      }

      // 2. Ensure Academic Year & Semester exist (Required Foreign Keys for SubjectOffering)
      let semesterId = 1;
      const semRes = await fetch(`${API_BASE}/semesters/`);
      if (semRes.ok) {
        const sems = await semRes.json();
        if (sems.length > 0) {
          semesterId = sems[0].id;
        } else {
          // Check Academic Year first
          let yearId = 1;
          const yrRes = await fetch(`${API_BASE}/academic-years/`);
          if (yrRes.ok) {
            const yrs = await yrRes.json();
            if (yrs.length > 0) {
              yearId = yrs[0].id;
            } else {
              const createYr = await fetch(`${API_BASE}/academic-years/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ institution_id: institutionId, name: "2026-27" }),
              });
              if (createYr.ok) {
                const newYr = await createYr.json();
                yearId = newYr.id;
              }
            }
          }

          const createSem = await fetch(`${API_BASE}/semesters/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ academic_year_id: yearId, name: "Semester 1" }),
          });
          if (createSem.ok) {
            const newSem = await createSem.json();
            semesterId = newSem.id;
          }
        }
      }

      // 3. Ensure at least one room exists
      if (rms.length === 0) {
        const createRoom = await fetch(`${API_BASE}/rooms/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ institution_id: institutionId, name: "Room 101", capacity: 60, room_type: "Classroom" }),
        });
        if (createRoom.ok) {
          rms = [await createRoom.json()];
          setRooms(rms);
        }
      }

      // 4. Ensure at least one section exists
      if (secs.length === 0) {
        const createSec = await fetch(`${API_BASE}/sections/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_id: 1, name: "CSE-A" }),
        });
        if (createSec.ok) {
          secs = [await createSec.json()];
          setSections(secs);
        }
      }

      // 5. Ensure at least one subject exists
      if (subs.length === 0) {
        const createSub = await fetch(`${API_BASE}/subjects/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_id: 1, name: "Data Structures", code: "CS201" }),
        });
        if (createSub.ok) {
          subs = [await createSub.json()];
          setSubjects(subs);
        }
      }

      // 6. Ensure at least one faculty exists
      if (facs.length === 0) {
        const createFac = await fetch(`${API_BASE}/faculty/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_id: 1, name: "Dr. Rajesh Kumar", designation: "Professor" }),
        });
        if (createFac.ok) {
          facs = [await createFac.json()];
          setFaculty(facs);
        }
      }

      // 7. Ensure TimeSlots exist (Monday through Friday)
      if (slots.length === 0) {
        const slotData = [
          { day_of_week: "Monday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Monday", start_time: "10:00", end_time: "11:00" },
          { day_of_week: "Tuesday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Tuesday", start_time: "10:00", end_time: "11:00" },
          { day_of_week: "Wednesday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Thursday", start_time: "09:00", end_time: "10:00" },
          { day_of_week: "Friday", start_time: "09:00", end_time: "10:00" },
        ];

        for (const s of slotData) {
          const res = await fetch(`${API_BASE}/time-slots/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          });
          if (res.ok) {
            slots.push(await res.json());
          }
        }
        setTimeSlots([...slots]);
      }

      // 8. Ensure SubjectOfferings exist
      if (offs.length === 0 && subs.length > 0 && facs.length > 0 && secs.length > 0) {
        for (let i = 0; i < subs.length; i++) {
          const sub = subs[i];
          const fac = facs[i % facs.length];
          const sec = secs[i % secs.length];

          const res = await fetch(`${API_BASE}/subject-offerings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject_id: sub.id,
              faculty_id: fac.id,
              section_id: sec.id,
              semester_id: semesterId,
              weekly_hours: 1,
            }),
          });
          if (res.ok) {
            offs.push(await res.json());
          }
        }
        setOfferings([...offs]);
      }

      // 9. Call OR-Tools Generator
      const genRes = await fetch(`${API_BASE}/generator/generate`, {
        method: "POST",
      });

      const data = await genRes.json();

      if (data.status === "success") {
        setEntries(data.entries);
        setStatusMessage({
          type: "success",
          text: `Timetable generated successfully! OR-Tools placed ${data.entries.length} scheduled class periods.`,
        });
        await fetchAllData();
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Optimization engine could not find a feasible schedule.",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Error running timetable optimizer." });
    } finally {
      setGenerating(false);
    }
  };

  // Helper to find entry for a specific day and time period
  const getEntryForSlot = (day: string, periodIndex: number) => {
    // 1. Find matching timeSlot in DB for this day and hour
    const slot = timeSlots.find((s) => {
      if (s.day_of_week.toLowerCase() !== day.toLowerCase()) return false;
      const startHour = s.start_time.split(":")[0];
      if (periodIndex === 0 && (startHour === "09" || startHour === "9")) return true;
      if (periodIndex === 1 && startHour === "10") return true;
      if (periodIndex === 2 && startHour === "11") return true;
      if (periodIndex === 3 && startHour === "12") return true;
      if (periodIndex === 4 && (startHour === "14" || startHour === "02" || startHour === "2")) return true;
      if (periodIndex === 5 && (startHour === "15" || startHour === "03" || startHour === "3")) return true;
      return false;
    });

    if (!slot) return null;

    // 2. Find TimetableEntry placed in this slot
    const entry = entries.find((e) => e.time_slot_id === slot.id);
    if (!entry) return null;

    // 3. Find subject offering
    const offering = offerings.find((o) => o.id === entry.subject_offering_id);
    if (!offering) return null;

    // Apply Section filter
    if (selectedSection !== "ALL" && offering.section_id !== selectedSection) {
      return null;
    }

    const sub = subjects.find((s) => s.id === offering.subject_id);
    const fac = faculty.find((f) => f.id === offering.faculty_id);
    const rm = rooms.find((r) => r.id === entry.room_id);
    const sec = sections.find((sc) => sc.id === offering.section_id);

    return {
      entry,
      subject: sub?.name || `Subject #${offering.subject_id}`,
      code: sub?.code || "SUB",
      faculty: fac?.name || `Faculty #${offering.faculty_id}`,
      room: rm?.name || `Room #${entry.room_id}`,
      section: sec?.name || `Sec #${offering.section_id}`,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        {/* Header and Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Interactive Timetable Workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Constraint-optimized schedule grid powered by Google OR-Tools CP-SAT engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchAllData} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print View
            </Button>

            <Button
              className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Wand2 className={`size-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Solving Constraints..." : "Generate Timetable"}
            </Button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`flex items-center gap-3 rounded-lg border p-4 text-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                : statusMessage.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-700"
                : "bg-blue-500/10 border-blue-500/20 text-blue-700"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="size-5 shrink-0" />
            ) : (
              <AlertCircle className="size-5 shrink-0" />
            )}
            <p>{statusMessage.text}</p>
          </div>
        )}

        {/* Section Filter and Overview Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Filter Section:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={selectedSection === "ALL" ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => setSelectedSection("ALL")}
              >
                All Sections
              </Button>
              {sections.map((sec) => (
                <Button
                  key={sec.id}
                  size="sm"
                  variant={selectedSection === sec.id ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setSelectedSection(sec.id)}
                >
                  {sec.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="size-3.5" />
              <strong>{entries.length}</strong> Assigned Classes
            </span>
            <span>•</span>
            <span>
              <strong>{rooms.length}</strong> Rooms Available
            </span>
          </div>
        </div>

        {/* Main Interactive Timetable Grid */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Master Schedule Grid</CardTitle>
                <CardDescription className="text-xs">
                  Optimal placement computed with 0 faculty, room, or section overlaps
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-background">
                OR-Tools CP-SAT
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[960px]"
                style={{
                  gridTemplateColumns: "130px repeat(5, minmax(160px, 1fr))",
                }}
              >
                {/* Header Row */}
                <div className="border-b border-r bg-muted/50 p-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Time Period
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r bg-muted/50 p-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground last:border-r-0"
                  >
                    {day}
                  </div>
                ))}

                {/* Rows */}
                {DEFAULT_PERIODS.map((period, periodIdx) => (
                  <div key={period} className="contents">
                    <div className="flex items-center justify-center border-b border-r bg-muted/20 p-3 font-mono text-xs text-muted-foreground">
                      {period}
                    </div>

                    {DAYS.map((day) => {
                      const item = getEntryForSlot(day, periodIdx);

                      return (
                        <div
                          key={`${day}-${period}`}
                          className="min-h-24 border-b border-r p-2 transition-colors hover:bg-muted/10 last:border-r-0"
                        >
                          {item ? (
                            <div className="flex h-full flex-col justify-between rounded-lg border border-primary/20 bg-primary/5 p-2.5 shadow-sm transition hover:border-primary/40 hover:bg-primary/10">
                              <div>
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px] font-bold">
                                    {item.code}
                                  </Badge>
                                  <span className="rounded bg-background/80 px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {item.section}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-1 text-xs font-semibold text-foreground">
                                  {item.subject}
                                </p>
                              </div>

                              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="line-clamp-1 font-medium">{item.faculty}</span>
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                                  {item.room}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/15 p-2 text-center">
                              <span className="text-[11px] text-muted-foreground/50">Free Slot</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}