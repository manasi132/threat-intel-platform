"use client";

import { useState } from "react";

type Mode = "signin" | "signup";

export default function Home() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const signup = mode === "signup";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    if (signup && password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(signup ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Unable to continue. Please try again.");
        return;
      }
      if (signup) {
        setMessage("Account created. Sign in with your new credentials.");
        setMode("signin");
        setPassword("");
        setConfirm("");
      } else {
        window.location.href = data.user?.role === "Admin" ? "/admin/analysts" : "/dashboard";
      }
    } catch {
      setMessage("Could not reach the server. Check that the app is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">TI</div>
          <h1 className="text-3xl font-bold text-white">Threat Intel Platform</h1>
          <p className="mt-2 text-slate-400">Threat Intelligence &amp; IOC Correlation</p>
        </div>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-950 p-1">
            {(["signin", "signup"] as Mode[]).map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setMessage(""); }}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === item ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {item === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-white">{signup ? "Create Analyst Account" : "Analyst Login"}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-400">{signup ? "Create an analyst account to get started." : "Sign in to access the security dashboard."}</p>
          <form onSubmit={submit}>
            {signup && <>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={100} placeholder="Your full name" className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
            </>}
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={150} placeholder="analyst@example.com" className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 10 : 1} placeholder={signup ? "At least 10 characters" : "Enter your password"} className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
            {signup && <>
              <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-300">Confirm Password</label>
              <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={10} autoComplete="new-password" placeholder="Re-enter password" className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
            </>}
            {message && <p role="status" className="mb-4 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">{message}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">{busy ? "Please wait..." : signup ? "Create Account" : "Sign In"}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">{signup ? "Already registered?" : "New analyst?"}{" "}
            <button type="button" onClick={() => { setMode(signup ? "signin" : "signup"); setMessage(""); }} className="font-semibold text-blue-400 hover:text-blue-300">{signup ? "Sign In" : "Create an account"}</button>
          </p>
        </section>
        <p className="mt-6 text-center text-xs text-slate-500">Threat Intel &amp; IOC Correlation Platform</p>
      </div>
    </main>
  );
}
