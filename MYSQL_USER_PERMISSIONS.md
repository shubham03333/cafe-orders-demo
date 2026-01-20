# MySQL User Permissions Fix

## Current Error:
`ERROR 1130 (HY000): Host '3.108.223.194' is not allowed to connect to this MySQL server`

## Solution: Configure MySQL User Permissions

### Step 1: Connect to MySQL Locally
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@3.108.223.194

# Connect to MySQL locally (using localhost/socket)
mysql -u root -p
```

### Step 2: Check Current Users and Permissions
```sql
-- See all users and their allowed hosts
SELECT user, host FROM mysql.user;

-- You'll likely see something like:
-- root | localhost
-- root | 127.0.0.1
-- root | ::1
```

### Step 3: Create or Update User for Remote Access
```sql
-- Option A: Create a new user for remote access
CREATE USER 'root'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Option B: Update existing root user to allow all hosts
UPDATE mysql.user SET host='%' WHERE user='root';
FLUSH PRIVILEGES;

-- Option C: Create a dedicated application user (recommended)
CREATE USER 'cafe_app'@'%' IDENTIFIED BY 'strong-password-here';
GRANT ALL PRIVILEGES ON cafe_node_db.* TO 'cafe_app'@'%';
FLUSH PRIVILEGES;
```

### Step 4: Verify the Changes
```sql
-- Check updated user permissions
SELECT user, host FROM mysql.user;

-- Should see at least one entry with '%' as host
```

### Step 5: Test the Connection
```bash
# Exit MySQL
exit

# Now test connection using public IP
mysql -u root -p -h 3.108.223.194

# Or if you created a dedicated user
mysql -u cafe_app -p -h 3.108.223.194
```

### Step 6: Update Your Environment Variables
In your `.env.local` file, use the appropriate credentials:
```bash
# If using root user
DB_USERNAME=root
DB_PASSWORD=your-root-password

# If using dedicated user (recommended)
DB_USERNAME=cafe_app
DB_PASSWORD=strong-password-here
```

## Security Recommendations

### 1. Use Dedicated User (Best Practice)
```sql
CREATE USER 'cafe_app'@'%' IDENTIFIED BY 'StrongPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON cafe_node_db.* TO 'cafe_app'@'%';
FLUSH PRIVILEGES;
```

### 2. Restrict Access by IP (More Secure)
```sql
-- If you know your application server IP
CREATE USER 'cafe_app'@'your-app-server-ip' IDENTIFIED BY 'password';
GRANT ALL ON cafe_node_db.* TO 'cafe_app'@'your-app-server-ip';
FLUSH PRIVILEGES;
```

### 3. Test Connection After Changes
```bash
# Test with new user
mysql -u cafe_app -p -h 3.108.223.194 -e "SELECT 1 as test;"

# Should return: test = 1
```

## Troubleshooting
If you still get errors:
1. Make sure you FLUSH PRIVILEGES after changes
2. Check if there are multiple user entries conflicting
3. Verify the password is correct
4. Ensure MySQL is still running: `sudo systemctl status mysql`

After these steps, your application should be able to connect successfully!
