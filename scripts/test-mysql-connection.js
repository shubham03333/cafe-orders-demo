// Simple script to test MySQL database connection for AWS EC2
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=#]+)=([^#]*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    
    // Set environment variables
    Object.assign(process.env, envVars);
  }
}

async function testMySQLConnection() {
  try {
    // Load environment variables from .env.local
    loadEnvFile();
    
    console.log('Testing MySQL database connection to AWS EC2...');
    console.log('Environment variables:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USERNAME:', process.env.DB_USERNAME);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('Has DB_PASSWORD:', !!process.env.DB_PASSWORD);

    if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_NAME) {
      console.error('❌ Missing required database environment variables');
      console.error('Please check your .env.local file configuration');
      return false;
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ MySQL Connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Test query result:', rows);

    // Check if tables exist
    try {
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('Available tables:', tables.map(t => t.Tables_in_cafe_orders || Object.values(t)[0]));
    } catch (tableError) {
      console.log('❌ Error checking tables:', tableError.message);
    }

    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL Connection failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// If called directly
if (require.main === module) {
  testMySQLConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testMySQLConnection };
