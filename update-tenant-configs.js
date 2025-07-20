// Script to update tenant configurations with unique branding
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/chatbot_saas";

async function updateTenantConfigs() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    
    const db = client.db("chatbot_saas");
    
    // Update Majestic Escape with hotel theme
    await db.collection("tenants").updateOne(
      { _id: new ObjectId("687d067f74f2f8e6e27e032c") },
      {
        $set: {
          config: {
            companyName: "Majestic Escape Resort",
            botName: "Majestic Assistant",
            welcomeMessage: "Welcome to Majestic Escape Resort! I'm here to help you with bookings, amenities, and any questions about your luxury stay. How may I assist you today?",
            primaryColor: "#8B5A2B",
            secondaryColor: "#D4AF37",
            theme: "luxury-hotel"
          }
        }
      }
    );
    console.log("✅ Updated Majestic Escape with luxury hotel theme");
    
    // Update CodeMax with tech theme  
    await db.collection("tenants").updateOne(
      { _id: new ObjectId("687d073374f2f8e6e27e032d") },
      {
        $set: {
          config: {
            companyName: "CodeMax Solutions",
            botName: "CodeMax Bot",
            welcomeMessage: "Hi! I'm CodeMax Bot, your technical support assistant. I can help you with software issues, coding questions, and technical documentation. What can I help you with?",
            primaryColor: "#1E40AF",
            secondaryColor: "#3B82F6", 
            theme: "tech-support"
          },
          allowedDomains: ["localhost", "127.0.0.1", "*.codemax.com", "codemax.dev"]
        }
      }
    );
    console.log("✅ Updated CodeMax with tech support theme");
    
    // Update MuscleBlaze with fitness theme
    await db.collection("tenants").updateOne(
      { _id: new ObjectId("687d104974f2f8e6e27e032e") },
      {
        $set: {
          config: {
            companyName: "MuscleBlaze Fitness",
            botName: "Fitness Coach AI",
            welcomeMessage: "💪 Welcome to MuscleBlaze! I'm your personal fitness coach AI. Ask me about workout plans, nutrition advice, supplement recommendations, or any fitness-related questions!",
            primaryColor: "#DC2626",
            secondaryColor: "#EF4444",
            theme: "fitness"
          }
        }
      }
    );
    console.log("✅ Updated MuscleBlaze with fitness theme");
    
    console.log("\n🎉 All tenant configurations updated!");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

updateTenantConfigs();
