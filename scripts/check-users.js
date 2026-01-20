require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🔍 Checking users in database...');
    
    // Check if users table has any data
    const [users] = await connection.execute('SELECT * FROM users');
    console.log(`📊 Found ${users.length} users in the database:`);
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`   👤 ID: ${user.id}, Username: ${user.username}, Role ID: ${user.role_id}`);
      });
    } else {
      console.log('   ❌ No users found in the database');
    }

    // Check user_roles table
    const [roles] = await connection.execute('SELECT * FROM user_roles');
    console.log(`\n📊 Found ${roles.length} roles in the database:`);
    
    roles.forEach(role => {
      console.log(`   🛡️  ID: ${role.id}, Role: ${role.role_name}`);
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    console.error('Full error:', error);
  }
}

checkUsers();
