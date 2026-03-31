import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton for Vercel Serverless
 * Optimized for Supabase Transaction Pooler (PgBouncer)
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Supabase pooling: we want to be conservative with connection timeouts
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
