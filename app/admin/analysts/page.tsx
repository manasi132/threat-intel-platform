"use client";

import { useEffect, useState } from "react";

type Account = { user_id: number; full_name: string; email: string; status: string; created_at: string; role_name: string };

export default function AdminAccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/analysts").then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to load account.");
      setAccount(data.account);
    }).catch((e: Error) => setError(e.message));
  }, []);
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
    <header className="mb-8 flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">Threat Intel Platform</h1><p className="text-sm text-slate-400">Admin · My Account</p></div>
      <button onClick={signOut} className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Sign out</button>
    </header>
    <section className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">My Account</h2>
      <p className="mt-1 text-sm text-slate-400">Only your own account details are shown here.</p>
      {error && <p role="alert" className="mt-5 text-rose-400">{error}</p>}
      {!error && account && <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><dt className="text-xs text-slate-400">Name</dt><dd className="mt-1">{account.full_name}</dd></div>
        <div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-1">{account.email}</dd></div>
        <div><dt className="text-xs text-slate-400">Role</dt><dd className="mt-1">{account.role_name}</dd></div>
        <div><dt className="text-xs text-slate-400">Status</dt><dd className="mt-1">{account.status}</dd></div>
        <div><dt className="text-xs text-slate-400">Joined</dt><dd className="mt-1">{new Date(account.created_at).toLocaleDateString()}</dd></div>
      </dl>}
      {!error && !account && <p className="mt-5 text-slate-400">Account details are unavailable.</p>}
    </section>
  </main>;
}
