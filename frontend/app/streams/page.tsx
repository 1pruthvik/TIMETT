"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Layers, Plus, Trash2, GitMerge, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface Stream {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}


interface CycleGroup {
  id: number;
  name: string;
  cycle_type: "physics" | "chemistry";
  stream_id: number;
  created_at: string;
}

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [cycleGroups, setCycleGroups] = useState<CycleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamName, setStreamName] = useState("");
  const [streamCode, setStreamCode] = useState("");
  const [streamDesc, setStreamDesc] = useState("");
  const [cycleName, setCycleName] = useState("");
  const [cycleType, setCycleType] = useState<"physics" | "chemistry">("physics");
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [jointSem1, setJointSem1] = useState("1");
  const [jointSem2, setJointSem2] = useState("2");
  const [jointStatus, setJointStatus] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resS, resC] = await Promise.all([
        fetch("http://127.0.0.1:8000/streams").catch(() => null),
        fetch("http://127.0.0.1:8000/cycle-groups").catch(() => null),
      ]);
      if (resS && resS.ok) setStreams(await resS.json().catch(() => []));
      if (resC && resC.ok) setCycleGroups(await resC.json().catch(() => []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamName || !streamCode) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: streamName, code: streamCode, description: streamDesc }),
      }).catch(() => null);
      if (res && res.ok) {
        setStreamName("");
        setStreamCode("");
        setStreamDesc("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCycleGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || !selectedStreamId) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/cycle-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cycleName, cycle_type: cycleType, stream_id: selectedStreamId }),
      }).catch(() => null);
      if (res && res.ok) {
        setCycleName("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStream = async (id: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/streams/${id}`, { method: "DELETE" }).catch(() => null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerJointGeneration = async () => {
    setGenerating(true);
    setJointStatus(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/generator/generate-joint?sem1_id=${jointSem1}&sem2_id=${jointSem2}`,
        { method: "POST" }
      ).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (res && res.ok && data?.status === "success") {
        setJointStatus(`Success! Joint timetables created for Semester ${jointSem1} and Semester ${jointSem2}.`);
      } else {
        setJointStatus(`Generation infeasible or failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      setJointStatus("Failed to reach solver API.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="1st-Year Streams & Cycle Groups"
        description="Configure Physics & Chemistry cycle syllabus streams and trigger joint two-semester solver passes."
        icon={Layers}
      />

      {/* Joint 2-Semester Solver Generator Card */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <GitMerge className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Joint Two-Semester Cycle Solver</h2>
            <p className="text-sm text-muted-foreground">
              Generates mirrored Physics-Cycle & Chemistry-Cycle schedules simultaneously across Semesters 1 & 2.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Semester 1 ID</label>
            <input
              type="number"
              min="0"
              value={jointSem1}
              onChange={(e) => setJointSem1(e.target.value === "" ? "" : String(Math.max(0, parseInt(e.target.value, 10) || 0)))}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Semester 2 ID</label>
            <input
              type="number"
              min="0"
              value={jointSem2}
              onChange={(e) => setJointSem2(e.target.value === "" ? "" : String(Math.max(0, parseInt(e.target.value, 10) || 0)))}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleTriggerJointGeneration}
            disabled={generating}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <GitMerge className="h-4 w-4" />
            )}
            <span>{generating ? "Solving..." : "Run Joint Solver"}</span>
          </button>
        </div>

        {jointStatus && (
          <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 text-sm ${jointStatus.startsWith("Success") ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
            {jointStatus.startsWith("Success") ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{jointStatus}</span>
          </div>
        )}
      </div>

      {/* Streams & Cycle Group Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Stream */}
        <form onSubmit={handleCreateStream} className="rounded-xl border p-5 bg-card space-y-4">
          <h3 className="font-semibold text-base flex items-center space-x-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Create 1st-Year Stream</span>
          </h3>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stream Name</label>
            <input
              type="text"
              placeholder="e.g. Engineering Physics & Chemistry Stream"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stream Code</label>
            <input
              type="text"
              placeholder="e.g. STREAM-ENG-1"
              value={streamCode}
              onChange={(e) => setStreamCode(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <input
              type="text"
              placeholder="Shared syllabus stream for first-year cycle groups"
              value={streamDesc}
              onChange={(e) => setStreamDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button type="submit" className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition">
            Add Stream
          </button>
        </form>

        {/* Create Cycle Group */}
        <form onSubmit={handleCreateCycleGroup} className="rounded-xl border p-5 bg-card space-y-4">
          <h3 className="font-semibold text-base flex items-center space-x-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Add Cycle Group</span>
          </h3>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Select Stream</label>
            <select
              value={selectedStreamId || ""}
              onChange={(e) => setSelectedStreamId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
              required
            >
              <option value="">Select Stream...</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Physics Cycle Group A"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cycle Type</label>
            <select
              value={cycleType}
              onChange={(e) => setCycleType(e.target.value as "physics" | "chemistry")}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary/40"
            >
              <option value="physics">Physics Cycle</option>
              <option value="chemistry">Chemistry Cycle</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedStreamId}
            className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            Add Cycle Group
          </button>
        </form>
      </div>

      {/* Streams List */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Configured Syllabus Streams</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading streams...</p>
        ) : streams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No streams configured yet.</p>
        ) : (
          <div className="space-y-4">
            {streams.map((s) => {
              const groups = cycleGroups.filter((cg) => cg.stream_id === s.id);
              return (
                <div key={s.id} className="p-4 rounded-lg border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-base">{s.name}</span>
                      <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-mono">{s.code}</span>
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {groups.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No cycle groups attached</span>
                      ) : (
                        groups.map((g) => (
                          <span
                            key={g.id}
                            className={`px-2.5 py-1 text-xs rounded-full font-medium border ${
                              g.cycle_type === "physics"
                                ? "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"
                                : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            }`}
                          >
                            {g.name} ({g.cycle_type.toUpperCase()})
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteStream(s.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition self-end md:self-center"
                    title="Delete Stream"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
