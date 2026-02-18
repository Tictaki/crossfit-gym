import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const token = jwt.sign({ id: 'dummy-id', role: 'ADMIN' }, secret);

console.log(token);
