const net = require('net');
const mysql = require('mysql2/promise');

async function testPortConnectivity() {
  const host = '3.108.223.194';
  const port = 3306;

  console.log(`Testing connectivity to ${host}:${port}...`);

  // Test if port is open
  const socket = new net.Socket();
  
  return new Promise((resolve) => {
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log('✅ Port 3306 is open and accessible');
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.log('❌ Connection timeout - port may be blocked or server not responding');
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.log('❌ Connection error:', err.message);
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function testMySQLWithTimeout() {
  console.log('Testing MySQL connection with timeout...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '3.108.223.194',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'cafe_node_db',
      connectTimeout: 5000,
    });

    console.log('✅ MySQL Connection successful!');
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL Connection failed:', error.message);
    return false;
  }
}

async function main() {
  // Load environment variables first
  const fs = require('fs');
  const path = require('path');
  
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
    
    Object.assign(process.env, envVars);
  }

  console.log('Testing database connectivity...');
  
  // Test port connectivity
  const portOpen = await testPortConnectivity();
  
  if (portOpen) {
    // If port is open, test MySQL connection
    await testMySQLWithTimeout();
  } else {
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if MySQL is running on the EC2 instance');
    console.log('2. Verify AWS Security Group allows port 3306');
    console.log('3. Check MySQL bind-address configuration');
    console.log('4. Ensure no firewall is blocking the connection');
  }
}

if (require.main === module) {
  main();
}
