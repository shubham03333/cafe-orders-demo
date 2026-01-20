// Script to check environment variables configuration
const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
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
    
    return envVars;
  }
  return {};
}

function checkEnvironment() {
  console.log('🔍 Checking environment configuration...\n');
  
  // Check .env.local
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envLocalVars = loadEnvFile(envLocalPath);
  
  if (Object.keys(envLocalVars).length > 0) {
    console.log('✅ .env.local file found with variables:');
    Object.entries(envLocalVars).forEach(([key, value]) => {
      const maskedValue = key.includes('PASSWORD') ? '***' : value;
      console.log(`   ${key}=${maskedValue}`);
    });
  } else {
    console.log('❌ .env.local file not found or empty');
    console.log('   Run: cp .env.template .env.local');
    console.log('   Then edit .env.local with your database credentials');
  }
  
  console.log('\n📋 Required environment variables check:');
  
  const requiredVars = ['DB_HOST', 'DB_USERNAME', 'DB_NAME'];
  let allRequiredPresent = true;
  
  requiredVars.forEach(varName => {
    const hasVar = process.env[varName] || envLocalVars[varName];
    if (hasVar) {
      console.log(`   ✅ ${varName}: ${varName.includes('PASSWORD') ? '***' : hasVar}`);
    } else {
      console.log(`   ❌ ${varName}: MISSING`);
      allRequiredPresent = false;
    }
  });
  
  // Check for password
  const hasPassword = process.env.DB_PASSWORD || envLocalVars.DB_PASSWORD;
  if (hasPassword) {
    console.log('   ✅ DB_PASSWORD: *** (present)');
  } else {
    console.log('   ⚠️  DB_PASSWORD: Not set (may be required for some databases)');
  }
  
  // Check for DATABASE_URL alternative
  const hasDatabaseUrl = process.env.DATABASE_URL || envLocalVars.DATABASE_URL;
  if (hasDatabaseUrl) {
    console.log('   ✅ DATABASE_URL: *** (present)');
  } else {
    console.log('   ℹ️  DATABASE_URL: Not set (using individual parameters)');
  }
  
  console.log('\n🚀 Next steps:');
  if (allRequiredPresent) {
    console.log('   Run: npm run db:test     - Test database connection');
    console.log('   Run: npm run dev        - Start development server');
  } else {
    console.log('   Please configure all required environment variables first');
    console.log('   Edit .env.local with your database credentials');
  }
  
  return allRequiredPresent;
}

// If called directly
if (require.main === module) {
  const success = checkEnvironment();
  process.exit(success ? 0 : 1);
}

module.exports = { checkEnvironment };
