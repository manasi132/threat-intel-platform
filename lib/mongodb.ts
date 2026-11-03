import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DATABASE;

  if (!uri || !database) {
    throw new Error(
      "MongoDB configuration missing. Set MONGODB_URI and MONGODB_DATABASE in .env.local."
    );
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }

  const connectedClient = await clientPromise;
  return connectedClient.db(database);
}