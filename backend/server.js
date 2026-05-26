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
      .replace(/^-+|-+$/g, '') || 'produk';

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

    cb(new Error('Format gambar harus JPG, JPEG, atau PNG.'));
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

function normalizeProductPayload(body) {
  return {
    name: String(body.name || '').trim(),
    origin: String(body.origin || '').trim(),
    roast_level: String(body.roast_level || '').trim(),
    flavor_notes: String(body.flavor_notes || '').trim(),
    weight: String(body.weight || '1 Kg').trim(),
    price: Number(body.price),
    image_url: String(body.image_url || '').trim(),
    description: String(body.description || '').trim(),
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

app.post('/api/orders', async (req, res) => {
  const { customer_name, whatsapp, product_id, quantity, address } = req.body;

  if (!customer_name || !whatsapp || !product_id || !quantity || !address) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }

  if (Number(quantity) < 1) {
    return res.status(400).json({ message: 'Jumlah pesanan minimal 1.' });
  }

  try {
    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ?', [product_id]);

    if (productRows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const [result] = await pool.query(
      `INSERT INTO orders (customer_name, whatsapp, product_id, quantity, address)
       VALUES (?, ?, ?, ?, ?)`,
      [customer_name, whatsapp, product_id, quantity, address]
    );

    res.status(201).json({
      message: 'Pesanan berhasil disimpan.',
      order_id: result.insertId,
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
             orders.quantity, orders.address, orders.created_at
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

  if (error.message === 'Format gambar harus JPG, JPEG, atau PNG.') {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Backend failed to start:', error);
    process.exit(1);
  });
