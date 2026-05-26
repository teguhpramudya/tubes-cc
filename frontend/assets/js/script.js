const productList = document.getElementById('produk-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');
const paymentMethodSelect = document.getElementById('payment-method-select');
const paymentMethodDetail = document.getElementById('payment-method-detail');
const paymentProofFileInput = document.getElementById('payment-proof-file');
const paymentProofPreviewWrapper = document.getElementById('payment-proof-preview-wrapper');
const paymentProofPreview = document.getElementById('payment-proof-preview');

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

let paymentMethodsCache = [];

function formatHarga(price) {
  return `${rupiah.format(Number(price)).replace(/\s/g, ' ')}/Kg`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

  if (!normalizedAddress) return 'Alamat pengiriman wajib diisi.';
  if (normalizedAddress.length < 8) return 'Alamat terlalu pendek. Masukkan alamat pengiriman yang lebih jelas.';
  if (words.length < 2) return 'Alamat harus berisi minimal 2 kata, contoh: Telkom University.';
  if (!/[A-Za-zÀ-ÿ]/.test(normalizedAddress)) return 'Alamat harus berisi nama tempat atau daerah.';
  if (hasSuspiciousPattern(normalizedAddress)) return 'Alamat tidak terlihat valid. Masukkan alamat pengiriman yang benar.';

  return null;
}

function validatePaymentProof(file) {
  if (!file) return 'Bukti transfer wajib diupload.';

  const allowedTypes = ['image/jpeg', 'image/png'];
  const allowedExtensions = ['jpg', 'jpeg', 'png'];
  const extension = file.name.split('.').pop().toLowerCase();

  if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
    return 'Bukti transfer harus berupa file JPG atau PNG.';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'Ukuran bukti transfer maksimal 10 MB.';
  }

  return null;
}

function showFormMessage(message, type = 'error') {
  let messageElement = document.getElementById('form-message');

  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.id = 'form-message';

    const submitButton = orderForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.insertAdjacentElement('beforebegin', messageElement);
    } else {
      orderForm.appendChild(messageElement);
    }
  }

  messageElement.className = `form-message ${type}`;
  messageElement.textContent = message;
  messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFormMessage() {
  const messageElement = document.getElementById('form-message');
  if (messageElement) messageElement.remove();
}

function setSubmitLoading(isLoading) {
  const submitButton = orderForm.querySelector('button[type="submit"]');
  if (!submitButton) return;

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Mengirim Pesanan...' : 'Pesan Sekarang';
}

orderForm.addEventListener('invalid', (event) => {
  event.preventDefault();
  const field = event.target;
  const label = field.getAttribute('placeholder') || field.previousElementSibling?.textContent || 'Field';
  showFormMessage(`${label} wajib diisi dengan benar.`, 'error');
  field.focus();
}, true);

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

async function loadPaymentMethods() {
  try {
    const response = await fetch('/api/payment-methods');

    if (!response.ok) {
      throw new Error('API metode pembayaran tidak dapat diakses.');
    }

    const paymentMethods = await response.json();
    paymentMethodsCache = paymentMethods.filter((method) => Number(method.is_active) === 1);

    renderPaymentMethods(paymentMethodsCache);
  } catch (error) {
    console.log('Metode pembayaran memakai data default karena API belum tersedia:', error.message);
    paymentMethodsCache = [
      {
        id: 1,
        bank_name: 'BCA',
        account_number: '1234567890',
        account_name: 'Siputra Coffee Beans',
        description: 'Setelah pesanan dikirim, silakan lakukan pembayaran melalui transfer BCA, lalu upload bukti transfer pada form pemesanan.',
        is_active: 1,
      },
    ];
    renderPaymentMethods(paymentMethodsCache);
  }
}

function renderProducts(products) {
  productList.innerHTML = products.map((product) => `
    <div class="card">
      <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">

      <div class="card-body">
        <h3>${escapeHtml(product.name)}</h3>

        <p>
          ${escapeHtml(product.description)}
        </p>

        <p
          class="price price-clickable"
          role="button"
          tabindex="0"
          data-product-id="${escapeHtml(product.id)}"
          title="Klik untuk pesan produk ini"
        >
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

function renderPaymentMethods(paymentMethods) {
  paymentMethodSelect.innerHTML = '<option value="">Pilih Metode Pembayaran</option>';

  if (!paymentMethods.length) {
    paymentMethodDetail.innerHTML = '<p>Belum ada metode pembayaran aktif. Silakan hubungi admin.</p>';
    return;
  }

  paymentMethods.forEach((method) => {
    const option = document.createElement('option');
    option.value = method.id;
    option.textContent = `Transfer ${method.bank_name}`;
    paymentMethodSelect.appendChild(option);
  });

  paymentMethodSelect.value = paymentMethods[0].id;
  showSelectedPaymentMethod();
}

function showSelectedPaymentMethod() {
  const selectedMethod = paymentMethodsCache.find((method) => Number(method.id) === Number(paymentMethodSelect.value));

  if (!selectedMethod) {
    paymentMethodDetail.innerHTML = '<p>Pilih metode pembayaran terlebih dahulu.</p>';
    return;
  }

  paymentMethodDetail.innerHTML = `
    <p><strong>Transfer Bank:</strong> ${escapeHtml(selectedMethod.bank_name)}</p>
    <p><strong>No. Rekening:</strong> ${escapeHtml(selectedMethod.account_number)}</p>
    <p><strong>Atas Nama:</strong> ${escapeHtml(selectedMethod.account_name)}</p>
    <p class="payment-note">${escapeHtml(selectedMethod.description || 'Setelah pesanan dikirim, silakan lakukan pembayaran sesuai rekening yang dipilih.')}</p>
  `;
}

function getStaticProductId(productName) {
  const mapping = {
    'Arabika Gayo': 1,
    'Arabika Kerinci': 2,
    'Arabika Toraja': 3,
  };

  return mapping[productName] || Number(productName);
}

function goToOrderForm(productId) {
  if (!orderForm) return;

  if (productId && productSelect) {
    const normalizedProductId = String(productId);
    const optionExists = Array.from(productSelect.options).some((option) => option.value === normalizedProductId);

    if (optionExists) {
      productSelect.value = normalizedProductId;
    }
  }

  orderForm.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });

  setTimeout(() => {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
      quantityInput.focus();
    }
  }, 500);
}

function getProductIdFromCard(priceElement) {
  const directProductId = priceElement.dataset.productId;
  if (directProductId) return directProductId;

  const card = priceElement.closest('.card');
  const productName = card?.querySelector('h3')?.textContent?.trim();

  return getStaticProductId(productName);
}

function handlePriceOrderClick(event) {
  const priceElement = event.target.closest('.price');

  if (!priceElement || !productList.contains(priceElement)) return;

  const productId = getProductIdFromCard(priceElement);
  goToOrderForm(productId);
}

function handlePriceOrderKeyboard(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const priceElement = event.target.closest('.price');

  if (!priceElement || !productList.contains(priceElement)) return;

  event.preventDefault();
  const productId = getProductIdFromCard(priceElement);
  goToOrderForm(productId);
}

function validateOrderPayload(payload, proofFile) {
  const validationMessages = [
    validateCustomerName(payload.customer_name),
    validateWhatsapp(payload.whatsapp),
    validateAddress(payload.address),
    validatePaymentProof(proofFile),
  ].filter(Boolean);

  if (!payload.product_id) validationMessages.push('Produk kopi wajib dipilih.');
  if (!Number.isInteger(payload.quantity) || payload.quantity < 1 || payload.quantity > 99) {
    validationMessages.push('Jumlah pesanan harus berupa angka 1 sampai 99.');
  }
  if (!payload.payment_method_id) validationMessages.push('Metode pembayaran wajib dipilih.');

  return validationMessages[0] || null;
}

paymentProofFileInput.addEventListener('change', () => {
  const file = paymentProofFileInput.files[0];

  if (!file) {
    paymentProofPreviewWrapper.hidden = true;
    paymentProofPreview.src = '';
    return;
  }

  const validationMessage = validatePaymentProof(file);
  if (validationMessage) {
    showFormMessage(validationMessage, 'error');
    paymentProofFileInput.value = '';
    paymentProofPreviewWrapper.hidden = true;
    paymentProofPreview.src = '';
    return;
  }

  paymentProofPreview.src = URL.createObjectURL(file);
  paymentProofPreviewWrapper.hidden = false;
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormMessage();

  const productValue = productSelect.value;
  const selectedPaymentMethod = paymentMethodsCache.find((method) => Number(method.id) === Number(paymentMethodSelect.value));
  const proofFile = paymentProofFileInput.files[0];

  const payload = {
    customer_name: normalizeText(document.getElementById('customer-name').value),
    whatsapp: normalizeText(document.getElementById('customer-whatsapp').value),
    product_id: getStaticProductId(productValue),
    quantity: Number(document.getElementById('quantity').value),
    address: normalizeText(document.getElementById('address').value),
    payment_method_id: Number(paymentMethodSelect.value),
  };

  const validationMessage = validateOrderPayload(payload, proofFile);

  if (validationMessage) {
    showFormMessage(validationMessage, 'error');
    return;
  }

  try {
    setSubmitLoading(true);
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('payment_proof', proofFile);

    const response = await fetch('/api/orders', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Pesanan gagal dikirim.');
    }

    const paymentInfo = selectedPaymentMethod
      ? `Metode pembayaran: Transfer ${selectedPaymentMethod.bank_name}\nNo. Rekening: ${selectedPaymentMethod.account_number}\nAtas Nama: ${selectedPaymentMethod.account_name}\nStatus: ${result.payment_status || 'Menunggu Verifikasi'}`
      : `Metode pembayaran: ${result.payment_method || 'Transfer BCA'}`;

    setSubmitLoading(false);
    alert(`Pesanan berhasil disimpan. Nomor pesanan: #${result.order_id}\n\n${paymentInfo}\n\nBukti transfer berhasil diupload dan akan diverifikasi admin.`);
    orderForm.reset();
    paymentProofPreviewWrapper.hidden = true;
    paymentProofPreview.src = '';
    renderPaymentMethods(paymentMethodsCache);
  } catch (error) {
    setSubmitLoading(false);
    showFormMessage(`Pesanan gagal dikirim: ${error.message}`, 'error');
  }
});

productList.addEventListener('click', handlePriceOrderClick);
productList.addEventListener('keydown', handlePriceOrderKeyboard);
paymentMethodSelect.addEventListener('change', showSelectedPaymentMethod);

loadProducts();
loadPaymentMethods();
