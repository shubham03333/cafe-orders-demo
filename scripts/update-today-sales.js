#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { db } = require('./db-utils.js');
const { getTodayISTDateString } = require('./timezone-utils.js');

async function updateTodaySales() {
  try {
    const today = getTodayISTDateString();
    
    // Get today's sales from orders table
    const [todaySales] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue
      FROM orders 
      WHERE DATE(order_time) = ? 
        AND status = 'served'
    `, [today]);

    const totalOrders = todaySales[0]?.total_orders || 0;
    const totalRevenue = todaySales[0]?.total_revenue || 0;

    console.log(`Today's sales: ${totalOrders} orders, ₹${totalRevenue}`);

    // Update daily_sales table
    const [updateResult] = await db.execute(`
      INSERT INTO daily_sales (sale_date, total_orders, total_revenue) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        total_orders = ?,
        total_revenue = ?,
        updated_at = CURRENT_TIMESTAMP
    `, [today, totalOrders, totalRevenue, totalOrders, totalRevenue]);

    console.log(`✅ Daily sales updated successfully for ${today}`);
    console.log(`📝 Update result:`, updateResult);

  } catch (error) {
    console.error('❌ Error updating today sales:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🔄 Updating today\'s sales in daily_sales table...');
  
  updateTodaySales()
    .then(() => {
      console.log('🎉 Today\'s sales update completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Today\'s sales update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateTodaySales };
