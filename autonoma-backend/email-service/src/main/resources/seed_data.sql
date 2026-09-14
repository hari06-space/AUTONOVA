-- Seed Initial Data
USE nutech_email;

-- Default Admin User (password is 'admin123' hashed with BCrypt)
INSERT INTO app_user (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@nutech.example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uKCQqO', 'System Administrator', 'ADMIN')
ON DUPLICATE KEY UPDATE username=username;

-- Seed some Master Parts
INSERT INTO master_part (part_code, part_name, description, unit_price, category) VALUES
('ABC-1234', 'Steel Bolt M8', 'High-tensile steel bolt, 50mm', 15.00, 'Fasteners'),
('XYZ-9876', 'Gasket Seal 4"', 'Industrial grade rubber gasket', 120.00, 'Seals'),
('BRG-6205', 'Ball Bearing 6205', 'Deep groove ball bearing', 250.00, 'Bearings')
ON DUPLICATE KEY UPDATE part_code=part_code;

-- Seed a Customer
INSERT INTO customer (name, email, company_name) VALUES
('John Doe', 'john.doe@client.com', 'Global Tech Industries')
ON DUPLICATE KEY UPDATE email=email;
