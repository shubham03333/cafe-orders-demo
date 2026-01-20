-- Truncate users table and insert correct users with properly hashed passwords
TRUNCATE TABLE users;

-- Insert users with properly hashed passwords
INSERT INTO users (username, password, role_id) VALUES 
('admin', '$2a$12$FEDQ2keIDKq8sBAHS2BfVeEdFeUCE/NOMy0tN19v6QYgv2zg.OaQS', 1),  -- admin123
('chef', '$2a$12$ksuRaDBKQGP9E0clcwmxlu2b6aEn34wkg/vlU8Y/PNu1H446Q9uK6', 2),    -- chef456
('dashboard', '$2a$12$jGOgB78rfL9kHD0K9gCNK.9B6F3qudRLLt9AaXG6C1eNbVLSnQtpK', 3); -- shubh123
