-- SQL script to add user roles to the user_roles table

INSERT INTO user_roles (role_name, permissions) VALUES 
('admin', '["manage_users", "manage_orders", "view_reports", "manage_inventory"]'),
('chef', '["manage_orders", "view_reports"]'),
('dashboard', '["view_reports"]'),
('inventory_manager', '["manage_inventory"]'),
('customer', '["place_orders", "view_order_history"]');
