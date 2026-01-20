// Script to run SQL files
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

async function runSQLFile(filePath) {
  try {
    // Load environment variables from .env.local
    loadEnvFile();
    
    console.log(`📁 Running SQL file: ${filePath}`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Read SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent.split(';').filter(statement => statement.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.trim().substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }

    console.log('✅ SQL file executed successfully');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error executing SQL file:', error.message);
  }
}

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Please provide a SQL file path as argument');
  process.exit(1);
}

runSQLFile(filePath);
