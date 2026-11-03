import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretText = process.env.AUTH_SECRET;

async function readSession(
  token: string
): Promise<{ role: "Admin" | "Analyst"; userId: number } | null> {
  if (!secretText || secretText.length < 32) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secretText)
    );

    const role = payload.role;
    const userId = Number(payload.userId ?? payload.sub);

    if (
      (role !== "Admin" && role !== "Analyst") ||
      !Number.isSafeInteger(userId) ||
      userId < 1
    ) {
      return null;
    }

    return { role, userId };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("ti_session")?.value;
  const session = token ? await readSession(token) : null;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/admin/") && session?.role !== "Admin") {
    return NextResponse.json(
      { error: "Admin access only." },
      { status: session ? 403 : 401 }
    );
  }

  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    pathname !== "/api/health" &&
    !session
  ) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  if (
    ["/dashboard", "/iocs", "/incidents", "/threat-feeds", "/admin"].some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    ) &&
    !session
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && session?.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  if (session) {
    response.headers.set("x-auth-user-id", String(session.userId));
    response.headers.set("x-auth-role", session.role);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/iocs/:path*",
    "/incidents/:path*",
    "/threat-feeds/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};