/* ============================================================
   RecycleRight — App Bootstrap
   Tab routing, index rendering, global init
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

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
     PROFILE INIT
     ==================================================== */
  ProfileModule.init();

  /* ====================================================
     INDEX
     ==================================================== */
  let currentCategory = 'all';
  let searchTerm      = '';

  function buildIndex() {
    buildCategoryFilters();
    renderItems();
    bindIndexEvents();
  }

  function buildCategoryFilters() {
    const container = document.getElementById('category-filters');
    const allBtn = `<button class="filter-chip active" data-category="all" onclick="App.setCategory('all')">All <span style="opacity:.6">(${RECYCLING_ITEMS.length})</span></button>`;
    const catBtns = CATEGORIES.map(cat => {
      const count = RECYCLING_ITEMS.filter(item => item.category === cat.id).length;
      return `<button class="filter-chip" data-category="${cat.id}" onclick="App.setCategory('${cat.id}')">
        <i class="fas ${cat.icon}" style="font-size:.8rem"></i> ${cat.label} <span style="opacity:.6">(${count})</span>
      </button>`;
    }).join('');
    container.innerHTML = allBtn + catBtns;
  }

  function renderItems() {
    const grid   = document.getElementById('items-grid');
    const noRes  = document.getElementById('no-results');
    const summary = document.getElementById('index-summary');

    let filtered = RECYCLING_ITEMS;
    if (currentCategory !== 'all') filtered = filtered.filter(i => i.category === currentCategory);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(term) ||
        i.tip.toLowerCase().includes(term)  ||
        i.category.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      noRes.classList.remove('hidden');
      summary.textContent = '';
    } else {
      noRes.classList.add('hidden');
      summary.textContent = `Showing ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
      grid.innerHTML = filtered.map(item => buildItemCard(item)).join('');
    }
  }

  function buildItemCard(item) {
    const statusConfig = {
      yes:     { label: 'Recyclable',      icon: 'fa-check-circle',    cls: 'yes'     },
      check:   { label: 'Check Locally',   icon: 'fa-circle-question', cls: 'check'   },
      no:      { label: 'Not Recyclable',  icon: 'fa-circle-xmark',    cls: 'no'      },
      special: { label: 'Special Drop-Off',icon: 'fa-location-dot',    cls: 'special' },
    };
    const sc  = statusConfig[item.status] || statusConfig.no;
    const cat = CATEGORIES.find(c => c.id === item.category);

    return `
      <div class="item-card">
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
  window.App = { setCategory };
});
