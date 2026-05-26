require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file';

    cb(null, `${Date.now()}-${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error('Format file harus JPG, JPEG, atau PNG.'));
  },
});

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'kopi_user',
  password: process.env.DB_PASSWORD || 'kopi_password',
  database: process.env.DB_NAME || 'katalog_kopi',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

async function connectDatabase(retries = 30, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      pool = mysql.createPool(dbConfig);
      await pool.query('SELECT 1');
      console.log('Database connected successfully.');
      return;
    } catch (error) {
      console.log(`Database connection failed. Attempt ${attempt}/${retries}`);
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbConfig.database, tableName, columnName]
  );

  return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureDatabaseSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      account_name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('orders', 'payment_method_id', 'INT NULL');
  await addColumnIfMissing('orders', 'payment_method', "VARCHAR(100) DEFAULT 'Transfer BCA'");
  await addColumnIfMissing('orders', 'payment_status', "VARCHAR(50) DEFAULT 'Menunggu Pembayaran'");
  await addColumnIfMissing('orders', 'payment_proof_url', 'VARCHAR(255) NULL');

  const [paymentRows] = await pool.query('SELECT COUNT(*) AS total FROM payment_methods');
  if (paymentRows[0].total === 0) {
    await pool.query(
      `INSERT INTO payment_methods (bank_name, account_number, account_name, description, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'BCA',
        '1234567890',
        'Siputra Coffee Beans',
        'Setelah pesanan dikirim, silakan lakukan pembayaran melalui transfer BCA.',
        1,
      ]
    );
  }
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function hasSuspiciousPattern(value) {
  const text = normalizeText(value).toLowerCase();

  if (/(.)\1{3,}/.test(text)) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(text)) return true;
  if (/[aiueo]{6,}/i.test(text)) return true;
  if (/^[a-z]{8,}$/i.test(text)) return true;

  return false;
}

function validateCustomerName(name) {
  const normalizedName = normalizeText(name);
  const words = normalizedName.split(' ').filter(Boolean);

  if (!normalizedName) return 'Nama lengkap wajib diisi.';
  if (!/^[A-Za-zÀ-ÿ.' -]+$/.test(normalizedName)) return 'Nama hanya boleh berisi huruf dan spasi.';
  if (normalizedName.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 5) return 'Nama terlalu pendek.';
  if (words.length < 2) return 'Masukkan nama lengkap minimal 2 kata, contoh: Teguh Pramudya.';
  if (words.some((word) => word.length < 2)) return 'Setiap kata pada nama minimal 2 huruf.';
  if (hasSuspiciousPattern(normalizedName)) return 'Nama tidak terlihat valid. Masukkan nama lengkap yang benar.';

  return null;
}

function validateWhatsapp(whatsapp) {
  const normalizedWhatsapp = normalizeText(whatsapp).replace(/[\s-]/g, '');

  if (!normalizedWhatsapp) return 'Nomor WhatsApp wajib diisi.';
  if (!/^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(normalizedWhatsapp)) {
    return 'Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx.';
  }

  return null;
}

function validateAddress(address) {
  const normalizedAddress = normalizeText(address);
  const words = normalizedAddress.split(' ').filter(Boolean);
  const addressKeyword = /(jalan|jl\.?|gang|gg\.?|no\.?|nomor|rt|rw|blok|desa|kelurahan|kecamatan|kabupaten|kota|komplek|perumahan|dusun)/i;

  if (!normalizedAddress) return 'Alamat pengiriman wajib diisi.';
  if (normalizedAddress.length < 15) return 'Alamat terlalu pendek. Masukkan alamat pengiriman yang lebih lengkap.';
  if (words.length < 3) return 'Alamat harus lebih lengkap, minimal berisi nama jalan/daerah dan tujuan pengiriman.';
  if (hasSuspiciousPattern(normalizedAddress)) return 'Alamat tidak terlihat valid. Masukkan alamat pengiriman yang benar.';
  if (!addressKeyword.test(normalizedAddress) && !/\d/.test(normalizedAddress)) {
    return 'Alamat harus mencantumkan nama jalan/daerah atau nomor rumah.';
  }

  return null;
}

function normalizeProductPayload(body) {
  return {
    name: normalizeText(body.name),
    origin: normalizeText(body.origin),
    roast_level: normalizeText(body.roast_level),
    flavor_notes: normalizeText(body.flavor_notes),
    weight: normalizeText(body.weight || '1 Kg'),
    price: Number(body.price),
    image_url: normalizeText(body.image_url),
    description: normalizeText(body.description),
  };
}

function validateProduct(product) {
  if (
    !product.name ||
    !product.origin ||
    !product.roast_level ||
    !product.flavor_notes ||
    !product.weight ||
    !product.price ||
    !product.image_url ||
    !product.description
  ) {
    return 'Semua field produk wajib diisi.';
  }

  if (Number.isNaN(product.price) || product.price < 1) {
    return 'Harga produk harus berupa angka lebih dari 0.';
  }

  return null;
}

function normalizePaymentPayload(body) {
  return {
    bank_name: normalizeText(body.bank_name),
    account_number: normalizeText(body.account_number),
    account_name: normalizeText(body.account_name),
    description: normalizeText(body.description || 'Silakan lakukan pembayaran ke rekening yang dipilih.'),
    is_active: Number(body.is_active) === 0 ? 0 : 1,
  };
}

function validatePaymentMethod(paymentMethod) {
  if (!paymentMethod.bank_name || !paymentMethod.account_number || !paymentMethod.account_name) {
    return 'Bank, nomor rekening, dan atas nama wajib diisi.';
  }

  if (!/^[0-9]{5,30}$/.test(paymentMethod.account_number.replace(/\s/g, ''))) {
    return 'Nomor rekening harus berupa angka 5 sampai 30 digit.';
  }

  return null;
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'backend', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database not connected' });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File gambar wajib diupload.' });
  }

  res.status(201).json({
    message: 'Gambar berhasil diupload.',
    image_url: `/uploads/${req.file.filename}`,
  });
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, origin, roast_level, flavor_notes, weight, price, image_url, description
      FROM products
      ORDER BY id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data produk.' });
  }
});

app.post('/api/products', async (req, res) => {
  const product = normalizeProductPayload(req.body);
  const validationMessage = validateProduct(product);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const [idRows] = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM products');
    const nextId = idRows[0].next_id;

    const [result] = await pool.query(
      `INSERT INTO products (id, name, origin, roast_level, flavor_notes, weight, price, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        product.name,
        product.origin,
        product.roast_level,
        product.flavor_notes,
        product.weight,
        product.price,
        product.image_url,
        product.description,
      ]
    );

    res.status(201).json({
      message: 'Produk berhasil ditambahkan.',
      product_id: result.insertId || nextId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan produk.' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const productId = Number(req.params.id);
  const product = normalizeProductPayload(req.body);
  const validationMessage = validateProduct(product);

  if (!productId) {
    return res.status(400).json({ message: 'ID produk tidak valid.' });
  }

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const [result] = await pool.query(
      `UPDATE products
       SET name = ?, origin = ?, roast_level = ?, flavor_notes = ?, weight = ?, price = ?, image_url = ?, description = ?
       WHERE id = ?`,
      [
        product.name,
        product.origin,
        product.roast_level,
        product.flavor_notes,
        product.weight,
        product.price,
        product.image_url,
        product.description,
        productId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    res.json({ message: 'Produk berhasil diperbarui.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui produk.' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const productId = Number(req.params.id);

  if (!productId) {
    return res.status(400).json({ message: 'ID produk tidak valid.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error(error);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'Produk tidak bisa dihapus karena sudah memiliki data pesanan. Hapus/reset pesanan terlebih dahulu.',
      });
    }

    res.status(500).json({ message: 'Gagal menghapus produk.' });
  }
});

app.get('/api/payment-methods', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, bank_name, account_number, account_name, description, is_active, created_at
      FROM payment_methods
      ORDER BY id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil metode pembayaran.' });
  }
});

app.post('/api/payment-methods', async (req, res) => {
  const paymentMethod = normalizePaymentPayload(req.body);
  const validationMessage = validatePaymentMethod(paymentMethod);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO payment_methods (bank_name, account_number, account_name, description, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        paymentMethod.bank_name,
        paymentMethod.account_number,
        paymentMethod.account_name,
        paymentMethod.description,
        paymentMethod.is_active,
      ]
    );

    res.status(201).json({ message: 'Metode pembayaran berhasil ditambahkan.', payment_method_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan metode pembayaran.' });
  }
});

app.put('/api/payment-methods/:id', async (req, res) => {
  const paymentMethodId = Number(req.params.id);
  const paymentMethod = normalizePaymentPayload(req.body);
  const validationMessage = validatePaymentMethod(paymentMethod);

  if (!paymentMethodId) {
    return res.status(400).json({ message: 'ID metode pembayaran tidak valid.' });
  }

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const [result] = await pool.query(
      `UPDATE payment_methods
       SET bank_name = ?, account_number = ?, account_name = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [
        paymentMethod.bank_name,
        paymentMethod.account_number,
        paymentMethod.account_name,
        paymentMethod.description,
        paymentMethod.is_active,
        paymentMethodId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Metode pembayaran tidak ditemukan.' });
    }

    res.json({ message: 'Metode pembayaran berhasil diperbarui.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui metode pembayaran.' });
  }
});

app.delete('/api/payment-methods/:id', async (req, res) => {
  const paymentMethodId = Number(req.params.id);

  if (!paymentMethodId) {
    return res.status(400).json({ message: 'ID metode pembayaran tidak valid.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM payment_methods WHERE id = ?', [paymentMethodId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Metode pembayaran tidak ditemukan.' });
    }

    res.json({ message: 'Metode pembayaran berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus metode pembayaran.' });
  }
});

app.post('/api/orders', upload.single('payment_proof'), async (req, res) => {
  const customerName = normalizeText(req.body.customer_name);
  const whatsapp = normalizeText(req.body.whatsapp);
  const productId = Number(req.body.product_id);
  const quantity = Number(req.body.quantity);
  const address = normalizeText(req.body.address);
  const paymentMethodId = Number(req.body.payment_method_id);
  const paymentProofUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const validationMessages = [
    validateCustomerName(customerName),
    validateWhatsapp(whatsapp),
    validateAddress(address),
  ].filter(Boolean);

  if (!productId) validationMessages.push('Produk kopi wajib dipilih.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    validationMessages.push('Jumlah pesanan harus berupa angka 1 sampai 99.');
  }
  if (!paymentMethodId) validationMessages.push('Metode pembayaran wajib dipilih.');
  if (!paymentProofUrl) validationMessages.push('Bukti transfer wajib diupload dalam format JPG atau PNG.');

  if (validationMessages.length) {
    return res.status(400).json({ message: validationMessages[0] });
  }

  try {
    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);

    if (productRows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const [paymentRows] = await pool.query(
      `SELECT id, bank_name
       FROM payment_methods
       WHERE id = ? AND is_active = 1`,
      [paymentMethodId]
    );

    if (paymentRows.length === 0) {
      return res.status(404).json({ message: 'Metode pembayaran tidak tersedia atau tidak aktif.' });
    }

    const paymentMethodLabel = `Transfer ${paymentRows[0].bank_name}`;

    const [result] = await pool.query(
      `INSERT INTO orders
       (customer_name, whatsapp, product_id, quantity, address, payment_method_id, payment_method, payment_status, payment_proof_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerName,
        whatsapp,
        productId,
        quantity,
        address,
        paymentMethodId,
        paymentMethodLabel,
        'Menunggu Verifikasi',
        paymentProofUrl,
      ]
    );

    res.status(201).json({
      message: 'Pesanan berhasil disimpan.',
      order_id: result.insertId,
      payment_method: paymentMethodLabel,
      payment_status: 'Menunggu Verifikasi',
      payment_proof_url: paymentProofUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menyimpan pesanan.' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT orders.id, orders.customer_name, orders.whatsapp, products.name AS product_name,
             orders.quantity, orders.address, orders.payment_method_id, orders.payment_method,
             orders.payment_status, orders.payment_proof_url, orders.created_at
      FROM orders
      JOIN products ON products.id = orders.product_id
      ORDER BY orders.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data pesanan.' });
  }
});

app.put('/api/orders/:id/payment-status', async (req, res) => {
  const orderId = Number(req.params.id);
  const paymentStatus = normalizeText(req.body.payment_status);
  const allowedStatus = ['Menunggu Verifikasi', 'Sudah Dibayar', 'Ditolak', 'Dibatalkan'];

  if (!orderId) {
    return res.status(400).json({ message: 'ID pesanan tidak valid.' });
  }

  if (!allowedStatus.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Status pembayaran tidak valid.' });
  }

  try {
    const [result] = await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    res.json({ message: 'Status pembayaran berhasil diperbarui.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui status pembayaran.' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);

  if (!orderId) {
    return res.status(400).json({ message: 'ID pesanan tidak valid.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    res.json({ message: 'Pesanan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus pesanan.' });
  }
});

app.delete('/api/orders', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders');
    await pool.query('ALTER TABLE orders AUTO_INCREMENT = 1');

    res.json({ message: 'Semua pesanan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal reset pesanan.' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  if (error.message === 'Format file harus JPG, JPEG, atau PNG.') {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

connectDatabase()
  .then(ensureDatabaseSchema)
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Backend failed to start:', error);
    process.exit(1);
  });
