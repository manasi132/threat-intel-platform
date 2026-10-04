export default function IOCManagement() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Threat Intel Platform
            </h1>
            <p className="text-sm text-slate-400">
              IOC Management
            </p>
          </div>

          <div className="text-sm text-slate-300">
            Demo Analyst
          </div>
        </div>
      </nav>

      <section className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Indicators of Compromise
            </h2>

            <p className="mt-2 text-slate-400">
              Review and manage suspicious indicators collected from
              threat feeds.
            </p>
          </div>

          <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">
            + Add IOC
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h3 className="text-lg font-semibold">
              IOC Records
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-6 py-4 text-sm text-slate-400">
                    IOC ID
                  </th>

                  <th className="px-6 py-4 text-sm text-slate-400">
                    Value
                  </th>

                  <th className="px-6 py-4 text-sm text-slate-400">
                    Type
                  </th>

                  <th className="px-6 py-4 text-sm text-slate-400">
                    Severity
                  </th>

                  <th className="px-6 py-4 text-sm text-slate-400">
                    Source
                  </th>

                  <th className="px-6 py-4 text-sm text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-t border-slate-800">
                  <td className="px-6 py-5">
                    #1
                  </td>

                  <td className="px-6 py-5 font-mono text-sm">
                    203.0.113.50
                  </td>

                  <td className="px-6 py-5">
                    IP
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                      High
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    Demo Threat Feed
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                      Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total IOCs
            </p>
            <p className="mt-2 text-3xl font-bold">
              1
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              High Severity
            </p>
            <p className="mt-2 text-3xl font-bold">
              1
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              IP Indicators
            </p>
            <p className="mt-2 text-3xl font-bold">
              1
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}