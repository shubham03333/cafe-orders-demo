#!/usr/bin/env node
/**
 * Daily Sales Reset Script
 * Runs at 12 AM IST to finalize yesterday's sales and reset counters
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Import timezone utilities
const { getYesterdayISTDateString, formatISTDateTime } = require('./timezone-utils.js');

// Import the database connection
const { db } = require('./db-utils.js');

async function resetDailySales() {
  console.log('🔄 Starting daily sales reset process...');
  
  
  console.log(`⏰ Current IST time: ${formatISTDateTime(new Date())}`);

  try {
    const yesterdayIST = getYesterdayISTDateString();
    console.log(`📅 Processing sales for: ${yesterdayIST}`);

    if (!db) {
      throw new Error('Database connection not available');
    }

    // 1. Get total sales for yesterday from orders table
    console.log('📊 Calculating yesterday\'s sales from orders...');
    
    const [yesterdaySales] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue
      FROM orders 
      WHERE DATE(order_time) = ? 
        AND status = 'served'
    `, [yesterdayIST]);

    const totalOrders = yesterdaySales[0]?.total_orders || 0;
    const totalRevenue = yesterdaySales[0]?.total_revenue || 0;

    console.log(`💰 Yesterday's sales: ${totalOrders} orders, ₹${totalRevenue}`);

    if (totalOrders > 0) {
      // 2. Update daily_sales table with finalized totals
      console.log('💾 Updating daily_sales table with finalized data...');
      
      const [updateResult] = await db.execute(`
        INSERT INTO daily_sales (sale_date, total_orders, total_revenue) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
          total_orders = ?,
          total_revenue = ?,
          updated_at = CURRENT_TIMESTAMP
      `, [
        yesterdayIST, 
        totalOrders, 
        totalRevenue,
        totalOrders,
        totalRevenue
      ]);

      console.log(`✅ Daily sales updated successfully for ${yesterdayIST}`);
      console.log(`📝 Update result:`, updateResult);
    } else {
      console.log('ℹ️ No sales recorded yesterday, skipping update');
    }

    // 3. Optional: Clean up old orders if needed (keep served orders for 30 days)
    console.log('🧹 Checking for old orders to clean up...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [cleanupResult] = await db.execute(`
      DELETE FROM orders 
      WHERE status = 'served' 
        AND DATE(order_time) < ?
    `, [thirtyDaysAgoStr]);

    console.log(`🗑️ Cleaned up ${cleanupResult.affectedRows} old served orders`);

    console.log('✅ Daily sales reset process completed successfully!');

  } catch (error) {
    console.error('❌ Error during daily sales reset:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Running daily sales reset script...');
  
  resetDailySales()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { resetDailySales };
