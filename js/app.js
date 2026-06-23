/**
 * app.js — Application Entry Point / Router
 *
 * Initialises page components and handles page navigation
 * by subscribing to store's currentPage state.
 */

const App = (() => {
  const pages = {};

  function init() {
    // Cache page containers
    pages.cart = document.getElementById('page-cart');
    pages.checkout = document.getElementById('page-checkout');
    pages.success = document.getElementById('page-success');

    // Initialise page components
    CartPage.init(pages.cart);
    CheckoutPage.init(pages.checkout);
    SuccessPage.init(pages.success);

    // Subscribe to page changes
    Store.subscribe('currentPage', navigate);

    // Header cart badge
    Store.subscribe('cart', updateCartBadge);
    updateCartBadge();

    // Header logo → home
    document.getElementById('app-logo')?.addEventListener('click', () => {
      Store.setPage('cart');
    });

    // Header cart trigger → cart page
    document.getElementById('cart-trigger')?.addEventListener('click', () => {
      Store.setPage('cart');
    });

    // Navigate to initial page
    navigate(Store.getState().currentPage);
  }

  function navigate(pageName) {
    // Hide all pages
    Object.values(pages).forEach((el) => el.classList.remove('active'));

    // Show target page
    const target = pages[pageName];
    if (target) {
      target.classList.add('active');

      // Re-render page content
      if (pageName === 'cart') CartPage.init(target);
      else if (pageName === 'checkout') CheckoutPage.init(target);
      else if (pageName === 'success') SuccessPage.render();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const count = Store.getCartCount();
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('visible', count > 0);
    }
  }

  return { init };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
