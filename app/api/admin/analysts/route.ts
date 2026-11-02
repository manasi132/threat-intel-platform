import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin access only." }, { status: 403 });
  try {
    const [users] = await getMySqlPool().execute<RowDataPacket[]>(
      "SELECT u.user_id,u.full_name,u.email,u.status,u.created_at,r.role_name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE r.role_name='Analyst' ORDER BY u.created_at DESC"
    );
    return NextResponse.json({ analysts: users });
  } catch {
    return NextResponse.json({ error: "Unable to load analyst accounts." }, { status: 500 });
  }
}
