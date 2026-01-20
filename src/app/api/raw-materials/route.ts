import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RawMaterial, RawMaterialUpdate } from '@/types';

// GET /api/raw-materials - Get all raw materials
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const connection = await db.getConnection();
    
    const [rawMaterials] = await connection.execute(`
      SELECT 
        id, name, description, unit_type, 
        current_stock, min_stock_level, supplier_info,
        last_restocked, created_at, updated_at
      FROM raw_materials 
      ORDER BY name
    `);
    
    connection.release();

    return NextResponse.json(rawMaterials);
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raw materials' },
      { status: 500 }
    );
  }
}

// POST /api/raw-materials - Create a new raw material
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const rawMaterial: RawMaterialUpdate = await request.json();
    const connection = await db.getConnection();
    
    const [result] = await connection.execute(`
      INSERT INTO raw_materials 
      (name, description, unit_type, current_stock, min_stock_level, supplier_info)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      rawMaterial.name,
      rawMaterial.description || null,
      rawMaterial.unit_type || 'kg',
      rawMaterial.current_stock || 0,
      rawMaterial.min_stock_level || 5,
      rawMaterial.supplier_info || null
    ]);
    
    connection.release();

    return NextResponse.json({ 
      message: 'Raw material created successfully', 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error creating raw material:', error);
    return NextResponse.json(
      { error: 'Failed to create raw material' },
      { status: 500 }
    );
  }
}

// DELETE /api/raw-materials - Delete a raw material
export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    const connection = await db.getConnection();
    
    const [result] = await connection.execute(`
      DELETE FROM raw_materials WHERE id = ?
    `, [id]);

    connection.release();

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Raw material not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    return NextResponse.json(
      { error: 'Failed to delete raw material' },
      { status: 500 }
    );
  }
}

// PATCH /api/raw-materials - Update raw materials
export async function PATCH(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const updates: RawMaterialUpdate[] = await request.json();
    const connection = await db.getConnection();
    
    await connection.beginTransaction();

    try {
      for (const update of updates) {
        const {
          id,
          name,
          description,
          unit_type,
          current_stock,
          min_stock_level,
          supplier_info
        } = update;

        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }

        if (description !== undefined) {
          updateFields.push('description = ?');
          updateValues.push(description);
        }

        if (unit_type !== undefined) {
          updateFields.push('unit_type = ?');
          updateValues.push(unit_type);
        }

        if (current_stock !== undefined) {
          updateFields.push('current_stock = ?');
          updateValues.push(current_stock);
        }

        if (min_stock_level !== undefined) {
          updateFields.push('min_stock_level = ?');
          updateValues.push(min_stock_level);
        }

        if (supplier_info !== undefined) {
          updateFields.push('supplier_info = ?');
          updateValues.push(supplier_info);
        }

        // Update last_restocked if stock is being updated
        if (current_stock !== undefined) {
          updateFields.push('last_restocked = CURRENT_TIMESTAMP');
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          
          const query = `
            UPDATE raw_materials 
            SET ${updateFields.join(', ')}
            WHERE id = ?
          `;
          
          await connection.execute(query, updateValues);
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ message: 'Raw materials updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating raw materials:', error);
    return NextResponse.json(
      { error: 'Failed to update raw materials' },
      { status: 500 }
    );
  }
}
