/**
 * store.js — Central State Management (Observer pattern)
 *
 * A lightweight reactive store that holds all application state
 * and notifies subscribers on changes. Data flows:
 *   Cart Page → (items, promo) → Checkout → (shipping, payment) → Success
 *
 * The store uses a simple pub/sub pattern. Components subscribe to
 * specific state keys and are notified only when those keys change.
 */

const Store = (() => {
  // ---- Sample product catalog ----
  const PRODUCTS = [
    {
      id: 'prod-001',
      name: 'Wireless Noise-Cancelling Headphones',
      variant: 'Midnight Black',
      price: 1299000,
      image: '🎧',
    },
    {
      id: 'prod-002',
      name: 'Ultra-Slim Smartwatch Pro',
      variant: 'Silver / 44mm',
      price: 3499000,
      image: '⌚',
    },
    {
      id: 'prod-003',
      name: 'Premium Leather Crossbody Bag',
      variant: 'Cognac Brown',
      price: 899000,
      image: '👜',
    },
    {
      id: 'prod-004',
      name: 'Mechanical Gaming Keyboard',
      variant: 'Cherry MX Blue',
      price: 1549000,
      image: '⌨️',
    },
  ];

  // ---- Promo codes ----
  const PROMO_CODES = {
    HEMAT20: { type: 'percent', value: 20, label: 'Diskon 20%' },
    GRATIS50K: { type: 'fixed', value: 50000, label: 'Potongan Rp50.000' },
    NEWUSER: { type: 'percent', value: 15, label: 'Diskon 15% Member Baru' },
  };

  // ---- State ----
  let state = {
    currentPage: 'cart',      // 'cart' | 'checkout' | 'success'
    checkoutStep: 0,          // 0 = shipping, 1 = payment

    cart: [
      { product: PRODUCTS[0], quantity: 1 },
      { product: PRODUCTS[1], quantity: 2 },
      { product: PRODUCTS[2], quantity: 1 },
    ],

    promo: null,              // { code, type, value, label }

    shipping: {
      name: '',
      phone: '',
      address: '',
      courier: '',
    },

    paymentMethod: '',        // 'credit-card' | 'virtual-account' | 'e-wallet'

    order: null,              // filled on success
  };

  // ---- Subscribers ----
  const listeners = new Map();

  function subscribe(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key).delete(fn);
  }

  function notify(key) {
    if (listeners.has(key)) {
      listeners.get(key).forEach((fn) => fn(state[key]));
    }
    // Also notify wildcard listeners
    if (listeners.has('*')) {
      listeners.get('*').forEach((fn) => fn(state));
    }
  }

  // ---- Getters ----
  function getState() {
    return { ...state };
  }

  function getCartSubtotal() {
    return state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  function getDiscount() {
    if (!state.promo) return 0;
    const subtotal = getCartSubtotal();
    if (state.promo.type === 'percent') {
      return Math.round(subtotal * (state.promo.value / 100));
    }
    return Math.min(state.promo.value, subtotal);
  }

  function getServiceFee() {
    return state.cart.length > 0 ? 5000 : 0;
  }

  function getTax() {
    return Math.round(getCartSubtotal() * 0.11);
  }

  function getGrandTotal() {
    return getCartSubtotal() - getDiscount() + getServiceFee() + getTax();
  }

  function getCartCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ---- Cart Actions ----
  function addQuantity(productId) {
    const item = state.cart.find((i) => i.product.id === productId);
    if (item && item.quantity < 99) {
      item.quantity++;
      notify('cart');
    }
  }

  function subtractQuantity(productId) {
    const item = state.cart.find((i) => i.product.id === productId);
    if (item) {
      item.quantity--;
      if (item.quantity <= 0) removeFromCart(productId);
      else notify('cart');
    }
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((i) => i.product.id !== productId);
    notify('cart');
  }

  function clearCart() {
    state.cart = [];
    state.promo = null;
    notify('cart');
    notify('promo');
  }

  // ---- Promo Actions ----
  function applyPromo(code) {
    const upper = code.toUpperCase().trim();
    const promo = PROMO_CODES[upper];
    if (!promo) return { success: false, message: 'Kode promo tidak valid.' };
    state.promo = { code: upper, ...promo };
    notify('promo');
    notify('cart');
    return { success: true, message: `Promo "${promo.label}" berhasil diterapkan!` };
  }

  function removePromo() {
    state.promo = null;
    notify('promo');
    notify('cart');
  }

  // ---- Navigation ----
  function setPage(page) {
    state.currentPage = page;
    notify('currentPage');
  }

  function setCheckoutStep(step) {
    state.checkoutStep = step;
    notify('checkoutStep');
  }

  // ---- Shipping ----
  function setShipping(data) {
    state.shipping = { ...state.shipping, ...data };
    notify('shipping');
  }

  // ---- Payment ----
  function setPaymentMethod(method) {
    state.paymentMethod = method;
    notify('paymentMethod');
  }

  // ---- Order ----
  function createOrder() {
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const estimatedDays = state.shipping.courier === 'express' ? '1-2' : state.shipping.courier === 'reguler' ? '3-5' : '5-7';

    state.order = {
      id: orderId,
      items: [...state.cart],
      subtotal: getCartSubtotal(),
      discount: getDiscount(),
      serviceFee: getServiceFee(),
      tax: getTax(),
      total: getGrandTotal(),
      shipping: { ...state.shipping },
      paymentMethod: state.paymentMethod,
      promo: state.promo ? { ...state.promo } : null,
      estimatedArrival: `${estimatedDays} hari kerja`,
      createdAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    };

    notify('order');
    return state.order;
  }

  function resetCheckout() {
    state.checkoutStep = 0;
    state.shipping = { name: '', phone: '', address: '', courier: '' };
    state.paymentMethod = '';
    notify('checkoutStep');
    notify('shipping');
    notify('paymentMethod');
  }

  return {
    PRODUCTS,
    subscribe,
    getState,
    getCartSubtotal,
    getDiscount,
    getServiceFee,
    getTax,
    getGrandTotal,
    getCartCount,
    addQuantity,
    subtractQuantity,
    removeFromCart,
    clearCart,
    applyPromo,
    removePromo,
    setPage,
    setCheckoutStep,
    setShipping,
    setPaymentMethod,
    createOrder,
    resetCheckout,
  };
})();
