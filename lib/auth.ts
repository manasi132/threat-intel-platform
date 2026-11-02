import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ti_session";
const secretText = process.env.AUTH_SECRET;
if (!secretText || secretText.length < 32) {
  throw new Error("AUTH_SECRET must be set to a random value with at least 32 characters.");
}
const secret = new TextEncoder().encode(secretText);

export type SessionUser = { userId: number; email: string; fullName: string; role: "Admin" | "Analyst" };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ userId: user.userId, email: user.email, fullName: user.fullName, role: user.role })
    .setProtectedHeader({ alg: "HS256" }).setSubject(String(user.userId))
    .setIssuedAt().setExpirationTime("8h").sign(secret);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.fullName !== "string" || (payload.role !== "Admin" && payload.role !== "Analyst")) return null;
    return { userId: Number(payload.sub), email: payload.email, fullName: payload.fullName, role: payload.role };
  } catch { return null; }
}
