import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const IOC_TYPES = new Set(["IP", "Domain", "URL", "Hash"]);
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);
type RouteContext = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

async function authorizeIOC(iocId: number, userId: number, role: string) {
  if (role !== "Admin") return true;
  const [rows] = await getMySqlPool().execute<RowDataPacket[]>(
    "SELECT i.ioc_id FROM iocs i WHERE i.ioc_id=? AND EXISTS (SELECT 1 FROM ioc_incident ii JOIN incidents inc ON inc.incident_id=ii.incident_id WHERE ii.ioc_id=i.ioc_id AND inc.reported_by=?) LIMIT 1",
    [iocId, userId]
  );
  return rows.length > 0;
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin access only." }, { status: 403 });
  const { id } = await context.params;
  const iocId = parseId(id);
  if (!iocId) return NextResponse.json({ error: "Invalid IOC ID." }, { status: 400 });
  try {
    if (!(await authorizeIOC(iocId, session.userId, session.role))) {
      return NextResponse.json({ error: "You can only edit IOCs linked to your own incidents." }, { status: 403 });
    }
    const body = await request.json() as { iocValue?: string; iocType?: string; severity?: string; source?: string };
    const value = body.iocValue?.trim();
    const type = body.iocType;
    const severity = body.severity;
    const source = body.source?.trim();
    if (!value || value.length > 255 || !source || source.length > 100) return NextResponse.json({ error: "IOC value and source are required." }, { status: 400 });
    if (!type || !IOC_TYPES.has(type)) return NextResponse.json({ error: "Choose a valid IOC type." }, { status: 400 });
    if (!severity || !SEVERITIES.has(severity)) return NextResponse.json({ error: "Choose a valid severity." }, { status: 400 });
    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      "UPDATE iocs SET ioc_value=?,ioc_type=?,severity=?,source=? WHERE ioc_id=?",
      [value, type, severity, source, iocId]
    );
    if (!result.affectedRows) return NextResponse.json({ error: "IOC not found." }, { status: 404 });
    return NextResponse.json({ message: "IOC updated successfully." });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "This IOC value already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not update the IOC.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const iocId = parseId(id);
  if (!iocId) return NextResponse.json({ error: "Invalid IOC ID." }, { status: 400 });
  try {
    if (!(await authorizeIOC(iocId, session.userId, session.role))) {
      return NextResponse.json({ error: "You can only delete IOCs linked to your own incidents." }, { status: 403 });
    }
    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      "DELETE FROM iocs WHERE ioc_id=?",
      [iocId]
    );
    if (!result.affectedRows) return NextResponse.json({ error: "IOC not found." }, { status: 404 });
    return NextResponse.json({ message: "IOC deleted successfully." });
  } catch (e) {
    return NextResponse.json({ error: "Could not delete the IOC.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}
