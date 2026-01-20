import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all user roles
export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  try {
    const [roles] = await db.execute('SELECT * FROM user_roles');
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST - Create a new user role
export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  try {
    const { role_name, permissions } = await request.json();
    
    const [result] = await db.execute(
      'INSERT INTO user_roles (role_name, permissions) VALUES (?, ?)',
      [role_name, JSON.stringify(permissions)]
    );
    
    const insertResult = result as any;
    return NextResponse.json(
      { id: insertResult.insertId, role_name, permissions },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
