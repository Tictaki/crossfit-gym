import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prismaProxy = new Proxy({}, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      if (!process.env.DATABASE_URL) {
        // Log to console but don't crash the entire app immediately, 
        // let the route handler deal with the missing connection error.
        console.error('❌ CRITICAL: DATABASE_URL is missing in environment variables.');
        return null;
      }
      globalForPrisma.prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return globalForPrisma.prisma ? globalForPrisma.prisma[prop] : undefined;
  }
});

export default prismaProxy;
