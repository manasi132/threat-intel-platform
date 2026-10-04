export default function Incidents() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Threat Intel Platform
            </h1>
            <p className="text-sm text-slate-400">
              Incident & Alert Management
            </p>
          </div>

          <div className="text-sm text-slate-300">
            Demo Analyst
          </div>
        </div>
      </nav>

      <section className="p-8">
        <h2 className="text-3xl font-bold">
          Incident Management
        </h2>

        <p className="mt-2 text-slate-400">
          Investigate incidents and review correlated security alerts.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Incident details */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Incident #4
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  IOC Trigger Test
                </h3>
              </div>

              <span className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400">
                High
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-sm text-slate-400">
                  Status
                </p>
                <p className="mt-1 font-semibold text-green-400">
                  Open
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-sm text-slate-400">
                  Reporter
                </p>
                <p className="mt-1 font-semibold">
                  Demo Analyst
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="text-sm text-slate-400">
                  Risk Score
                </p>
                <p className="mt-1 text-2xl font-bold text-red-400">
                  40
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold">
                Correlated IOC
              </h4>

              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono">
                      203.0.113.50
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      IP Indicator · Demo Threat Feed
                    </p>
                  </div>

                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                    High
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold">
                Affected Asset
              </h4>

              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold">
                  Demo Web Server
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Server · 192.0.2.10
                </p>

                <p className="mt-1 text-sm text-yellow-400">
                  Criticality: High
                </p>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-bold">
              Security Alert
            </h3>

            <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/30 p-5">
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-400">
                High
              </span>

              <h4 className="mt-5 text-lg font-semibold">
                IOC Match
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                New IOC matched an active incident.
              </p>

              <div className="mt-5 border-t border-red-900/50 pt-4 text-sm text-slate-400">
                <p>Incident: #4</p>
                <p className="mt-1">Status: Open</p>
                <p className="mt-1">Read: No</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-950 p-4">
              <p className="text-sm text-slate-400">
                Correlation Result
              </p>

              <p className="mt-2 text-sm text-slate-300">
                The IOC was linked to an active incident and an
                automatic alert was generated.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}