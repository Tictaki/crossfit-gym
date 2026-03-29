const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createAdmin() {
  const client = new pg.Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🚀 Connected to Supabase via raw pg...');

    const email = 'fauzia@crosstraining.com';
    const name = 'Fauzia Admin';
    const id = uuidv4();

    const query = `
      INSERT INTO "User" (id, email, name, password, role, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO UPDATE
      SET role = 'ADMIN', name = $3, "updatedAt" NOW()
      RETURNING *;
    `;

    const res = await client.query(query, [id, email, name, 'SUPABASE_MANAGED', 'ADMIN']);
    console.log('✅ Admin user created/updated:', res.rows[0]);

  } catch (err) {
    console.error('❌ Database error:', err);
  } finally {
    await client.end();
  }
}

createAdmin();
