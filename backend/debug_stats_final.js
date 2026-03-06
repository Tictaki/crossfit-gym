
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const prisma = new PrismaClient();
const JWT_SECRET = "your-secret-key-change-this-in-production";

async function debugStats() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
      console.error('No admin user found');
      process.exit(1);
    }
    console.log('Found admin user:', user.email, 'ID:', user.id);

    // Payload MUST have userId
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token');

    const response = await axios.get('http://localhost:3001/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('--- STATS RESPONSE ---');
    console.log(JSON.stringify(response.data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) console.error('Data:', error.response.data);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

debugStats();
