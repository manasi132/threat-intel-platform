import AppNav from "@/components/AppNav";
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

type Incident = { incident_id: number; title: string; severity: string; status: string; };
type Alert = { alert_id: number; incident_id: number; alert_type: string; message: string; severity: string; is_read: number; incident_title: string; };
type DashboardData = {
  summary: { openIncidents: number; highRiskIOCs: number; affectedAssets: number; unreadAlerts: number };
  recentIncidents: Incident[];
  latestAlerts: Alert[];
};

const metrics = [
  ["openIncidents", "Open Incidents", "/incidents"],
  ["highRiskIOCs", "High-Risk IOCs", "/iocs"],
  ["affectedAssets", "Affected Assets", "/assets"],
  ["unreadAlerts", "Unread Alerts", "/alerts"],
] as const;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error || "Could not load dashboard."); return body as DashboardData; })
      .then((body) => { if (active) setData(body); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Dashboard request failed."); });
    return () => { active = false; };
  }, []);

  return (
    <><AppNav /><main className="min-h-screen">
      <AppNav />
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Security Overview</h1><p className="mt-2 text-sm text-slate-400">Monitor incidents, IOCs, assets and security alerts.</p></div>
        <Link href="/alerts" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">View incidents</Link>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([key, label, href]) => <Link key={key} href={href} className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500 hover:bg-slate-900/80"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold">{data ? data.summary[key] : "—"}</p><span className="mt-3 block text-xs text-blue-400">Open section →</span></Link>)}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent Incidents</h2><Link href="/incidents" className="text-sm text-blue-400 hover:text-blue-300">See all</Link></div>
          {!data && !error && <p className="text-sm text-slate-400">Loading incidents…</p>}
          {data?.recentIncidents.length === 0 && <p className="text-sm text-slate-400">No incidents found.</p>}
          <div className="divide-y divide-slate-800">{data?.recentIncidents.map((incident) => <Link key={incident.incident_id} href={`/incidents?id=${incident.incident_id}`} className="flex items-center justify-between gap-3 py-4 hover:bg-slate-800/40"><div><p className="font-medium">{incident.title}</p><p className="mt-1 text-xs text-slate-400">Incident #{incident.incident_id} · {incident.status}</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{incident.severity}</span></Link>)}</div>
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Latest Alerts</h2><Link href="/incidents" className="text-sm text-blue-400 hover:text-blue-300">Review alerts</Link></div>
          {!data && !error && <p className="text-sm text-slate-400">Loading alerts…</p>}
          {data?.latestAlerts.length === 0 && <p className="text-sm text-slate-400">No alerts found.</p>}
          <div className="space-y-3">{data?.latestAlerts.map((alert) => <Link key={alert.alert_id} href={`/incidents?id=${alert.incident_id}`} className="block rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-blue-500"><div className="flex justify-between gap-3"><p className="font-semibold">{alert.alert_type}</p><span className="text-xs text-slate-400">{alert.is_read ? "Read" : "Unread"}</span></div><p className="mt-2 text-sm text-slate-300">{alert.message}</p><p className="mt-2 text-xs text-slate-500">Incident #{alert.incident_id} · {alert.severity}</p></Link>)}</div>
        </section>
      </div>
      </section>
    </main></>
  );
}
