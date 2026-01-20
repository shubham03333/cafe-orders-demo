# Daily Sales Reset Functionality

## Overview
This functionality automatically resets daily sales at 12 AM IST (Indian Standard Time) every day. It calculates the final sales totals for the previous day and updates the `daily_sales` table with the finalized data.

## How It Works

### 1. Timezone Handling
- Uses Indian Standard Time (IST = UTC+5:30)
- All date calculations are performed in IST timezone
- Functions available in `src/lib/timezone.ts`

### 2. Reset Process
The reset script (`scripts/daily-sales-reset.js`) performs the following steps:

1. **Calculate Yesterday's Sales**: Queries the `orders` table for all served orders from yesterday (IST)
2. **Update Daily Sales**: Inserts or updates the `daily_sales` table with finalized totals
3. **Optional Cleanup**: Remolds old served orders (older than 30 days) to prevent database bloat

### 3. Scheduling
The script should be scheduled to run daily at 12 AM IST:

#### Linux/Mac (crontab)
```bash
# Add to crontab (crontab -e)
0 0 * * * cd /path/to/cafe-orders && npm run daily-sales-reset >> /var/log/daily-sales-reset.log 2>&1
```

#### Windows (Task Scheduler)
- Create a daily task that runs at 00:00
- Action: `npm run daily-sales-reset`
- Working directory: path to cafe-orders project

#### Vercel Deployment
Use Vercel Cron Jobs or an external scheduling service like:
- GitHub Actions
- AWS Lambda + CloudWatch Events
- Heroku Scheduler
- Cron-job.org

## Files Created

### `src/lib/timezone.ts`
Timezone utilities for IST:
- `getCurrentISTDate()` - Get current date in IST
- `getTodayISTDateString()` - Today's date as YYYY-MM-DD
- `getYesterdayISTDateString()` - Yesterday's date as YYYY-MM-DD
- `isMidnightIST()` - Check if it's midnight in IST
- `formatISTDateTime()` - Format date for logging

### `scripts/daily-sales-reset.js`
Main reset script that:
- Calculates yesterday's sales from orders
- Updates daily_sales table
- Performs optional cleanup

### `scripts/test-daily-reset.js`
Test script to verify the functionality works correctly

## Usage

### Manual Testing
```bash
npm run test-daily-reset
```

### Manual Reset
```bash
npm run daily-sales-reset
```

### Environment Variables
Ensure these are set in your `.env.local`:
```
DATABASE_HOST=your-database-host
DATABASE_USERNAME=your-username  
DATABASE_PASSWORD=your-password
```

## Database Schema

The `daily_sales` table should have this structure:
```sql
CREATE TABLE daily_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_date DATE NOT NULL UNIQUE,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Error Handling
- The script includes comprehensive error handling
- Logs are output to console
- For production, consider adding email/SMS alerts for failures

## Monitoring
- Check logs regularly for successful runs
- Monitor database size and performance
- Verify daily_sales table contains expected data

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_* environment variables
2. **Timezone Issues**: Ensure server timezone is set correctly
3. **Permission Issues**: Script needs read/write access to database

### Testing
```bash
# Test database connection
npm run db:test

# Test environment variables
npm run env:check

# Test daily reset functionality
npm run test-daily-reset
```

## Future Enhancements
- Add email notifications for successful/failed runs
- Implement retry logic for transient failures
- Add more detailed logging to file
- Create admin dashboard to view reset history
