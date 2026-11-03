import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";

const targetEmail = (process.env.ADMIN_DEMO_EMAIL || "manaviarya13@gmail.com").trim().toLowerCase();
const mysqlHost = process.env.MYSQL_HOST;
const mysqlUser = process.env.MYSQL_USER;
const mysqlDatabase = process.env.MYSQL_DATABASE;
const mongoUri = process.env.MONGODB_URI;
const mongoDatabase = process.env.MONGODB_DATABASE;

if (!mysqlHost || !mysqlUser || !mysqlDatabase || !mongoUri || !mongoDatabase) {
  throw new Error("Set MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE, MONGODB_URI and MONGODB_DATABASE in .env.local before seeding.");
}

const sql = mysql.createPool({
  host: mysqlHost,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: mysqlUser,
  password: process.env.MYSQL_PASSWORD || "",
  database: mysqlDatabase,
  connectionLimit: 4,
});

const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000 });

async function main() {
  await mongo.connect();
  const db = mongo.db(mongoDatabase);
  const feedCollection = db.collection("threat_feed_records");

  const [users] = await sql.execute<mysql.RowDataPacket[]>(
    "SELECT u.user_id,u.full_name,u.email,r.role_name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE LOWER(u.email)=? LIMIT 1",
    [targetEmail]
  );
  if (!users.length) throw new Error(`No user found for ${targetEmail}. Create/sign in to the account first.`);
  const user = users[0];
  if (user.role_name !== "Admin") throw new Error(`${targetEmail} is role ${user.role_name}, not Admin. No demo data was inserted.`);
  const userId = Number(user.user_id);
  console.log(`Seeding demo data for ${user.full_name} (${targetEmail}), user_id=${userId}.`);

  const feedName = `Admin Demo Feed ${userId}`;
  await sql.execute(
    "INSERT INTO threat_feeds (feed_name,feed_type,source_url,status) VALUES (?,?,?,'Active') ON DUPLICATE KEY UPDATE feed_type=VALUES(feed_type),source_url=VALUES(source_url),status='Active'",
    [feedName, "Admin-owned demonstration", "https://example.invalid/admin-demo-feed"]
  );
  const [feedRows] = await sql.execute<mysql.RowDataPacket[]>(
    "SELECT feed_id FROM threat_feeds WHERE feed_name=? LIMIT 1",
    [feedName]
  );
  const feedId = Number(feedRows[0].feed_id);

  const iocSamples = [
    { value: `198.51.100.${(userId % 100) + 10}`, type: "IP", severity: "Critical", reason: "Credential-stuffing source observed against the admin demo environment" },
    { value: `login-admin-demo-${userId}.example.invalid`, type: "Domain", severity: "High", reason: "Lookalike authentication domain in a controlled demonstration" },
    { value: `https://admin-demo-${userId}.example.invalid/session`, type: "URL", severity: "High", reason: "Suspicious session-harvesting URL in a controlled demonstration" },
    { value: (String(userId).padStart(8, "0") + "a".repeat(56)).slice(0, 64), type: "Hash", severity: "Medium", reason: "Synthetic file hash used for correlation demonstration" },
    { value: `203.0.113.${(userId % 100) + 20}`, type: "IP", severity: "Medium", reason: "Known test-network indicator reserved for documentation" },
  ] as const;

  const iocIds: number[] = [];
  for (const sample of iocSamples) {
    await sql.execute(
      "INSERT INTO iocs (feed_id,ioc_value,ioc_type,severity,source) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE feed_id=VALUES(feed_id),severity=VALUES(severity),source=VALUES(source)",
      [feedId, sample.value, sample.type, sample.severity, feedName]
    );
    const [rows] = await sql.execute<mysql.RowDataPacket[]>(
      "SELECT ioc_id FROM iocs WHERE ioc_value=? LIMIT 1",
      [sample.value]
    );
    iocIds.push(Number(rows[0].ioc_id));
  }

  const incidentSamples = [
    { title: `Admin Demo · Suspicious Authentication Traffic · ${userId}`, description: "Synthetic training incident: repeated authentication attempts from a documentation-only test address. No production systems are implicated.", severity: "Critical", status: "Investigating", iocs: [0, 1, 2] },
    { title: `Admin Demo · Endpoint Malware Triage · ${userId}`, description: "Synthetic training incident: suspicious file indicator associated with a controlled endpoint investigation.", severity: "High", status: "Open", iocs: [3, 4] },
    { title: `Admin Demo · Threat Feed Validation · ${userId}`, description: "Synthetic training incident: validate ingestion, source attribution and IOC correlation workflow.", severity: "Medium", status: "Resolved", iocs: [1, 4] },
  ] as const;

  const incidentIds: number[] = [];
  for (const sample of incidentSamples) {
    await sql.execute(
      "INSERT INTO incidents (reported_by,title,description,severity,status) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE description=VALUES(description),severity=VALUES(severity),status=VALUES(status)",
      [userId, sample.title, sample.description, sample.severity, sample.status]
    );
    const [rows] = await sql.execute<mysql.RowDataPacket[]>(
      "SELECT incident_id FROM incidents WHERE reported_by=? AND title=? LIMIT 1",
      [userId, sample.title]
    );
    const incidentId = Number(rows[0].incident_id);
    incidentIds.push(incidentId);

    for (const index of sample.iocs) {
      await sql.execute(
        "INSERT INTO ioc_incident (ioc_id,incident_id,match_reason,confidence) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE match_reason=VALUES(match_reason),confidence=VALUES(confidence)",
        [iocIds[index], incidentId, iocSamples[index].reason, index === 0 ? 98 : 92]
      );
    }
  }

  const assetSamples = [
    { name: `Admin Demo · Identity Gateway · ${userId}`, type: "Server", ip: "192.0.2.41", criticality: "Critical", ioc: 0 },
    { name: `Admin Demo · Finance Workstation · ${userId}`, type: "Endpoint", ip: "192.0.2.42", criticality: "High", ioc: 3 },
    { name: `Admin Demo · DNS Resolver · ${userId}`, type: "Server", ip: "192.0.2.43", criticality: "Medium", ioc: 1 },
  ] as const;

  for (const asset of assetSamples) {
    await sql.execute(
      "INSERT INTO assets (owner_user_id,asset_name,asset_type,ip_address,criticality) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE owner_user_id=VALUES(owner_user_id),asset_type=VALUES(asset_type),ip_address=VALUES(ip_address),criticality=VALUES(criticality)",
      [userId, asset.name, asset.type, asset.ip, asset.criticality]
    );
    const [assetRows] = await sql.execute<mysql.RowDataPacket[]>(
      "SELECT asset_id FROM assets WHERE asset_name=? AND owner_user_id=? LIMIT 1",
      [asset.name, userId]
    );
    await sql.execute(
      "INSERT INTO asset_ioc (asset_id,ioc_id,confidence) VALUES (?,?,95) ON DUPLICATE KEY UPDATE confidence=VALUES(confidence)",
      [Number(assetRows[0].asset_id), iocIds[asset.ioc]]
    );
  }

  // Existing trigger creates alerts for active incidents; ensure one clear alert per demo incident.
  for (let i = 0; i < incidentIds.length; i++) {
    if (incidentSamples[i].status === "Resolved") continue;
    const [existing] = await sql.execute<mysql.RowDataPacket[]>(
      "SELECT alert_id FROM alerts WHERE incident_id=? AND alert_type='Admin Demo Correlation' LIMIT 1",
      [incidentIds[i]]
    );
    if (!existing.length) {
      await sql.execute(
        "INSERT INTO alerts (incident_id,alert_type,message,severity,is_read) VALUES (?,?,?,?,0)",
        [incidentIds[i], "Admin Demo Correlation", "Synthetic admin-owned demonstration alert generated by the repeatable demo seed.", incidentSamples[i].severity]
      );
    }
  }

  const docs = [
    { source: feedName, record_type: "IOC", payload: { value: iocSamples[0].value, type: "IP", severity: "Critical", note: "Synthetic documentation-only test indicator" }, tags: ["admin-demo", "authentication", "critical"] },
    { source: feedName, record_type: "IOC", payload: { value: iocSamples[1].value, type: "Domain", severity: "High", note: "Reserved example domain; not a live threat" }, tags: ["admin-demo", "phishing", "domain"] },
    { source: feedName, record_type: "IOC", payload: { value: iocSamples[2].value, type: "URL", severity: "High", note: "Reserved example URL; not a live threat" }, tags: ["admin-demo", "url", "investigation"] },
    { source: feedName, record_type: "IOC", payload: { value: iocSamples[3].value, type: "Hash", severity: "Medium", note: "Synthetic hash for training" }, tags: ["admin-demo", "endpoint", "hash"] },
    { source: feedName, record_type: "IOC", payload: { value: iocSamples[4].value, type: "IP", severity: "Medium", note: "Documentation-only TEST-NET address" }, tags: ["admin-demo", "test-net", "medium"] },
  ];
  for (const doc of docs) {
    await feedCollection.updateOne(
      { owner_user_id: userId, source: doc.source, "payload.value": doc.payload.value },
      { $set: { ...doc, owner_user_id: userId, collected_at: new Date() } },
      { upsert: true }
    );
  }

  const [[summary]] = await sql.query<mysql.RowDataPacket[]>(
    "SELECT (SELECT COUNT(*) FROM incidents WHERE reported_by=?) AS incidents, (SELECT COUNT(*) FROM assets WHERE owner_user_id=?) AS assets, (SELECT COUNT(*) FROM ioc_incident ii JOIN incidents inc ON inc.incident_id=ii.incident_id WHERE inc.reported_by=?) AS correlations, (SELECT COUNT(*) FROM alerts a JOIN incidents inc ON inc.incident_id=a.incident_id WHERE inc.reported_by=?) AS alerts",
    [userId, userId, userId, userId]
  );
  const mongoCount = await feedCollection.countDocuments({ owner_user_id: userId });
  console.log("Admin demo seed completed (safe to rerun).");
  console.log({ userId, mysql: summary, mongoThreatFeedRecords: mongoCount, createdIOCValues: iocSamples.map(x => x.value) });
}

main().catch((error) => {
  console.error("Admin demo seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await Promise.allSettled([sql.end(), mongo.close()]);
});
