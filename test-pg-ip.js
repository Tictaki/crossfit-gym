const { Client } = require('pg');

// Using Direct IP for the pooler in sa-east-1
const connectionString = "postgresql://postgres.auqigciynbyivnyavghg:xlxBXqEBr771x7pW@54.94.90.106:6543/postgres";

async function test() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect with pg module (IP: 54.94.90.106:6543)...');
    await client.connect();
    console.log('✅ SUCCESS: Connected to Supabase!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    process.exit(1);
  }
}

test();
