import http from 'http';
import https from 'https';

const TARGET_URL = 'https://crossfit-gym-production-944c.up.railway.app/health';

console.log(`🔍 Testing connection to: ${TARGET_URL}`);
console.log(`⏰ Current Time: ${new Date().toISOString()}`);

const client = TARGET_URL.startsWith('https') ? https : http;

const req = client.get(TARGET_URL, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  console.log(`📄 Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`📥 Body: ${data}`);
    if (res.statusCode === 200) {
      console.log('🎉 Backend is LIVE and reachable!');
    } else {
      console.log('⚠️ Backend is reachable but returned an error.');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Connection FAILED:', err.message);
  if (err.code === 'ENOTFOUND') {
    console.error('👉 DNS Error: Domain not found.');
  } else if (err.code === 'ETIMEDOUT') {
    console.error('👉 Timeout Error: Server took too long to respond.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('👉 Connection Refused: Server is not listening on that port.');
  }
});

req.setTimeout(10000, () => {
  console.error('❌ Request TIMED OUT (10s)');
  req.destroy();
});
