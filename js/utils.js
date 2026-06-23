/**
 * utils.js — Shared utility functions
 */

const Utils = (() => {
  /**
   * Format number to Indonesian Rupiah
   */
  function formatCurrency(amount) {
    return 'Rp' + amount.toLocaleString('id-ID');
  }

  /**
   * Show a toast notification
   */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '⚠'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  /**
   * Simple form validation
   */
  function validateField(inputEl, rules = {}) {
    const value = inputEl.value.trim();
    const errorEl = inputEl.parentElement.querySelector('.form-error');
    let errorMsg = '';

    if (rules.required && !value) {
      errorMsg = rules.requiredMsg || 'Field ini wajib diisi.';
    } else if (rules.minLength && value.length < rules.minLength) {
      errorMsg = `Minimal ${rules.minLength} karakter.`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      errorMsg = rules.patternMsg || 'Format tidak valid.';
    }

    if (errorMsg) {
      inputEl.classList.add('error');
      if (errorEl) {
        errorEl.textContent = errorMsg;
        errorEl.classList.add('visible');
      }
      return false;
    }

    inputEl.classList.remove('error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    return true;
  }

  /**
   * Clear all form errors in a container
   */
  function clearFormErrors(container) {
    container.querySelectorAll('.form-input.error, .form-select.error').forEach((el) => {
      el.classList.remove('error');
    });
    container.querySelectorAll('.form-error').forEach((el) => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Generate confetti pieces
   */
  function spawnConfetti(container, count = 40) {
    const colors = ['#7c5cfc', '#b86cff', '#22c997', '#f5a623', '#f06cac', '#5ce6d0', '#ff6b8a'];
    const shapes = ['circle', 'square'];

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = 6 + Math.random() * 8;
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 2 + Math.random() * 2;

      piece.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${shape === 'circle' ? '50%' : '2px'};
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      `;
      container.appendChild(piece);
    }

    // Clean up after animations
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  return {
    formatCurrency,
    showToast,
    validateField,
    clearFormErrors,
    escapeHtml,
    spawnConfetti,
  };
})();
