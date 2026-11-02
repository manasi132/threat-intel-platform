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
    if (!email || !password) {
      return NextResponse.json({ error: "Enter both your email and password." }, { status: 400 });
    }

    const [rows] = await getMySqlPool().execute<RowDataPacket[]>(
      "SELECT u.user_id,u.full_name,u.email,u.password_hash,u.status,r.role_name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE LOWER(u.email)=? LIMIT 1",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "No account was found for this email. Choose Create Account first." }, { status: 401 });
    }
    if (user.status !== "Active") {
      return NextResponse.json({ error: "This account is not active. Contact your administrator." }, { status: 403 });
    }
    if (!["Admin", "Analyst"].includes(String(user.role_name))) {
      return NextResponse.json({ error: "This account does not have an allowed application role." }, { status: 403 });
    }

    const passwordHash = String(user.password_hash ?? "");
    if (!/^\$2[aby]\$\d{2}\$/.test(passwordHash) || passwordHash.includes("REPLACE_WITH_A_REAL_HASH")) {
      return NextResponse.json({ error: "This account has a demo placeholder password. Create a new account using Create Account, or have an administrator reset this account." }, { status: 401 });
    }

    if (!(await compare(password, passwordHash))) {
      return NextResponse.json({ error: "Password is incorrect. Check it and try again." }, { status: 401 });
    }

    const sessionUser = {
      userId: Number(user.user_id),
      email: String(user.email),
      fullName: String(user.full_name),
      role: user.role_name as "Admin" | "Analyst",
    };
    await createSession(sessionUser);
    return NextResponse.json({ user: { fullName: sessionUser.fullName, email: sessionUser.email, role: sessionUser.role } });
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json({
      error: "Sign in could not complete. Check that MySQL is connected and AUTH_SECRET is configured in .env.local.",
    }, { status: 500 });
  }
}
