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
import { Plus, Trash2, Users, RefreshCw } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

interface FacultyMember {
  id: number;
  name: string;
  department_id: number;
  designation?: string | null;
}

interface Department {
  id: number;
  name: string;
  institution_id: number;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch departments first
      const deptRes = await fetch(`${API_BASE}/departments/`);
      let depts: Department[] = [];
      if (deptRes.ok) {
        depts = await deptRes.json();
        setDepartments(depts);
      }

      // If no departments exist yet, automatically check or create a default institution & department
      if (depts.length === 0) {
        let instId = 1;
        const instRes = await fetch(`${API_BASE}/institutions/`);
        if (instRes.ok) {
          const insts = await instRes.json();
          if (insts.length > 0) {
            instId = insts[0].id;
          } else {
            const createInst = await fetch(`${API_BASE}/institutions/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "College of Engineering" }),
            });
            if (createInst.ok) {
              const newInst = await createInst.json();
              instId = newInst.id;
            }
          }
        }

        const createDept = await fetch(`${API_BASE}/departments/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Computer Science & Engineering",
            institution_id: instId,
          }),
        });
        if (createDept.ok) {
          const newDept = await createDept.json();
          depts = [newDept];
          setDepartments(depts);
        }
      }

      if (depts.length > 0) {
        setDepartmentId(depts[0].id);
      }

      // 2. Fetch faculty list
      const facRes = await fetch(`${API_BASE}/faculty/`);
      if (facRes.ok) {
        const facData = await facRes.json();
        setFaculty(facData);
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

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !departmentId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/faculty/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          designation: designation.trim() || null,
          department_id: Number(departmentId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add faculty member");
      }

      setName("");
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating faculty member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this faculty member?")) return;

    try {
      const res = await fetch(`${API_BASE}/faculty/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFaculty((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete faculty", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Faculty Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, organize, and manage teaching staff and their department assignments.
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
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Faculty Member</DialogTitle>
                  <DialogDescription>
                    Enter faculty details to assign them to academic subjects and schedules.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFaculty} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Dr. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Designation
                    </label>
                    <Input
                      placeholder="e.g. Associate Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
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
                      {submitting ? "Saving..." : "Save Faculty"}
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
                <CardTitle>Faculty Directory</CardTitle>
                <CardDescription>
                  {faculty.length} {faculty.length === 1 ? "member" : "members"} registered in database
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <p>Loading faculty records from database...</p>
              </div>
            ) : faculty.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Users className="size-6" />
                </div>
                <h3 className="text-sm font-medium">No faculty members found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Get started by adding your first faculty member using the "Add Faculty" button above.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {faculty.map((member) => {
                      const deptName =
                        departments.find((d) => d.id === member.department_id)?.name ||
                        `Dept #${member.department_id}`;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{member.id}
                          </TableCell>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-xs">
                              {member.designation || "Faculty"}
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
                              onClick={() => handleDelete(member.id)}
                              title="Delete faculty"
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