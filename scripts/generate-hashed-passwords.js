const bcrypt = require('bcryptjs');

// Generate hashed passwords for the existing users
async function generateHashedPasswords() {
  const passwords = {
    admin: 'admin123',
    chef: 'chef456', 
    dashboard: 'shubh123'
  };

  console.log('Generating hashed passwords:');
  console.log('============================');

  for (const [username, password] of Object.entries(passwords)) {
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log(`Username: ${username}`);
    console.log(`Plain password: ${password}`);
    console.log(`Hashed password: ${hashedPassword}`);
    console.log('---');
  }
}

generateHashedPasswords().catch(console.error);
