import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const IOC_TYPES = new Set(["IP", "Domain", "URL", "Hash"]);
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);

export async function GET(request: Request) {
  try {
    const search = (new URL(request.url).searchParams.get("q") || "").trim();
    const like = `%${search}%`;
    const [rows] = await getMySqlPool().execute<RowDataPacket[]>(
      `SELECT i.ioc_id,i.ioc_value,i.ioc_type,i.severity,i.source,i.first_seen,i.last_seen,i.created_at,i.feed_id,tf.feed_name
       FROM iocs i LEFT JOIN threat_feeds tf ON tf.feed_id=i.feed_id
       WHERE (?='' OR i.ioc_value LIKE ? OR i.source LIKE ? OR i.ioc_type LIKE ?)
       ORDER BY i.created_at DESC LIMIT 200`, [search, like, like, like]
    );
    return NextResponse.json({ iocs: rows });
  } catch (e) {
    return NextResponse.json({ error: "Could not load IOCs from MySQL.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { iocValue?: string; iocType?: string; severity?: string; source?: string; feedId?: number | string | null };
    const value = body.iocValue?.trim(); const type = body.iocType; const severity = body.severity; const source = body.source?.trim();
    const feedId = body.feedId ? Number(body.feedId) : null;
    if (!value || value.length > 255 || !source || source.length > 100) return NextResponse.json({ error: "IOC value (max 255 chars) and source (max 100 chars) are required." }, { status: 400 });
    if (!type || !IOC_TYPES.has(type)) return NextResponse.json({ error: "IOC type must be IP, Domain, URL, or Hash." }, { status: 400 });
    if (!severity || !SEVERITIES.has(severity)) return NextResponse.json({ error: "Choose a valid severity." }, { status: 400 });
    if (feedId !== null && (!Number.isInteger(feedId) || feedId < 1)) return NextResponse.json({ error: "Feed ID must be a positive integer." }, { status: 400 });
    const [result] = await getMySqlPool().execute<ResultSetHeader>("INSERT INTO iocs (feed_id,ioc_value,ioc_type,severity,source) VALUES (?,?,?,?,?)", [feedId, value, type, severity, source]);
    return NextResponse.json({ message: "IOC saved to MySQL.", iocId: result.insertId }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "This IOC value already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not save the IOC to MySQL.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}
