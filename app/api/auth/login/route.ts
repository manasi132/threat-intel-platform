import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    const [rows] = await getMySqlPool().execute<RowDataPacket[]>(
      "SELECT u.user_id,u.full_name,u.email,u.password_hash,u.status,r.role_name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.email=? LIMIT 1", [email]
    );
    const user = rows[0];
    if (!user || user.status !== "Active" || !["Admin", "Analyst"].includes(user.role_name) || !String(user.password_hash).startsWith("$2")) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const valid = await compare(password, String(user.password_hash));
    if (!valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    const sessionUser = { userId: Number(user.user_id), email: String(user.email), fullName: String(user.full_name), role: user.role_name as "Admin" | "Analyst" };
    await createSession(sessionUser);
    return NextResponse.json({ user: { fullName: sessionUser.fullName, email: sessionUser.email, role: sessionUser.role } });
  } catch {
    return NextResponse.json({ error: "Sign in failed. Verify the database and AUTH_SECRET configuration." }, { status: 500 });
  }
}
