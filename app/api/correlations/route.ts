import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = await request.json() as { iocId?: number | string; incidentId?: number | string; matchReason?: string; confidence?: number | string };
    const iocId = Number(body.iocId);
    const incidentId = Number(body.incidentId);
    const confidence = body.confidence === undefined ? 95 : Number(body.confidence);
    const reason = body.matchReason?.trim() || "IOC linked by analyst";
    if (!Number.isInteger(iocId) || iocId < 1 || !Number.isInteger(incidentId) || incidentId < 1) return NextResponse.json({ error: "Select a valid IOC and incident." }, { status: 400 });
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) return NextResponse.json({ error: "Confidence must be between 0 and 100." }, { status: 400 });

    const db = getMySqlPool();
    if (session.role === "Admin") {
      const [owned] = await db.execute<RowDataPacket[]>(
        "SELECT incident_id FROM incidents WHERE incident_id=? AND reported_by=? LIMIT 1",
        [incidentId, session.userId]
      );
      if (!owned.length) return NextResponse.json({ error: "You can only correlate IOCs with your own incidents." }, { status: 403 });
    }
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO ioc_incident (ioc_id,incident_id,match_reason,confidence) VALUES (?,?,?,?)",
      [iocId, incidentId, reason, confidence]
    );
    return NextResponse.json({ message: "IOC linked in MySQL. If the incident is active, the database trigger should create an alert.", affectedRows: result.affectedRows }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "This IOC is already linked to that incident." }, { status: 409 });
    return NextResponse.json({ error: "Could not link IOC to incident in MySQL.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}
