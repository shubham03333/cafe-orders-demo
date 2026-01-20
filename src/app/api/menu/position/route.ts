import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { menuItems } = await request.json();

    if (!Array.isArray(menuItems)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of menu items with positions.' },
        { status: 400 }
      );
    }

    // Update positions in a transaction
    for (const item of menuItems) {
      if (item.id && item.position !== undefined) {
        await executeQuery(
          'UPDATE menu_items SET position = ? WHERE id = ?',
          [item.position, item.id]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Menu positions updated successfully' });
  } catch (error) {
    console.error('Error updating menu positions:', error);
    return NextResponse.json(
      { error: 'Failed to update menu positions' },
      { status: 500 }
    );
  }
}
