import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prismaProxy = new Proxy({}, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    return globalForPrisma.prisma[prop];
  }
});

export default prismaProxy;
