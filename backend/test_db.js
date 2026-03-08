import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'Expense\'');
    console.log("Database Columns:");
    console.log(columns);
    
    // Test creating an expense locally to see if it replicates the P2022 error
    await prisma.expense.create({
      data: {
        description: "Test Expense",
        amount: 10.0,
        category: "OTHER",
        processedBy: (await prisma.user.findFirst()).id,
        dueDate: new Date(),
        invoiceNumber: "TEST-123"
      }
    });
    console.log("Successfully created test expense with dueDate.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
