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
      }
    });
  });

  /* ====================================================
     AUTH + LOCATION INIT (before quiz so cloud data lands first)
     ==================================================== */
  AuthModule.init();
  LocationModule.init();

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

  /* ---- Expose needed globals ---- */
  window.App = { setCategory, toggleBookmark };
});
