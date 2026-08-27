"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Plus,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

interface FacultyItem {
  name: string;
  department: string;
}

export default function FacultyPage() {
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("Computer Science & Engineering");
  const [parsingFaculty, setParsingFaculty] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vtu_faculty_list");
      if (saved) {
        setFacultyList(JSON.parse(saved));
      } else {
        const defaultFac: FacultyItem[] = [
          { name: "Dr. Pranav Bhat", department: "Computer Science & Engineering" },
          { name: "Prof. Ujwal Amar", department: "Computer Science & Engineering" },
          { name: "Prof. Pruthvik K", department: "Computer Science & Engineering" },
          { name: "Dr. Nivish Gowda", department: "Electronics & Communication Engineering" },
        ];
        setFacultyList(defaultFac);
        localStorage.setItem("vtu_faculty_list", JSON.stringify(defaultFac));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveFacultyToStorage = (updated: FacultyItem[]) => {
    try {
      localStorage.setItem("vtu_faculty_list", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFacultyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFaculty(true);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/vtu/parse-faculty", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const extracted: FacultyItem[] = data.faculties || [];
        setFacultyList((prev) => {
          const updated = [...prev, ...extracted];
          saveFacultyToStorage(updated);
          return updated;
        });
        setUploadSuccess(`Successfully parsed ${extracted.length} faculties!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsingFaculty(false);
    }
  };

  const handleAddManualFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newFac: FacultyItem = {
      name: manualName.trim(),
      department: manualDept.trim() || "Computer Science & Engineering",
    };

    setFacultyList((prev) => {
      const updated = [...prev, newFac];
      saveFacultyToStorage(updated);
      return updated;
    });

    setManualName("");
  };

  const handleRemoveFaculty = (index: number) => {
    setFacultyList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveFacultyToStorage(updated);
      return updated;
    });
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 tt-animate-fade">
        <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card/85 backdrop-blur-xl shadow-2xl overflow-hidden my-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-muted/20">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Automated Timetable Setup Wizard
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Step 4 of 5 — VTU Institutional Flow
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                Total Faculty: {facultyList.length}
              </span>
            </div>
          </div>

          {/* Wizard Progress Bar */}
          <div className="w-full bg-muted/40 h-1">
            <div
              className="bg-gradient-to-r from-primary to-[#00A3FF] h-full transition-all duration-500 shadow-[0_0_12px_rgba(0,102,255,0.8)]"
              style={{ width: "80%" }}
            />
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-border/50 pb-4 space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                4. Available Department Faculties
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter faculty names manually or upload a PDF / Word document / photo of the faculty roster.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: File Upload & Manual Form */}
              <div className="space-y-4">
                {/* File Upload Box */}
                <div className="border-2 border-dashed border-primary/40 rounded-xl p-5 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative shadow-inner">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp,.tiff,image/*"
                    onChange={handleFacultyFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      {parsingFaculty ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {parsingFaculty
                        ? "Extracting Faculty Roster..."
                        : "Upload Faculty List (PDF / DOCX / Image)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Parser extracts names and departments automatically
                    </p>
                  </div>
                </div>

                {/* Manual Entry Form */}
                <form
                  onSubmit={handleAddManualFaculty}
                  className="rounded-xl border border-border bg-card/90 p-4 space-y-3 shadow-xs"
                >
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Manual Faculty Entry
                  </h4>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="Faculty Name (e.g. Dr. Rajesh Sharma)"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Department (e.g. Computer Science & Engineering)"
                      value={manualDept}
                      onChange={(e) => setManualDept(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-9 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Faculty Member</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Ingested Faculty List */}
              <div className="rounded-xl border border-border bg-card/90 p-4 space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Ingested Department Faculty ({facultyList.length})</span>
                  </h4>
                </div>

                {uploadSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {facultyList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground italic">
                    No faculty added yet. Upload a roster file or add manually on the left.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                    {facultyList.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-foreground truncate flex items-center space-x-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{f.name}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{f.department}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFaculty(idx)}
                          className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <Link href="/documents">
              <button
                type="button"
                className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background/60 hover:bg-muted transition cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous: Document Ingestion</span>
              </button>
            </Link>

            <Link href="/rooms">
              <button
                type="button"
                className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold rounded-xl tt-gradient-btn text-white shadow-lg hover:scale-105 transition cursor-pointer"
              >
                <span>Next: Rooms & Labs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  );
}