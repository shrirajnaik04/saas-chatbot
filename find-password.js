console.log('🔑 Testing login with different passwords...');

async function testLogin(email, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success with password "${password}"`);
      console.log('📋 Tenant Data:', {
        _id: data.tenant._id,
        name: data.tenant.name,
        email: data.tenant.email,
        allowedDomains: data.tenant.allowedDomains
      });
      return true;
    } else {
      console.log(`❌ Failed with password "${password}": ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error with password "${password}": ${error.message}`);
    return false;
  }
}

async function findPassword() {
  const commonPasswords = [
    'password123',
    'admin123',
    'test123',
    'muscleblaze',
    '123456',
    'password',
    'test',
    'demo123'
  ];
  
  for (const pwd of commonPasswords) {
    const success = await testLogin('muscleblaze@gmail.com', pwd);
    if (success) {
      console.log(`\n🎉 Found working password: ${pwd}`);
      break;
    }
  }
}

findPassword();
