"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminMfaPage() {
  const router = useRouter();
  const [state, setState] = useState<{ enrolled?: boolean; secret?: string; uri?: string }>({});
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/admin/mfa", { cache: "no-store" }).then(async (r) => { const p = await r.json(); if (!r.ok) throw new Error(p.error); setState(p); }).catch((e) => setError(e.message)); }, []);
  async function verify() {
    setError("");
    const response = await fetch("/api/admin/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Verification failed");
    router.replace("/admin"); router.refresh();
  }
  return <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
    <section className="rounded-2xl border bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-bold">Secure administrator access</h1>
      {!state.enrolled && state.secret && <div className="mt-5 space-y-3 text-sm"><p>Add a new account in your authenticator app using this setup key:</p><code className="block break-all rounded bg-slate-100 p-3 text-base font-bold tracking-wider">{state.secret}</code><p className="text-slate-600">Account: Intimo Admin. Type: time-based. Digits: 6. Period: 30 seconds.</p></div>}
      {state.enrolled && <p className="mt-4 text-sm text-slate-600">Enter the current six-digit code from your authenticator app.</p>}
      <label className="mt-6 block text-sm font-semibold" htmlFor="totp">Authenticator code</label>
      <input id="totp" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 w-full rounded-lg border px-4 py-3 text-2xl tracking-[0.4em]" />
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <button onClick={verify} disabled={code.length !== 6} className="mt-5 rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50">Verify and continue</button>
    </section>
  </main>;
}
