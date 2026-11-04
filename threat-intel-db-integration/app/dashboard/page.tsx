"use client";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import DatabaseStatus from "@/components/DatabaseStatus";

type Incident = { incident_id: number; title: string; severity: string; status: string; ioc_count: number; affected_asset_count: number; alert_count: number };
type Alert = { alert_id: number; incident_id: number; incident_title: string; alert_type: string; message: string; severity: string };
type Data = { summary: { openIncidents: number; highRiskIOCs: number; affectedAssets: number; unreadAlerts: number }; recentIncidents: Incident[]; latestAlerts: Alert[] };
const blank: Data = { summary: { openIncidents: 0, highRiskIOCs: 0, affectedAssets: 0, unreadAlerts: 0 }, recentIncidents: [], latestAlerts: [] };

export default function Dashboard() {
  const [data, setData] = useState<Data>(blank); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { const r = await fetch("/api/dashboard", { cache: "no-store" }); const b = await r.json(); if (!r.ok) throw new Error(b.details || b.error); setData(b as Data); }
    catch (e) { setError(e instanceof Error ? e.message : "Dashboard could not be loaded."); }
    finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // Start the data request when the dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  const cards: [string, number][] = [["Open Incidents", data.summary.openIncidents], ["High-Risk IOCs", data.summary.highRiskIOCs], ["Affected Assets", data.summary.affectedAssets], ["Unread Alerts", data.summary.unreadAlerts]];
  return <main className="min-h-screen bg-slate-950 text-white"><AppNav /><section className="mx-auto max-w-7xl p-5 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Security Overview</h1><p className="mt-2 text-slate-400">Dashboard values are loaded from MySQL.</p></div><button onClick={() => void load()} className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Refresh</button></div>
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="mb-3 text-sm font-semibold text-slate-300">Database connections</p><DatabaseStatus /></div>
    {error ? <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">{error}</p> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-6"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold">{loading ? "…" : value}</p></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-lg font-semibold">Recent Incidents</h2>{loading ? <p className="mt-4 text-slate-400">Loading…</p> : data.recentIncidents.length ? <div className="mt-4 space-y-4">{data.recentIncidents.map((i) => <div key={i.incident_id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 last:border-0"><div><p className="font-medium">{i.title}</p><p className="text-sm text-slate-400">Incident #{i.incident_id} · {i.status} · {i.ioc_count} IOC(s)</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-sm">{i.severity}</span></div>)}</div> : <p className="mt-4 text-slate-400">No incidents found.</p>}</section>
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-lg font-semibold">Latest Alerts</h2>{loading ? <p className="mt-4 text-slate-400">Loading…</p> : data.latestAlerts.length ? <div className="mt-4 space-y-4">{data.latestAlerts.map((a) => <div key={a.alert_id} className="rounded-lg border border-red-900/50 bg-red-950/20 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{a.alert_type}</p><span className="text-sm text-red-300">{a.severity}</span></div><p className="mt-2 text-sm text-slate-300">{a.message}</p><p className="mt-2 text-xs text-slate-500">Incident #{a.incident_id} · {a.incident_title}</p></div>)}</div> : <p className="mt-4 text-slate-400">No alerts found.</p>}</section></div>
  </section></main>;
}
