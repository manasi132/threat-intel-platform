"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Incident = { incident_id: number; title: string; severity: string; status: string; created_at?: string; reported_by?: string; ioc_count?: number; affected_asset_count?: number; alert_count?: number; };
type Alert = { alert_id: number; incident_id: number; alert_type: string; message: string; severity: string; is_read: number; created_at?: string; incident_title?: string; };

function severityClass(value: string) {
  if (value === "Critical" || value === "High") return "border-red-900 bg-red-950/50 text-red-300";
  if (value === "Medium") return "border-amber-900 bg-amber-950/40 text-amber-300";
  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function Incidents() {
  const params = useSearchParams();
  const requestedId = params.get("id");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/incidents", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to retrieve incidents.");
        return body as { incidents: Incident[]; alerts: Alert[] };
      })
      .then((body) => {
        if (!active) return;
        setIncidents(body.incidents || []);
        setAlerts(body.alerts || []);
        const firstId = body.incidents?.[0]?.incident_id ?? null;
        setSelectedId(requestedId && body.incidents?.some((item) => item.incident_id === Number(requestedId)) ? Number(requestedId) : firstId);
      })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Request failed."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestedId]);

  const selected = useMemo(() => incidents.find((item) => item.incident_id === selectedId) ?? null, [incidents, selectedId]);
  const selectedAlerts = alerts.filter((item) => item.incident_id === selectedId);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 md:px-8">
      <div><h1 className="text-2xl font-bold">Incident Management</h1><p className="mt-2 text-sm text-slate-400">Select an incident to review its status and correlated alerts.</p></div>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Incidents <span className="text-sm text-slate-400">({incidents.length})</span></h2>
          {loading && <p className="text-sm text-slate-400">Loading incidents…</p>}
          {!loading && !incidents.length && !error && <p className="text-sm text-slate-400">No incidents are available.</p>}
          <div className="space-y-2">{incidents.map((incident) => <button key={incident.incident_id} onClick={() => setSelectedId(incident.incident_id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === incident.incident_id ? "border-blue-500 bg-blue-950/40" : "border-slate-800 bg-slate-950 hover:border-slate-600"}`}><div className="flex items-start justify-between gap-2"><span className="font-medium">{incident.title}</span><span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${severityClass(incident.severity)}`}>{incident.severity}</span></div><p className="mt-2 text-xs text-slate-400">#{incident.incident_id} · {incident.status}</p></button>)}</div>
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          {!selected ? <div><h2 className="font-semibold">Incident details</h2><p className="mt-3 text-sm text-slate-400">Choose an incident from the list to view its details.</p></div> : <>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-400">Incident #{selected.incident_id}</p><h2 className="mt-1 text-xl font-bold">{selected.title}</h2></div><span className={`rounded-full border px-3 py-1 text-sm ${severityClass(selected.severity)}`}>{selected.severity}</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">{[["Status",selected.status],["IOC matches",selected.ioc_count ?? 0],["Affected assets",selected.affected_asset_count ?? 0]].map(([label,value])=><div key={label} className="rounded-lg bg-slate-950 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>
            <h3 className="mt-6 font-semibold">Related alerts</h3>
            {selectedAlerts.length === 0 ? <p className="mt-3 text-sm text-slate-400">No alerts are linked to this incident.</p> : <div className="mt-3 space-y-3">{selectedAlerts.map((alert)=><article key={alert.alert_id} className="rounded-lg border border-slate-800 bg-slate-950 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{alert.alert_type}</p><span className="text-xs text-slate-400">{alert.is_read ? "Read" : "Unread"}</span></div><p className="mt-2 text-sm text-slate-300">{alert.message}</p><p className="mt-2 text-xs text-slate-500">Severity: {alert.severity}</p></article>)}</div>}
          </>}
        </section>
      </div>
    </main>
  );
}
