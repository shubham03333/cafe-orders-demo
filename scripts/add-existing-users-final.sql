-- SQL script to add existing users to the users table with actual hashed passwords

INSERT INTO users (username, password, role_id) VALUES 
('admin', '$2b$12$FEDQ2keIDKq8sBAHS2BfVeEdFeUCE/NOMy0tN19v6QYgv2zg.OaQS', 1),  -- admin123
('chef', '$2b$12$ksuRaDBKQGP9E0clcwmxlu2b6aEn34wkg/vlU8Y/PNu1H446Q9uK6', 2),    -- chef456
('dashboard', '$2b$12$jGOgB78rfL9kHD0K9gCNK.9B6F3qudRLLt9AaXG6C1eNbVLSnQtpK', 3); -- shubh123
