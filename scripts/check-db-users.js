// Script to check users in the database
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

async function checkUsers() {
  try {
    // Load environment variables from .env.local
    loadEnvFile();
    
    console.log('🔍 Checking users in database...');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Check users table
    console.log('\n📊 Checking users table...');
    try {
      const [users] = await connection.execute('SELECT * FROM users');
      console.log(`Found ${users.length} users in the database:`);
      
      if (users.length > 0) {
        users.forEach(user => {
          console.log(`   👤 ID: ${user.id}, Username: ${user.username}, Role ID: ${user.role_id}`);
          console.log(`      Password hash: ${user.password ? 'Present' : 'Missing'}`);
        });
      } else {
        console.log('   ❌ No users found in the database');
      }
    } catch (error) {
      console.log('   ❌ Error querying users table:', error.message);
    }

    // Check user_roles table
    console.log('\n📊 Checking user_roles table...');
    try {
      const [roles] = await connection.execute('SELECT * FROM user_roles');
      console.log(`Found ${roles.length} roles in the database:`);
      
      roles.forEach(role => {
        console.log(`   🛡️  ID: ${role.id}, Role: ${role.role_name}`);
      });
    } catch (error) {
      console.log('   ❌ Error querying user_roles table:', error.message);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkUsers();
