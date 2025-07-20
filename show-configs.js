// Script to show detailed tenant configurations
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/chatbot_saas";

async function showTenantConfigs() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    const db = client.db("chatbot_saas");
    const tenants = await db.collection("tenants").find({}).toArray();
    
    console.log("🏢 Tenant Configurations:\n");
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.email})`);
      console.log(`   - ID: ${tenant._id.toString()}`);
      console.log(`   - Config:`, JSON.stringify(tenant.config || {}, null, 6));
      console.log(`   - Status: ${tenant.status}`);
      console.log(`   - Allowed Domains: ${tenant.allowedDomains || 'Not set'}`);
      console.log("---");
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

showTenantConfigs();
