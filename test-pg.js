const { Client } = require('pg');

const connectionString = "postgresql://postgres.auqigciynbyivnyavghg:xlxBXqEBr771x7pW@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function test() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('Attempting to connect with pg module (SSL on)...');
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
