require('dotenv').config({ path: '.env.local' });
const { db } = require('./scripts/db-utils.js');

async function checkPaymentStatus() {
  try {
    console.log('Checking payment status of served orders...\n');

    const [orders] = await db.execute(
      'SELECT id, order_number, status, payment_status, total, order_time FROM orders WHERE status = "served" ORDER BY order_time DESC LIMIT 10'
    );

    console.log('Recent served orders:');
    orders.forEach(order => {
      console.log(`Order #${order.order_number}: ₹${order.total} - Status: ${order.status} - Payment: ${order.payment_status || 'null'}`);
    });

    // Count paid vs unpaid served orders
    const paidCount = orders.filter(o => o.payment_status === 'paid').length;
    const unpaidCount = orders.filter(o => o.payment_status !== 'paid').length;

    console.log(`\nSummary: ${paidCount} paid, ${unpaidCount} unpaid served orders`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPaymentStatus();
