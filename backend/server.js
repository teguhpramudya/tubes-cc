require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'backend', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database not connected' });
  }
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
