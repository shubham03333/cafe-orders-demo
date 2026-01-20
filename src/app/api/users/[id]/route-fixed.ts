import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { username, password, role_id } = await request.json();
    const id = params.id;
    
    if (!username || !role_id) {
      return NextResponse.json(
        { error: 'Username and role_id are required' },
        { status: 400 }
      );
    }

    // Check if username already exists (excluding current user)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );
    
    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    let updateQuery = 'UPDATE users SET username = ?, role_id = ?';
    let queryParams: any[] = [username, role_id];

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    await db.execute(updateQuery, queryParams);

    // Get the updated user with role name
    const [updatedUser] = await db.execute(`
      SELECT u.id, u.username, u.role_id, r.role_name, u.created_at, u.updated_at
      FROM users u
      JOIN user_roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    return NextResponse.json((updatedUser as any[])[0]);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
