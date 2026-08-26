"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Users,
  Building2,
  Trash2,
  Check,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface DocumentItem {
  id: number;
  filename: string;
  file_type: string;
  doc_type: string;
  status: string;
  uploaded_at: string;
  extracted_data?: {
    branches?: Array<{ name: string; code: string; student_count: number }>;
    subjects?: Array<{
      code: string;
      name: string;
      is_lab: boolean;
      subject_type: string;
      weekly_hours: number;
      cycle_group?: string;
    }>;
    faculty?: Array<{ name: string; designation: string }>;
  };
}

export default function DocumentIngestionPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Candidate review state
  const [candidateSubjects, setCandidateSubjects] = useState<any[]>([]);
  const [candidateFaculty, setCandidateFaculty] = useState<any[]>([]);
  const [candidateBranches, setCandidateBranches] = useState<any[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents/`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDoc) {
          selectDocument(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const selectDocument = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setSuccessMsg("");
    if (doc.extracted_data) {
      setCandidateSubjects(doc.extracted_data.subjects || []);
      setCandidateFaculty(doc.extracted_data.faculty || []);
      setCandidateBranches(doc.extracted_data.branches || []);
    } else {
      setCandidateSubjects([]);
      setCandidateFaculty([]);
      setCandidateBranches([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", "syllabus");
      formData.append("institution_id", "1");

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const createdDoc = await res.json();
        setDocuments((prev) => [createdDoc, ...prev]);
        selectDocument(createdDoc);
      }
    } catch (err) {
      console.error("Failed to upload document", err);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmCandidates = async () => {
    if (!selectedDoc) return;
    setConfirming(true);
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_BASE}/documents/${selectedDoc.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_branches: candidateBranches,
          confirmed_subjects: candidateSubjects,
          confirmed_faculty: candidateFaculty,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setSelectedDoc(updated);
        setSuccessMsg("Candidates verified and ingested into database successfully!");
      }
    } catch (err) {
      console.error("Failed to confirm candidates", err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto tt-animate-fade pb-16">
        <PageHeader
          title="VTU Document Ingestion & Candidate Review"
          icon={FileText}
        >
          <label className="tt-gradient-btn h-11 rounded-2xl gap-2 font-bold px-5 text-sm cursor-pointer shadow-lg hover:scale-105 transition-all inline-flex items-center justify-center text-white">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Upload className={`size-4 ${uploading ? "animate-spin" : ""}`} />
            {uploading ? "Extracting Candidates..." : "Upload Syllabus / Roster"}
          </label>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchDocuments}
            className="size-11 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-foreground cursor-pointer"
            title="Refresh documents"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-[#0070F3]" : ""}`} />
          </Button>
        </PageHeader>

        {/* ── Chronon AI / OCR Auxiliary Rule Notice ── */}
        <div className="p-4 rounded-2xl bg-[#0070F3]/10 border border-[#0070F3]/20 flex items-start gap-3">
          <Sparkles className="size-5 text-[#0070F3] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">
              Deterministic Ingestion & Human Review Gate
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Extracted curriculum subjects, branches, and faculty rosters are staged as candidates for human verification. They will only become authoritative scheduling inputs after you review and click <strong>&quot;Confirm & Ingest&quot;</strong>.
            </p>
          </div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          {/* Left Column: Uploaded Documents List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
              <h3 className="text-sm font-bold text-foreground">Uploaded Documents ({documents.length})</h3>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/[0.08] dark:border-white/10">
                <FileText className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-muted-foreground">
                  No documents ingested yet. Upload a VTU scheme PDF or Faculty list above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  const isConfirmed = doc.status === "CONFIRMED";

                  return (
                    <div
                      key={doc.id}
                      onClick={() => selectDocument(doc)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#0070F3]/10 border-[#0070F3]/40 shadow-xs"
                          : "bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground line-clamp-1">
                            {doc.filename}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {new Date(doc.uploaded_at).toLocaleDateString()} • {doc.file_type.toUpperCase()}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold border-0 ${
                            isConfirmed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Candidate Review & Normalization Workspace (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedDoc ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Candidate Review Workspace
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Document: <span className="font-mono text-foreground font-semibold">{selectedDoc.filename}</span>
                    </p>
                  </div>

                  <Button
                    onClick={handleConfirmCandidates}
                    disabled={confirming || selectedDoc.status === "CONFIRMED"}
                    className="tt-gradient-btn h-11 rounded-2xl px-6 font-bold gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {confirming ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" /> Ingesting...
                      </>
                    ) : selectedDoc.status === "CONFIRMED" ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-300" /> Ingested & Authoritative
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> Confirm & Ingest Candidates
                      </>
                    )}
                  </Button>
                </div>

                {successMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> {successMsg}
                  </div>
                )}

                {/* Candidate Subjects Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <BookOpen className="size-4 text-[#0070F3]" />
                    <span>Extracted Curriculum Subjects ({candidateSubjects.length})</span>
                  </div>

                  {candidateSubjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No candidate subjects detected in this document.
                    </p>
                  ) : (
                    <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-black/[0.06] dark:border-white/[0.06]">
                            <TableHead className="text-xs font-bold text-center w-28">Subject Code</TableHead>
                            <TableHead className="text-xs font-bold">Course Title</TableHead>
                            <TableHead className="text-xs font-bold text-center w-24">Type</TableHead>
                            <TableHead className="text-xs font-bold text-center w-24">Hours/Wk</TableHead>
                            <TableHead className="text-xs font-bold text-center w-28">Cycle Group</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {candidateSubjects.map((sub, idx) => (
                            <TableRow key={idx} className="border-b border-black/[0.04] dark:border-white/[0.04]">
                              <TableCell className="text-center font-mono text-xs font-bold text-[#0070F3]">
                                {sub.code}
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-foreground">
                                {sub.name}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[10px] font-bold border-0 bg-black/[0.04] dark:bg-white/[0.06]">
                                  {sub.subject_type || (sub.is_lab ? "Lab" : "Theory")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                                {sub.weekly_hours} hrs
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {sub.cycle_group || "Common"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Candidate Faculty Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Users className="size-4 text-emerald-400" />
                    <span>Extracted Faculty Members ({candidateFaculty.length})</span>
                  </div>

                  {candidateFaculty.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No faculty roster entries detected in this document.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {candidateFaculty.map((fac, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-foreground block">
                              {fac.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {fac.designation || "Assistant Professor"}
                            </span>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">
                            Candidate
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
                <FileText className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Select a document on the left
                </h4>
                <p className="text-xs text-muted-foreground">
                  Or upload a new VTU Syllabus / Faculty roster to review candidates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
