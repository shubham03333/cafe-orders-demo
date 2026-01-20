require('dotenv').config({ path: '.env.local' });
const { db } = require('./db-utils.js');

async function checkServedOrders() {
  try {
    const [rows] = await db.execute('SELECT * FROM orders WHERE status = "served" ORDER BY order_time DESC LIMIT 10');
    console.log('Recent served orders:');
    rows.forEach(order => {
      console.log(`Order #${order.order_number}: ₹${order.total} - ${order.order_time} - ${order.status}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkServedOrders();
