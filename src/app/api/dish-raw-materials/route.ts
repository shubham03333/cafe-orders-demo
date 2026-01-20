import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DishRawMaterial, DishRawMaterialUpdate } from '@/types';

// GET /api/dish-raw-materials - Get raw materials for a specific dish
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get('dishId');
    
    if (!dishId) {
      return NextResponse.json(
        { error: 'Dish ID is required' },
        { status: 400 }
      );
    }
    
    const connection = await db.getConnection();
    
    const [dishRawMaterials] = await connection.execute(`
      SELECT 
        drm.id,
        drm.dish_id,
        drm.raw_material_id,
        drm.quantity_required,
        drm.created_at,
        drm.updated_at,
        rm.name as raw_material_name,
        rm.unit_type as raw_material_unit,
        rm.current_stock,
        rm.min_stock_level
      FROM dish_raw_materials drm
      JOIN raw_materials rm ON drm.raw_material_id = rm.id
      WHERE drm.dish_id = ?
      ORDER BY rm.name
    `, [dishId]);
    
    connection.release();

    return NextResponse.json(dishRawMaterials);
  } catch (error) {
    console.error('Error fetching dish raw materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dish raw materials' },
      { status: 500 }
    );
  }
}

// POST /api/dish-raw-materials - Associate raw materials with a dish
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const associations: DishRawMaterialUpdate[] = await request.json();
    const connection = await db.getConnection();
    
    await connection.beginTransaction();

    try {
      for (const association of associations) {
        const { dish_id, raw_material_id, quantity_required } = association;

        await connection.execute(`
          INSERT INTO dish_raw_materials (dish_id, raw_material_id, quantity_required)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity_required = VALUES(quantity_required)
        `, [dish_id, raw_material_id, quantity_required]);
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ message: 'Dish raw materials associated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error associating dish raw materials:', error);
    return NextResponse.json(
      { error: 'Failed to associate dish raw materials' },
      { status: 500 }
    );
  }
}

// DELETE /api/dish-raw-materials - Remove raw material association from dish
export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get('dishId');
    const rawMaterialId = searchParams.get('rawMaterialId');
    
    if (!dishId || !rawMaterialId) {
      return NextResponse.json(
        { error: 'Dish ID and Raw Material ID are required' },
        { status: 400 }
      );
    }
    
    const connection = await db.getConnection();
    
    await connection.execute(`
      DELETE FROM dish_raw_materials 
      WHERE dish_id = ? AND raw_material_id = ?
    `, [dishId, rawMaterialId]);
    
    connection.release();

    return NextResponse.json({ message: 'Dish raw material association removed successfully' });
  } catch (error) {
    console.error('Error removing dish raw material association:', error);
    return NextResponse.json(
      { error: 'Failed to remove dish raw material association' },
      { status: 500 }
    );
  }
}
