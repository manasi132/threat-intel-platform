"use client";

import { useEffect, useState } from "react";

type Analyst = { user_id: number; full_name: string; email: string; status: string; created_at: string; role_name: string };

export default function AnalystAdminPage() {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/analysts").then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to load analysts.");
      setAnalysts(data.analysts);
    }).catch((e: Error) => setError(e.message));
  }, []);
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
    <header className="mb-8 flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">Threat Intel Platform</h1><p className="text-sm text-slate-400">Admin · Analyst Accounts</p></div>
      <button onClick={signOut} className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Sign out</button>
    </header>
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Registered Analysts</h2>
      <p className="mt-1 text-sm text-slate-400">This list is restricted to signed-in Admin accounts.</p>
      {error && <p role="alert" className="mt-5 text-rose-400">{error}</p>}
      {!error && <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="text-slate-400"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Created</th></tr></thead>
        <tbody>{analysts.map((a) => <tr key={a.user_id} className="border-t border-slate-800"><td className="p-3">{a.full_name}</td><td className="p-3">{a.email}</td><td className="p-3">{a.status}</td><td className="p-3">{new Date(a.created_at).toLocaleDateString()}</td></tr>)}
          {analysts.length === 0 && <tr><td colSpan={4} className="p-4 text-slate-400">No analyst accounts found.</td></tr>}
        </tbody>
      </table></div>}
    </section>
  </main>;
}
