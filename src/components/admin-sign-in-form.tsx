"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export function AdminSignInForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    setLoading(false);

    if (!response.ok) {
      setError("Invalid admin credentials.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded border border-line bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-semibold text-ink">Professor sign in</h1>
      <div className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded border border-line px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input name="password" type="password" required className="mt-1 w-full rounded border border-line px-3 py-2" />
        </label>
      </div>
      {error ? <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 font-medium text-white disabled:opacity-60">
        <KeyRound className="h-4 w-4" />
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
