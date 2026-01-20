import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// GET orders for chef view (pending and preparing orders)
export async function GET() {
  try {
    const rows = await executeQuery(
      'SELECT * FROM orders WHERE status IN ("pending", "preparing") ORDER BY order_time ASC'
    ) as any[];

    const orders = rows.map(row => {
      // Check if items is already an object or needs parsing
      let itemsData = row.items;
      if (typeof row.items === 'string') {
        try {
          itemsData = JSON.parse(row.items);
        } catch (parseError) {
          console.warn('Failed to parse items JSON:', row.items);
          itemsData = [];
        }
      }
      
      return {
        ...row,
        items: itemsData
      };
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching chef orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chef orders' },
      { status: 500 }
    );
  }
}

// PUT method to update order status to 'ready' (prepared)
export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();

    // Update the order status to 'ready'
    await executeQuery(
      'UPDATE orders SET status = "ready" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
