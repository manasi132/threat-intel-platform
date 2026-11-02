import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const db = getMySqlPool();
    const isAdmin = session.role === "Admin";
    const incidentScope = isAdmin ? " AND inc.reported_by = ?" : "";
    const viewIncidentScope = isAdmin ? " AND i.reported_by = ?" : "";
    const assetScope = isAdmin ? " AND a.owner_user_id = ?" : "";
    const userParams = isAdmin ? [session.userId] : [];

    const [open] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM incidents inc WHERE inc.status IN ('Open','Investigating')${incidentScope}`,
      userParams
    );

    const [highIocs] = isAdmin
      ? await db.execute<RowDataPacket[]>(
          "SELECT COUNT(DISTINCT i.ioc_id) AS total FROM iocs i JOIN ioc_incident ii ON ii.ioc_id=i.ioc_id JOIN incidents inc ON inc.incident_id=ii.incident_id WHERE i.severity IN ('High','Critical') AND inc.reported_by=?",
          [session.userId]
        )
      : await db.query<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM iocs WHERE severity IN ('High','Critical')"
        );

    const [assets] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT a.asset_id) AS total FROM assets a LEFT JOIN asset_ioc ai ON ai.asset_id=a.asset_id WHERE 1=1${assetScope}`,
      userParams
    );

    const [unread] = isAdmin
      ? await db.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM alerts al JOIN incidents inc ON inc.incident_id=al.incident_id WHERE al.is_read=0 AND inc.reported_by=?",
          [session.userId]
        )
      : await db.query<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM alerts WHERE is_read=0"
        );

    const [recentIncidents] = await db.execute<RowDataPacket[]>(
      `SELECT v.incident_id,v.title,v.severity,v.status,v.reported_by,i.created_at,v.ioc_count,v.affected_asset_count,v.alert_count FROM analyst_dashboard_v v JOIN incidents i ON i.incident_id=v.incident_id WHERE 1=1${viewIncidentScope} ORDER BY i.created_at DESC LIMIT 5`,
      userParams
    );

    const [latestAlerts] = isAdmin
      ? await db.execute<RowDataPacket[]>(
          "SELECT al.alert_id,al.incident_id,al.alert_type,al.message,al.severity,al.is_read,al.created_at,i.title AS incident_title FROM alerts al JOIN incidents i ON i.incident_id=al.incident_id WHERE i.reported_by=? ORDER BY al.created_at DESC LIMIT 5",
          [session.userId]
        )
      : await db.query<RowDataPacket[]>(
          "SELECT a.alert_id,a.incident_id,a.alert_type,a.message,a.severity,a.is_read,a.created_at,i.title AS incident_title FROM alerts a JOIN incidents i ON i.incident_id=a.incident_id ORDER BY a.created_at DESC LIMIT 5"
        );

    return NextResponse.json({
      summary: {
        openIncidents: Number(open[0]?.total ?? 0),
        highRiskIOCs: Number(highIocs[0]?.total ?? 0),
        affectedAssets: Number(assets[0]?.total ?? 0),
        unreadAlerts: Number(unread[0]?.total ?? 0),
      },
      recentIncidents,
      latestAlerts,
    });
  } catch (e) {
    return NextResponse.json({
      error: "Could not load dashboard data from MySQL.",
      details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined,
    }, { status: 503 });
  }
}
