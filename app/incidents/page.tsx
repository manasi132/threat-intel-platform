"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Incident = {
  incident_id: number;
  title: string;
  severity: string;
  status: string;
  created_at?: string;
  reported_by?: string;
  ioc_count?: number;
  affected_asset_count?: number;
  alert_count?: number;
};

type Alert = {
  alert_id: number;
  incident_id: number;
  alert_type: string;
  message: string;
  severity: string;
  is_read: number;
  created_at?: string;
  incident_title?: string;
};

type IOC = {
  ioc_id: number;
  ioc_value: string;
  ioc_type: string;
  severity?: string;
  source?: string;
};
type Correlation = {
  ioc_id: number;
  incident_id: number;
  ioc_value: string;
  ioc_type: string;
  match_reason: string;
  confidence: number;
  incident_title: string;
};

function severityClass(value: string) {
  if (value === "Critical" || value === "High")
    return "border-red-900 bg-red-950/50 text-red-300";
  if (value === "Medium")
    return "border-amber-900 bg-amber-950/40 text-amber-300";
  return "border-slate-700 bg-slate-800 text-slate-300";
}

function IncidentsContent() {
  const params = useSearchParams();
  const requestedId = params.get("id");

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [correlationError, setCorrelationError] = useState("");
  const [correlationSearch, setCorrelationSearch] = useState("");
  const [correlationType, setCorrelationType] = useState("All");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [iocId, setIocId] = useState("");
  const [matchReason, setMatchReason] = useState("");
  const [confidence, setConfidence] = useState("90");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadIncidents() {
    const response = await fetch("/api/incidents", { cache: "no-store" });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Unable to retrieve incidents.");
    }

    setIncidents(body.incidents || []);
    setAlerts(body.alerts || []);

    return body.incidents as Incident[];
  }

  async function loadIocs() {
    const response = await fetch("/api/iocs", { cache: "no-store" });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Unable to retrieve IOCs.");
    }

    setIocs(body.iocs || []);
  }

  useEffect(() => {
    let active = true;

    Promise.all([loadIncidents(), loadIocs(), loadCorrelations()])
        .then(([loadedIncidents]) => {
        if (!active) return;

        const firstId = loadedIncidents?.[0]?.incident_id ?? null;
        const requested = Number(requestedId);

        setSelectedId(
          requestedId &&
            loadedIncidents?.some((item) => item.incident_id === requested)
            ? requested
            : firstId
        );
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Request failed.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestedId]);

  const selected = useMemo(
    () => incidents.find((item) => item.incident_id === selectedId) ?? null,
    [incidents, selectedId]
  );

  const selectedAlerts = alerts.filter(
    (item) => item.incident_id === selectedId
  );


  const filteredCorrelations = correlations.filter((correlation) => {
    const search = correlationSearch.trim().toLowerCase();

    const iocValue = String(correlation.ioc_value ?? "").toLowerCase();
    const incidentTitle = String(correlation.incident_title ?? "").toLowerCase();
    const matchReasonValue = String(correlation.match_reason ?? "").toLowerCase();

    const matchesSearch =
      !search ||
      iocValue.includes(search) ||
      incidentTitle.includes(search) ||
      matchReasonValue.includes(search);

    const matchesType =
      correlationType === "All" || correlation.ioc_type === correlationType;

    return matchesSearch && matchesType;
  });
  async function loadCorrelations() {
  const response = await fetch("/api/correlations", {
    cache: "no-store",
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Unable to retrieve correlations.");
  }

  setCorrelations(body.correlations || []);
}


  async function handleCorrelationSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedId) {
      setError("Select an incident first.");
      return;
    }

    if (!iocId) {
      setError("Select an IOC to correlate.");
      return;
    }

    if (!matchReason.trim()) {
      setError("Enter a reason for this correlation.");
      return;
    }

    const confidenceValue = Number(confidence);

    if (
      !Number.isFinite(confidenceValue) ||
      confidenceValue < 0 ||
      confidenceValue > 100
    ) {
      setError("Confidence must be between 0 and 100.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/correlations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iocId: Number(iocId),
          incidentId: selectedId,
          matchReason: matchReason.trim(),
          confidence: confidenceValue,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Unable to create IOC correlation.");
      }

      setSuccess(
        body.message || "IOC successfully correlated with the incident."
      );
      setMatchReason("");

      // Refresh incident counts and alerts after the correlation.
      await loadIncidents();
      await loadCorrelations();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Unable to create correlation."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold">Incident Management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Select an incident to review its status, correlate IOCs, and review
          alerts.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300"
        >
          {success}
        </p>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">
            Incidents{" "}
            <span className="text-sm text-slate-400">
              ({incidents.length})
            </span>
          </h2>

          {loading && (
            <p className="text-sm text-slate-400">Loading incidents…</p>
          )}

          {!loading && !incidents.length && !error && (
            <p className="text-sm text-slate-400">
              No incidents are available.
            </p>
          )}

          <div className="space-y-2">
            {incidents.map((incident) => (
              <button
                key={incident.incident_id}
                onClick={() => {
                  setSelectedId(incident.incident_id);
                  setError("");
                  setSuccess("");
                }}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === incident.incident_id
                    ? "border-blue-500 bg-blue-950/40"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{incident.title}</span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${severityClass(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  #{incident.incident_id} · {incident.status}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          {!selected ? (
            <div>
              <h2 className="font-semibold">Incident details</h2>
              <p className="mt-3 text-sm text-slate-400">
                Choose an incident from the list to view its details.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">
                    Incident #{selected.incident_id}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{selected.title}</h2>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-sm ${severityClass(
                    selected.severity
                  )}`}
                >
                  {selected.severity}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Status", selected.status],
                  ["IOC matches", selected.ioc_count ?? 0],
                  ["Affected assets", selected.affected_asset_count ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-950 p-4">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <h3 className="font-semibold">Correlate an IOC</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Link an indicator of compromise to this incident.
                </p>

                {iocs.length === 0 ? (
                  <p className="mt-4 text-sm text-amber-300">
                    No IOCs found. Add an IOC on the IOC Management page first.
                  </p>
                ) : (
                  <form
                    onSubmit={handleCorrelationSubmit}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="ioc-select"
                        className="mb-1 block text-sm text-slate-300"
                      >
                        IOC
                      </label>
                      <select
                        id="ioc-select"
                        value={iocId}
                        onChange={(event) => setIocId(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      >
                        <option value="">Select an IOC</option>
                        {iocs.map((ioc) => (
                          <option key={ioc.ioc_id} value={ioc.ioc_id}>
                            {ioc.ioc_type}: {ioc.ioc_value}
                            {ioc.severity ? ` (${ioc.severity})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="match-reason"
                        className="mb-1 block text-sm text-slate-300"
                      >
                        Match reason
                      </label>
                      <textarea
                        id="match-reason"
                        value={matchReason}
                        onChange={(event) => setMatchReason(event.target.value)}
                        required
                        rows={3}
                        placeholder="Explain why this IOC is related to the incident."
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confidence"
                        className="mb-1 block text-sm text-slate-300"
                      >
                        Confidence (0–100)
                      </label>
                      <input
                        id="confidence"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={confidence}
                        onChange={(event) => setConfidence(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Correlating..." : "Create Correlation"}
                    </button>
                  </form>
                )}
              </div>

              <h3 className="mt-6 font-semibold">Related alerts</h3>

              {selectedAlerts.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No alerts are linked to this incident.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {selectedAlerts.map((alert) => (
                    <article
                      key={alert.alert_id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-medium">{alert.alert_type}</p>
                        <span className="text-xs text-slate-400">
                          {alert.is_read ? "Read" : "Unread"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-300">
                        {alert.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Severity: {alert.severity}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
            <section className="mt-7 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Correlation History</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
  <input
    type="text"
    value={correlationSearch}
    onChange={(event) => setCorrelationSearch(event.target.value)}
    placeholder="Search IOC, incident, or reason..."
    className="w-full rounded-md border px-3 py-2"
  />

  <select
    value={correlationType}
    onChange={(event) => setCorrelationType(event.target.value)}
    className="rounded-md border px-3 py-2"
  >
    <option value="All">All IOC types</option>
    <option value="IP">IP</option>
    <option value="Domain">Domain</option>
    <option value="URL">URL</option>
    <option value="Hash">Hash</option>
  </select>
</div>
            <p className="mt-1 text-sm text-slate-400">
              IOCs linked to incidents, including match reasons and confidence.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCorrelations().catch((e: unknown) =>
              setCorrelationError(
                e instanceof Error ? e.message : "Unable to refresh correlations."
              )
            )}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        {correlationError && (
          <p className="mt-3 text-sm text-red-300">{correlationError}</p>
        )}

        {filteredCorrelations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No correlations found.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-3 py-3">IOC</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Incident</th>
                  <th className="px-3 py-3">Match reason</th>
                  <th className="px-3 py-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredCorrelations.map((item, index) => (
                  <tr
                    key={`${item.ioc_id}-${item.incident_id}-${index}`}
                    className="border-b border-slate-800 last:border-0"
                  >
                    <td className="px-3 py-3 font-mono text-xs">
                      {item.ioc_value}
                    </td>
                    <td className="px-3 py-3">{item.ioc_type}</td>
                    <td className="px-3 py-3">
                      <span className="text-slate-400">
                        #{item.incident_id}
                      </span>
                      <br />
                      {item.incident_title}
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {item.match_reason}
                    </td>
                    <td className="px-3 py-3">
                      {Number(item.confidence).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default function Incidents() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 md:px-8">
          <p className="text-sm text-slate-400">Loading incidents...</p>
        </main>
      }
    >
      <IncidentsContent />
    </Suspense>
  );
}
