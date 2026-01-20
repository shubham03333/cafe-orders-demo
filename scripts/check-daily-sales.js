// Simple script to check daily_sales table
const { executeQuery } = require('./db-utils');
const { getTodayISTDateString } = require('./timezone-utils');

async function checkDailySales() {
  try {
    console.log('Checking daily_sales table...');
    
    // Check all records in daily_sales
    const allSales = await executeQuery('SELECT * FROM daily_sales ORDER BY sale_date DESC');
    console.log('All daily_sales records:', allSales);
    
    // Check today's record specifically
    const today = getTodayISTDateString();
    const todaySales = await executeQuery('SELECT * FROM daily_sales WHERE sale_date = ?', [today]);
    console.log(`Today's (${today}) sales record:`, todaySales);
    
    if (todaySales.length === 0) {
      console.log('❌ No daily_sales record found for today');
    } else {
      console.log('✅ Today\'s sales record found');
    }
    
  } catch (error) {
    console.error('Error checking daily_sales:', error);
  }
}

checkDailySales();
