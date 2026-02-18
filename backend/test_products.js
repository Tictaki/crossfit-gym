const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let token = '';

async function testProducts() {
  try {
    console.log('--- Starting Product API Tests ---');

    // 1. Login to get token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gym.com',
      password: 'admin123'
    });
    token = loginRes.data.token;
    console.log('✅ Login successful');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Create a product
    const productRes = await axios.post(`${API_URL}/products`, {
      name: 'Água Mineral 500ml',
      description: 'Água fresca para o treino',
      price: 50,
      stock: 50,
      category: 'Bebidas'
    }, config);
    const productId = productRes.data.id;
    console.log('✅ Product created:', productRes.data.name);

    // 3. List products
    const listRes = await axios.get(`${API_URL}/products`, config);
    console.log('✅ Products listed, count:', listRes.data.length);

    // 4. Record a sale
    const saleRes = await axios.post(`${API_URL}/products/sales`, {
      productId,
      quantity: 2,
      totalAmount: 100,
      paymentMethod: 'CASH'
    }, config);
    console.log('✅ Sale recorded, total:', saleRes.data.totalAmount, 'MZN');

    // 5. Verify stock update
    const updatedProductRes = await axios.get(`${API_URL}/products`, config);
    const updatedProduct = updatedProductRes.data.find(p => p.id === productId);
    console.log('✅ Updated stock:', updatedProduct.stock, '(Expected 48)');

    if (updatedProduct.stock === 48) {
      console.log('🎉 Stock verification PASSED');
    } else {
      console.error('❌ Stock verification FAILED');
    }

    // 6. List sales
    const salesListRes = await axios.get(`${API_URL}/products/sales`, config);
    console.log('✅ Sales listed, count:', salesListRes.data.length);

    console.log('--- All Tests Passed! ---');
  } catch (error) {
    console.error('❌ Tests failed:', error.response?.data || error.message);
  }
}

testProducts();
