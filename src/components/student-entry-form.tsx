"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

type VerifyResponse = {
  ok: boolean;
  attemptId?: string;
  message?: string;
};

export function StudentEntryForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/student/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prn: form.get("prn"),
        email: form.get("email"),
        code: form.get("code")
      })
    });
    const data = (await response.json()) as VerifyResponse;
    setLoading(false);

    if (!response.ok || !data.ok || !data.attemptId) {
      setError(data.message ?? "Unable to verify examination access.");
      return;
    }

    window.location.href = `/exam/${data.attemptId}`;
  }

  return (
    <form onSubmit={onSubmit} className="rounded border border-line bg-white p-6 shadow-soft">
      <h2 className="text-xl font-semibold text-ink">Enter examination</h2>
      <div className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          PRN
          <input name="prn" required className="mt-1 w-full rounded border border-line px-3 py-2" autoComplete="off" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          College email
          <input name="email" type="email" required className="mt-1 w-full rounded border border-line px-3 py-2" autoComplete="email" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          6-digit access code
          <input name="code" inputMode="numeric" pattern="[0-9]{6}" required className="mt-1 w-full rounded border border-line px-3 py-2 tracking-[0.25em]" autoComplete="one-time-code" />
        </label>
      </div>
      {error ? <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 font-medium text-white disabled:opacity-60">
        <LogIn className="h-4 w-4" />
        {loading ? "Verifying..." : "Start"}
      </button>
    </form>
  );
}
