// Simple MySQL connection test without dotenv
const mysql = require('mysql2/promise');

async function testMySQLConnection() {
  try {
    console.log('Testing MySQL database connection...');
    
    // Replace these with your actual database credentials
    const config = {
      host: 'your-ec2-instance-ip',      // Replace with your EC2 IP
      user: 'your-mysql-username',       // Replace with your MySQL username
      password: 'your-mysql-password',   // Replace with your MySQL password
      database: 'your-database-name',    // Replace with your database name
    };

    console.log('Using config:', {
      host: config.host,
      database: config.database,
      user: config.user,
      hasPassword: !!config.password
    });

    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL Connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Test query result:', rows);

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
