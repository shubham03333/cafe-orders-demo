// Test script to verify daily sales functionality
const { testConnection } = require('./test-connection');

async function testDailySales() {
  console.log('Testing Daily Sales Functionality...');
  
  // First test the connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Database connection failed');
    return;
  }

  const { db } = require('../src/lib/db');
  
  try {
    // Check if daily_sales table exists and has data
    const [salesRows] = await db.execute('SELECT * FROM daily_sales ORDER BY sale_date DESC LIMIT 5');
    console.log('📊 Daily Sales Data:');
    console.log(salesRows);
    
    // Check orders that are served
    const [servedOrders] = await db.execute('SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status = "served"');
    console.log('🍽️  Served Orders Summary:');
    console.log(servedOrders);
    
    console.log('✅ Daily sales test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing daily sales:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testDailySales().then(() => {
    process.exit(0);
  });
}

module.exports = { testDailySales };
