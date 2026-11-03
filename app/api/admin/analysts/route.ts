import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin access only." }, { status: 403 });

  try {
    const db = getMySqlPool();
    const [[account]] = await db.execute<RowDataPacket[]>(
      "SELECT u.user_id,u.full_name,u.email,u.status,u.created_at,r.role_name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.user_id=? LIMIT 1",
      [session.userId]
    );
    if (!account) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

    const [[summary]] = await db.execute<RowDataPacket[]>(
      "SELECT (SELECT COUNT(*) FROM incidents WHERE reported_by=?) AS incidents,(SELECT COUNT(*) FROM assets WHERE owner_user_id=?) AS assets,(SELECT COUNT(*) FROM ioc_incident ii JOIN incidents inc ON inc.incident_id=ii.incident_id WHERE inc.reported_by=?) AS correlations,(SELECT COUNT(*) FROM alerts a JOIN incidents inc ON inc.incident_id=a.incident_id WHERE inc.reported_by=?) AS alerts",
      [session.userId, session.userId, session.userId, session.userId]
    );
    return NextResponse.json({ account, summary });
  } catch (e) {
    return NextResponse.json({
      error: "Unable to load Admin account overview.",
      details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined,
    }, { status: 500 });
  }
}
