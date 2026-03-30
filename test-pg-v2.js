const { Client } = require('pg');

// Trying standard Supabase db hostname on port 6543
const connectionString = "postgresql://postgres.auqigciynbyivnyavghg:xlxBXqEBr771x7pW@db.auqigciynbyivnyavghg.supabase.co:6543/postgres";

async function test() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect with pg module (db.[ref].supabase.co:6543)...');
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
