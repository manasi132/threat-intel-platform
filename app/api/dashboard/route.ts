import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getMySqlPool();
    const [open] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM incidents WHERE status IN ('Open','Investigating')");
    const [highIocs] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM iocs WHERE severity IN ('High','Critical')");
    const [assets] = await db.query<RowDataPacket[]>("SELECT COUNT(DISTINCT asset_id) AS total FROM asset_ioc");
    const [unread] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM alerts WHERE is_read = 0");
    const [recentIncidents] = await db.query<RowDataPacket[]>("SELECT v.incident_id,v.title,v.severity,v.status,v.reported_by,i.created_at,v.ioc_count,v.affected_asset_count,v.alert_count FROM analyst_dashboard_v v JOIN incidents i ON i.incident_id = v.incident_id ORDER BY i.created_at DESC LIMIT 5");
    const [latestAlerts] = await db.query<RowDataPacket[]>("SELECT a.alert_id,a.incident_id,a.alert_type,a.message,a.severity,a.is_read,a.created_at,i.title AS incident_title FROM alerts a JOIN incidents i ON i.incident_id=a.incident_id ORDER BY a.created_at DESC LIMIT 5");
    return NextResponse.json({
      summary: { openIncidents: Number(open[0]?.total ?? 0), highRiskIOCs: Number(highIocs[0]?.total ?? 0), affectedAssets: Number(assets[0]?.total ?? 0), unreadAlerts: Number(unread[0]?.total ?? 0) },
      recentIncidents, latestAlerts,
    });
  } catch (e) {
    return NextResponse.json({ error: "Could not load dashboard data from MySQL.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}
