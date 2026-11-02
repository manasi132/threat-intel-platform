import Link from "next/link";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "IOCs", href: "/iocs" },
  { label: "Incidents", href: "/incidents" },
  { label: "Threat Feeds", href: "/threat-feeds" },
];

export default function AppNav() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900 px-5 py-4 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-bold text-white">
          Threat Intel Platform
          <span className="ml-2 block text-xs font-normal text-slate-400">MySQL + MongoDB</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
