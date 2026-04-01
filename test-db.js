const net = require('net');

const configs = [
  { host: 'aws-1-eu-west-1.pooler.supabase.com', port: 6543, name: 'Pooler (Transaction)' },
  { host: 'aws-1-eu-west-1.pooler.supabase.com', port: 5432, name: 'Pooler (Session)' },
  { host: 'aws-1-eu-west-1.pooler.supabase.com', port: 5432, name: 'Direct Connection' }
];

async function test(host, port, name) {
  return new Promise((resolve) => {
    console.log(`Testing ${name} (${host}:${port})...`);
    const socket = new net.Socket();
    const start = Date.now();
    
    socket.setTimeout(5000);
    
    socket.connect(port, host, () => {
      console.log(`✅ SUCCESS: Connected to ${name} in ${Date.now() - start}ms`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ FAILED: ${name} - ${err.message}`);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ TIMEOUT: ${name} - Request timed out after 5s`);
      socket.destroy();
      resolve(false);
    });
  });
}

(async () => {
  console.log('--- SUPABASE CONNECTIVITY TEST ---');
  for (const config of configs) {
    await test(config.host, config.port, config.name);
    console.log('----------------------------------');
  }
})();
