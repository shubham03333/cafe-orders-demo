// Script to update user password in the database
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

async function updateUserPassword(username, newPassword) {
  try {
    // Load environment variables from .env.local
    loadEnvFile();
    
    console.log(`🔐 Updating password for user: ${username}`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`🔒 New password hash: ${hashedPassword}`);

    // Update the user's password
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Password updated successfully for user: ${username}`);
      console.log(`📝 New password: ${newPassword}`);
    } else {
      console.log(`❌ User not found: ${username}`);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  }
}

// Get username and password from command line arguments
const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('❌ Usage: node scripts/update-user-password.js <username> <new_password>');
  console.error('Example: node scripts/update-user-password.js admin newpassword123');
  process.exit(1);
}

updateUserPassword(username, newPassword);
