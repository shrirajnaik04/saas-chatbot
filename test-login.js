// Test login API endpoint
// Run this with: node test-login.js

async function testLogin() {
  const loginData = {
    email: "info@majesticescape.in",
    password: process.env.DEFAULT_PASSWORD || "password123" // Use environment variable
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Login successful!");
      console.log("📋 Tenant Info:");
      console.log(`   - Name: ${data.tenant.name}`);
      console.log(`   - Email: ${data.tenant.email}`);
      console.log(`   - API Token: ${data.tenant.apiToken}`);
      console.log(`   - JWT Token: ${data.token.substring(0, 50)}...`);
    } else {
      console.log("❌ Login failed:");
      console.log(`   - Error: ${data.error}`);
      console.log("💡 Make sure to use the correct password from tenant creation");
    }
  } catch (error) {
    console.error("🔥 Network error:", error.message);
    console.log("💡 Make sure the development server is running on localhost:3000");
  }
}

testLogin();
