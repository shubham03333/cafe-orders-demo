require('dotenv').config({ path: '.env.local' });
const { executeQuery } = require('./scripts/db-utils.js');

async function fixTodaySales() {
  try {
    console.log('Fixing today\'s sales...\n');

    // Get current date in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + istOffset);
    const today = istDate.toISOString().split('T')[0];
    console.log('Today date:', today);

    // Get all served and paid orders for today
    const servedOrdersQuery = `
      SELECT id, order_number, total, order_time
      FROM orders
      WHERE status = 'served'
      AND payment_status = 'paid'
      AND DATE(order_time) = ?
      ORDER BY order_time DESC
    `;

    const servedOrders = await executeQuery(servedOrdersQuery, [today]);
    console.log(`Found ${servedOrders.length} served and paid orders for today`);

    if (servedOrders.length === 0) {
      console.log('No served orders found for today. Nothing to fix.');
      return;
    }

    // Calculate totals
    const totalOrders = servedOrders.length;
    const totalRevenue = servedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    console.log(`Calculated totals: ${totalOrders} orders, ₹${totalRevenue}`);

    // Update or insert into daily_sales table
    const updateQuery = `
      INSERT INTO daily_sales (sale_date, total_orders, total_revenue)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_orders = VALUES(total_orders),
        total_revenue = VALUES(total_revenue)
    `;

    await executeQuery(updateQuery, [today, totalOrders, totalRevenue]);
    console.log('✅ Successfully updated daily_sales table for today');

    // Verify the update
    const verifyQuery = `
      SELECT * FROM daily_sales
      WHERE sale_date = ?
    `;

    const verifyResult = await executeQuery(verifyQuery, [today]);
    console.log('Verification - daily_sales entry:', verifyResult[0]);

  } catch (error) {
    console.error('Error fixing sales:', error);
  } finally {
    process.exit(0);
  }
}

fixTodaySales();
