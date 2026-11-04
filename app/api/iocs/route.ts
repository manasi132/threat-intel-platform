import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const IOC_TYPES = new Set(["IP", "Domain", "URL", "Hash"]);
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const search = (new URL(request.url).searchParams.get("q") || "").trim();
    const like = `%${search}%`;
    const adminScope = session.role === "Admin"
      ? " AND EXISTS (SELECT 1 FROM ioc_incident ii JOIN incidents inc ON inc.incident_id=ii.incident_id WHERE ii.ioc_id=i.ioc_id AND inc.reported_by=?)"
      : "";
    const params = session.role === "Admin"
      ? [search, like, like, like, session.userId]
      : [search, like, like, like];
    const [rows] = await getMySqlPool().execute<RowDataPacket[]>(
      `SELECT i.ioc_id,i.ioc_value,i.ioc_type,i.severity,i.source,i.first_seen,i.last_seen,i.created_at,i.feed_id,tf.feed_name
       FROM iocs i LEFT JOIN threat_feeds tf ON tf.feed_id=i.feed_id
       WHERE (?='' OR i.ioc_value LIKE ? OR i.source LIKE ? OR i.ioc_type LIKE ?)${adminScope}
       ORDER BY i.created_at DESC LIMIT 200`,
      params
    );
    return NextResponse.json({ iocs: rows });
  } catch (e) {
    return NextResponse.json({ error: "Could not load IOCs from MySQL.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin access only. Analysts can view and correlate IOCs." }, { status: 403 });

  try {
    const body = await request.json() as { iocValue?: string; iocType?: string; severity?: string; source?: string; feedId?: number | string | null };
    const value = body.iocValue?.trim(); const type = body.iocType; const severity = body.severity; const source = body.source?.trim();
    const feedId = body.feedId ? Number(body.feedId) : null;
    if (!value || value.length > 255 || !source || source.length > 100) return NextResponse.json({ error: "IOC value (max 255 chars) and source (max 100 chars) are required." }, { status: 400 });
    if (!type || !IOC_TYPES.has(type)) return NextResponse.json({ error: "IOC type must be IP, Domain, URL, or Hash." }, { status: 400 });
    if (!severity || !SEVERITIES.has(severity)) return NextResponse.json({ error: "Choose a valid severity." }, { status: 400 });
    if (feedId !== null && (!Number.isInteger(feedId) || feedId < 1)) return NextResponse.json({ error: "Feed ID must be a positive integer." }, { status: 400 });

    const db = getMySqlPool();
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO iocs (feed_id,ioc_value,ioc_type,severity,source) VALUES (?,?,?,?,?)",
      [feedId, value, type, severity, source]
    );

    // Link newly submitted Admin IOCs to an Admin-owned incident so that the
    // Admin's existing ownership-scoped IOC list can display and manage them.
    if (session.role === "Admin") {
      const [ownedIncidents] = await db.execute<RowDataPacket[]>(
        "SELECT incident_id FROM incidents WHERE reported_by=? ORDER BY created_at DESC LIMIT 1",
        [session.userId]
      );
      if (ownedIncidents.length) {
        await db.execute(
          "INSERT INTO ioc_incident (ioc_id,incident_id,match_reason,confidence) VALUES (?,?,?,?)",
          [result.insertId, ownedIncidents[0].incident_id, "Added by the signed-in Admin", 95]
        );
      }
    }

    return NextResponse.json({ message: "IOC saved to MySQL.", iocId: result.insertId }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "This IOC value already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not save the IOC to MySQL.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}
