import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

const secret = process.env.JWT_SECRET;
console.log('Secret from .env:', secret);

async function verifyAuth() {
  try {
    const VALID_USER_ID = 'a961986a-7ffd-479e-a60d-749e757a3e89';
    const token = jwt.sign({ userId: VALID_USER_ID }, secret, { expiresIn: '1h' });
    console.log('Generated token:', token);

    const decoded = jwt.verify(token, secret);
    console.log('Decoded payload:', decoded);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (user) {
      console.log('SUCCESS: User found in database:', user.email);
    } else {
      console.log('FAILURE: User NOT found in database for ID:', decoded.userId);
    }
  } catch (error) {
    console.error('ERROR during verification:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

verifyAuth();
