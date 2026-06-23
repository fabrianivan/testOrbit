/**
 * checkout.js — Checkout Page Component (Multi-step Wizard)
 *
 * Step 0: Shipping Information (name, phone, address, courier)
 * Step 1: Payment Method (credit card, VA, e-wallet)
 *
 * Validates all fields before progression. On "Bayar Sekarang",
 * shows a 2s loading overlay simulating API verification,
 * then redirects to the Success page.
 */

const CheckoutPage = (() => {
  let _container = null;

  function init(container) {
    _container = container;
    Store.subscribe('checkoutStep', render);
    Store.subscribe('paymentMethod', () => {
      updatePaymentUI();
    });
    render();
  }

  function render() {
    const state = Store.getState();
    const step = state.checkoutStep;

    _container.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">Checkout</h1>
        <p class="section-header__subtitle">Lengkapi informasi untuk menyelesaikan pesanan</p>
      </div>

      <!-- Stepper -->
      <nav class="stepper" aria-label="Langkah checkout">
        <div class="stepper__step ${step >= 0 ? 'active' : ''} ${step > 0 ? 'completed' : ''}" aria-current="${step === 0 ? 'step' : 'false'}">
          <div class="stepper__circle">${step > 0 ? '✓' : '1'}</div>
          <span class="stepper__label">Pengiriman</span>
        </div>
        <div class="stepper__line ${step > 0 ? 'completed' : ''}"></div>
        <div class="stepper__step ${step >= 1 ? 'active' : ''}" aria-current="${step === 1 ? 'step' : 'false'}">
          <div class="stepper__circle">2</div>
          <span class="stepper__label">Pembayaran</span>
        </div>
      </nav>

      <div class="checkout-layout">
        <div>
          <!-- Step 0: Shipping -->
          <div class="step-panel ${step === 0 ? 'active' : ''}" id="step-shipping" role="tabpanel" aria-label="Informasi Pengiriman">
            ${renderShippingForm(state)}
          </div>

          <!-- Step 1: Payment -->
          <div class="step-panel ${step === 1 ? 'active' : ''}" id="step-payment" role="tabpanel" aria-label="Metode Pembayaran">
            ${renderPaymentForm(state)}
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <aside class="checkout-order-summary" aria-label="Ringkasan belanja">
          ${renderMiniSummary(state)}
        </aside>
      </div>
    `;

    bindCheckoutEvents(step);
  }

  // ---- Step 0: Shipping Form ----
  function renderShippingForm(state) {
    const s = state.shipping;
    return `
      <h2 class="step-panel__title">
        <span class="step-panel__title-icon">📦</span>
        Informasi Pengiriman
      </h2>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="ship-name">Nama Lengkap</label>
          <input type="text" class="form-input" id="ship-name" placeholder="cth. Ahmad Fauzi"
            value="${Utils.escapeHtml(s.name)}" autocomplete="name" />
          <div class="form-error" role="alert"></div>
        </div>

        <div class="form-group">
          <label class="form-label form-label--required" for="ship-phone">Nomor Telepon</label>
          <input type="tel" class="form-input" id="ship-phone" placeholder="cth. 08123456789"
            value="${Utils.escapeHtml(s.phone)}" autocomplete="tel" />
          <div class="form-error" role="alert"></div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label form-label--required" for="ship-address">Alamat Lengkap</label>
        <textarea class="form-input" id="ship-address" rows="3"
          placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota, Kode Pos"
          autocomplete="street-address">${Utils.escapeHtml(s.address)}</textarea>
        <div class="form-error" role="alert"></div>
      </div>

      <div class="form-group">
        <label class="form-label form-label--required" for="ship-courier">Pilihan Kurir Ekspedisi</label>
        <select class="form-select" id="ship-courier">
          <option value="" disabled ${!s.courier ? 'selected' : ''}>— Pilih kurir —</option>
          <option value="reguler" ${s.courier === 'reguler' ? 'selected' : ''}>📦 Reguler (3-5 hari) — Rp15.000</option>
          <option value="express" ${s.courier === 'express' ? 'selected' : ''}>⚡ Express (1-2 hari) — Rp30.000</option>
          <option value="ekonomi" ${s.courier === 'ekonomi' ? 'selected' : ''}>🚚 Ekonomi (5-7 hari) — Rp8.000</option>
        </select>
        <div class="form-error" role="alert"></div>
      </div>

      <div class="checkout-actions">
        <button class="btn btn--ghost" id="btn-back-cart">
          ← Kembali ke Keranjang
        </button>
        <button class="btn btn--primary btn--lg" id="btn-next-payment">
          Lanjut ke Pembayaran →
        </button>
      </div>
    `;
  }

  // ---- Step 1: Payment Form ----
  function renderPaymentForm(state) {
    const pm = state.paymentMethod;
    return `
      <h2 class="step-panel__title">
        <span class="step-panel__title-icon">💳</span>
        Metode Pembayaran
      </h2>

      <div class="payment-options" role="radiogroup" aria-label="Pilih metode pembayaran">
        ${renderPaymentOption('credit-card', '💳', 'Kartu Kredit / Debit', 'Visa, Mastercard, JCB', pm)}
        ${renderPaymentOption('virtual-account', '🏦', 'Virtual Account', 'BCA, BNI, Mandiri, BRI', pm)}
        ${renderPaymentOption('e-wallet', '📱', 'E-Wallet', 'GoPay, OVO, DANA, ShopeePay', pm)}
      </div>

      <div id="payment-error" class="form-error" role="alert" style="margin-top: var(--space-3);"></div>

      <div class="checkout-actions">
        <button class="btn btn--ghost" id="btn-back-shipping">
          ← Kembali
        </button>
        <button class="btn btn--primary btn--lg" id="btn-pay-now">
          🔒 Bayar Sekarang
        </button>
      </div>
    `;
  }

  function renderPaymentOption(value, icon, name, desc, current) {
    const selected = current === value;
    return `
      <label class="payment-card ${selected ? 'selected' : ''}" data-payment="${value}" tabindex="0"
        role="radio" aria-checked="${selected}" aria-label="${name}">
        <input type="radio" name="payment-method" value="${value}" ${selected ? 'checked' : ''} />
        <div class="payment-card__radio"></div>
        <div class="payment-card__icon">${icon}</div>
        <div class="payment-card__info">
          <div class="payment-card__name">${name}</div>
          <div class="payment-card__desc">${desc}</div>
        </div>
      </label>
    `;
  }

  // ---- Mini Summary Sidebar ----
  function renderMiniSummary(state) {
    const cart = state.cart;
    const discount = Store.getDiscount();
    const total = Store.getGrandTotal();

    return `
      <h3 class="checkout-order-summary__title">Ringkasan Belanja</h3>

      ${cart.map((item) => `
        <div class="checkout-item-mini">
          <div class="checkout-item-mini__img">${item.product.image}</div>
          <div class="checkout-item-mini__info">
            <div class="checkout-item-mini__name">${Utils.escapeHtml(item.product.name)}</div>
            <div class="checkout-item-mini__qty">${item.quantity}x</div>
          </div>
          <div class="checkout-item-mini__price">${Utils.formatCurrency(item.product.price * item.quantity)}</div>
        </div>
      `).join('')}

      <hr class="divider" />

      <div class="summary-line">
        <span>Subtotal</span>
        <span>${Utils.formatCurrency(Store.getCartSubtotal())}</span>
      </div>
      ${discount > 0 ? `
        <div class="summary-line summary-line--discount">
          <span>Diskon</span>
          <span>-${Utils.formatCurrency(discount)}</span>
        </div>
      ` : ''}
      <div class="summary-line">
        <span>PPN (11%)</span>
        <span>${Utils.formatCurrency(Store.getTax())}</span>
      </div>
      <div class="summary-line">
        <span>Biaya Layanan</span>
        <span>${Utils.formatCurrency(Store.getServiceFee())}</span>
      </div>
      <div class="summary-line summary-line--total">
        <span>Total</span>
        <span>${Utils.formatCurrency(total)}</span>
      </div>
    `;
  }

  // ---- Payment Card UI Update ----
  function updatePaymentUI() {
    const state = Store.getState();
    document.querySelectorAll('.payment-card').forEach((card) => {
      const val = card.dataset.payment;
      const isSelected = val === state.paymentMethod;
      card.classList.toggle('selected', isSelected);
      card.setAttribute('aria-checked', isSelected);
      card.querySelector('input[type="radio"]').checked = isSelected;
    });
  }

  // ---- Event Binding ----
  function bindCheckoutEvents(step) {
    if (step === 0) bindShippingEvents();
    if (step === 1) bindPaymentEvents();
  }

  function bindShippingEvents() {
    // Back to cart
    document.getElementById('btn-back-cart')?.addEventListener('click', () => {
      Store.setPage('cart');
    });

    // Next to payment — validate first
    document.getElementById('btn-next-payment')?.addEventListener('click', () => {
      if (validateShippingForm()) {
        saveShippingData();
        Store.setCheckoutStep(1);
      }
    });
  }

  function bindPaymentEvents() {
    // Payment card selection
    document.querySelectorAll('.payment-card').forEach((card) => {
      card.addEventListener('click', () => {
        Store.setPaymentMethod(card.dataset.payment);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          Store.setPaymentMethod(card.dataset.payment);
        }
      });
    });

    // Back to shipping
    document.getElementById('btn-back-shipping')?.addEventListener('click', () => {
      saveShippingData(); // keep form data
      Store.setCheckoutStep(0);
    });

    // Pay now
    document.getElementById('btn-pay-now')?.addEventListener('click', handlePayNow);
  }

  // ---- Validation ----
  function validateShippingForm() {
    const nameOk = Utils.validateField(document.getElementById('ship-name'), {
      required: true,
      minLength: 3,
      requiredMsg: 'Nama lengkap wajib diisi.',
    });

    const phoneOk = Utils.validateField(document.getElementById('ship-phone'), {
      required: true,
      pattern: /^(\+62|62|0)8[0-9]{8,12}$/,
      requiredMsg: 'Nomor telepon wajib diisi.',
      patternMsg: 'Format nomor tidak valid (cth. 08123456789).',
    });

    const addressOk = Utils.validateField(document.getElementById('ship-address'), {
      required: true,
      minLength: 10,
      requiredMsg: 'Alamat lengkap wajib diisi.',
    });

    const courierEl = document.getElementById('ship-courier');
    const courierOk = Utils.validateField(courierEl, {
      required: true,
      requiredMsg: 'Pilih kurir ekspedisi.',
    });

    return nameOk && phoneOk && addressOk && courierOk;
  }

  function saveShippingData() {
    const name = document.getElementById('ship-name')?.value || '';
    const phone = document.getElementById('ship-phone')?.value || '';
    const address = document.getElementById('ship-address')?.value || '';
    const courier = document.getElementById('ship-courier')?.value || '';
    Store.setShipping({ name, phone, address, courier });
  }

  // ---- Payment Handler ----
  function handlePayNow() {
    const state = Store.getState();
    if (!state.paymentMethod) {
      const errorEl = document.getElementById('payment-error');
      if (errorEl) {
        errorEl.textContent = 'Pilih metode pembayaran terlebih dahulu.';
        errorEl.classList.add('visible');
      }
      Utils.showToast('Pilih metode pembayaran.', 'error');
      return;
    }

    // Show loading overlay
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('active');

    // Simulate 2s API verification
    setTimeout(() => {
      overlay.classList.remove('active');
      const order = Store.createOrder();
      Store.clearCart();
      Store.resetCheckout();
      Store.setPage('success');
    }, 2000);
  }

  return { init };
})();
