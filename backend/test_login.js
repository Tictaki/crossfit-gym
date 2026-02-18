const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing Admin Login...\n');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'gerente@crosstraininggym.com',
      password: 'Admin#Master2026'
    });

    console.log('✅ Login Successful!');
    console.log('User:', response.data.user.name);
    console.log('Email:', response.data.user.email);
    console.log('Role:', response.data.user.role);
    console.log('Token:', response.data.token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Login Failed:', error.response?.data || error.message);
  }
}

testLogin();
