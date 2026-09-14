"use client";

import { Download, Eye, FileUp, KeyRound, Pause, Play, RotateCcw, Send, Square, UserCheck, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AdminSession } from "@/lib/auth";
import type { DashboardSnapshot } from "@/lib/admin-data";

export function AdminDashboard({ snapshot }: { snapshot: DashboardSnapshot; admin: AdminSession }) {
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => window.location.reload(), 15000);
    return () => window.clearInterval(interval);
  }, []);

  async function post(url: string, body?: unknown, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = await response.json().catch(() => ({}));
    if (data.code) {
      setFreshCode(data.code);
      window.alert(`New examination code: ${data.code}`);
      return;
    }
    if (!response.ok) {
      window.alert(data.message ?? "Action failed.");
      return;
    }
    window.location.reload();
  }

  async function importStudents(file?: File) {
    if (!file) return;
    setImportStatus("Importing...");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/students/import", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setImportStatus(data.message ?? "Import failed.");
      return;
    }
    setImportStatus(`Imported ${data.imported} students.`);
    window.setTimeout(() => window.location.reload(), 800);
  }

  const exam = snapshot.exam;

  return (
    <main className="min-h-screen bg-[#eef1f4] px-6 py-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-ink">{exam?.title ?? "No exam created"}</h1>
            <p className="mt-1 text-sm text-slate-600">Professor dashboard - live monitoring</p>
          </div>
          {exam ? (
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => importStudents(event.target.files?.[0])}
              />
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium">
                <FileUp className="h-4 w-4" /> Import CSV
              </button>
              <button onClick={() => post(`/api/admin/exams/${exam.id}/code`)} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium">
                <KeyRound className="h-4 w-4" /> Regenerate Code
              </button>
              <button onClick={() => post(`/api/admin/exams/${exam.id}/start`)} className="inline-flex items-center gap-2 rounded bg-success px-3 py-2 text-sm font-medium text-white">
                <Play className="h-4 w-4" /> Start
              </button>
              <button onClick={() => post(`/api/admin/exams/${exam.id}/pause`)} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium">
                <Pause className="h-4 w-4" /> Pause
              </button>
              <button onClick={() => post(`/api/admin/exams/${exam.id}/resume`)} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium">
                <Play className="h-4 w-4" /> Resume
              </button>
              <button onClick={() => post(`/api/admin/exams/${exam.id}/complete`, {}, "End this exam and complete all active attempts?")} className="inline-flex items-center gap-2 rounded bg-accent px-3 py-2 text-sm font-medium text-white">
                <Square className="h-4 w-4" /> End
              </button>
              <a href={`/api/admin/exams/${exam.id}/export`} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium">
                <Download className="h-4 w-4" /> Export
              </a>
            </div>
          ) : null}
        </div>

        {importStatus ? <p className="mt-3 text-sm text-slate-700">{importStatus}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          {[
            ["Status", exam?.status ?? "-"],
            ["Access Code", freshCode ?? snapshot.accessCodeDisplay],
            ["Students", snapshot.metrics.students],
            ["Activated", snapshot.metrics.activated],
            ["Started", snapshot.metrics.started],
            ["Submitted", snapshot.metrics.submitted]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded border border-line bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel">
              <tr>
                <th className="px-4 py-3">PRN</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Seat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.students.map((student) => (
                <tr key={student.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{student.prn}</td>
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3">{student.seatNumber}</td>
                  <td className="px-4 py-3">{student.status}</td>
                  <td className="px-4 py-3">{student.startTime ?? "-"}</td>
                  <td className="px-4 py-3">{student.lastActivity ?? "-"}</td>
                  <td className="px-4 py-3">{student.remaining ?? "-"}</td>
                  <td className="px-4 py-3">{student.score}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button title="Activate" onClick={() => post(`/api/admin/students/${student.id}/activate`, { examId: exam?.id })} className="rounded border border-line p-2">
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button title="Deactivate" onClick={() => post(`/api/admin/students/${student.id}/deactivate`, { examId: exam?.id }, "Deactivate this student before they start?")} className="rounded border border-line p-2">
                        <UserX className="h-4 w-4" />
                      </button>
                      <button title="Reset session" onClick={() => post(`/api/admin/students/${student.id}/reset-session`, { examId: exam?.id }, "Reset this student's active session?")} className="rounded border border-line p-2">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button title="Force submit" onClick={() => post(`/api/admin/students/${student.id}/force-submit`, { examId: exam?.id }, "Force submit this student's active attempt?")} className="rounded border border-line p-2">
                        <Send className="h-4 w-4" />
                      </button>
                      {student.attemptId ? (
                        <a title="View result" href={`/results/${student.attemptId}`} className="rounded border border-line p-2">
                          <Eye className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
