// Quick script to test MongoDB connection and check tenants
// Run this with: node test-db.js

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/chatbot_saas";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    const db = client.db("chatbot_saas");
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("📋 Collections:", collections.map(c => c.name));
    
    // Check tenants
    const tenants = await db.collection("tenants").find({}).toArray();
    console.log("👥 Tenants found:", tenants.length);
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.email}) - Status: ${tenant.status}`);
      console.log(`   - ID: ${tenant._id.toString()}`);
      console.log(`   - API Token: ${tenant.apiToken}`);
      console.log(`   - Has Password: ${tenant.password ? 'Yes' : 'No'}`);
      console.log(`   - Allowed Domains: ${tenant.allowedDomains || 'Not set'}`);
      console.log(`   - Created: ${tenant.createdAt}`);
      console.log('---');
    });
    
    // Update existing tenant to add localhost for testing
    if (tenants.length > 0) {
      const updateResult = await db.collection("tenants").updateOne(
        { _id: tenants[0]._id },
        { $set: { allowedDomains: ["localhost", "127.0.0.1", "*.example.com"] } }
      );
      console.log("📝 Updated tenant with allowed domains for testing");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

testConnection();
