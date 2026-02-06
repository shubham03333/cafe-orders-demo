# MySQL / TiDB Connection Troubleshooting Guide

## TiDB Cloud: "No available TiDB instances"

If you see:

```
Database query error: Error: No available TiDB instances, please make sure TiDB is available
sqlMessage: 'No available TiDB instances, please make sure TiDB is available'
```

**Cause:** The app is configured to use TiDB Cloud (e.g. `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`) but the cluster is not reachable or not running.

**What to do:**

1. **TiDB Cloud Console**
   - Log in to [TiDB Cloud](https://tidbcloud.com) and open your project.
   - Confirm the cluster is **Running** (not Paused). Free clusters auto-pause after inactivity; resume it from the console.
   - Check **Connection** / **Allowlist**: add your current IP (or `0.0.0.0/0` for testing only) so your app can reach the cluster.

2. **Environment variables** (e.g. `.env.local`)
   - `DB_HOST` – TiDB Cloud host (e.g. `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
   - `DB_PORT` – usually `4000` for TiDB Cloud
   - `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` – from TiDB Cloud connection details
   - `DB_SSL=true` for TiDB Cloud

3. **While the database is unavailable**
   - The dashboard will show a yellow banner: *"Database temporarily unavailable. Showing locally saved orders."*
   - Orders are loaded from local storage (IndexedDB). When TiDB is back and the API works again, the app will sync and the banner will go away.

---

## Connection Error: ECONNREFUSED 3.108.223.194:3306

This error means the MySQL server is not accessible from your current location. Here are the common causes and solutions:

### 1. Check MySQL Server Status
- SSH into your EC2 instance: `ssh ubuntu@3.108.223.194`
- Check if MySQL is running: `sudo systemctl status mysql`
- Start MySQL if stopped: `sudo systemctl start mysql`

### 2. Check MySQL Configuration
- Verify MySQL is listening on the correct interface
- Check `/etc/mysql/my.cnf` or `/etc/mysql/mysql.conf.d/mysqld.cnf`
- Ensure `bind-address` is set to `0.0.0.0` (not `127.0.0.1`)

### 3. Check AWS Security Groups
- Go to AWS EC2 Console → Security Groups
- Ensure port 3306 is open for your IP address or for all IPs (0.0.0.0/0)
- Add inbound rule: Type=MySQL, Protocol=TCP, Port=3306, Source=Your-IP or 0.0.0.0/0

### 4. Check MySQL User Permissions
- Connect to MySQL locally on the EC2 instance
- Check user permissions: `SELECT user, host FROM mysql.user;`
- Grant remote access: 
  ```sql
  CREATE USER 'root'@'%' IDENTIFIED BY 'your-password';
  GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
  FLUSH PRIVILEGES;
  ```

### 5. Test Connection Locally
First, test if you can connect from the EC2 instance itself:
```bash
mysql -u root -p -h localhost
```

### 6. Test Connection from Your Machine
```bash
telnet 3.108.223.194 3306
# or
nc -zv 3.108.223.194 3306
```

### 7. Firewall Check
- Check if there's a firewall blocking port 3306 on the EC2 instance
- Check AWS Network ACLs

## Quick Test Script
Run this to test basic connectivity:
```bash
cd cafe-orders
npm run db:test
```

## Environment Variables
Make sure your `.env.local` contains:
```
DB_HOST=3.108.223.194
DB_USERNAME=root
DB_PASSWORD=your-actual-password
DB_NAME=cafe_node_db
```

## Common Solutions
1. **Security Group**: Open port 3306 to your IP
2. **MySQL bind-address**: Set to `0.0.0.0`
3. **User permissions**: Allow remote connections
4. **Firewall**: Disable or configure firewall rules

Once the connection is working, run the database initialization:
```sql
-- Run this in your MySQL console
SOURCE scripts/init-database.sql
