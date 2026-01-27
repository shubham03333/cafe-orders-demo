require('dotenv').config({ path: '.env.local' });
const { executeQuery } = require('./src/lib/db');
const { getTodayDateString } = require('./src/lib/timezone-dynamic');

async function debugSalesAPI() {
  try {
    console.log('Debugging sales API...\n');

    const today = await getTodayDateString();
    console.log('Today date string from getTodayDateString():', today);

    // Check what orders exist for today
    const ordersQuery = `
      SELECT id, order_number, order_time, DATE(order_time) as order_date, payment_status, total
      FROM orders
      WHERE DATE(order_time) = ?
      ORDER BY order_time DESC
    `;

    const orders = await executeQuery(ordersQuery, [today]);
    console.log(`\nOrders with DATE(order_time) = '${today}':`);
    orders.forEach(order => {
      console.log(`Order #${order.order_number}: ${order.order_time} -> DATE: ${order.order_date}, Payment: ${order.payment_status}, Total: ₹${order.total}`);
    });

    // Check paid orders specifically
    const paidOrdersQuery = `
      SELECT id, order_number, order_time, DATE(order_time) as order_date, payment_status, total
      FROM orders
      WHERE DATE(order_time) = ? AND payment_status = 'paid'
      ORDER BY order_time DESC
    `;

    const paidOrders = await executeQuery(paidOrdersQuery, [today]);
    console.log(`\nPaid orders with DATE(order_time) = '${today}':`);
    paidOrders.forEach(order => {
      console.log(`Order #${order.order_number}: ${order.order_time} -> DATE: ${order.order_date}, Payment: ${order.payment_status}, Total: ₹${order.total}`);
    });

    // Calculate totals
    const totalOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    console.log(`\nCalculated totals: ${totalOrders} orders, ₹${totalRevenue}`);

    // Test the exact query from the API
    const apiQuery = `
      SELECT
        COUNT(*) as total_orders,
        SUM(total) as total_revenue
       FROM orders
       WHERE DATE(order_time) = ? AND payment_status = 'paid'
    `;

    const apiResult = await executeQuery(apiQuery, [today]);
    console.log('\nAPI query result:', apiResult);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugSalesAPI();
