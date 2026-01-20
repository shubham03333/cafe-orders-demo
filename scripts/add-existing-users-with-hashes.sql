-- SQL script to add existing users to the users table with hashed passwords

INSERT INTO users (username, password, role_id) VALUES 
('admin', '$2a$12$hashed_password_for_admin', 1),  -- Assuming role_id 1 corresponds to admin
('chef', '$2a$12$hashed_password_for_chef', 2),    -- Assuming role_id 2 corresponds to chef
('dashboard', '$2a$12$hashed_password_for_dashboard', 3); -- Assuming role_id 3 corresponds to dashboard
