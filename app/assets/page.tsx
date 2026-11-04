import AppNav from "@/components/AppNav";
"use client";

import { useEffect, useState } from "react";

type AssetRow = {
  asset_id: number;
  asset_name: string;
  asset_type: string;
  ip_address: string | null;
  criticality: string;
  created_at: string;

  incident_id: number | null;
  incident_title: string | null;
  incident_severity: string | null;
  incident_status: string | null;
  ioc_value: string | null;
};

type Incident = {
  incident_id: number;
  title: string;
  severity: string;
  status: string;
  ioc_value: string;
};

type Asset = {
  asset_id: number;
  asset_name: string;
  asset_type: string;
  ip_address: string | null;
  criticality: string;
  incidents: Incident[];
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/assets")
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to load assets.");
        }

        const rows: AssetRow[] = data.assets || [];
        const grouped = new Map<number, Asset>();

        rows.forEach((row) => {
          if (!grouped.has(row.asset_id)) {
            grouped.set(row.asset_id, {
              asset_id: row.asset_id,
              asset_name: row.asset_name,
              asset_type: row.asset_type,
              ip_address: row.ip_address,
              criticality: row.criticality,
              incidents: [],
            });
          }

          const asset = grouped.get(row.asset_id)!;

          if (
            row.incident_id !== null &&
            row.incident_title &&
            row.incident_status
          ) {
            const alreadyAdded = asset.incidents.some(
              (incident) => incident.incident_id === row.incident_id
            );

            if (!alreadyAdded) {
              asset.incidents.push({
                incident_id: row.incident_id,
                title: row.incident_title,
                severity: row.incident_severity || "Unknown",
                status: row.incident_status,
                ioc_value: row.ioc_value || "—",
              });
            }
          }
        });

        setAssets(Array.from(grouped.values()));
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <><AppNav /><main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">Assets</h1>

        <p className="mt-2 text-sm text-slate-400">
          View registered assets, their criticality, and linked incidents.
        </p>

        {error && <p className="mt-4 text-rose-400">{error}</p>}

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="p-4">Asset</th>
                <th className="p-4">Type</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Criticality</th>
                <th className="p-4">Linked Incidents</th>
              </tr>
            </thead>

            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.asset_id}
                  className="border-t border-slate-800 align-top"
                >
                  <td className="p-4 font-medium">{asset.asset_name}</td>
                  <td className="p-4">{asset.asset_type}</td>
                  <td className="p-4">{asset.ip_address || "—"}</td>
                  <td className="p-4">{asset.criticality || "Medium"}</td>

                  <td className="p-4">
                    {asset.incidents.length === 0 ? (
                      <span className="text-slate-400">
                        No linked incidents
                      </span>
                    ) : (
                      <div className="space-y-3">
                        {asset.incidents.map((incident) => (
                          <div
                            key={incident.incident_id}
                            className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                          >
                            <p className="font-medium">
                              Incident #{incident.incident_id}:{" "}
                              {incident.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              IOC: {incident.ioc_value}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Severity: {incident.severity} · Status:{" "}
                              {incident.status}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {assets.length === 0 && !error && (
          <p className="mt-4 text-sm text-slate-400">No assets found.</p>
        )}
      </div>
    </main></>
  );
}