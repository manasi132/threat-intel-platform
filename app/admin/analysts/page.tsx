import AppNav from "@/components/AppNav";
"use client";

import { useEffect, useState } from "react";

type Account = { user_id: number; full_name: string; email: string; status: string; created_at: string; role_name: string };
type Summary = { incidents: number; assets: number; correlations: number; alerts: number };

export default function AdminAccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/analysts", { cache: "no-store" }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to load account.");
      setAccount(data.account);
      setSummary(data.summary);
    }).catch((e: Error) => setError(e.message));
  }, []);
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  const metrics = [
    ["Incidents", summary?.incidents],
    ["Assets", summary?.assets],
    ["Correlations", summary?.correlations],
    ["Alerts", summary?.alerts],
  ] as const;

  return <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
    <header className="mb-8 flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Threat Intel Platform</h1><p className="text-sm text-slate-400">Admin · My Account</p></div>
      <button onClick={signOut} className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Sign out</button>
    </header>
    <section className="max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">My Admin Account</h2>
      <p className="mt-1 text-sm text-slate-400">Account details and activity totals are scoped to your signed-in user ID.</p>
      {error && <p role="alert" className="mt-5 text-rose-400">{error}</p>}
      {!error && account && <>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-slate-400">Name</dt><dd className="mt-1">{account.full_name}</dd></div>
          <div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-1">{account.email}</dd></div>
          <div><dt className="text-xs text-slate-400">Role</dt><dd className="mt-1">{account.role_name}</dd></div>
          <div><dt className="text-xs text-slate-400">Status</dt><dd className="mt-1">{account.status}</dd></div>
          <div><dt className="text-xs text-slate-400">Joined</dt><dd className="mt-1">{new Date(account.created_at).toLocaleDateString()}</dd></div>
        </dl>
        <h3 className="mt-8 font-semibold">My Data Overview</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">My {label}</p><p className="mt-2 text-2xl font-bold">{value ?? "—"}</p></div>)}
        </div>
        <p className="mt-5 text-xs text-slate-500">These totals do not include other Admin or Analyst accounts.</p>
      </>}
      {!error && !account && <p className="mt-5 text-slate-400">Loading your account overview…</p>}
    </section>
  </main>;
}
