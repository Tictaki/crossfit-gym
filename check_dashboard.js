
const axios = require('axios');

async function checkStats() {
  try {
    const response = await axios.get('http://localhost:3001/api/dashboard/stats');
    console.log('Stats:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

checkStats();
