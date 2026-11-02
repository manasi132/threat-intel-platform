"use client";

import { useState } from "react";

type AuthMode = "signin" | "signup";

export default function Home() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSignUp = mode === "signup";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        alert("Please enter your full name.");
        return;
      }
      if (password.length < 8) {
        alert("Please use a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        alert("The passwords do not match.");
        return;
      }

      // Registration is not connected to the database yet.
      alert("The sign-up screen is ready, but account creation still needs to be connected to the MySQL authentication API.");
      return;
    }

    // Demo sign-in behavior: real password verification is not implemented yet.
    window.location.href = "/dashboard";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            TI
          </div>

          <h1 className="text-3xl font-bold text-white">
            Threat Intel Platform
          </h1>

          <p className="mt-2 text-slate-400">
            Threat Intelligence &amp; IOC Correlation
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                !isSignUp
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              aria-pressed={!isSignUp}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isSignUp
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              aria-pressed={isSignUp}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-xl font-semibold text-white">
            {isSignUp ? "Create Analyst Account" : "Analyst Login"}
          </h2>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            {isSignUp
              ? "Register to get started with the security dashboard."
              : "Sign in to access the security dashboard."}
          </p>

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                />
              </>
            )}

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@example.com"
              className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              required
            />

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "Create a password (8+ characters)" : "Enter your password"}
              className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              minLength={isSignUp ? 8 : undefined}
              required
            />

            {isSignUp && (
              <>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  minLength={8}
                  required
                />
              </>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            {isSignUp ? "Already have an account?" : "New analyst?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignUp ? "signin" : "signup")}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              {isSignUp ? "Sign In" : "Create an account"}
            </button>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Threat Intel &amp; IOC Correlation Platform
        </p>
      </div>
    </main>
  );
}
