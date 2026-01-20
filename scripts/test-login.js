// Script to test login functionality
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

async function testLogin(username, password) {
  try {
    // Load environment variables from .env.local
    loadEnvFile();
    
    console.log(`🔐 Testing login for username: ${username}`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Find user by username
    const [users] = await connection.execute(`
      SELECT u.id, u.username, u.password, r.role_name, r.permissions
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.username = ?
    `, [username]);

    const user = users[0];

    if (!user) {
      console.log('❌ User not found');
      await connection.end();
      return false;
    }

    console.log(`✅ User found: ${user.username} (Role: ${user.role_name})`);
    console.log(`   Password hash: ${user.password}`);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (isValidPassword) {
      console.log('✅ Password verification: SUCCESS');
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('❌ Login failed - invalid password');
    }

    await connection.end();
    return isValidPassword;
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    return false;
  }
}

// Test with different credentials
async function runTests() {
  console.log('🧪 Running login tests...\n');
  
  // Test admin login
  console.log('1. Testing admin login:');
  await testLogin('admin', 'admin123');
  
  console.log('\n2. Testing chef login:');
  await testLogin('chef', 'chef456');
  
  console.log('\n3. Testing dashboard login:');
  await testLogin('dashboard', 'shubh123');
  
  console.log('\n4. Testing invalid password:');
  await testLogin('admin', 'wrongpassword');
  
  console.log('\n5. Testing non-existent user:');
  await testLogin('nonexistent', 'password123');
}

runTests();
