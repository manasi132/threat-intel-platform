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
    const adminFilter = session.role === "Admin" ? "WHERE a.owner_user_id = ?" : "";
    const params = session.role === "Admin" ? [session.userId] : [];
    const [assets] = await getMySqlPool().execute<RowDataPacket[]>(
      `SELECT a.asset_id,a.asset_name,a.asset_type,a.ip_address,a.criticality,a.created_at,
              inc.incident_id,inc.title AS incident_title,inc.severity AS incident_severity,
              inc.status AS incident_status,ioc.ioc_value
       FROM assets a
       LEFT JOIN asset_ioc ai ON ai.asset_id=a.asset_id
       LEFT JOIN iocs ioc ON ioc.ioc_id=ai.ioc_id
       LEFT JOIN ioc_incident ii ON ii.ioc_id=ioc.ioc_id
       LEFT JOIN incidents inc ON inc.incident_id=ii.incident_id
       ${adminFilter}
       ${session.role === "Admin" ? "AND (inc.incident_id IS NULL OR inc.reported_by = ?)" : ""}
       ORDER BY a.asset_name,inc.incident_id`,
      session.role === "Admin" ? [session.userId, session.userId] : params
    );
    return NextResponse.json({ assets });
  } catch (e) {
    console.error("Assets API error:", e);
    return NextResponse.json({
      error: "Failed to load assets.",
      details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined,
    }, { status: 500 });
  }
}
