"use client";

import { useEffect, useState } from "react";

type Health = { mysql: string; mongodb: string; error?: string };

function Pill({ label, status }: { label: string; status?: string }) {
  const connected = status === "connected";
  return <span className={`rounded-full border px-3 py-1 text-xs ${connected ? "border-emerald-800 bg-emerald-950/50 text-emerald-300" : "border-amber-800 bg-amber-950/40 text-amber-200"}`}>{label}: {status || "checking"}</span>;
}

export default function DatabaseStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/health", { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (active) setHealth(body); })
      .catch(() => { if (active) setHealth({ mysql: "disconnected", mongodb: "disconnected", error: "Could not contact health endpoint." }); });
    return () => { active = false; };
  }, []);
  return <div className="flex flex-wrap items-center gap-2"><Pill label="MySQL" status={health?.mysql} /><Pill label="MongoDB" status={health?.mongodb} />{health?.error ? <span className="text-xs text-amber-200">{health.error}</span> : null}</div>;
}
