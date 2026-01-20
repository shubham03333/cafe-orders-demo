# MySQL Authentication Fix

## Current Error:
`Access denied for user 'root'@'202.91.134.144' (using password: YES)`

## What This Means:
- ✅ Connection is reaching MySQL server successfully
- ✅ MySQL recognizes the 'root' user
- ❌ Password is incorrect OR user doesn't have permission from your IP

## Solution Steps:

### Step 1: Verify Current MySQL Users and Permissions
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@3.108.223.194

# Connect to MySQL locally
mysql -u root -p

# Check users and their allowed hosts
SELECT user, host FROM mysql.user;
```

### Step 2: Check if Root User Exists for Your IP
```sql
-- Look for root user with your IP or wildcard
SELECT user, host FROM mysql.user 
WHERE user = 'root' AND (host = '%' OR host = '202.91.134.144');

-- If no results, you need to create or update the user
```

### Step 3: Fix Options (Choose One)

#### Option A: Update Root User to Allow All Hosts (Quick Fix)
```sql
-- Update existing root user to allow all hosts
UPDATE mysql.user SET host='%' WHERE user='root';
FLUSH PRIVILEGES;

-- Verify the change
SELECT user, host FROM mysql.user WHERE user='root';
```

#### Option B: Create Specific Entry for Your IP (More Secure)
```sql
-- Create root user specifically for your IP
CREATE USER 'root'@'202.91.134.144' IDENTIFIED BY 'your-actual-password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'202.91.134.144' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

#### Option C: Reset Root Password (If password is wrong)
```sql
-- If you think the password is incorrect
ALTER USER 'root'@'%' IDENTIFIED BY 'new-password-here';
FLUSH PRIVILEGES;
```

### Step 4: Test the Connection
```bash
# Exit MySQL
exit

# Test connection from your local machine
mysql -u root -p -h 3.108.223.194

# Should now connect successfully!
```

### Step 5: Update Your Environment Variables
Make sure your `.env.local` has the correct password:
```bash
DB_HOST=3.108.223.194
DB_USERNAME=root
DB_PASSWORD=your-correct-password-here
DB_NAME=cafe_node_db
```

### Step 6: Test with Application
```bash
# Run the test again
npm run db:test

# Should now show: ✅ Connection successful!
```

## Common Scenarios:

### If You Forgot MySQL Root Password:
```bash
# Stop MySQL
sudo systemctl stop mysql

# Start MySQL without authentication
sudo mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# Reset password
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new-password';
ALTER USER 'root'@'%' IDENTIFIED BY 'new-password';
FLUSH PRIVILEGES;

# Restart MySQL normally
sudo systemctl start mysql
```

### If You Want to Create Dedicated User (Recommended):
```sql
CREATE USER 'cafe_app'@'%' IDENTIFIED BY 'StrongAppPassword123!';
GRANT ALL PRIVILEGES ON cafe_node_db.* TO 'cafe_app'@'%';
FLUSH PRIVILEGES;
```

Then update `.env.local`:
```bash
DB_USERNAME=cafe_app
DB_PASSWORD=StrongAppPassword123!
```

## Final Test:
After fixing, run:
```bash
npm run db:test
# Should show: ✅ Connection successful!

npm run dev
# API endpoints should now work without 500 errors
```

You're very close! The connection is working - just need to fix the authentication details.
