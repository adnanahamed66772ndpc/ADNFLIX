-- Add default Help page (editable in Admin → Settings → Page Content Management)
INSERT INTO page_content (id, page_key, title, content) VALUES
  (UUID(), 'help', 'Help', '<h1>Help</h1><p>Welcome to ADNFLIX Help. Here you can find answers to common questions.</p><p>Edit this content in Admin → Settings → Page Content Management.</p><p>For support tickets, visit the Help Center.</p>')
ON DUPLICATE KEY UPDATE page_key=page_key;
