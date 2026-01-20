# Quick Fix Guide - MySQL Access Denied Error

## The Problem:
`Access denied for user 'root'@'202.91.134.144' (using password: YES)`

## What This Means:
- ✅ Your MySQL server at `3.108.223.194` is running and accessible
- ✅ Your application is correctly configured to connect to it
- ❌ MySQL doesn't allow `root` user from your IP `202.91.134.144`

## Immediate Solution:

### Step 1: SSH into Your EC2 Instance
```bash
ssh -i your-key.pem ubuntu@3.108.223.194
```

### Step 2: Connect to MySQL Locally
```bash
mysql -u root -p
# Enter your MySQL root password when prompted
```

### Step 3: Run These SQL Commands (Choose One Option)

#### Option A: Allow Root from Your Specific IP (Recommended)
```sql
-- Create user for your specific IP
CREATE USER 'root'@'202.91.134.144' IDENTIFIED BY 'your-mysql-password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON *.* TO 'root'@'202.91.134.144' WITH GRANT OPTION;

FLUSH PRIVILEGES;
```

#### Option B: Allow Root from Any IP (Easier)
```sql
-- Update root user to allow all hosts
UPDATE mysql.user SET host='%' WHERE user='root';

FLUSH PRIVILEGES;
```

#### Option C: Create Dedicated App User (Most Secure)
```sql
-- Create dedicated user
CREATE USER 'cafe_app'@'%' IDENTIFIED BY 'StrongPassword123!';

-- Grant privileges to your database
GRANT ALL PRIVILEGES ON cafe_node_db.* TO 'cafe_app'@'%';

FLUSH PRIVILEGES;
```

### Step 4: Verify the Changes
```sql
-- Check users
SELECT user, host FROM mysql.user;

-- Exit MySQL
exit
```

### Step 5: Test the Connection
```bash
# Test from your EC2 instance
mysql -u root -p -h 3.108.223.194

# Should connect successfully now!
```

### Step 6: Update Your Application (If you used Option C)
Edit your `.env.local` file:
```bash
# If you created dedicated user
DB_USERNAME=cafe_app
DB_PASSWORD=StrongPassword123!

# If using root user (ensure password matches)
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
```

### Step 7: Test Your Application
```bash
# Run the test
npm run db:test

# Should show: ✅ Connection successful!

# Start your application
npm run dev

# API endpoints should now work without 500 errors
```

## Common Issues:

### If Password is Wrong:
```sql
-- Reset password
ALTER USER 'root'@'%' IDENTIFIED BY 'new-password';
FLUSH PRIVILEGES;
```

### If MySQL Won't Start:
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

### If Still Having Issues:
1. Check AWS Security Group allows port 3306
2. Verify MySQL is binding to `0.0.0.0` not `127.0.0.1`
3. Check firewall settings: `sudo ufw status`

You're almost there! This is the final configuration needed to make your application work.
