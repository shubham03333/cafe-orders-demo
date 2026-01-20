# Cafe Order System - Setup Guide

## Prerequisites

- Node.js 18+ 
- PlanetScale MySQL database account
- npm or yarn package manager

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd cafe-orders
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database credentials.

3. **Set up your PlanetScale database:**
   - Create a new database in PlanetScale
   - Run the initialization script from `scripts/init-database.sql`
   - Get your database connection string

4. **Configure environment variables in `.env.local`:**
   ```bash
   # Option 1: Use DATABASE_URL (recommended)
   DATABASE_URL=mysql://username:password@host/database?ssl={"rejectUnauthorized":true}

   # Option 2: Use individual parameters
   DB_HOST=aws.connect.psdb.cloud
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   DB_NAME=your-database-name
   ```

5. **Test the connection:**
   ```bash
   npm run db:test
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

## Database Setup

### Using PlanetScale

1. Sign up for a PlanetScale account at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get your connection credentials from the dashboard
4. Run the initialization script from `scripts/init-database.sql` in your database console

### Manual Database Creation

If you're using a different MySQL provider, run these SQL commands:

```sql
-- Create the database
CREATE DATABASE cafe_orders;

-- Use the database
USE cafe_orders;

-- Run the contents of scripts/init-database.sql
```

## Environment Variables Reference

### Required Variables

- `DATABASE_URL` - PlanetScale connection string (recommended)
  OR
- `DB_HOST` - Database host address
- `DB_USERNAME` - Database username  
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### Optional Variables

- `NEXT_PUBLIC_APP_NAME` - Application name (default: "Cafe Order System")
- `NEXT_PUBLIC_APP_VERSION` - Application version (default: "1.0.0")
- `NODE_ENV` - Node environment (development/production)

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PlanetScale connection string

3. Deploy automatically from main branch or manually trigger deployment

## Troubleshooting

### Common Issues

1. **Database connection fails:**
   - Verify your credentials in `.env.local`
   - Check if your PlanetScale database is running
   - Ensure SSL is enabled

2. **"Cannot find module" errors:**
   - Run `npm install` to ensure all dependencies are installed
   - Check if `.env.local` file exists and is properly formatted

3. **TypeScript errors:**
   - Restart your IDE/editor
   - Run `npm run lint` to check for issues

### Testing Connection

Use the provided test script:
```bash
npm run db:test
```

This will verify your database configuration and connection.

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure the database tables exist (run `scripts/init-database.sql`)
4. Check the [PlanetScale documentation](https://planetscale.com/docs) for database-specific issues
