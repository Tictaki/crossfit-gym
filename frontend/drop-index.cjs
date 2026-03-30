const { Client } = require('pg');
const connectionString = 'postgresql://postgres.auqigciynbyivnyavghg:xlxBXqEBr771x7pW@db.auqigciynbyivnyavghg.supabase.co:5432/postgres?sslmode=no-verify';

async function main() {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected! Dropping index if it exists...');
    const res = await client.query('DROP INDEX IF EXISTS "Expense_category_idx"');
    console.log('SQL executed successfully.');
    console.log('Result:', res.command, res.rowCount);
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

main();
