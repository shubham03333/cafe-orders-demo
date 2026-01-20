#!/bin/bash
# Quick MySQL Permission Fix Script
# Run this on your EC2 instance to fix the access denied error

echo "=== MySQL Permission Fix Script ==="
echo "Fixing access for: root@202.91.134.144"

# Connect to MySQL and fix permissions
mysql -u root -p << EOF

-- Check current users
SELECT user, host FROM mysql.user WHERE user = 'root';

-- Create or update user for the specific IP
CREATE USER IF NOT EXISTS 'root'@'202.91.134.144' IDENTIFIED BY 'your-mysql-password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON *.* TO 'root'@'202.91.134.144' WITH GRANT OPTION;

-- Alternatively, update existing root user to allow all hosts
-- UPDATE mysql.user SET host='%' WHERE user='root';

FLUSH PRIVILEGES;

-- Verify the changes
SELECT user, host FROM mysql.user WHERE user = 'root';

EOF

echo "=== Permission fix completed ==="
echo "Test connection with: mysql -u root -p -h 3.108.223.194"
