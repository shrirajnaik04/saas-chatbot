import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>
let indexesInitialized = false

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  const db = client.db("chatbot_saas")
  // Initialize indexes once for dedup and performance
  if (!indexesInitialized) {
    try {
      await db.collection("documents").createIndex(
        { tenantId: 1, filename: 1, size: 1 },
        { unique: true, name: "uniq_tenant_filename_size" },
      )
    } catch (e) {
      // ignore if already exists or if permissions limited
    } finally {
      indexesInitialized = true
    }
  }
  return db
}
