import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMySqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json() as { fullName?: string; email?: string; password?: string };
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!fullName || fullName.length > 100 || !email || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
    if (!password || password.length < 10 || password.length > 128) return NextResponse.json({ error: "Password must be 10 to 128 characters." }, { status: 400 });
    const db = getMySqlPool();
    const [roles] = await db.execute<RowDataPacket[]>("SELECT role_id FROM roles WHERE role_name='Analyst' LIMIT 1");
    if (!roles.length) return NextResponse.json({ error: "Analyst role is missing in MySQL. Add it to the roles table first." }, { status: 503 });
    const passwordHash = await hash(password, 12);
    const [result] = await db.execute<ResultSetHeader>("INSERT INTO users (role_id,full_name,email,password_hash,status) VALUES (?,?,?,?,'Active')", [roles[0].role_id, fullName, email, passwordHash]);
    return NextResponse.json({ message: "Account created. You can now sign in.", userId: result.insertId }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ error: "Registration failed. Check the MySQL connection and users/roles tables." }, { status: 500 });
  }
}
