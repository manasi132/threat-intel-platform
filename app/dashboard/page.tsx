export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Threat Intel Platform
            </h1>
            <p className="text-sm text-slate-400">
              Analyst Dashboard
            </p>
          </div>

          <div className="text-sm text-slate-300">
            Demo Analyst
          </div>
        </div>
      </nav>

      <section className="p-8">
        <h2 className="text-3xl font-bold">
          Security Overview
        </h2>

        <p className="mt-2 text-slate-400">
          Monitor incidents, IOCs, assets and security alerts.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Open Incidents</p>
            <p className="mt-2 text-3xl font-bold">2</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">High-Risk IOCs</p>
            <p className="mt-2 text-3xl font-bold">1</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Affected Assets</p>
            <p className="mt-2 text-3xl font-bold">1</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Unread Alerts</p>
            <p className="mt-2 text-3xl font-bold">1</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">
              Recent Incidents
            </h3>

            <div className="mt-5 space-y-4">
              <div className="flex justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="font-medium">
                    IOC Trigger Test
                  </p>
                  <p className="text-sm text-slate-400">
                    Incident #4
                  </p>
                </div>

                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  High
                </span>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="font-medium">
                    Suspicious Authentication Activity
                  </p>
                  <p className="text-sm text-slate-400">
                    Incident #2
                  </p>
                </div>

                <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400">
                  Medium
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">
              Latest Alert
            </h3>

            <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/30 p-5">
              <p className="font-semibold text-red-400">
                IOC Match
              </p>

              <p className="mt-2 text-sm text-slate-300">
                New IOC matched an active incident.
              </p>

              <p className="mt-3 text-xs text-slate-500">
                Incident #4 · High Severity
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
