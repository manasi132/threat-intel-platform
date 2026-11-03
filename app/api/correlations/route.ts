import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const adminFilter = session.role === "Admin" ? "WHERE inc.reported_by = ?" : "";
    const params = session.role === "Admin" ? [session.userId] : [];
    const [rows] = await getMySqlPool().execute<RowDataPacket[]>(
      `SELECT ii.ioc_id,ii.incident_id,i.ioc_value,i.ioc_type,ii.match_reason,ii.confidence,inc.title AS incident_title
       FROM ioc_incident ii
       JOIN iocs i ON i.ioc_id=ii.ioc_id
       JOIN incidents inc ON inc.incident_id=ii.incident_id
       ${adminFilter}
       ORDER BY ii.incident_id DESC,ii.ioc_id DESC`,
      params
    );
    return NextResponse.json({ correlations: rows });
  } catch (error) {
    console.error("GET correlations error:", error);
    return NextResponse.json({
      error: "Unable to retrieve correlations.",
      details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const body = await request.json() as { iocId?: number | string; incidentId?: number | string; matchReason?: string; confidence?: number | string };
    const iocId = Number(body.iocId);
    const incidentId = Number(body.incidentId);
    const confidence = body.confidence === undefined ? 95 : Number(body.confidence);
    const reason = body.matchReason?.trim() || "IOC linked by analyst";
    if (!Number.isSafeInteger(iocId) || iocId < 1 || !Number.isSafeInteger(incidentId) || incidentId < 1) {
      return NextResponse.json({ error: "Select a valid IOC and incident." }, { status: 400 });
    }
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
      return NextResponse.json({ error: "Confidence must be between 0 and 100." }, { status: 400 });
    }

    const db = getMySqlPool();
    if (session.role === "Admin") {
      const [allowed] = await db.execute<RowDataPacket[]>(
        "SELECT inc.incident_id FROM incidents inc WHERE inc.incident_id=? AND inc.reported_by=? AND EXISTS (SELECT 1 FROM ioc_incident existing_link JOIN incidents own_inc ON own_inc.incident_id=existing_link.incident_id WHERE existing_link.ioc_id=? AND own_inc.reported_by=?) LIMIT 1",
        [incidentId, session.userId, iocId, session.userId]
      );
      // A previously unlinked IOC is allowed only when the target incident is owned.
      if (!allowed.length) {
        const [ownedIncident] = await db.execute<RowDataPacket[]>(
          "SELECT incident_id FROM incidents WHERE incident_id=? AND reported_by=? LIMIT 1",
          [incidentId, session.userId]
        );
        if (!ownedIncident.length) return NextResponse.json({ error: "You can only correlate IOCs with your own incidents." }, { status: 403 });
      }
    }
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO ioc_incident (ioc_id,incident_id,match_reason,confidence) VALUES (?,?,?,?)",
      [iocId, incidentId, reason, confidence]
    );
    return NextResponse.json({ message: "IOC linked successfully.", affectedRows: result.affectedRows }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "This IOC is already linked to that incident." }, { status: 409 });
    }
    return NextResponse.json({
      error: "Could not link IOC to incident in MySQL.",
      details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined,
    }, { status: 503 });
  }
}
