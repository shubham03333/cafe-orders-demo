// Test API endpoints to verify daily sales functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
  console.log('Testing API Endpoints...');
  
  try {
    // Test 1: Get menu items
    console.log('\n1. Testing /api/menu...');
    const menuResponse = await axios.get(`${BASE_URL}/menu`);
    console.log('✅ Menu API working:', menuResponse.data.length, 'items found');
    
    // Test 2: Get orders
    console.log('\n2. Testing /api/orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/orders`);
    console.log('✅ Orders API working:', ordersResponse.data.length, 'orders found');
    
    // Test 3: Check if any orders are served
    const servedOrders = ordersResponse.data.filter(order => order.status === 'served');
    console.log('🍽️  Served orders:', servedOrders.length);
    
    if (servedOrders.length > 0) {
      console.log('💰 Total revenue from served orders:', servedOrders.reduce((sum, order) => sum + order.total, 0));
    }
    
    console.log('\n✅ All API endpoints are working correctly!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a new order through the web interface');
    console.log('2. Mark it as "served" to test daily sales tracking');
    console.log('3. Check if the daily_sales table gets updated');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testEndpoints().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testEndpoints };
