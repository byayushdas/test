import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ayushdas20241_db_user:WBkwqMWEiyRp82Yy@cluster0.jjsco4e.mongodb.net/?appName=Cluster0";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const mongoOptions = {
  tls: true,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
};

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, mongoOptions);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI, mongoOptions);
  clientPromise = client.connect();
}

export async function getMongoDb() {
  const client = await clientPromise;
  return client.db("seed2shelf");
}

export default clientPromise;
