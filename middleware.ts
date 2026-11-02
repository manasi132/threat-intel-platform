import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;
async function readRole(token: string) {
  if (!secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "Admin" || payload.role === "Analyst" ? payload.role : null;
  } catch { return null; }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("ti_session")?.value;
  const role = token ? await readRole(token) : null;
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/admin/") && role !== "Admin") {
    return NextResponse.json({ error: "Admin access only." }, { status: role ? 403 : 401 });
  }
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && !role) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (["/dashboard", "/iocs", "/incidents", "/threat-feeds", "/admin"].some((path) => pathname === path || pathname.startsWith(path + "/")) && !role) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/iocs/:path*", "/incidents/:path*", "/threat-feeds/:path*", "/admin/:path*", "/api/:path*"] };
