const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const productsTableBody = document.getElementById('products-table-body');
const ordersTableBody = document.getElementById('orders-table-body');
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const currentImageInput = document.getElementById('current-image-url');
const productImageFileInput = document.getElementById('product-image-file');
const imagePreviewWrapper = document.getElementById('image-preview-wrapper');
const imagePreview = document.getElementById('image-preview');
const saveProductButton = document.getElementById('save-product-btn');
const cancelEditButton = document.getElementById('cancel-edit-btn');

let productsCache = [];

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
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request gagal diproses.');
  }

  return data;
}

async function uploadImageIfSelected() {
  const file = productImageFileInput.files[0];

  if (!file) {
    return currentImageInput.value;
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
      <td>
        <img class="admin-product-img" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">
      </td>
      <td>
        <strong>${escapeHtml(product.name)}</strong><br>
        <small>${escapeHtml(product.description)}</small>
      </td>
      <td>${escapeHtml(product.origin)}</td>
      <td>${escapeHtml(product.roast_level)}<br><small>${escapeHtml(product.flavor_notes)}</small></td>
      <td>${formatRupiah(product.price)}<br><small>${escapeHtml(product.weight)}</small></td>
      <td>
        <div class="admin-table-actions">
          <button type="button" class="admin-btn admin-btn-small" onclick="startEditProduct(${product.id})">Edit</button>
          <button type="button" class="admin-btn admin-btn-small admin-btn-danger" onclick="deleteProduct(${product.id})">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function startEditProduct(productId) {
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

async function loadOrders() {
  ordersTableBody.innerHTML = '<tr><td colspan="8">Memuat data pesanan...</td></tr>';

  try {
    const orders = await requestJson('/api/orders');
    renderOrders(orders);
  } catch (error) {
    ordersTableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersTableBody.innerHTML = '<tr><td colspan="8">Belum ada pesanan.</td></tr>';
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
      <td>${formatDate(order.created_at)}</td>
      <td>
        <button type="button" class="admin-btn admin-btn-small admin-btn-danger" onclick="deleteOrder(${order.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
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
document.getElementById('refresh-products-btn').addEventListener('click', loadProducts);
document.getElementById('refresh-orders-btn').addEventListener('click', loadOrders);
document.getElementById('reset-orders-btn').addEventListener('click', resetOrders);

loadProducts();
loadOrders();
