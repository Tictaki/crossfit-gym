
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import fs from 'fs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';
const LOG_FILE = 'verify_log.txt';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Initialize log file
fs.writeFileSync(LOG_FILE, '');

async function verifyRBAC() {
  log('🔄 Starting RBAC Verification...');
  let staffUser = null;
  let token = null;

  try {
    // 1. Create STAFF user
    log('1️⃣ Creating test STAFF user...');
    const hashedPassword = await bcrypt.hash('staff123', 10);
    const uniqueEmail = `staff_test_${Date.now()}@example.com`;
    
    staffUser = await prisma.user.create({
      data: {
        name: 'Staff Teste',
        email: uniqueEmail,
        password: hashedPassword,
        role: 'RECEPTIONIST'
      }
    });
    log(`✅ Staff user created: ${staffUser.email} (ID: ${staffUser.id})`);

    // 2. Login
    log('2️⃣ Logging in as STAFF...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'staff123'
    });
    token = loginResponse.data.token;
    log('✅ Login successful. Token obtained.');

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Test Product Creation (Should Fail)
    log('3️⃣ Testing Product Creation (Expected: 403 Forbidden)...');
    try {
      await axios.post(`${API_URL}/products`, {
        name: 'Forbidden Product',
        description: 'Should not modify',
        price: 100,
        stock: 10,
        category: 'SUPPLEMENTS'
      }, { headers });
      log('❌ FAILURE: Staff was able to create a product!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        log('✅ SUCCESS: Product creation blocked (403 Forbidden)');
      } else {
        log(`❌ UNEXPECTED ERROR: ${error.message} (Status: ${error.response?.status})`);
      }
    }

    // 4. Test Product Update (Should Fail)
    // We need an existing product ID. Let's find one or assume one exists.
    const product = await prisma.product.findFirst();
    if (product) {
        log(`4️⃣ Testing Product Update for ID ${product.id} (Expected: 403 Forbidden)...`);
        try {
            await axios.put(`${API_URL}/products/${product.id}`, {
                name: 'Hacked Product Name'
            }, { headers });
            log('❌ FAILURE: Staff was able to update a product!');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                log('✅ SUCCESS: Product update blocked (403 Forbidden)');
            } else {
                log(`❌ UNEXPECTED ERROR: ${error.message} (Status: ${error.response?.status})`);
            }
        }
    } else {
        log('⚠️ SKIPPING Product Update Test: No products found in database.');
    }

    // 5. Test Plan Creation (Should Fail)
    log('5️⃣ Testing Plan Creation (Expected: 403 Forbidden)...');
    try {
      await axios.post(`${API_URL}/plans`, {
        name: 'Forbidden Plan',
        price: 999,
        durationDays: 30,
        description: 'Should not exist'
      }, { headers });
      log('❌ FAILURE: Staff was able to create a plan!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        log('✅ SUCCESS: Plan creation blocked (403 Forbidden)');
      } else {
        log(`❌ UNEXPECTED ERROR: ${error.message} (Status: ${error.response?.status})`);
      }
    }

    // 6. Test Database Export (Should Fail)
    log('6️⃣ Testing Database Export (Expected: 403 Forbidden)...');
    try {
      await axios.get(`${API_URL}/settings/export-database`, { headers });
      log('❌ FAILURE: Staff was able to export database!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        log('✅ SUCCESS: Database export blocked (403 Forbidden)');
      } else {
        log(`❌ UNEXPECTED ERROR: ${error.message} (Status: ${error.response?.status})`);
      }
    }

  } catch (error) {
    log('🚨 CRITICAL ERROR during verification: ' + error.message);
    if (error.response) {
        log('Response data: ' + JSON.stringify(error.response.data));
    }
  } finally {
    // Cleanup
    if (staffUser) {
      log('🧹 Cleaning up test user...');
      await prisma.user.delete({ where: { id: staffUser.id } });
      log('✅ Test user deleted.');
    }
    await prisma.$disconnect();
    log('🏁 Verification finished.');
  }
}

verifyRBAC();
