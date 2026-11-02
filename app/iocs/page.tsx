"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type IOC = {
  ioc_id: number;
  ioc_value: string;
  ioc_type: "IP" | "Domain" | "URL" | "Hash";
  severity: "Low" | "Medium" | "High" | "Critical";
  source: string;
};

export default function IOCManagement() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [iocValue, setIocValue] = useState("");
  const [iocType, setIocType] = useState<IOC["ioc_type"]>("IP");
  const [severity, setSeverity] = useState<IOC["severity"]>("Medium");
  const [source, setSource] = useState("Demo Threat Feed");

  const loadIOCs = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/iocs", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load IOCs.");
      }

      setIocs(data.iocs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load IOCs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIOCs();
  }, [loadIOCs]);

  function resetForm() {
    setEditingId(null);
    setIocValue("");
    setIocType("IP");
    setSeverity("Medium");
    setSource("Demo Threat Feed");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        editingId ? `/api/iocs/${editingId}` : "/api/iocs",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iocValue,
            iocType,
            severity,
            source,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save IOC.");
      }

      setSuccess(editingId ? "IOC updated successfully." : "IOC saved successfully.");

      resetForm();
      setShowForm(false);
      await loadIOCs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save IOC.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(ioc: IOC) {
    setEditingId(ioc.ioc_id);
    setIocValue(ioc.ioc_value);
    setIocType(ioc.ioc_type);
    setSeverity(ioc.severity);
    setSource(ioc.source);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleDelete(ioc: IOC) {
    const confirmed = window.confirm(
      `Delete IOC #${ioc.ioc_id} (${ioc.ioc_value})?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/iocs/${ioc.ioc_id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete IOC.");
      }

      setSuccess("IOC deleted successfully.");
      await loadIOCs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete IOC.");
    }
  }

  const highSeverityCount = iocs.filter(
    (ioc) => ioc.severity === "High" || ioc.severity === "Critical"
  ).length;

  const ipCount = iocs.filter((ioc) => ioc.ioc_type === "IP").length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Threat Intel Platform</h1>
            <p className="text-sm text-slate-400">IOC Management</p>
          </div>
          <div className="text-sm text-slate-300">Demo Analyst</div>
        </div>
      </nav>

      <section className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Indicators of Compromise</h2>
            <p className="mt-2 text-slate-400">
              Review and manage suspicious indicators collected from threat feeds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");

              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            {showForm ? "Close Form" : "+ Add IOC"}
          </button>
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-5 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-300">
            {success}
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 md:grid-cols-2"
          >
            <h3 className="text-lg font-semibold md:col-span-2">
              {editingId ? "Edit IOC" : "Add New IOC"}
            </h3>

            <label className="text-sm text-slate-300">
              IOC Value
              <input
                required
                maxLength={255}
                value={iocValue}
                onChange={(event) => setIocValue(event.target.value)}
                placeholder="e.g. 198.51.100.77"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
              />
            </label>

            <label className="text-sm text-slate-300">
              IOC Type
              <select
                value={iocType}
                onChange={(event) =>
                  setIocType(event.target.value as IOC["ioc_type"])
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
              >
                <option value="IP">IP</option>
                <option value="Domain">Domain</option>
                <option value="URL">URL</option>
                <option value="Hash">Hash</option>
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Severity
              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as IOC["severity"])
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Source
              <input
                required
                maxLength={100}
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
              />
            </label>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold hover:bg-green-500 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update IOC"
                  : "Save IOC"}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h3 className="text-lg font-semibold">IOC Records</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950">
                <tr>
                  {[
                    "IOC ID",
                    "Value",
                    "Type",
                    "Severity",
                    "Source",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-sm text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-slate-400">
                      Loading IOC records...
                    </td>
                  </tr>
                ) : iocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-slate-400">
                      No IOC records found.
                    </td>
                  </tr>
                ) : (
                  iocs.map((ioc) => (
                    <tr key={ioc.ioc_id} className="border-t border-slate-800">
                      <td className="px-6 py-5">#{ioc.ioc_id}</td>
                      <td className="px-6 py-5 font-mono text-sm">
                        {ioc.ioc_value}
                      </td>
                      <td className="px-6 py-5">{ioc.ioc_type}</td>
                      <td className="px-6 py-5">{ioc.severity}</td>
                      <td className="px-6 py-5">{ioc.source}</td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                          Active
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(ioc)}
                            className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-500"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(ioc)}
                            className="rounded bg-red-600 px-3 py-1 text-sm hover:bg-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Total IOCs</p>
            <p className="mt-2 text-3xl font-bold">{iocs.length}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">High / Critical Severity</p>
            <p className="mt-2 text-3xl font-bold">{highSeverityCount}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">IP Indicators</p>
            <p className="mt-2 text-3xl font-bold">{ipCount}</p>
          </div>
        </div>
      </section>
    </main>
  );
}