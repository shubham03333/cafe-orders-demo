import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    if (!db) {
      throw new Error('Database not configured');
    }

    // Admin endpoint fetches ALL menu items (including unavailable ones)
    const [rows] = await db.execute(
      'SELECT * FROM menu_items ORDER BY position IS NULL, position, category, name'
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching admin menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
