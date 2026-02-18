
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing product creation with new fields...');
    const product = await prisma.product.create({
      data: {
        name: 'Test Product ' + Date.now(),
        commercialName: 'Test Brand',
        price: 100,
        stock: 10,
        category: 'Test Category',
        packageSize: '1kg',
        sku: 'TEST-' + Math.floor(Math.random() * 1000)
      }
    });
    console.log('Product created successfully:', product);
    
    console.log('Cleaning up test product...');
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log('Test product deleted.');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
