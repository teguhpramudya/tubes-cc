CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    roast_level VARCHAR(50) NOT NULL,
    flavor_notes VARCHAR(150) NOT NULL,
    weight VARCHAR(20) NOT NULL DEFAULT '1 Kg',
    price INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    address TEXT NOT NULL,
    payment_method_id INT NULL,
    payment_method VARCHAR(100) DEFAULT 'Transfer BCA',
    payment_status VARCHAR(50) DEFAULT 'Menunggu Verifikasi',
    payment_proof_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_products
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

INSERT INTO products (id, name, origin, roast_level, flavor_notes, weight, price, image_url, description) VALUES
(1, 'Arabika Gayo', 'Aceh Gayo', 'Medium Roast', 'Fruity, floral, smooth', '1 Kg', 230000, 'assets/img/kopi-gayo.jpg', 'Biji kopi premium dari Aceh Gayo dengan aroma khas dan rasa lembut.'),
(2, 'Arabika Kerinci', 'Jambi Kerinci', 'Medium Roast', 'Fruity, citrus, acidity seimbang', '1 Kg', 250000, 'assets/img/kopi-kerinci.jpg', 'Memiliki karakter fruity dengan tingkat acidity seimbang.'),
(3, 'Arabika Toraja', 'Sulawesi Toraja', 'Medium Dark Roast', 'Bold, earthy, spicy', '1 Kg', 240000, 'assets/img/kopi-robusta.jpg', 'Aroma kuat dengan rasa bold khas kopi pegunungan Toraja.')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    origin = VALUES(origin),
    roast_level = VALUES(roast_level),
    flavor_notes = VALUES(flavor_notes),
    weight = VALUES(weight),
    price = VALUES(price),
    image_url = VALUES(image_url),
    description = VALUES(description);

INSERT INTO payment_methods (id, bank_name, account_number, account_name, description, is_active) VALUES
(1, 'BCA', '1234567890', 'Siputra Coffee Beans', 'Setelah pesanan dikirim, silakan lakukan pembayaran melalui transfer BCA, lalu upload bukti transfer pada form pemesanan.', 1)
ON DUPLICATE KEY UPDATE
    bank_name = VALUES(bank_name),
    account_number = VALUES(account_number),
    account_name = VALUES(account_name),
    description = VALUES(description),
    is_active = VALUES(is_active);
