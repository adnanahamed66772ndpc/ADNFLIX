-- Payment method settings (admin-editable numbers for website and app)
CREATE TABLE IF NOT EXISTS payment_method_settings (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  number VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default methods (admin updates numbers in panel)
INSERT INTO payment_method_settings (id, name, number) VALUES
  ('bkash', 'bKash', '01XXXXXXXXX'),
  ('nagad', 'Nagad', '01XXXXXXXXX'),
  ('rocket', 'Rocket', '01XXXXXXXXX')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
