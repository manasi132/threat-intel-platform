import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DATABASE;
  if (!uri || !database) {
    throw new Error("MongoDB configuration missing. Set MONGODB_URI and MONGODB_DATABASE in .env.local.");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 }).connect();
  }
  const client = await clientPromise;
  return client.db(database);
}
