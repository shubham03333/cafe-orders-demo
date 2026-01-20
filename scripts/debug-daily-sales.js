// Debug script for daily sales issues
const { db } = require('../src/lib/db');

async function debugDailySales() {
  console.log('🔍 Debugging Daily Sales Issues...');
  
  try {
    // 1. Check if daily_sales table exists
    console.log('\n1. Checking daily_sales table structure...');
    try {
      const [tableInfo] = await db.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'daily_sales' 
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (tableInfo.length === 0) {
        console.log('❌ daily_sales table does not exist!');
        console.log('💡 Run the init-database.sql script to create the table');
        return;
      }
      
      console.log('✅ daily_sales table exists with columns:');
      console.log(tableInfo);
      
    } catch (tableError) {
      console.log('❌ Error checking table structure:', tableError.message);
      return;
    }
    
    // 2. Check current data in daily_sales
    console.log('\n2. Checking current daily_sales data...');
    const [salesData] = await db.execute('SELECT * FROM daily_sales ORDER BY sale_date DESC');
    console.log('📊 Current daily sales data:', salesData);
    
    // 3. Check orders with served status
    console.log('\n3. Checking served orders...');
    const [servedOrders] = await db.execute(`
      SELECT id, order_number, status, total, order_time 
      FROM orders 
      WHERE status = 'served' 
      ORDER BY order_time DESC
    `);
    console.log('🍽️  Served orders:', servedOrders);
    
    // 4. Test the daily sales update query
    console.log('\n4. Testing daily sales update query...');
    if (servedOrders.length > 0) {
      const testOrder = servedOrders[0];
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Testing with order:', testOrder);
      console.log('Today:', today);
      
      try {
        const [result] = await db.execute(`
          INSERT INTO daily_sales (sale_date, total_orders, total_revenue) 
          VALUES (?, 1, ?) 
          ON DUPLICATE KEY UPDATE 
            total_orders = total_orders + 1,
            total_revenue = total_revenue + ?
        `, [today, testOrder.total, testOrder.total]);
        
        console.log('✅ Daily sales update query executed successfully');
        console.log('Result:', result);
        
      } catch (queryError) {
        console.log('❌ Daily sales update query failed:', queryError.message);
        console.log('💡 Check if the daily_sales table has the correct structure');
      }
    } else {
      console.log('ℹ️  No served orders found to test with');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  debugDailySales().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
}

module.exports = { debugDailySales };
