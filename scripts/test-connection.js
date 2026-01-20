// // Simple script to test database connection
// // Run with: node -r dotenv/config scripts/test-connection.js

// const { connect } = require('@planetscale/database');

// async function testConnection() {
//   try {
//     const config = {
//       url: process.env.DATABASE_URL || 
//            `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?ssl={"rejectUnauthorized":true}`
//     };

//     console.log('Testing database connection...');
//     console.log('Using config:', {
//       host: process.env.DB_HOST,
//       database: process.env.DB_NAME,
//       username: process.env.DB_USERNAME,
//       hasPassword: !!process.env.DB_PASSWORD,
//       hasDatabaseUrl: !!process.env.DATABASE_URL
//     });

//     const db = connect(config);
    
//     // Test a simple query
//     const result = await db.execute('SELECT 1 as test');
//     console.log('✅ Connection successful!');
//     console.log('Test query result:', result.rows);
    
//     return true;
//   } catch (error) {
//     console.error('❌ Connection failed:', error.message);
//     return false;
//   }
// }

// // If called directly
// if (require.main === module) {
//   testConnection().then(success => {
//     process.exit(success ? 0 : 1);
//   });
// }

// module.exports = { testConnection };
