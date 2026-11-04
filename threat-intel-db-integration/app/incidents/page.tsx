"use client";
import { useEffect, useState, type FormEvent } from "react";
import AppNav from "@/components/AppNav";
import DatabaseStatus from "@/components/DatabaseStatus";
type Incident = { incident_id: number; title: string; severity: string; status: string; reported_by: string; ioc_count: number; affected_asset_count: number; alert_count: number; created_at?: string };
type Alert = { alert_id: number; incident_id: number; incident_title: string; alert_type: string; message: string; severity: string; is_read: number | boolean };
type IOC = { ioc_id: number; ioc_value: string; ioc_type: string; severity: string };
const field = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500";
export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]); const [alerts, setAlerts] = useState<Alert[]>([]); const [iocs, setIocs] = useState<IOC[]>([]);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [severity, setSeverity] = useState("Medium");
  const [iocId, setIocId] = useState(""); const [incidentId, setIncidentId] = useState(""); const [matchReason, setMatchReason] = useState("IOC observed during incident investigation");
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const [ir, xr] = await Promise.all([fetch("/api/incidents", { cache: "no-store" }), fetch("/api/iocs", { cache: "no-store" })]);
      const ib = await ir.json(); const xb = await xr.json();
      if (!ir.ok) throw new Error(ib.details || ib.error); if (!xr.ok) throw new Error(xb.details || xb.error);
      const nextIncidents = ib.incidents as Incident[]; const nextIocs = xb.iocs as IOC[];
      setIncidents(nextIncidents); setAlerts(ib.alerts as Alert[]); setIocs(nextIocs);
      if (!incidentId && nextIncidents.length) setIncidentId(String(nextIncidents[0].incident_id));
      if (!iocId && nextIocs.length) setIocId(String(nextIocs[0].ioc_id));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load incident data."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    // Start the data request when the incidents page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function createIncident(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, severity, reporterEmail: "analyst@example.com" }) });
      const b = await r.json(); if (!r.ok) throw new Error(b.details || b.error);
      setMessage(b.message); setTitle(""); setDescription(""); await load(); setIncidentId(String(b.incidentId));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create incident."); }
    finally { setBusy(false); }
  }
  async function linkIOC(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/correlations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ iocId: Number(iocId), incidentId: Number(incidentId), matchReason, confidence: 95 }) });
      const b = await r.json(); if (!r.ok) throw new Error(b.details || b.error); setMessage(b.message); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not link IOC."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-950 text-white"><AppNav /><section className="mx-auto max-w-7xl p-5 md:p-8">
    <h1 className="text-3xl font-bold">Incident & Alert Management</h1><p className="mt-2 text-slate-400">Incidents and alerts load from MySQL. Linking an IOC inserts a relationship record and invokes the existing trigger.</p>
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4"><DatabaseStatus /></div>
    {error ? <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">{error}</p> : null}{message ? <p className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-200">{message}</p> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <form onSubmit={createIncident} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-semibold">Create an Incident</h2><label className="mt-4 block text-sm text-slate-300">Title<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className={`mt-2 ${field}`} /></label><label className="mt-4 block text-sm text-slate-300">Description<textarea value={description} onChange={e => setDescription(e.target.value)} className={`mt-2 ${field}`} rows={3} /></label><label className="mt-4 block text-sm text-slate-300">Severity<select value={severity} onChange={e => setSeverity(e.target.value)} className={`mt-2 ${field}`}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><p className="mt-3 text-xs text-slate-500">Reporter defaults to analyst@example.com. Change the email in the page code if your seeded analyst uses a different email.</p><button disabled={busy} className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold disabled:opacity-60">{busy ? "Working…" : "Create incident in MySQL"}</button></form>
      <form onSubmit={linkIOC} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-semibold">Link IOC to Incident</h2><label className="mt-4 block text-sm text-slate-300">IOC<select required value={iocId} onChange={e => setIocId(e.target.value)} className={`mt-2 ${field}`}><option value="">Choose IOC</option>{iocs.map(i => <option key={i.ioc_id} value={i.ioc_id}>#{i.ioc_id} — {i.ioc_value} ({i.severity})</option>)}</select></label><label className="mt-4 block text-sm text-slate-300">Incident<select required value={incidentId} onChange={e => setIncidentId(e.target.value)} className={`mt-2 ${field}`}><option value="">Choose incident</option>{incidents.map(i => <option key={i.incident_id} value={i.incident_id}>#{i.incident_id} — {i.title} ({i.status})</option>)}</select></label><label className="mt-4 block text-sm text-slate-300">Match reason<input value={matchReason} onChange={e => setMatchReason(e.target.value)} className={`mt-2 ${field}`} /></label><p className="mt-3 text-xs text-slate-500">For an active incident, the database trigger should create the IOC Match alert automatically.</p><button disabled={busy || !iocs.length || !incidents.length} className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold disabled:opacity-60">{busy ? "Working…" : "Link IOC in MySQL"}</button></form>
    </div>
    <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Incidents</h2><button onClick={() => void load()} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Refresh</button></div><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr>{["ID", "Title", "Severity", "Status", "Reporter", "IOCs", "Assets", "Alerts"].map(h => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{incidents.map(i => <tr key={i.incident_id} className="border-t border-slate-800"><td className="px-3 py-4">#{i.incident_id}</td><td className="px-3 py-4">{i.title}</td><td className="px-3 py-4">{i.severity}</td><td className="px-3 py-4">{i.status}</td><td className="px-3 py-4">{i.reported_by}</td><td className="px-3 py-4">{i.ioc_count}</td><td className="px-3 py-4">{i.affected_asset_count}</td><td className="px-3 py-4">{i.alert_count}</td></tr>)}{!loading && !incidents.length ? <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">No incidents in MySQL.</td></tr> : null}</tbody></table></div></section>
    <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-semibold">Recent Alerts</h2><div className="mt-4 space-y-3">{alerts.map(a => <article key={a.alert_id} className="rounded-lg border border-slate-800 bg-slate-950 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{a.alert_type} · Incident #{a.incident_id}</p><span className="text-sm text-red-300">{a.severity}</span></div><p className="mt-2 text-sm text-slate-300">{a.message}</p><p className="mt-1 text-xs text-slate-500">{a.incident_title}</p></article>)}{!loading && !alerts.length ? <p className="text-sm text-slate-400">No alerts in MySQL.</p> : null}</div></section>
  </section></main>;
}
