
import axios from 'axios';

async function getStats() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@crossfit.gym',
      password: 'CrossFitAdmin2026!'
    });
    const token = loginRes.data.token;
    console.log('Login successful');

    // 2. Fetch stats
    const statsRes = await axios.get('http://localhost:3001/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Stats Response:', JSON.stringify(statsRes.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) console.error('Data:', error.response.data);
  }
}

getStats();
