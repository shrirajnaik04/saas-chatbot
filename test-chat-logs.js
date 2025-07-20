const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = "chatbot_saas"; // Hardcoded as in lib/mongodb.ts

async function addTestChatLogs() {
  if (!uri) {
    console.error('❌ Missing MONGODB_URI in .env file');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    
    // First, get a tenant ID to associate with chat logs
    const tenants = await db.collection('tenants').find({}).toArray();
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    const tenant = tenants[0];
    console.log('📋 Using tenant:', tenant.name, 'ID:', tenant._id);

    // Clear existing chat logs for this tenant
    await db.collection('chat_logs').deleteMany({ tenantId: tenant._id.toString() });
    console.log('🗑️ Cleared existing chat logs');

    // Sample chat logs with current dates
    const now = new Date();
    const today = new Date(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const chatLogs = [
      {
        tenantId: tenant._id.toString(),
        message: "What are your business hours?",
        response: "Our business hours are Monday to Friday, 9 AM to 6 PM EST. We're here to help during these times!",
        timestamp: today,
        ragUsed: true
      },
      {
        tenantId: tenant._id.toString(),
        message: "How do I reset my password?",
        response: "You can reset your password by clicking the 'Forgot Password' link on the login page. You'll receive an email with instructions.",
        timestamp: yesterday,
        ragUsed: true
      },
      {
        tenantId: tenant._id.toString(),
        message: "Tell me a joke",
        response: "Why don't scientists trust atoms? Because they make up everything! 😄",
        timestamp: twoDaysAgo,
        ragUsed: false
      },
      {
        tenantId: tenant._id.toString(),
        message: "What products do you offer?",
        response: "We offer a wide range of AI-powered solutions including chatbots, document analysis, and customer support automation. Check our products page for details!",
        timestamp: threeDaysAgo,
        ragUsed: true
      },
      {
        tenantId: tenant._id.toString(),
        message: "Hello",
        response: "Hello! Welcome to our AI assistant. How can I help you today?",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        ragUsed: false
      },
      {
        tenantId: tenant._id.toString(),
        message: "Can I get a refund?",
        response: "Absolutely! Our refund policy allows for full refunds within 30 days of purchase. Please contact our support team with your order details.",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        ragUsed: true
      },
      {
        tenantId: tenant._id.toString(),
        message: "What is AI?",
        response: "Artificial Intelligence (AI) refers to computer systems that can perform tasks that typically require human intelligence, such as learning, reasoning, and problem-solving.",
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        ragUsed: false
      }
    ];

    // Insert chat logs
    const result = await db.collection('chat_logs').insertMany(chatLogs);
    console.log(`✅ Inserted ${result.insertedCount} chat logs`);

    // Show summary
    const totalLogs = await db.collection('chat_logs').countDocuments({ tenantId: tenant._id.toString() });
    const ragUsedCount = await db.collection('chat_logs').countDocuments({ 
      tenantId: tenant._id.toString(),
      ragUsed: true 
    });
    
    console.log('\n📊 Analytics Summary:');
    console.log(`Total chats: ${totalLogs}`);
    console.log(`RAG used: ${ragUsedCount} (${Math.round((ragUsedCount / totalLogs) * 100)}%)`);
    
    // Get this month's count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthCount = await db.collection('chat_logs').countDocuments({
      tenantId: tenant._id.toString(),
      timestamp: { $gte: startOfMonth }
    });
    
    console.log(`This month: ${thisMonthCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addTestChatLogs().catch(console.error);
