"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Send, Wifi, WifiOff } from "lucide-react";
import { CodeEditor } from "@/components/code-editor";
import type { AttemptWorkspace } from "@/lib/student-data";

export function ExamWorkspace({ workspace }: { workspace: AttemptWorkspace }) {
  const [activeQuestionId, setActiveQuestionId] = useState(workspace.questions[0]?.id ?? "");
  const activeQuestion = workspace.questions.find((question) => question.id === activeQuestionId) ?? workspace.questions[0];
  const [code, setCode] = useState(activeQuestion?.code ?? "");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline">("saved");
  const [result, setResult] = useState<string>("No run yet.");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const next = workspace.questions.find((question) => question.id === activeQuestionId);
    const recovered = next ? localStorage.getItem(`attempt:${workspace.attempt.id}:${next.id}`) : null;
    setCode(recovered ?? next?.code ?? "");
  }, [activeQuestionId, workspace.attempt.id, workspace.questions]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (!activeQuestion) return;
      setSaveState("saving");
      try {
        await fetch(`/api/attempts/${workspace.attempt.id}/autosave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: activeQuestion.id, code })
        });
        localStorage.setItem(`attempt:${workspace.attempt.id}:${activeQuestion.id}`, code);
        setSaveState("saved");
      } catch {
        setSaveState("offline");
      }
    }, 7000);
    return () => window.clearInterval(interval);
  }, [activeQuestion, code, workspace.attempt.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetch(`/api/attempts/${workspace.attempt.id}/heartbeat`, { method: "POST" })
        .then((response) => {
          if (response.status === 409) {
            window.location.href = `/results/${workspace.attempt.id}`;
          }
        })
        .catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [workspace.attempt.id]);

  const remainingSeconds = Math.max(0, Math.floor((new Date(workspace.attempt.deadline).getTime() - now) / 1000));
  const remaining = useMemo(() => {
    const h = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(remainingSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [remainingSeconds]);

  async function execute(mode: "RUN" | "SUBMIT") {
    if (!activeQuestion) return;
    setResult("Queued for execution...");
    const response = await fetch(`/api/attempts/${workspace.attempt.id}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: activeQuestion.id, code, mode })
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setResult(data.message ?? "Unable to queue execution.");
      return;
    }

    setResult(`Submission queued: ${data.submissionId}`);
    for (let attempt = 0; attempt < 25; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      const statusResponse = await fetch(`/api/attempts/${workspace.attempt.id}/submissions?submissionId=${data.submissionId}`);
      const statusData = await statusResponse.json();
      const submission = statusData.submission;

      if (!statusResponse.ok || !submission) {
        setResult("Unable to load execution result.");
        return;
      }

      if (submission.status === "QUEUED" || submission.status === "RUNNING") {
        setResult(`Execution ${submission.status.toLowerCase()}...`);
        continue;
      }

      setResult([
        `Status: ${submission.status}`,
        `Passed: ${submission.passedTests} / ${submission.totalTests}`,
        `Score: ${submission.score}`,
        submission.executionTime ? `Execution time: ${submission.executionTime} ms` : null,
        submission.stdout ? `\nstdout:\n${submission.stdout}` : null,
        submission.stderr ? `\nstderr:\n${submission.stderr}` : null
      ].filter(Boolean).join("\n"));
      return;
    }

    setResult("Execution is still running. Results will appear after refresh.");
  }

  return (
    <main className="grid h-screen grid-rows-[auto_1fr] bg-[#eef1f4]">
      <header className="border-b border-line bg-white px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-ink">{workspace.exam.title}</h1>
            <p className="text-xs text-slate-600">{workspace.student.name} - {workspace.student.prn}</p>
          </div>
          <div className="rounded border border-line bg-panel px-4 py-2 font-mono text-lg font-semibold text-ink">Remaining: {remaining}</div>
        </div>
        <nav className="mt-3 flex gap-2">
          {workspace.questions.map((question, index) => (
            <button
              key={question.id}
              title={`${question.status} ${question.passedTests}/${question.totalTests}`}
              onClick={() => setActiveQuestionId(question.id)}
              className={`h-9 w-9 rounded border text-sm font-semibold ${
                question.id === activeQuestionId
                  ? "border-brand bg-brand text-white"
                  : question.status === "SUBMITTED"
                    ? "border-success bg-emerald-50 text-success"
                    : question.status === "ATTEMPTED"
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-line bg-white text-ink"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </nav>
      </header>
      <section className="grid min-h-0 grid-cols-[420px_1fr]">
        <aside className="exam-scrollbar overflow-auto border-r border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Question {activeQuestion?.order}</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{activeQuestion?.title}</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{activeQuestion?.description}</p>
          <div className="mt-6 rounded border border-line bg-panel p-4">
            <h3 className="font-semibold">Instructions</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{activeQuestion?.instructions}</p>
          </div>
          <div className="mt-4 rounded border border-line bg-white p-4">
            <h3 className="font-semibold">Public Tests</h3>
            <pre className="mt-2 overflow-auto text-xs text-slate-700">{JSON.stringify(activeQuestion?.publicTests, null, 2)}</pre>
          </div>
        </aside>
        <div className="grid min-h-0 grid-rows-[1fr_auto_160px]">
          <CodeEditor language={activeQuestion?.language ?? "python"} value={code} onChange={setCode} />
          <div className="flex items-center justify-between border-y border-line bg-white px-4 py-3">
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              {saveState === "offline" ? <WifiOff className="h-4 w-4 text-accent" /> : <Wifi className="h-4 w-4 text-success" />}
              {saveState === "saving" ? "Saving..." : saveState === "offline" ? "Connection lost" : "Saved"}
            </div>
            <div className="flex gap-2">
              <button disabled={remainingSeconds <= 0} onClick={() => execute("RUN")} className="inline-flex items-center gap-2 rounded border border-line bg-white px-4 py-2 font-medium disabled:opacity-50">
                <Play className="h-4 w-4" /> Run Code
              </button>
              <button disabled={remainingSeconds <= 0} onClick={() => execute("SUBMIT")} className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 font-medium text-white disabled:opacity-50">
                <Send className="h-4 w-4" /> Submit Answer
              </button>
            </div>
          </div>
          <section className="overflow-auto bg-[#101820] p-4 font-mono text-sm text-slate-100">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </section>
        </div>
      </section>
    </main>
  );
}
