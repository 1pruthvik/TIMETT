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
import { Plus, Trash2, BookOpen, RefreshCw } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface Subject {
  id: number;
  name: string;
  code: string;
  department_id: number;
}

interface Department {
  id: number;
  name: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch departments
      const deptRes = await fetch(`${API_BASE}/departments/`);
      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) {
          setDepartmentId(depts[0].id);
        }
      }

      // 2. Fetch subjects
      const subRes = await fetch(`${API_BASE}/subjects/`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData);
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !departmentId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          department_id: Number(departmentId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add subject");
      }

      setName("");
      setCode("");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      const res = await fetch(`${API_BASE}/subjects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete subject", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Subject Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add courses, curriculum codes, and department mappings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} title="Refresh">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Enter subject name, course code, and assign department.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddSubject} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Subject Name *
                    </label>
                    <Input
                      placeholder="e.g. Data Structures & Algorithms"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Subject Code *
                    </label>
                    <Input
                      placeholder="e.g. CS201"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Department *
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      required
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={submitting || !name.trim() || !code.trim()}>
                      {submitting ? "Saving..." : "Save Subject"}
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
                <CardTitle>Course Catalog</CardTitle>
                <CardDescription>
                  {subjects.length} {subjects.length === 1 ? "subject" : "subjects"} in curriculum
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading course records from database...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <BookOpen className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No subjects found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Add subjects like Operating Systems, Mathematics, or DBMS using the "Add Subject" button.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {subjects.map((sub) => {
                      const deptName =
                        departments.find((d) => d.id === sub.department_id)?.name ||
                        `Dept #${sub.department_id}`;

                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {sub.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {deptName}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(sub.id)}
                              title="Delete subject"
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}