import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getTodayDateString } from '@/lib/timezone-dynamic';

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await executeQuery(
      'SELECT o.*, t.table_code, t.table_name FROM orders o LEFT JOIN tables_master t ON o.table_id = t.id WHERE o.id = ?',
      [id]
    ) as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = rows[0];
    let itemsData = order.items;

    if (typeof order.items === 'string') {
      try {
        itemsData = JSON.parse(order.items);
      } catch (parseError) {
        console.warn('Failed to parse items JSON:', order.items);
        itemsData = [];
      }
    }

    return NextResponse.json({
      ...order,
      items: itemsData,
      payment_status: order.payment_status || 'pending',
      payment_mode: order.payment_mode || null
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update order status and other fields
    const updateFields = [];
    const updateValues = [];

    if (body.status) {
      updateFields.push('status = ?');
      updateValues.push(body.status);
    }

    if (body.payment_status) {
      updateFields.push('payment_status = ?');
      updateValues.push(body.payment_status);
    }

    if (body.payment_mode) {
      updateFields.push('payment_mode = ?');
      updateValues.push(body.payment_mode);
    }

    if (body.items) {
      updateFields.push('items = ?');
      updateValues.push(JSON.stringify(body.items));
    }

    if (body.total !== undefined) {
      updateFields.push('total = ?');
      updateValues.push(body.total);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updateValues.push(id);
    await executeQuery(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Handle status-specific logic
    if (body.status === 'served') {
      console.log(`Updating order status for order ID: ${id} to served`);
      // Get the order total and payment status first
      const orderRows = await executeQuery(
        'SELECT total, payment_status FROM orders WHERE id = ?',
        [id]
      ) as any[];

      if (orderRows && orderRows.length > 0) {
        const orderTotal = orderRows[0].total;
        const currentPaymentStatus = orderRows[0].payment_status;
        console.log(`Order total for order ID ${id}: ₹${orderTotal}, payment status: ${currentPaymentStatus}`);

        // Only update sales if payment status is 'paid'
        if (currentPaymentStatus === 'paid') {
          const today = await getTodayDateString(); // Use configured timezone date

          await executeQuery(`
            INSERT INTO daily_sales (sale_date, total_orders, total_revenue)
            VALUES (?, 1, ?)
            ON DUPLICATE KEY UPDATE
              total_orders = total_orders + 1,
              total_revenue = total_revenue + ?
          `, [today, orderTotal, orderTotal]);
          console.log(`Updated daily sales for ${today}: +1 order, +₹${orderTotal}`);
        } else {
          console.log(`Order ${id} marked as served but payment status is ${currentPaymentStatus}, not updating sales`);
        }
      }
    }

    // Reduce stock quantity for each item in the order when status is served
    if (body.status === 'served' && body.items) {
      console.log(`Reducing stock for order ID: ${id}`);

      const stockAdjustments = body.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        action: 'subtract'
      }));

      try {
        const inventoryResponse = await fetch('http://localhost:3000/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stockAdjustments)
        });

        if (!inventoryResponse.ok) {
          console.error('Failed to update inventory:', await inventoryResponse.text());
        } else {
          console.log('Stock levels updated successfully');
        }
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await executeQuery('DELETE FROM orders WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
