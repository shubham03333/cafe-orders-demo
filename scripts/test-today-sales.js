require('dotenv').config({ path: '.env.local' });
const { db } = require('./db-utils.js');

async function testTodaySales() {
  try {
    // Get current IST date
    const todayIST = new Date();
    // IST is UTC+5:30
    todayIST.setHours(todayIST.getHours() + 5);
    todayIST.setMinutes(todayIST.getMinutes() + 30);
    const todayDateStr = todayIST.toISOString().split('T')[0];
    
    console.log('Today (IST):', todayDateStr);
    
    // Get all served orders
    const [allServed] = await db.execute('SELECT * FROM orders WHERE status = "served" ORDER BY order_time DESC');
    
    console.log('\nAll served orders analysis:');
    let totalTodaySales = 0;
    
    allServed.forEach(order => {
      const orderTime = new Date(order.order_time);
      // Convert to IST for comparison
      const orderTimeIST = new Date(orderTime);
      orderTimeIST.setHours(orderTimeIST.getHours() + 5);
      orderTimeIST.setMinutes(orderTimeIST.getMinutes() + 30);
      const orderDateStr = orderTimeIST.toISOString().split('T')[0];
      
      const isToday = orderDateStr === todayDateStr;
      
      console.log(`Order #${order.order_number}: ₹${parseFloat(order.total)} - ${orderTime} -> ${orderDateStr} ${isToday ? '(TODAY)' : ''}`);
      
      if (isToday) {
        totalTodaySales += parseFloat(order.total);
      }
    });
    
    console.log('\nTotal today sales (calculated): ₹' + totalTodaySales);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testTodaySales();
