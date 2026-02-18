
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';
const LOG_FILE = 'verify_custom_expense.txt';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Initialize log file
fs.writeFileSync(LOG_FILE, '');

async function runTest() {
    log('🔄 Starting Custom Expense Verification...');
    let adminUser = null;
    let token = null;

    try {
        // 1. Create Temp ADMIN
        log('1️⃣ Creating test ADMIN user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const uniqueEmail = `admin_exp_${Date.now()}@example.com`;
        
        adminUser = await prisma.user.create({
            data: {
                name: 'Admin Expense Test',
                email: uniqueEmail,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });
        log(`✅ Admin user created: ${adminUser.email}`);

        // 2. Login
        log('2️⃣ Logging in as ADMIN...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: uniqueEmail,
            password: 'admin123'
        });
        token = loginResponse.data.token;
        log('✅ Login successful.');

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Create Expense with Custom Category
        const customCategoryName = `CustomCat_${Date.now()}`;
        log(`3️⃣ Creating expense with custom category: ${customCategoryName}...`);
        
        const expenseData = {
            description: 'Test Custom Expense',
            amount: 500,
            category: customCategoryName,
            date: new Date().toISOString().split('T')[0]
        };

        const createResponse = await axios.post(`${API_URL}/expenses`, expenseData, { headers });
        const createdExpense = createResponse.data;
        log(`✅ Expense created. ID: ${createdExpense.id}`);

        // 4. Verify in Database
        log('4️⃣ Verifying in Database...');
        const expenseInDb = await prisma.expense.findUnique({
            where: { id: createdExpense.id }
        });

        if (expenseInDb && expenseInDb.category === customCategoryName) {
            log(`✅ SUCCESS: Expense found in DB with correct custom category: ${expenseInDb.category}`);
        } else {
            log(`❌ FAILURE: Expense not found or category mismatch. Found: ${expenseInDb?.category}`);
        }

    } catch (error) {
        log('🚨 ERROR: ' + error.message);
        if (error.response) {
            log('Response: ' + JSON.stringify(error.response.data));
        }
    } finally {
        if (adminUser) {
            log('🧹 Cleaning up...');
            await prisma.user.delete({ where: { id: adminUser.id } });
            // Cleanup expense if needed, but deleting user might cascade if set up, or we leave it.
            // Let's delete the expense to keep DB clean
            const expense = await prisma.expense.findFirst({where: { description: 'Test Custom Expense' }});
            if(expense) await prisma.expense.delete({where: {id: expense.id}});
            log('✅ Cleanup done.');
        }
        await prisma.$disconnect();
    }
}

runTest();
