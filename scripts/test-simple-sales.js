// Simple test script for daily sales - uses the same db config as the app
const { db } = require('../src/lib/db');

async function testDailySales() {
  console.log('Testing Daily Sales Functionality...');
  
  try {
    // Check if daily_sales table exists and has data
    const [salesRows] = await db.execute('SELECT * FROM daily_sales ORDER BY sale_date DESC LIMIT 5');
    console.log('📊 Daily Sales Data:');
    console.log(salesRows);
    
    // Check orders that are served
    const [servedOrders] = await db.execute('SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status = "served"');
    console.log('🍽️  Served Orders Summary:');
    console.log(servedOrders);
    
    // Check all orders
    const [allOrders] = await db.execute('SELECT id, order_number, status, total FROM orders ORDER BY order_time DESC LIMIT 10');
    console.log('📋 Recent Orders:');
    console.log(allOrders);
    
    console.log('✅ Daily sales test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing daily sales:', error.message);
    console.log('💡 Make sure your database connection is configured in .env.local');
  }
}

// Run if called directly
if (require.main === module) {
  testDailySales().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testDailySales };
