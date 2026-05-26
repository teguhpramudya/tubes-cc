const ADMIN_LOGIN_KEY = 'siputra_admin_logged_in';

if (localStorage.getItem(ADMIN_LOGIN_KEY) !== 'true') {
  window.location.replace('login.html');
}

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const productsTableBody = document.getElementById('products-table-body');
const ordersTableBody = document.getElementById('orders-table-body');
const paymentsTableBody = document.getElementById('payments-table-body');

const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const currentImageInput = document.getElementById('current-image-url');
const productImageFileInput = document.getElementById('product-image-file');
const imagePreviewWrapper = document.getElementById('image-preview-wrapper');
const imagePreview = document.getElementById('image-preview');
const saveProductButton = document.getElementById('save-product-btn');
const cancelEditButton = document.getElementById('cancel-edit-btn');

const paymentForm = document.getElementById('payment-form');
const paymentIdInput = document.getElementById('payment-id');
const savePaymentButton = document.getElementById('save-payment-btn');
const cancelPaymentEditButton = document.getElementById('cancel-payment-edit-btn');

let productsCache = [];
let paymentMethodsCache = [];

function formatRupiah(value) {
  return rupiahFormatter.format(Number(value)).replace(/\s/g, ' ');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    throw new Error(data.message || 'Request gagal diproses.');
  }

  return data;
}

async function uploadImageIfSelected() {
  const file = productImageFileInput.files[0];

  if (!file && currentImageInput.value) {
    return currentImageInput.value;
  }

  if (!file) {
    return '';
  }

  const formData = new FormData();
  formData.append('image', file);

  const result = await requestJson('/api/upload', {
    method: 'POST',
    body: formData,
  });

  return result.image_url;
}

async function loadProducts() {
  productsTableBody.innerHTML = '<tr><td colspan="6">Memuat data produk...</td></tr>';

  try {
    const products = await requestJson('/api/products');
    productsCache = products;
    renderProducts(products);
  } catch (error) {
    productsTableBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderProducts(products) {
  if (!products.length) {
    productsTableBody.innerHTML = '<tr><td colspan="6">Belum ada produk.</td></tr>';
    return;
  }

  productsTableBody.innerHTML = products.map((product) => `
    <tr>
      <td><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" class="admin-product-img"></td>
      <td>
        <strong>${escapeHtml(product.name)}</strong><br>
        <small>${escapeHtml(product.description)}</small>
      </td>
      <td>${escapeHtml(product.origin)}</td>
      <td>
        ${escapeHtml(product.roast_level)}<br>
        <small>${escapeHtml(product.flavor_notes)}</small>
      </td>
      <td>
        ${formatRupiah(product.price)}<br>
        <small>${escapeHtml(product.weight)}</small>
      </td>
      <td>
        <div class="admin-table-actions">
          <button type="button" class="admin-btn admin-btn-small" onclick="editProduct(${product.id})">Edit</button>
          <button type="button" class="admin-btn admin-btn-small admin-btn-danger" onclick="deleteProduct(${product.id})">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editProduct(productId) {
  const product = productsCache.find((item) => Number(item.id) === Number(productId));

  if (!product) {
    alert('Produk tidak ditemukan.');
    return;
  }

  productIdInput.value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-origin').value = product.origin;
  document.getElementById('product-roast').value = product.roast_level;
  document.getElementById('product-flavor').value = product.flavor_notes;
  document.getElementById('product-weight').value = product.weight;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-description').value = product.description;
  currentImageInput.value = product.image_url;
  productImageFileInput.value = '';

  imagePreview.src = product.image_url;
  imagePreviewWrapper.hidden = false;
  saveProductButton.textContent = 'Simpan Perubahan';
  cancelEditButton.hidden = false;

  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetProductForm() {
  productForm.reset();
  productIdInput.value = '';
  currentImageInput.value = '';
  imagePreview.src = '';
  imagePreviewWrapper.hidden = true;
  saveProductButton.textContent = 'Tambah Produk';
  cancelEditButton.hidden = true;
}

async function saveProduct(event) {
  event.preventDefault();

  try {
    const imageUrl = await uploadImageIfSelected();

    if (!imageUrl) {
      alert('Foto produk wajib dipilih untuk produk baru.');
      return;
    }

    const payload = {
      name: document.getElementById('product-name').value.trim(),
      origin: document.getElementById('product-origin').value.trim(),
      roast_level: document.getElementById('product-roast').value.trim(),
      flavor_notes: document.getElementById('product-flavor').value.trim(),
      weight: document.getElementById('product-weight').value.trim(),
      price: Number(document.getElementById('product-price').value),
      image_url: imageUrl,
      description: document.getElementById('product-description').value.trim(),
    };

    const productId = productIdInput.value;
    const isEdit = Boolean(productId);

    await requestJson(isEdit ? `/api/products/${productId}` : '/api/products', {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    alert(isEdit ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
    resetProductForm();
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteProduct(productId) {
  const confirmDelete = confirm('Yakin ingin menghapus produk ini? Produk yang sudah memiliki pesanan tidak bisa dihapus sebelum pesanan direset.');

  if (!confirmDelete) return;

  try {
    await requestJson(`/api/products/${productId}`, {
      method: 'DELETE',
    });

    alert('Produk berhasil dihapus.');
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
}

async function loadPayments() {
  paymentsTableBody.innerHTML = '<tr><td colspan="5">Memuat metode pembayaran...</td></tr>';

  try {
    const payments = await requestJson('/api/payment-methods');
    paymentMethodsCache = payments;
    renderPayments(payments);
  } catch (error) {
    paymentsTableBody.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderPayments(payments) {
  if (!payments.length) {
    paymentsTableBody.innerHTML = '<tr><td colspan="5">Belum ada metode pembayaran.</td></tr>';
    return;
  }

  paymentsTableBody.innerHTML = payments.map((payment) => `
    <tr>
      <td><strong>Transfer ${escapeHtml(payment.bank_name)}</strong><br><small>${escapeHtml(payment.description || '-')}</small></td>
      <td>${escapeHtml(payment.account_number)}</td>
      <td>${escapeHtml(payment.account_name)}</td>
      <td><span class="status-badge ${Number(payment.is_active) === 1 ? 'status-active' : 'status-inactive'}">${Number(payment.is_active) === 1 ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <div class="admin-table-actions">
          <button type="button" class="admin-btn admin-btn-small" onclick="editPayment(${payment.id})">Edit</button>
          <button type="button" class="admin-btn admin-btn-small admin-btn-danger" onclick="deletePayment(${payment.id})">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editPayment(paymentId) {
  const payment = paymentMethodsCache.find((item) => Number(item.id) === Number(paymentId));

  if (!payment) {
    alert('Metode pembayaran tidak ditemukan.');
    return;
  }

  paymentIdInput.value = payment.id;
  document.getElementById('payment-bank').value = payment.bank_name;
  document.getElementById('payment-account-number').value = payment.account_number;
  document.getElementById('payment-account-name').value = payment.account_name;
  document.getElementById('payment-description').value = payment.description || '';
  document.getElementById('payment-active').value = Number(payment.is_active) === 1 ? '1' : '0';

  savePaymentButton.textContent = 'Simpan Perubahan';
  cancelPaymentEditButton.hidden = false;
  paymentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetPaymentForm() {
  paymentForm.reset();
  paymentIdInput.value = '';
  document.getElementById('payment-active').value = '1';
  savePaymentButton.textContent = 'Tambah Metode';
  cancelPaymentEditButton.hidden = true;
}

async function savePayment(event) {
  event.preventDefault();

  const payload = {
    bank_name: document.getElementById('payment-bank').value.trim(),
    account_number: document.getElementById('payment-account-number').value.trim(),
    account_name: document.getElementById('payment-account-name').value.trim(),
    description: document.getElementById('payment-description').value.trim(),
    is_active: Number(document.getElementById('payment-active').value),
  };

  const paymentId = paymentIdInput.value;
  const isEdit = Boolean(paymentId);

  try {
    await requestJson(isEdit ? `/api/payment-methods/${paymentId}` : '/api/payment-methods', {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    alert(isEdit ? 'Metode pembayaran berhasil diperbarui.' : 'Metode pembayaran berhasil ditambahkan.');
    resetPaymentForm();
    await loadPayments();
  } catch (error) {
    alert(error.message);
  }
}

async function deletePayment(paymentId) {
  const confirmDelete = confirm('Yakin ingin menghapus metode pembayaran ini?');

  if (!confirmDelete) return;

  try {
    await requestJson(`/api/payment-methods/${paymentId}`, {
      method: 'DELETE',
    });

    alert('Metode pembayaran berhasil dihapus.');
    await loadPayments();
  } catch (error) {
    alert(error.message);
  }
}

async function loadOrders() {
  ordersTableBody.innerHTML = '<tr><td colspan="11">Memuat data pesanan...</td></tr>';

  try {
    const orders = await requestJson('/api/orders');
    renderOrders(orders);
  } catch (error) {
    ordersTableBody.innerHTML = `<tr><td colspan="11">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersTableBody.innerHTML = '<tr><td colspan="11">Belum ada pesanan.</td></tr>';
    return;
  }

  ordersTableBody.innerHTML = orders.map((order) => `
    <tr>
      <td>#${order.id}</td>
      <td>${escapeHtml(order.customer_name)}</td>
      <td>${escapeHtml(order.whatsapp)}</td>
      <td>${escapeHtml(order.product_name)}</td>
      <td>${escapeHtml(order.quantity)}</td>
      <td>${escapeHtml(order.address)}</td>
      <td>${escapeHtml(order.payment_method || '-')}</td>
      <td>
        <select class="status-select" onchange="updatePaymentStatus(${order.id}, this.value)">
          ${['Menunggu Verifikasi', 'Sudah Dibayar', 'Ditolak', 'Dibatalkan'].map((status) => `
            <option value="${status}" ${order.payment_status === status ? 'selected' : ''}>${status}</option>
          `).join('')}
        </select>
      </td>
      <td>
        ${order.payment_proof_url ? `
          <a href="${escapeHtml(order.payment_proof_url)}" target="_blank" class="proof-link">
            <img src="${escapeHtml(order.payment_proof_url)}" alt="Bukti transfer" class="payment-proof-img">
            <span>Lihat Bukti</span>
          </a>
        ` : '<span class="muted-text">Tidak ada</span>'}
      </td>
      <td>${formatDate(order.created_at)}</td>
      <td>
        <button type="button" class="admin-btn admin-btn-small admin-btn-danger" onclick="deleteOrder(${order.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

async function updatePaymentStatus(orderId, paymentStatus) {
  try {
    await requestJson(`/api/orders/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
  } catch (error) {
    alert(error.message);
    await loadOrders();
  }
}

async function deleteOrder(orderId) {
  const confirmDelete = confirm('Yakin ingin menghapus pesanan ini?');

  if (!confirmDelete) return;

  try {
    await requestJson(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });

    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
}

async function resetOrders() {
  const confirmReset = confirm('Yakin ingin menghapus semua pesanan?');

  if (!confirmReset) return;

  try {
    await requestJson('/api/orders', {
      method: 'DELETE',
    });

    alert('Semua pesanan berhasil dihapus.');
    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
}

productImageFileInput.addEventListener('change', () => {
  const file = productImageFileInput.files[0];

  if (!file) {
    if (currentImageInput.value) {
      imagePreview.src = currentImageInput.value;
      imagePreviewWrapper.hidden = false;
    } else {
      imagePreviewWrapper.hidden = true;
    }
    return;
  }

  imagePreview.src = URL.createObjectURL(file);
  imagePreviewWrapper.hidden = false;
});

productForm.addEventListener('submit', saveProduct);
cancelEditButton.addEventListener('click', resetProductForm);
paymentForm.addEventListener('submit', savePayment);
cancelPaymentEditButton.addEventListener('click', resetPaymentForm);

document.getElementById('refresh-products-btn').addEventListener('click', loadProducts);
document.getElementById('refresh-payments-btn').addEventListener('click', loadPayments);
document.getElementById('refresh-orders-btn').addEventListener('click', loadOrders);
document.getElementById('reset-orders-btn').addEventListener('click', resetOrders);
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem(ADMIN_LOGIN_KEY);
  window.location.replace('login.html');
});

loadProducts();
loadPayments();
loadOrders();
