import { NextResponse } from "next/server";
import { getMySqlPool } from "@/lib/mysql";
import { getMongoDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const result: {
    mysql: "connected" | "disconnected";
    mongodb: "connected" | "disconnected";
    error?: string;
  } = { mysql: "disconnected", mongodb: "disconnected" };

  try {
    await getMySqlPool().query("SELECT 1 AS ok");
    result.mysql = "connected";
  } catch (e) {
    result.error = `MySQL: ${e instanceof Error ? e.message : "connection failed"}`;
  }

  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    result.mongodb = "connected";
  } catch (e) {
    const message = `MongoDB: ${e instanceof Error ? e.message : "connection failed"}`;
    result.error = result.error ? `${result.error} | ${message}` : message;
  }

  return NextResponse.json(result, {
    status: result.mysql === "connected" && result.mongodb === "connected" ? 200 : 503,
  });
}
