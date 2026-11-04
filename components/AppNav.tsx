"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "IOCs", href: "/iocs" },
  { label: "Incidents", href: "/incidents" },
  { label: "Assets", href: "/assets" },
  { label: "Alerts", href: "/alerts" },
  { label: "Threat Feeds", href: "/threat-feeds" },
];

export default function AppNav() {
  const [role, setRole] = useState<"Admin" | "Analyst" | null>(null);
  const [name, setName] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load account.");
        if (active) {
          setRole(data.user.role);
          setName(data.user.fullName || data.user.email);
        }
      })
      .catch(() => { if (active) setRole(null); });
    return () => { active = false; };
  }, []);
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <nav className="border-b border-slate-800 bg-slate-900 px-5 py-4 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-bold text-white">
          Threat Intel Platform
          <span className="ml-2 block text-xs font-normal text-slate-400">MySQL + MongoDB</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
              {link.label}
            </Link>
          ))}
          {role === "Admin" && <Link href="/admin/analysts" className="rounded-lg px-3 py-2 text-sm text-blue-300 hover:bg-slate-800">Admin</Link>}
          <span className="px-2 text-xs text-slate-400">{name}{role ? ` · ${role}` : ""}</span>
          <button onClick={signOut} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Sign out</button>
        </div>
      </div>
    </nav>
  );
}
