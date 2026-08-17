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
import { Plus, Trash2, GraduationCap, RefreshCw } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface Section {
  id: number;
  name: string;
  department_id: number;
}

interface Department {
  id: number;
  name: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userDeptId = user?.department_id;
      const userInstId = user?.institution_id;

      // 1. Fetch departments
      const deptUrl = userInstId ? `${API_BASE}/departments/?institution_id=${userInstId}` : `${API_BASE}/departments/`;
      const deptRes = await fetch(deptUrl);
      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0) {
          setDepartmentId(userDeptId || depts[0].id);
        }
      }

      // 2. Fetch sections
      const secUrl = userDeptId ? `${API_BASE}/sections/?department_id=${userDeptId}` : `${API_BASE}/sections/`;
      const secRes = await fetch(secUrl);
      if (secRes.ok) {
        const secData = await secRes.json();
        setSections(secData);
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

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !departmentId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/sections/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department_id: Number(departmentId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add section");
      }

      setName("");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating section");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      const res = await fetch(`${API_BASE}/sections/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete section", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Section Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Define student cohorts, classes, and department batch sections.
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
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Student Section</DialogTitle>
                  <DialogDescription>
                    Create a class batch (e.g. CSE-A, CSE-B, or Year 3 - Sec 1).
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddSection} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Section Name *
                    </label>
                    <Input
                      placeholder="e.g. CSE-A or 6th Sem Batch A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                    <Button type="submit" disabled={submitting || !name.trim()}>
                      {submitting ? "Saving..." : "Save Section"}
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
                <CardTitle>Registered Sections</CardTitle>
                <CardDescription>
                  {sections.length} {sections.length === 1 ? "section" : "sections"} configured in department
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading sections from database...</p>
              </div>
            ) : sections.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <GraduationCap className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No sections found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Create class sections like CSE-A or 4th Year Section 1 to assign teaching schedules.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Section Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sections.map((sec, index) => {
                      const deptName =
                        departments.find((d) => d.id === sec.department_id)?.name ||
                        `Dept #${sec.department_id}`;

                      return (
                        <TableRow key={sec.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                            #{index + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-semibold text-xs">
                              {sec.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {deptName}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(sec.id)}
                              title="Delete section"
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