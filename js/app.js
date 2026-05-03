/* ============================================================
   RecycleRight — App Bootstrap
   Tab routing, index rendering, global init
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ====================================================
     DARK MODE
     ==================================================== */
  const dmToggle = document.getElementById('dark-mode-toggle');
  const dmIcon   = document.getElementById('dark-mode-icon');
  const DM_KEY   = 'rr_dark_mode';

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (dmIcon) dmIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
  }

  applyTheme(localStorage.getItem(DM_KEY) === 'true');

  dmToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    localStorage.setItem(DM_KEY, String(!isDark));
    applyTheme(!isDark);
  });

  /* ====================================================
     TAB ROUTING
     ==================================================== */
  const navBtns    = document.querySelectorAll('.nav-btn');
  const tabContent = document.querySelectorAll('.tab-content');
  let indexBuilt   = false;

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      navBtns.forEach(b => b.classList.remove('active'));
      tabContent.forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');

      // Lazy-build index on first visit
      if (target === 'index' && !indexBuilt) {
        buildIndex();
        indexBuilt = true;
      }
      // Reload profile tab on every visit so it reflects latest auth state
      if (target === 'profile') {
        ProfileModule.reload();
      }
      // Render shop on every visit (points may have changed)
      if (target === 'shop') {
        ShopModule.render();
        // Mark shop as seen today → hide the "new" dot
        localStorage.setItem('rr_shop_seen', new Date().toISOString().slice(0, 10));
        _updateShopDot();
      }
    });
  });

  /* ====================================================
     AUTH + LOCATION INIT (before quiz so cloud data lands first)
     ==================================================== */
  AuthModule.init();
  LocationModule.init();
  _initOnboarding();
  _initPullToRefresh();

  /* ====================================================
     SCANNER INIT
     ==================================================== */
  Scanner.init();

  /* ====================================================
     QUIZ INIT
     ==================================================== */
  Quiz.init();

  /* ====================================================
     SHOP + PROFILE INIT
     ==================================================== */
  ShopModule.init();
  ProfileModule.init();

  /* ====================================================
     INDEX
     ==================================================== */
  let currentCategory = 'all';
  let searchTerm      = '';
  const KEY_BOOKMARKS = 'rr_bookmarks';

  function getBookmarks()    { return JSON.parse(localStorage.getItem(KEY_BOOKMARKS) || '[]'); }
  function isBookmarked(id)  { return getBookmarks().includes(id); }
  function toggleBookmark(id) {
    let bms = getBookmarks();
    if (bms.includes(id)) bms = bms.filter(b => b !== id);
    else bms.push(id);
    localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(bms));
    renderItems(); // re-render so star icons update
  }

  function buildIndex() {
    buildCategoryFilters();
    renderItems();
    bindIndexEvents();
  }

  function buildCategoryFilters() {
    const container = document.getElementById('category-filters');
    const bms   = getBookmarks();
    const allBtn = `<button class="filter-chip active" data-category="all" onclick="App.setCategory('all')">All <span style="opacity:.6">(${RECYCLING_ITEMS.length})</span></button>`;
    const bmBtn  = `<button class="filter-chip" data-category="bookmarks" onclick="App.setCategory('bookmarks')">
      <i class="fas fa-star" style="font-size:.8rem;color:var(--amber-500)"></i> Saved <span style="opacity:.6">(${bms.length})</span>
    </button>`;
    const catBtns = CATEGORIES.map(cat => {
      const count = RECYCLING_ITEMS.filter(item => item.category === cat.id).length;
      return `<button class="filter-chip" data-category="${cat.id}" onclick="App.setCategory('${cat.id}')">
        <i class="fas ${cat.icon}" style="font-size:.8rem"></i> ${cat.label} <span style="opacity:.6">(${count})</span>
      </button>`;
    }).join('');
    container.innerHTML = allBtn + bmBtn + catBtns;
  }

  function renderItems() {
    const grid    = document.getElementById('items-grid');
    const noRes   = document.getElementById('no-results');
    const summary = document.getElementById('index-summary');
    const bms     = getBookmarks();

    let filtered = RECYCLING_ITEMS;
    if (currentCategory === 'bookmarks') {
      filtered = filtered.filter(i => bms.includes(i.id));
    } else if (currentCategory !== 'all') {
      filtered = filtered.filter(i => i.category === currentCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(term) ||
        i.tip.toLowerCase().includes(term)  ||
        i.category.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = currentCategory === 'bookmarks'
        ? `<div class="bookmarks-empty"><i class="fas fa-star fa-2x" style="color:var(--amber-300)"></i><p>No bookmarks yet — click the ⭐ on any item to save it!</p></div>`
        : '';
      noRes.classList.toggle('hidden', currentCategory === 'bookmarks');
      summary.textContent = '';
    } else {
      noRes.classList.add('hidden');
      summary.textContent = `Showing ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
      grid.innerHTML = filtered.map(item => buildItemCard(item, bms)).join('');
    }
  }

  function buildItemCard(item, bms) {
    bms = bms || getBookmarks();
    const statusConfig = {
      yes:     { label: 'Recyclable',      icon: 'fa-check-circle',    cls: 'yes'     },
      check:   { label: 'Check Locally',   icon: 'fa-circle-question', cls: 'check'   },
      no:      { label: 'Not Recyclable',  icon: 'fa-circle-xmark',    cls: 'no'      },
      special: { label: 'Special Drop-Off',icon: 'fa-location-dot',    cls: 'special' },
    };
    const sc       = statusConfig[item.status] || statusConfig.no;
    const cat      = CATEGORIES.find(c => c.id === item.category);
    const saved    = bms.includes(item.id);

    return `
      <div class="item-card">
        <button class="bookmark-btn${saved ? ' bookmarked' : ''}"
          onclick="App.toggleBookmark(${item.id})" title="${saved ? 'Remove bookmark' : 'Bookmark this item'}">
          <i class="fas fa-star"></i>
        </button>
        <div class="item-card-top">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <span class="item-cat-badge">${cat ? cat.label : item.category}</span>
        </div>
        <span class="status-badge ${sc.cls}">
          <i class="fas ${sc.icon}"></i> ${sc.label}
        </span>
        <div class="item-tip">${escapeHtml(item.tip)}</div>
      </div>`;
  }

  function setCategory(catId) {
    currentCategory = catId;
    // Rebuild filters so the bookmarks count updates
    buildCategoryFilters();
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.category === catId);
    });
    renderItems();
  }

  function bindIndexEvents() {
    const searchInput = document.getElementById('index-search');
    const clearBtn    = document.getElementById('clear-search');

    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim();
      clearBtn.style.display = searchTerm ? 'flex' : 'none';
      renderItems();
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchTerm = '';
      clearBtn.style.display = 'none';
      renderItems();
    });
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ====================================================
     SHOP "NEW" DOT
     ==================================================== */
  function _updateShopDot() {
    const dot   = document.getElementById('shop-new-dot');
    if (!dot) return;
    const today = new Date().toISOString().slice(0, 10);
    const seen  = localStorage.getItem('rr_shop_seen');
    dot.style.display = (seen !== today) ? 'block' : 'none';
  }
  _updateShopDot(); // run on page load

  /* ====================================================
     KEYBOARD TAB SHORTCUTS  (S / I / Q / B / P)
     ==================================================== */
  document.addEventListener('keydown', e => {
    // Skip if the user is typing in a text field
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    // Skip modified keys (Ctrl+S for save, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const tabMap = { s: 'scanner', i: 'index', q: 'quiz', b: 'shop', p: 'profile' };
    const target = tabMap[e.key.toLowerCase()];
    if (target) {
      const btn = document.querySelector(`.nav-btn[data-tab="${target}"]`);
      if (btn) { e.preventDefault(); btn.click(); }
    }
  });

  /* ====================================================
     BACK TO TOP BUTTON
     ==================================================== */
  const bttBtn = document.getElementById('back-to-top');
  if (bttBtn) {
    window.addEventListener('scroll', () => {
      bttBtn.classList.toggle('btt-visible', window.scrollY > 400);
    }, { passive: true });
    bttBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ====================================================
     ITEM OF THE DAY  (Scanner tab)
     ==================================================== */
  function renderItemOfDay() {
    const slot = document.getElementById('item-of-day');
    if (!slot || typeof RECYCLING_ITEMS === 'undefined' || RECYCLING_ITEMS.length === 0) return;

    // Deterministic daily pick — LCG seeded by today's date
    const dateNum = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10);
    let s = (dateNum % 2147483647) || 1;
    s = (s * 16807) % 2147483647;
    const idx  = s % RECYCLING_ITEMS.length;
    const item = RECYCLING_ITEMS[idx];

    const statusLabels = {
      yes:     { text: 'Recyclable',       cls: 'yes',     icon: 'fa-check-circle'    },
      no:      { text: 'Not Recyclable',   cls: 'no',      icon: 'fa-circle-xmark'    },
      check:   { text: 'Check Locally',    cls: 'check',   icon: 'fa-circle-question' },
      special: { text: 'Special Drop-Off', cls: 'special', icon: 'fa-location-dot'    },
    };
    const sc = statusLabels[item.status] || statusLabels.no;

    slot.innerHTML = `
      <div class="iotd-card">
        <div class="iotd-header">
          <i class="fas fa-star iotd-star"></i>
          <span class="iotd-label">Item of the Day</span>
        </div>
        <div class="iotd-name">${escapeHtml(item.name)}</div>
        <span class="status-badge ${sc.cls}" style="margin:6px 0 8px">
          <i class="fas ${sc.icon}"></i> ${sc.text}
        </span>
        <div class="iotd-tip">${escapeHtml(item.tip)}</div>
      </div>`;
  }

  renderItemOfDay();

  /* ====================================================
     ONBOARDING
     ==================================================== */
  function _initOnboarding() {
    if (localStorage.getItem('rr_onboarded')) return; // already seen

    const overlay  = document.getElementById('onboarding-overlay');
    const dotsEl   = document.getElementById('ob-dots');
    const steps    = overlay?.querySelectorAll('.ob-step');
    const nextBtn  = document.getElementById('ob-next');
    const skipBtn  = document.getElementById('ob-skip');
    if (!overlay || !steps?.length) return;

    let current = 0;

    function goTo(idx) {
      steps.forEach((s, i) => s.classList.toggle('ob-step-active', i === idx));
      dotsEl.querySelectorAll('.ob-dot').forEach((d, i) => d.classList.toggle('ob-dot-active', i === idx));
      const isLast = idx === steps.length - 1;
      nextBtn.innerHTML = isLast
        ? '<i class="fas fa-check"></i> Get Started'
        : 'Next <i class="fas fa-arrow-right"></i>';
      skipBtn.style.display = isLast ? 'none' : '';
      current = idx;
      navigator.vibrate?.(15);
    }

    function finish() {
      overlay.classList.add('ob-fade-out');
      setTimeout(() => { overlay.style.display = 'none'; }, 300);
      localStorage.setItem('rr_onboarded', '1');
    }

    nextBtn.addEventListener('click', () => {
      if (current < steps.length - 1) goTo(current + 1);
      else finish();
    });
    skipBtn.addEventListener('click', finish);

    // Show after a brief delay so the app paints first
    setTimeout(() => {
      overlay.style.display = 'flex';
      overlay.classList.add('ob-fade-in');
    }, 600);
  }

  /* ====================================================
     PULL TO REFRESH
     ==================================================== */
  function _initPullToRefresh() {
    _attachPTR('tab-profile', () => {
      ProfileModule.reload();
      Toast?.show?.('🔄 Profile refreshed', 'info', 1500);
    });
    _attachPTR('tab-quiz', () => {
      Quiz.reload?.();
      Toast?.show?.('🔄 Refreshed', 'info', 1500);
    });
  }

  function _attachPTR(tabId, onRefresh) {
    const el = document.getElementById(tabId);
    if (!el) return;

    let startY    = 0;
    let startX    = 0;
    let pulling   = false;
    let triggered = false;

    // Create indicator element
    const ind = document.createElement('div');
    ind.className = 'ptr-indicator';
    ind.innerHTML = '<i class="fas fa-arrow-rotate-right ptr-spin"></i>';
    el.prepend(ind);

    el.addEventListener('touchstart', e => {
      startY    = e.touches[0].clientY;
      startX    = e.touches[0].clientX;
      pulling   = el.scrollTop <= 0;
      triggered = false;
    }, { passive: true });

    el.addEventListener('touchmove', e => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      const dx = Math.abs(e.touches[0].clientX - startX);
      // Only react to downward, mostly-vertical drags
      if (dy <= 0 || dx > dy * 0.8) { pulling = false; return; }

      const progress = Math.min(dy / 80, 1);
      ind.style.opacity    = String(progress);
      ind.style.transform  = `translateY(${Math.min(dy * 0.45, 36)}px) rotate(${dy * 1.8}deg)`;
      ind.classList.toggle('ptr-ready', dy > 72);
    }, { passive: true });

    el.addEventListener('touchend', e => {
      if (!pulling) return;
      const dy = e.changedTouches[0].clientY - startY;
      ind.style.opacity   = '0';
      ind.style.transform = '';
      ind.classList.remove('ptr-ready');

      if (dy > 72 && !triggered) {
        triggered = true;
        ind.classList.add('ptr-spinning');
        navigator.vibrate?.(20);
        setTimeout(() => {
          onRefresh();
          ind.classList.remove('ptr-spinning');
        }, 600);
      }
      pulling = false;
    }, { passive: true });
  }

  /* ---- Expose needed globals ---- */
  window.App = { setCategory, toggleBookmark };
});
