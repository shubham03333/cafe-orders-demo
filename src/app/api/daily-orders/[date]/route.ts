import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getConfiguredTimezone } from '@/lib/timezone-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get the configured timezone to handle timezone conversion
    const timezone = await getConfiguredTimezone();
    
    // For IST timezone (UTC+5:30), we need to adjust the date comparison
    // Convert the input date (which is in IST) to UTC for proper comparison
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Convert to UTC for database comparison
    const startDate = targetDate.toISOString().split('T')[0];
    const endDate = nextDate.toISOString().split('T')[0];

    // Query to get all served orders for the specific date range
    // Use date range comparison to handle timezone differences
    const orders = await executeQuery(
      `SELECT 
        id,
        order_number,
        items,
        total,
        order_time,
        status
       FROM orders 
       WHERE order_time >= ? AND order_time < ?
         AND status = 'served'
       ORDER BY order_time ASC`,
      [startDate, endDate]
    ) as any[];

    // Process order items to aggregate dish-level data
    const dishSales: Record<string, { quantity: number; revenue: number; price_per_unit: number }> = {};

    orders.forEach((order) => {
      let items;
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (error) {
        console.warn('Failed to parse items for order:', order.id, order.items);
        return;
      }

      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item.name && item.quantity && item.price) {
            const dishName = item.name;
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const revenue = quantity * price;

            if (dishSales[dishName]) {
              dishSales[dishName].quantity += quantity;
              dishSales[dishName].revenue += revenue;
            } else {
              dishSales[dishName] = {
                quantity,
                revenue,
                price_per_unit: price
              };
            }
          }
        });
      }
    });

    // Convert to array and sort by revenue descending
    const orderDetails = Object.entries(dishSales)
      .map(([dish_name, data]) => ({
        dish_name,
        quantity: data.quantity,
        revenue: data.revenue,
        price_per_unit: data.price_per_unit
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const total_revenue = orderDetails.reduce((sum, item) => sum + item.revenue, 0);
    const total_orders = orders.length;

    const result = {
      date,
      total_orders,
      total_revenue,
      order_details: orderDetails
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching daily order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily order details' },
      { status: 500 }
    );
  }
}
