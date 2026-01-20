// Script to list all users in the database
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

async function listUsers() {
  try {
    // Load environment variables from .env.local
    loadEnvFile();
    
    console.log('👥 Listing all users in database...');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get all users with their roles
    const [users] = await connection.execute(`
      SELECT u.id, u.username, r.role_name, u.created_at
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      ORDER BY u.id
    `);

    console.log(`📊 Found ${users.length} users:`);
    console.log('----------------------------------------');
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Role: ${user.role_name}`);
      console.log(`Created: ${user.created_at}`);
      console.log('----------------------------------------');
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

listUsers();
