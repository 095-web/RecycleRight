/* ============================================================
   RecycleRight — Toast Notifications
   Global Toast.show(message, type, duration)
   Types: success | error | info | badge | spin
   ============================================================ */

const Toast = (function () {

  const ICONS = {
    success : 'fa-circle-check',
    error   : 'fa-circle-xmark',
    info    : 'fa-circle-info',
    badge   : 'fa-trophy',
    spin    : 'fa-star',
  };

  function _getContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function show(message, type = 'info', duration = 3500) {
    const container = _getContainer();
    const icon = ICONS[type] || ICONS.info;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;

    // Click to dismiss early
    toast.addEventListener('click', () => _dismiss(toast));

    container.appendChild(toast);

    // Trigger show animation (next frame so CSS transition fires)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('toast-show'));
    });

    // Auto-dismiss
    const timer = setTimeout(() => _dismiss(toast), duration);
    toast._dismissTimer = timer;
  }

  function _dismiss(toast) {
    clearTimeout(toast._dismissTimer);
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback removal if animation doesn't fire
    setTimeout(() => toast.remove(), 500);
  }

  return { show };

})();

window.Toast = Toast;
