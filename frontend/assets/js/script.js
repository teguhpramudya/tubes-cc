const productList = document.getElementById('produk-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatHarga(price) {
  return `${rupiah.format(Number(price)).replace(/\s/g, ' ')}/Kg`;
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');

    if (!response.ok) {
      throw new Error('API produk tidak dapat diakses.');
    }

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      return;
    }

    renderProducts(products);
    renderProductOptions(products);
  } catch (error) {
    console.log('Produk tetap menggunakan data statis karena API belum tersedia:', error.message);
  }
}

function renderProducts(products) {
  productList.innerHTML = products.map((product) => `
    <div class="card">
      <img src="${product.image_url}" alt="${product.name}">

      <div class="card-body">
        <h3>${product.name}</h3>

        <p>
          ${product.description}
        </p>

        <p class="price">
          ${formatHarga(product.price)}
        </p>
      </div>
    </div>
  `).join('');
}

function renderProductOptions(products) {
  productSelect.innerHTML = '<option value="">Pilih Produk Kopi</option>';

  products.forEach((product) => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    productSelect.appendChild(option);
  });
}

function getStaticProductId(productName) {
  const mapping = {
    'Arabika Gayo': 1,
    'Arabika Kerinci': 2,
    'Arabika Toraja': 3,
  };

  return mapping[productName] || Number(productName);
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const productValue = productSelect.value;

  const payload = {
    customer_name: document.getElementById('customer-name').value.trim(),
    whatsapp: document.getElementById('customer-whatsapp').value.trim(),
    product_id: getStaticProductId(productValue),
    quantity: Number(document.getElementById('quantity').value),
    address: document.getElementById('address').value.trim(),
  };

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Pesanan gagal dikirim.');
    }

    alert(`Pesanan berhasil disimpan. Nomor pesanan: #${result.order_id}`);
    orderForm.reset();
  } catch (error) {
    alert(`Pesanan gagal dikirim: ${error.message}`);
  }
});

loadProducts();
