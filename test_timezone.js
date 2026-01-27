require('dotenv').config({ path: '.env.local' });
const { getTodayDateString } = require('./src/lib/timezone-dynamic.ts');

async function testTimezone() {
  try {
    console.log('Testing timezone functionality...\n');

    const today = await getTodayDateString();
    console.log('Today date string from getTodayDateString():', today);

    // Test with current date
    const now = new Date();
    console.log('Current system date:', now.toISOString());
    console.log('Current system date (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

    // Check what the API would return
    const response = await fetch('http://localhost:3000/api/daily-sales/today');
    if (response.ok) {
      const data = await response.json();
      console.log('API response:', data);
    } else {
      console.log('API call failed:', response.status);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testTimezone();
