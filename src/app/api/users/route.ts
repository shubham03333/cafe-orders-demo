import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - List all users
export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  try {
    const [users] = await db.execute(`
      SELECT u.id, u.username, u.role_id, r.role_name, u.created_at, u.updated_at
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { username, password, role_id } = await request.json();
    
    if (!username || !password || !role_id) {
      return NextResponse.json(
        { error: 'Username, password, and role_id are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert the new user
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)',
      [username, hashedPassword, role_id]
    );

    const insertResult = result as any;
    
    // Get the created user with role name
    const [newUser] = await db.execute(`
      SELECT u.id, u.username, u.role_id, r.role_name, u.created_at, u.updated_at
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [insertResult.insertId]);

    return NextResponse.json((newUser as any[])[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
