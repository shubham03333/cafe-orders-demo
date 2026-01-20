# Password Fix Guide

## Current Status: ✅ Perfect MySQL Configuration
Your MySQL user setup is correct:
- `root@%` exists (allows root from any host)
- The user permissions are properly configured

## The Problem: ❌ Incorrect Password
The error `Access denied for user 'root'@'202.91.134.144' (using password: YES)` means:
- ✅ User exists and has permissions
- ✅ Connection reaches MySQL server
- ❌ **Password is incorrect**

## Immediate Solution:

### Step 1: Check/Reset MySQL Root Password on EC2
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@3.108.223.194

# Connect to MySQL (try with no password first)
mysql -u root

# If that doesn't work, try common default passwords:
mysql -u root -p
# Try password: (blank), 'root', 'password', '123456'

# If you can't remember, reset the password:
```

### Step 2: Reset MySQL Root Password (If Needed)
```bash
# Stop MySQL
sudo systemctl stop mysql

# Start MySQL without authentication
sudo mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# Reset password
FLUSH PRIVILEGES;
ALTER USER 'root'@'%' IDENTIFIED BY 'Sbmntn@2';
FLUSH PRIVILEGES;

# Exit and restart MySQL
exit
sudo systemctl start mysql
```

### Step 3: Test the New Password
```bash
# Test connection with new password
mysql -u root -p -h 3.108.223.194
# Enter your new password when prompted
```

### Step 4: Update Your Environment Variables
Edit your `.env.local` file with the **correct password**:
```bash
DB_HOST=3.108.223.194
DB_USERNAME=root
DB_PASSWORD=your-actual-mysql-password-here
DB_NAME=cafe_node_db
```

### Step 5: Test the Application
```bash
# Test database connection
npm run db:test

# Should show: ✅ Connection successful!

# Start your application
npm run dev

# API endpoints should now work!
```

## Common Default Passwords to Try:
- (blank - no password)
- `root`
- `password` 
- `123456`
- `mysql`
- The password you set during MySQL installation

## If You're Still Having Issues:

### Check MySQL Error Log
```bash
# Check MySQL error logs for more details
sudo tail -f /var/log/mysql/error.log
```

### Verify Password Hashing
```sql
-- Check password authentication method
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';

-- If using auth_socket, change to mysql_native_password
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'new-password';
```

### Test with Simple Connection
```bash
# Simple test without the application
mysql -u root -p -h 3.108.223.194 -e "SELECT 1 as test;"
```

You're extremely close! The user configuration is perfect - you just need to ensure the password in your `.env.local` file matches the actual MySQL root password.
