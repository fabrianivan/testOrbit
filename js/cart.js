/**
 * cart.js — Cart Page Component
 *
 * Renders the shopping cart with item list, promo input,
 * summary sidebar, and empty state.
 */

const CartPage = (() => {
  let _container = null;

  function init(container) {
    _container = container;
    render();
    // Subscribe to cart changes for live updates
    Store.subscribe('cart', render);
    Store.subscribe('promo', render);
  }

  function render() {
    const state = Store.getState();
    const cart = state.cart;

    if (cart.length === 0) {
      _container.innerHTML = renderEmptyState();
      bindEmptyEvents();
      return;
    }

    _container.innerHTML = `
      <div class="section-header">
        <h1 class="section-header__title">Keranjang Belanja</h1>
        <p class="section-header__subtitle">${Store.getCartCount()} item di keranjang Anda</p>
      </div>

      <div class="cart-layout">
        <section class="cart-items-section" aria-label="Daftar item keranjang">
          ${cart.map(renderCartItem).join('')}
        </section>

        <aside class="cart-summary" aria-label="Ringkasan pesanan">
          ${renderSummary(state)}
        </aside>
      </div>
    `;

    bindCartEvents();
  }

  function renderCartItem(item) {
    const subtotal = item.product.price * item.quantity;
    return `
      <article class="cart-item-card" data-product-id="${item.product.id}" aria-label="${Utils.escapeHtml(item.product.name)}">
        <div class="cart-item__image" aria-hidden="true">
          ${item.product.image}
        </div>

        <div class="cart-item__info">
          <h3 class="cart-item__name">${Utils.escapeHtml(item.product.name)}</h3>
          <span class="cart-item__variant">${Utils.escapeHtml(item.product.variant)}</span>
          <span class="cart-item__price-unit">${Utils.formatCurrency(item.product.price)} / pcs</span>
        </div>

        <div class="cart-item__actions">
          <span class="cart-item__subtotal">${Utils.formatCurrency(subtotal)}</span>

          <div class="qty-control" role="group" aria-label="Ubah kuantitas ${Utils.escapeHtml(item.product.name)}">
            <button class="qty-control__btn" data-action="subtract" data-id="${item.product.id}"
              aria-label="Kurangi kuantitas" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
            <span class="qty-control__value" aria-live="polite">${item.quantity}</span>
            <button class="qty-control__btn" data-action="add" data-id="${item.product.id}"
              aria-label="Tambah kuantitas">+</button>
          </div>

          <button class="cart-item__remove" data-action="remove" data-id="${item.product.id}"
            aria-label="Hapus ${Utils.escapeHtml(item.product.name)} dari keranjang">
            🗑 Hapus
          </button>
        </div>
      </article>
    `;
  }

  function renderSummary(state) {
    const subtotal = Store.getCartSubtotal();
    const discount = Store.getDiscount();
    const serviceFee = Store.getServiceFee();
    const tax = Store.getTax();
    const total = Store.getGrandTotal();

    return `
      <h2 class="cart-summary__title">Ringkasan Pesanan</h2>

      <!-- Promo -->
      ${state.promo ? renderPromoApplied(state.promo) : renderPromoInput()}

      <hr class="divider" />

      <div class="summary-line">
        <span>Subtotal</span>
        <span>${Utils.formatCurrency(subtotal)}</span>
      </div>

      ${discount > 0 ? `
        <div class="summary-line summary-line--discount">
          <span>Diskon (${state.promo.label})</span>
          <span>-${Utils.formatCurrency(discount)}</span>
        </div>
      ` : ''}

      <div class="summary-line">
        <span>PPN (11%)</span>
        <span>${Utils.formatCurrency(tax)}</span>
      </div>

      <div class="summary-line">
        <span>Biaya Layanan</span>
        <span>${Utils.formatCurrency(serviceFee)}</span>
      </div>

      <div class="summary-line summary-line--total">
        <span>Total</span>
        <span>${Utils.formatCurrency(total)}</span>
      </div>

      <button class="btn btn--primary btn--lg btn--full" id="btn-to-checkout"
        aria-label="Lanjut ke halaman checkout">
        Lanjut ke Checkout →
      </button>
    `;
  }

  function renderPromoInput() {
    return `
      <div class="promo-row">
        <input type="text" class="form-input" id="promo-input"
          placeholder="Kode promo / voucher" aria-label="Masukkan kode promo"
          maxlength="20" autocomplete="off" />
        <button class="btn btn--secondary" id="btn-apply-promo">Terapkan</button>
      </div>
    `;
  }

  function renderPromoApplied(promo) {
    return `
      <div class="promo-applied" role="status">
        <span>🎉 ${Utils.escapeHtml(promo.label)} (${Utils.escapeHtml(promo.code)})</span>
        <button class="promo-applied__remove" id="btn-remove-promo"
          aria-label="Hapus kode promo">✕</button>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="empty-state" role="status">
        <div class="empty-state__illustration" aria-hidden="true">
          🛒
        </div>
        <h2 class="empty-state__title">Keranjang Anda Kosong</h2>
        <p class="empty-state__text">
          Belum ada produk di keranjang. Yuk, mulai belanja dan temukan produk favorit Anda!
        </p>
        <button class="btn btn--primary btn--lg" id="btn-start-shopping">
          🛍 Mulai Belanja
        </button>
      </div>
    `;
  }

  // ---- Event Binding (event delegation) ----
  function bindCartEvents() {
    // Quantity & remove buttons (delegation)
    _container.addEventListener('click', handleCartClick);

    // Promo apply
    const applyBtn = document.getElementById('btn-apply-promo');
    if (applyBtn) {
      applyBtn.addEventListener('click', handleApplyPromo);
    }

    // Promo remove
    const removePromoBtn = document.getElementById('btn-remove-promo');
    if (removePromoBtn) {
      removePromoBtn.addEventListener('click', () => {
        Store.removePromo();
        Utils.showToast('Kode promo dihapus.', 'success');
      });
    }

    // Promo enter key
    const promoInput = document.getElementById('promo-input');
    if (promoInput) {
      promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleApplyPromo();
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('btn-to-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        Store.setPage('checkout');
      });
    }
  }

  function handleCartClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'add') Store.addQuantity(id);
    else if (action === 'subtract') Store.subtractQuantity(id);
    else if (action === 'remove') {
      Store.removeFromCart(id);
      Utils.showToast('Produk dihapus dari keranjang.', 'success');
    }
  }

  function handleApplyPromo() {
    const input = document.getElementById('promo-input');
    if (!input) return;
    const code = input.value.trim();
    if (!code) {
      Utils.showToast('Masukkan kode promo terlebih dahulu.', 'error');
      return;
    }
    const result = Store.applyPromo(code);
    Utils.showToast(result.message, result.success ? 'success' : 'error');
  }

  function bindEmptyEvents() {
    const btn = document.getElementById('btn-start-shopping');
    if (btn) {
      btn.addEventListener('click', () => {
        // Re-populate cart with sample items for demo
        Store.getState().cart.push(
          { product: Store.PRODUCTS[0], quantity: 1 },
          { product: Store.PRODUCTS[3], quantity: 1 },
        );
        Store.subscribe('cart', () => {}); // trigger
        render();
        Utils.showToast('Produk telah ditambahkan!', 'success');
      });
    }
  }

  return { init };
})();
