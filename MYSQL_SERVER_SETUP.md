# MySQL Server Setup Commands for AWS EC2

## 1. Check MySQL Status and Configuration
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@3.108.223.194

# Check if MySQL is running
sudo systemctl status mysql

# If not running, start it
sudo systemctl start mysql

# Check MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

## 2. Critical Configuration Change
```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Find the line that says:
# bind-address = 127.0.0.1

# Change it to:
bind-address = 0.0.0.0

# Save and exit (Ctrl+X, Y, Enter)

# Restart MySQL
sudo systemctl restart mysql
```

## 3. Verify MySQL is Listening on All Interfaces
```bash
# Check what ports MySQL is listening on
sudo netstat -tlnp | grep mysql
# Should show: 0.0.0.0:3306

# Test local connection
mysql -u root -p -h localhost
```

## 4. Check AWS Security Group
1. Go to AWS EC2 Console
2. Select your instance
3. Click on Security Group
4. Edit Inbound Rules
5. Add: Type=MySQL, Protocol=TCP, Port=3306, Source=0.0.0.0/0

## 5. Test Connection from EC2 Instance
```bash
# Test connection using public IP
mysql -u root -p -h 3.108.223.194

# If this works, your MySQL is now accessible
```

## 6. If Still Having Issues - Check Firewall
```bash
# Check if UFW firewall is blocking
sudo ufw status

# If active, allow MySQL
sudo ufw allow 3306

# Check iptables
sudo iptables -L -n
```

## 7. Quick Test Script
Run this on your EC2 instance to verify setup:
```bash
#!/bin/bash
echo "Testing MySQL configuration..."
echo "MySQL status:"
sudo systemctl status mysql | grep Active

echo "Network listening:"
sudo netstat -tlnp | grep 3306

echo "Testing local connection:"
mysql -u root -p -e "SELECT 1 as test;" 2>/dev/null && echo "✅ Local connection works" || echo "❌ Local connection failed"

echo "Testing public IP connection:"
mysql -u root -p -h 3.108.223.194 -e "SELECT 1 as test;" 2>/dev/null && echo "✅ Public IP connection works" || echo "❌ Public IP connection failed"
```

## 8. Common Issues and Solutions

### Issue: bind-address not changing
```bash
# Check all MySQL config files
sudo grep -r "bind-address" /etc/mysql/

# Make sure only one bind-address exists and it's 0.0.0.0
```

### Issue: MySQL not starting
```bash
# Check MySQL error logs
sudo tail -f /var/log/mysql/error.log

# Check configuration syntax
sudo mysqld --verbose --help | grep -A1 "bind-address"
```

### Issue: Permission denied
```bash
# Check MySQL user permissions
mysql -u root -p -e "SELECT user, host FROM mysql.user;"

# If root@localhost exists but not root@%
CREATE USER 'root'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

After completing these steps, your MySQL server should be accessible from your application.
