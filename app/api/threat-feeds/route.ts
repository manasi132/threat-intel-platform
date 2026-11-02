import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = (await getMongoDb()).collection("threat_feed_records");
    const [docs, counts] = await Promise.all([
      collection.find({}).sort({ collected_at: -1 }).limit(100).toArray(),
      collection.aggregate<{ _id: string | null; total: number }>([
        { $group: { _id: "$source", total: { $sum: 1 } } }, { $sort: { total: -1 } },
      ]).toArray(),
    ]);
    const records = docs.map((doc) => ({
      _id: doc._id.toString(),
      source: typeof doc.source === "string" ? doc.source : "Unknown",
      collected_at: doc.collected_at ? new Date(doc.collected_at).toISOString() : null,
      record_type: typeof doc.record_type === "string" ? doc.record_type : "IOC",
      payload: doc.payload && typeof doc.payload === "object" ? doc.payload : {},
      tags: Array.isArray(doc.tags) ? doc.tags : [],
    }));
    return NextResponse.json({ records, sourceCounts: counts.map((x) => ({ source: x._id || "Unknown", total: x.total })) });
  } catch (e) {
    return NextResponse.json({ error: "Could not load threat-feed documents from MongoDB.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { source?: string; value?: string; type?: string; severity?: string; tags?: string[] | string };
    const source = body.source?.trim(); const value = body.value?.trim(); const type = body.type?.trim(); const severity = body.severity?.trim() || "Medium";
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
      : typeof body.tags === "string" ? body.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [];
    if (!source || source.length > 100 || !value || value.length > 255 || !type || type.length > 30) return NextResponse.json({ error: "Source, IOC value and IOC type are required." }, { status: 400 });
    const result = await (await getMongoDb()).collection("threat_feed_records").insertOne({ source, collected_at: new Date(), record_type: "IOC", payload: { value, type, severity }, tags });
    return NextResponse.json({ message: "Threat-feed record saved to MongoDB.", id: result.insertedId.toString() }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Could not save threat-feed record to MongoDB.", details: process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined }, { status: 503 });
  }
}
