"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email && password) {
      window.location.href = "/dashboard";
    } else {
      alert("Please enter email and password.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            TI
          </div>

          <h1 className="text-3xl font-bold text-white">
            Threat Intel Platform
          </h1>

          <p className="mt-2 text-slate-400">
            Threat Intelligence & IOC Correlation
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
        >
          <h2 className="text-xl font-semibold text-white">
            Analyst Login
          </h2>

          <p className="mt-1 mb-6 text-sm text-slate-400">
            Sign in to access the security dashboard.
          </p>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analyst@example.com"
            className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Threat Intel & IOC Correlation Platform
        </p>
      </div>
    </main>
  );
}