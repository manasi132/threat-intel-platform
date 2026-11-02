import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const IOC_TYPES = new Set(["IP", "Domain", "URL", "Hash"]);
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getIOCId(id: string) {
  const parsed = Number(id);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const iocId = getIOCId(id);

  if (!iocId) {
    return NextResponse.json({ error: "Invalid IOC ID." }, { status: 400 });
  }

  try {
    const body = await request.json() as {
      iocValue?: string;
      iocType?: string;
      severity?: string;
      source?: string;
    };

    const value = body.iocValue?.trim();
    const type = body.iocType;
    const severity = body.severity;
    const source = body.source?.trim();

    if (!value || value.length > 255 || !source || source.length > 100) {
      return NextResponse.json(
        { error: "IOC value (max 255 chars) and source (max 100 chars) are required." },
        { status: 400 }
      );
    }

    if (!type || !IOC_TYPES.has(type)) {
      return NextResponse.json(
        { error: "IOC type must be IP, Domain, URL, or Hash." },
        { status: 400 }
      );
    }

    if (!severity || !SEVERITIES.has(severity)) {
      return NextResponse.json(
        { error: "Choose a valid severity." },
        { status: 400 }
      );
    }

    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      `UPDATE iocs
       SET ioc_value = ?, ioc_type = ?, severity = ?, source = ?
       WHERE ioc_id = ?`,
      [value, type, severity, source, iocId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "IOC not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "IOC updated successfully." });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "This IOC value already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Could not update the IOC.",
        details:
          process.env.NODE_ENV === "development" && e instanceof Error
            ? e.message
            : undefined,
      },
      { status: 503 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const iocId = getIOCId(id);

  if (!iocId) {
    return NextResponse.json({ error: "Invalid IOC ID." }, { status: 400 });
  }

  try {
    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      "DELETE FROM iocs WHERE ioc_id = ?",
      [iocId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "IOC not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "IOC deleted successfully." });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Could not delete the IOC.",
        details:
          process.env.NODE_ENV === "development" && e instanceof Error
            ? e.message
            : undefined,
      },
      { status: 503 }
    );
  }
}