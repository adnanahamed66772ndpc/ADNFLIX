-- Add support tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add ticket replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add page content table for editable pages
CREATE TABLE IF NOT EXISTS page_content (
  id CHAR(36) PRIMARY KEY,
  page_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  updated_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_page_key (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default page content
INSERT INTO page_content (id, page_key, title, content) VALUES
  (UUID(), 'terms', 'Terms of Service', 
   CONCAT('<h1>Terms of Service</h1><p>Last updated: ', DATE_FORMAT(NOW(), '%Y-%m-%d'), '</p><p>Welcome to ADNFLIX. By accessing or using our service, you agree to be bound by these Terms of Service.</p><h2>1. Acceptance of Terms</h2><p>By accessing and using ADNFLIX, you accept and agree to be bound by the terms and provision of this agreement.</p><h2>2. Use License</h2><p>Permission is granted to temporarily access the materials on ADNFLIX for personal, non-commercial transitory viewing only.</p><h2>3. User Accounts</h2><p>You are responsible for maintaining the confidentiality of your account and password.</p><h2>4. Content</h2><p>All content on ADNFLIX is the property of ADNFLIX or its content suppliers and is protected by copyright laws.</p><h2>5. Prohibited Uses</h2><p>You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.</p>'))
ON DUPLICATE KEY UPDATE page_key=page_key;

INSERT INTO page_content (id, page_key, title, content) VALUES
  (UUID(), 'privacy', 'Privacy Policy', 
   CONCAT('<h1>Privacy Policy</h1><p>Last updated: ', DATE_FORMAT(NOW(), '%Y-%m-%d'), '</p><p>ADNFLIX respects your privacy and is committed to protecting your personal data.</p><h2>1. Information We Collect</h2><p>We collect information that you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p><h2>2. How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services.</p><h2>3. Information Sharing</h2><p>We do not sell, trade, or rent your personal information to third parties.</p><h2>4. Data Security</h2><p>We implement appropriate security measures to protect your personal information.</p><h2>5. Your Rights</h2><p>You have the right to access, update, or delete your personal information at any time.</p><h2>6. Cookies</h2><p>We use cookies to enhance your experience on our platform.</p>'))
ON DUPLICATE KEY UPDATE page_key=page_key;
