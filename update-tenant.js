const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://nykshriraj4nov:78hvwANp1039gILy@cluster0.yw0xpsa.mongodb.net/chatbot_saas?retryWrites=true&w=majority&appName=Cluster0";

async function updateTenantDomains() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    const db = client.db("chatbot_saas");
    
    // Update the specific tenant to allow localhost
    const result = await db.collection("tenants").updateOne(
      { _id: new ObjectId("687d104974f2f8e6e27e032e") },
      { $set: { allowedDomains: ["localhost", "127.0.0.1", "*.example.com"] } }
    );
    
    console.log("📝 Updated tenant allowed domains:", result.modifiedCount);
    
    // Verify the update
    const tenant = await db.collection("tenants").findOne(
      { _id: new ObjectId("687d104974f2f8e6e27e032e") }
    );
    
    console.log("🔍 Tenant details:");
    console.log("- Name:", tenant.name);
    console.log("- Email:", tenant.email);
    console.log("- Allowed Domains:", tenant.allowedDomains);
    console.log("- Status:", tenant.status);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

updateTenantDomains();
