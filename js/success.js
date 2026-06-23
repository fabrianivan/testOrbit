/**
 * success.js — Success / Order Complete Page Component
 *
 * Displays order confirmation with animated checkmark,
 * confetti, order summary, and action buttons.
 */

const SuccessPage = (() => {
  let _container = null;

  function init(container) {
    _container = container;
  }

  function render() {
    const state = Store.getState();
    const order = state.order;

    if (!order) {
      _container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__illustration">📋</div>
          <h2 class="empty-state__title">Tidak Ada Pesanan</h2>
          <p class="empty-state__text">Anda belum membuat pesanan. Silakan mulai belanja terlebih dahulu.</p>
          <button class="btn btn--primary btn--lg" id="btn-go-home-empty">← Kembali ke Beranda</button>
        </div>
      `;
      document.getElementById('btn-go-home-empty')?.addEventListener('click', goHome);
      return;
    }

    const paymentLabel = {
      'credit-card': 'Kartu Kredit / Debit',
      'virtual-account': 'Virtual Account',
      'e-wallet': 'E-Wallet',
    }[order.paymentMethod] || order.paymentMethod;

    _container.innerHTML = `
      <div class="confetti-bg" id="confetti-bg" aria-hidden="true"></div>

      <div class="success-page">
        <!-- Animated Check -->
        <div class="success-animation" aria-hidden="true">
          <div class="success-circle">
            <span class="success-check">✓</span>
          </div>
          <div class="success-particles">
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
            <div class="particle"></div>
          </div>
        </div>

        <h1 class="success-title">Terima Kasih! 🎉</h1>
        <p class="success-subtitle">
          Pesanan Anda berhasil dibuat. Kami akan segera memproses dan mengirimkan pesanan Anda.
        </p>

        <!-- Order Summary Card -->
        <div class="order-summary-card">
          <div class="order-summary-card__header">
            <h2 class="order-summary-card__title">Ringkasan Pesanan</h2>
            <span class="badge badge--success">Berhasil</span>
          </div>

          <div class="order-detail-row">
            <span class="order-detail-row__label">Nomor Order</span>
            <span class="order-detail-row__value" style="font-family: var(--font-mono); letter-spacing: 0.05em;">${order.id}</span>
          </div>

          <div class="order-detail-row">
            <span class="order-detail-row__label">Tanggal Pemesanan</span>
            <span class="order-detail-row__value">${order.createdAt}</span>
          </div>

          <div class="order-detail-row">
            <span class="order-detail-row__label">Metode Pembayaran</span>
            <span class="order-detail-row__value">${paymentLabel}</span>
          </div>

          <div class="order-detail-row">
            <span class="order-detail-row__label">Penerima</span>
            <span class="order-detail-row__value">${Utils.escapeHtml(order.shipping.name)}</span>
          </div>

          <div class="order-detail-row">
            <span class="order-detail-row__label">Estimasi Waktu Tiba</span>
            <span class="order-detail-row__value">
              <span class="badge badge--accent">📦 ${order.estimatedArrival}</span>
            </span>
          </div>

          <div class="order-detail-row">
            <span class="order-detail-row__label">Total Pembayaran</span>
            <span class="order-detail-row__value highlight">${Utils.formatCurrency(order.total)}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="success-actions">
          <button class="btn btn--primary btn--lg" id="btn-view-order">
            📋 Lihat Detail Pesanan
          </button>
          <button class="btn btn--secondary btn--lg" id="btn-go-home">
            🏠 Kembali ke Beranda
          </button>
        </div>
      </div>
    `;

    // Spawn confetti
    const confettiContainer = document.getElementById('confetti-bg');
    if (confettiContainer) {
      Utils.spawnConfetti(confettiContainer, 50);
    }

    bindSuccessEvents();
  }

  function bindSuccessEvents() {
    document.getElementById('btn-view-order')?.addEventListener('click', () => {
      Utils.showToast(`Detail pesanan ${Store.getState().order?.id || ''} ditampilkan.`, 'success');
    });

    document.getElementById('btn-go-home')?.addEventListener('click', goHome);
  }

  function goHome() {
    // Reset state and go back to cart with sample items
    const state = Store.getState();
    state.cart = [
      { product: Store.PRODUCTS[0], quantity: 1 },
      { product: Store.PRODUCTS[1], quantity: 2 },
      { product: Store.PRODUCTS[2], quantity: 1 },
    ];
    state.order = null;
    Store.setPage('cart');
  }

  return { init, render };
})();
