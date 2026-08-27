"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Sparkles,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Plus,
  UserCheck,
  Search,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WizardFooter } from "@/components/ui/wizard-footer";

interface FacultyItem {
  name: string;
  department: string;
}

export default function FacultiesPage() {
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("Computer Science & Engineering");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 tt-animate-fade">
        
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                Step 4 of 5
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                VTU Institutional Flow
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Available Department Faculties
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Provide professors and lecturers available across departments. You can enter names manually or upload departmental faculty lists / documents for automated extraction.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-bold">
              Total Faculty: {facultyList.length}
            </div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center space-x-3 tt-animate-fade">
            <CheckCircle2 className="h-5 w-5" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Main 2-Column Expansive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Add Form (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* File Upload Parser Dropzone */}
            <div className="border-2 border-dashed border-primary/40 rounded-3xl p-6 text-center bg-primary/5 hover:bg-primary/10 transition cursor-pointer relative shadow-inner">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp,.tiff,image/*"
                onChange={handleFacultyFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-xs">
                  {parsingFaculty ? (
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {parsingFaculty
                      ? "Interpreting Faculty Document..."
                      : "Upload Faculty Roster (PDF / DOCX / Image)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Parser extracts faculty names and departments automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Faculty Entry Card */}
            <form
              onSubmit={handleAddManualFaculty}
              className="p-6 rounded-2xl border border-border bg-card/60 space-y-4 shadow-sm"
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Manual Faculty Entry
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Faculty Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={manualDept}
                    onChange={(e) => setManualDept(e.target.value)}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Add Faculty Member</span>
              </button>
            </form>
          </div>

          {/* Right Column: Ingested Faculty Roster (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Ingested Faculty Roster ({facultyList.length})</span>
              </h3>

              {/* Search Filter */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-border bg-background/80 outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            {filteredFaculty.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground italic rounded-2xl border border-dashed border-border bg-muted/10">
                No faculty members found. Upload a roster file or add manually on the left.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {filteredFaculty.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between group hover:border-primary/40 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-foreground text-sm truncate flex items-center space-x-1.5">
                        <UserCheck className="h-4 w-4 text-primary shrink-0" />
                        <span>{f.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{f.department}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaculty(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Navigation with Scrolling Overscroll Transition */}
        <WizardFooter
          prevHref="/documents"
          nextHref="/sections"
          nextLabel="Next: Sections & Durations"
        />

      </div>
    </AppShell>
  );
}
