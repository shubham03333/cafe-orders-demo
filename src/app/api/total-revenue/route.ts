import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // Query to get total cumulative revenue from all served orders
    const result = await executeQuery(
      `SELECT 
        SUM(total) as total_revenue,
        COUNT(*) as total_orders
       FROM orders 
       WHERE status = 'served'`
    ) as any[];

    return NextResponse.json({
      total_revenue: result[0]?.total_revenue || 0,
      total_orders: result[0]?.total_orders || 0
    });
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch total revenue' },
      { status: 500 }
    );
  }
}
