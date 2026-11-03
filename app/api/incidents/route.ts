import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const db = getMySqlPool();
    const isAdmin = session.role === "Admin";
    const filter = isAdmin ? " WHERE i.reported_by=?" : "";
    const params = isAdmin ? [session.userId] : [];
    const [incidents] = await db.execute<RowDataPacket[]>(
      `SELECT v.incident_id,v.title,v.severity,v.status,i.created_at,v.reported_by,v.ioc_count,v.affected_asset_count,v.alert_count FROM analyst_dashboard_v v JOIN incidents i ON i.incident_id=v.incident_id${filter} ORDER BY i.created_at DESC LIMIT 100`,
      params
    );
    const [alerts] = isAdmin
      ? await db.execute<RowDataPacket[]>(
          "SELECT a.alert_id,a.incident_id,a.alert_type,a.message,a.severity,a.is_read,a.created_at,i.title AS incident_title FROM alerts a JOIN incidents i ON i.incident_id=a.incident_id WHERE i.reported_by=? ORDER BY a.created_at DESC LIMIT 10",
          [session.userId]
        )
      : await db.query<RowDataPacket[]>(
          "SELECT a.alert_id,a.incident_id,a.alert_type,a.message,a.severity,a.is_read,a.created_at,i.title AS incident_title FROM alerts a JOIN incidents i ON i.incident_id=a.incident_id ORDER BY a.created_at DESC LIMIT 10"
        );
    return NextResponse.json({ incidents, alerts });
  } catch (e) {
    return NextResponse.json({
      error: "Could not load incidents from MySQL. Confirm analyst_dashboard_v exists.",
      details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined,
    }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = await request.json() as { title?: string; description?: string; severity?: string };
    const title = body.title?.trim();
    const description = body.description?.trim() || null;
    const severity = body.severity || "Medium";
    if (!title || title.length > 200) return NextResponse.json({ error: "Incident title is required (maximum 200 characters)." }, { status: 400 });
    if (!SEVERITIES.has(severity)) return NextResponse.json({ error: "Choose a valid severity." }, { status: 400 });
    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      "INSERT INTO incidents (reported_by,title,description,severity,status) VALUES (?,?,?,?,'Open')",
      [session.userId, title, description, severity]
    );
    return NextResponse.json({ message: "Incident created in MySQL.", incidentId: result.insertId }, { status: 201 });
  } catch (e) {
    return NextResponse.json({
      error: "Could not create incident in MySQL.",
      details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined,
    }, { status: 503 });
  }
}
