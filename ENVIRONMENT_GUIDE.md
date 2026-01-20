# Cafe Order System - Environment Setup Guide

## Overview

This guide covers the environment configuration for the Cafe Order System, a Next.js application with MySQL database connectivity.

## Quick Setup

1. **Copy the template file:**
   ```bash
   cp .env.template .env.local
   ```

2. **Edit `.env.local` with your database credentials:**
   ```bash
   # For PlanetScale (recommended)
   DB_HOST=aws.connect.psdb.cloud
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   DB_NAME=your-database-name

   # OR use connection string
   DATABASE_URL=mysql://username:password@host/database?ssl={"rejectUnauthorized":true}
   ```

3. **Test your configuration:**
   ```bash
   npm run env:check    # Check environment variables
   npm run db:test      # Test database connection
   ```

## Environment Variables Reference

### Required Variables

#### Option 1: Individual Parameters
- `DB_HOST` - Database host address (e.g., `aws.connect.psdb.cloud`)
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

#### Option 2: Connection String (Recommended)
- `DATABASE_URL` - Complete connection string format:
  ```
  mysql://username:password@host/database?ssl={"rejectUnauthorized":true}
  ```

### Optional Variables
- `NODE_ENV` - Environment mode (`development`/`production`)
- `NEXT_PUBLIC_APP_NAME` - Application display name
- `NEXT_PUBLIC_APP_VERSION` - Application version
- `DB_SSL` - Enable SSL (`true`/`false`)
- `DEBUG` - Enable debug mode
- `LOG_LEVEL` - Logging level (`info`/`debug`/`error`)

## Database Providers


### AWS RDS/EC2 MySQL
1. Set up MySQL instance
2. Configure security groups for access
3. Use individual parameters format
4. SSL configuration may be required

### Local MySQL
1. Install MySQL locally
2. Create database and user
3. Update host to `localhost` or `127.0.0.1`

## Setup Commands

```bash
# Check environment configuration
npm run env:check

# Test database connection
npm run db:test

# Test simple connection (no .env loading)
npm run db:test-simple

# Check environment via API (when server running)
npm run env:debug

# Start development server
npm run dev
```

## Troubleshooting

### Common Issues

1. **Missing environment variables:**
   ```bash
   npm run env:check
   ```

2. **Database connection failed:**
   - Verify credentials in `.env.local`
   - Check database is running
   - Ensure SSL is enabled for cloud providers

3. **File not found errors:**
   - Make sure `.env.local` exists
   - Check file permissions

4. **SSL certificate issues:**
   - For PlanetScale: SSL is required
   - For local development: may need to disable SSL

### Debug Mode

Enable debug output by setting:
```bash
DEBUG=true
```

Or check the debug endpoint when server is running:
```bash
curl http://localhost:3000/api/debug/env
```

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for database users
- Enable SSL for production environments
- Regularly rotate database credentials
- Use different credentials for development/production

## File Structure

```
cafe-orders/
├── .env.template      # Template file (safe to commit)
├── .env.local         # Local configuration (DO NOT COMMIT)
├── scripts/
│   ├── check-env.js           # Environment checker
│   ├── test-mysql-connection.js # Database tester
│   └── test-mysql-simple.js   # Simple connection test
└── src/
    └── lib/
        └── db.ts              # Database configuration
```

## Next Steps

1. Set up your database using `scripts/init-database.sql`
2. Test the connection with `npm run db:test`
3. Start the development server with `npm run dev`
4. Verify the application is working correctly
