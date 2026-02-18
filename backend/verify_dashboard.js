
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';
const LOG_FILE = 'verify_dashboard.txt';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Initialize log file
fs.writeFileSync(LOG_FILE, '');

async function verifyDashboard() {
  log('🔄 Starting Dashboard Sales Verification...');
  let adminUser = null;
  let token = null;

  try {
    // 1. Get existing ADMIN user or create one
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (!adminUser) {
        log('⚠️ No ADMIN user found. Cannot verify dashboard.');
        return;
    }
    
    // We assume we can't easily login without knowing the password.
    // So we'll cheat a bit for verification: generate a token directly if we had the secret,
    // OR we can just check the endpoint response structure if we mock the auth or use a known user.
    // Since we don't know the password of existing admin, let's create a temp one.
    
    /* 
       BETTER APPROACH:
       Since we are in a dev environment, let's just create a temp admin, login, check stats, and delete.
    */
   
    const tempEmail = `admin_test_${Date.now()}@example.com`;
    // We need bcrypt to hash password, but let's assume we can use the same flow as before
    // Wait, we don't need to reinstall bcrypt if it is in package.json.
    // It is in package.json.
    
    // Dynamic import for bcrypt if needed, but we used it in previous script so it should be available in node_modules
    // However, the import above needs to be valid.
    
    // Let's use the same approach as verify_rbac.js but with ADMIN role
  } catch (error) {
      log('Error setup: ' + error.message);
  }
}

// Re-writing the script to be complete and identical to verify_rbac pattern
import bcrypt from 'bcryptjs';

async function runTest() {
    log('🔄 Starting Dashboard Verification...');
    let adminUser = null;
    let token = null;

    try {
        // 1. Create Temp ADMIN
        log('1️⃣ Creating test ADMIN user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const uniqueEmail = `admin_dash_${Date.now()}@example.com`;
        
        adminUser = await prisma.user.create({
            data: {
                name: 'Admin Dashboard Test',
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

        // 3. Fetch Dashboard Stats
        log('3️⃣ Fetching Dashboard Stats...');
        const response = await axios.get(`${API_URL}/dashboard/stats`, { headers });
        const stats = response.data;

        // 4. Verify New Fields
        log('4️⃣ Verifying Sales Data Fields...');
        
        if (stats.hasOwnProperty('salesRevenueThisMonth')) {
            log(`✅ Field 'salesRevenueThisMonth' exists: ${stats.salesRevenueThisMonth}`);
        } else {
            log(`❌ MISSING Field 'salesRevenueThisMonth'`);
        }

        if (stats.hasOwnProperty('salesCount')) {
            log(`✅ Field 'salesCount' exists: ${stats.salesCount}`);
        } else {
            log(`❌ MISSING Field 'salesCount'`);
        }

        if (stats.hasOwnProperty('lowStockCount')) {
            log(`✅ Field 'lowStockCount' exists: ${stats.lowStockCount}`);
        } else {
            log(`❌ MISSING Field 'lowStockCount'`);
        }

        if (stats.hasOwnProperty('topProducts') && Array.isArray(stats.topProducts)) {
            log(`✅ Field 'topProducts' exists and is array. Length: ${stats.topProducts.length}`);
        } else {
            log(`❌ MISSING or INVALID Field 'topProducts'`);
        }

        // Check if monthlyRevenue has sales data
        if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
            const firstMonth = stats.monthlyRevenue[0];
            if (firstMonth.hasOwnProperty('sales')) {
                log(`✅ Monthly revenue has 'sales' field.`);
            } else {
                log(`❌ Monthly revenue MISSING 'sales' field.`);
            }
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
            log('✅ Cleanup done.');
        }
        await prisma.$disconnect();
    }
}

runTest();
