-- Add raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_type VARCHAR(50) DEFAULT 'kg',
    current_stock DECIMAL(10, 2) DEFAULT 0,
    min_stock_level DECIMAL(10, 2) DEFAULT 5,
    supplier_info VARCHAR(255),
    last_restocked TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_raw_material_name (name)
);

-- Add dish_raw_materials table to associate dishes with raw materials and their quantities
CREATE TABLE IF NOT EXISTS dish_raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    quantity_required DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dish_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dish_raw_material (dish_id, raw_material_id)
);

-- Insert some sample raw materials
INSERT IGNORE INTO raw_materials (name, description, unit_type, current_stock, min_stock_level) VALUES
('Coffee Beans', 'Premium Arabica coffee beans', 'kg', 25.0, 5.0),
('Milk', 'Fresh whole milk', 'liter', 50.0, 10.0),
('Sugar', 'White refined sugar', 'kg', 20.0, 5.0),
('Tea Leaves', 'Assam tea leaves', 'kg', 15.0, 3.0),
('Cocoa Powder', 'Premium cocoa powder', 'kg', 8.0, 2.0),
('Vanilla Extract', 'Pure vanilla extract', 'ml', 1000.0, 200.0),
('Cinnamon Powder', 'Ground cinnamon', 'kg', 5.0, 1.0),
('Whipped Cream', 'Fresh whipped cream', 'kg', 10.0, 2.0),
('Chocolate Syrup', 'Chocolate syrup for drinks', 'liter', 5.0, 1.0),
('Ice Cream', 'Vanilla ice cream', 'kg', 15.0, 3.0);

-- Associate some raw materials with existing dishes
INSERT IGNORE INTO dish_raw_materials (dish_id, raw_material_id, quantity_required) VALUES
(5, 1, 0.02),  -- Chilax Cold Coffee: 20g coffee beans
(5, 2, 0.25),  -- Chilax Cold Coffee: 250ml milk
(5, 3, 0.02),  -- Chilax Cold Coffee: 20g sugar
(5, 10, 0.05), -- Chilax Cold Coffee: 50g ice cream
(1, 4, 0.01),  -- Masala Chai: 10g tea leaves
(1, 2, 0.20),  -- Masala Chai: 200ml milk
(1, 3, 0.015); -- Masala Chai: 15g sugar
