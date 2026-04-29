/* ============================================================
   RecycleRight — Shop Module
   Spend points on avatars and titles.
   Permanent items always available; daily items rotate each day.
   ============================================================ */

const ShopModule = (function () {

  const KEY_PROFILES = 'rr_profiles';
  const KEY_CURRENT  = 'rr_current';

  /* ====================================================
     UNLOCK HELPERS (used by profile.js avatar/title pickers too)
     ==================================================== */
  function _isAdmin() { return window.AuthModule?.isAdmin === true; }

  function isAvatarUnlocked(idx, profile) {
    if (_isAdmin()) return true;
    if (!AVATAR_UNLOCKS?.[idx]) return true; // indices 0-2 are always free
    return (profile?.purchasedItems || []).some(id => {
      const item = allShopItems().find(s => s.id === id);
      return item?.type === 'avatar' && item.idx === idx;
    });
  }

  function isTitleUnlocked(titleId, profile) {
    if (_isAdmin()) return true;
    if (titleId === 'newcomer') return true; // always free
    return (profile?.purchasedItems || []).some(id => {
      const item = allShopItems().find(s => s.id === id);
      return item?.type === 'title' && item.titleId === titleId;
    });
  }

  function allShopItems() {
    return [...(SHOP_PERMANENT || []), ...(SHOP_ROTATING || [])];
  }

  /* ====================================================
     DAILY ROTATION (global seed from Firestore, falls back to date)
     ==================================================== */
  function getDailyItems(overrideSeed = null) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let seed    = overrideSeed || (parseInt(today) % 2147483647 || 1);
    const rng   = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    const pool  = [...(SHOP_ROTATING || [])];
    const picks = [];
    while (picks.length < 8 && pool.length > 0) {
      const i = Math.floor(rng() * pool.length);
      picks.push(pool.splice(i, 1)[0]);
    }
    return picks;
  }

  async function shuffleDailyShop() {
    if (!_isAdmin()) return;
    const newSeed = Math.floor(Math.random() * 2147483646) + 1;
    await window.AuthModule?.setGlobalShopSeed?.(newSeed);
    render();
    window.Toast?.show?.('🔄 Daily shop shuffled for all users!', 'success', 2500);
  }

  async function resetDailyShopSeed() {
    if (!_isAdmin()) return;
    await window.AuthModule?.clearGlobalShopSeed?.();
    render();
    window.Toast?.show?.("↩️ Daily shop reset to today's date rotation", 'info', 2500);
  }

  function _renderAdminPanel() {
    return `
      <div class="shop-section admin-panel">
        <div class="shop-section-hdr">
          <div>
            <h3><i class="fas fa-crown"></i> Admin Panel</h3>
            <p>All items unlocked · Infinite power-ups · Shop controls</p>
          </div>
          <div class="admin-crown-badge">👑 Admin</div>
        </div>
        <div class="admin-actions">
          <button class="btn btn-sm admin-action-btn" onclick="ShopModule.shuffleDailyShop()">
            <i class="fas fa-shuffle"></i> Shuffle Daily Items
          </button>
          <button class="btn btn-sm admin-action-btn" onclick="ShopModule.resetDailyShopSeed()">
            <i class="fas fa-rotate-left"></i> Reset to Today's Rotation
          </button>
        </div>
      </div>`;
  }

  function timeUntilReset() {
    const now  = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms   = next - now;
    const h    = Math.floor(ms / 3600000);
    const m    = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  /* ====================================================
     INIT / RENDER
     ==================================================== */
  function init() { /* populated on tab click */ }

  async function render() {
    const container = document.getElementById('shop-content');
    if (!container) return;

    const username = localStorage.getItem(KEY_CURRENT);
    const profiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
    const profile  = profiles.find(p => p.username === username) || null;

    if (!profile) {
      container.innerHTML = `
        <div class="shop-no-profile">
          <div class="shop-no-profile-icon"><i class="fas fa-store"></i></div>
          <h2>Join the Game First</h2>
          <p>Head to the <strong>Quiz</strong> tab to create a profile, earn points, then come back to spend them!</p>
        </div>`;
      return;
    }

    // Fetch global seed from Firestore (falls back to date seed if unavailable)
    const globalSeed = await window.AuthModule?.getGlobalShopSeed?.() || null;
    const daily = getDailyItems(globalSeed);

    container.innerHTML = `
      <div class="shop-page">

        <div class="shop-balance-bar">
          <i class="fas fa-star shop-balance-icon"></i>
          <span class="shop-balance-val">${(profile.points || 0).toLocaleString()}</span>
          <span class="shop-balance-lbl">points available</span>
        </div>

        ${_isAdmin() ? _renderAdminPanel() : ''}
        ${_renderSpinSection(profile)}

        <div class="shop-section">
          <div class="shop-section-hdr">
            <div>
              <h3><i class="fas fa-store"></i> Permanent Items</h3>
              <p>Always in stock — never rotate out</p>
            </div>
          </div>
          <div class="shop-grid">
            ${SHOP_PERMANENT.map(item => renderItem(item, profile)).join('')}
          </div>
        </div>

        <div class="shop-section">
          <div class="shop-section-hdr">
            <div>
              <h3><i class="fas fa-calendar-day"></i> Daily Items</h3>
              <p>New selection in <strong class="shop-timer">${timeUntilReset()}</strong></p>
            </div>
          </div>
          <div class="shop-grid">
            ${daily.map(item => renderItem(item, profile)).join('')}

          </div>
        </div>

      </div>`;
  }

  /* ====================================================
     DAILY SPIN
     ==================================================== */
  function _renderSpinSection(profile) {
    if (typeof SPIN_PRIZES === 'undefined') return '';
    const todayStr  = new Date().toISOString().slice(0, 10);
    const spunToday = profile.lastSpinDate === todayStr;
    const totalW    = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);

    const oddsRows = SPIN_PRIZES.map(p => {
      const pct = Math.round((p.weight / totalW) * 100);
      return `<div class="spin-odds-row">
        <span class="spin-odds-label" style="color:${p.color}">${p.label}</span>
        <span class="spin-odds-pct">${pct}%</span>
      </div>`;
    }).join('');

    const drumLabel = spunToday
      ? (SPIN_PRIZES.find(p => p.pts === profile.lastSpinResult)?.label || '—')
      : '?';
    const drumColor = spunToday
      ? (SPIN_PRIZES.find(p => p.pts === profile.lastSpinResult)?.color || 'var(--gray-400)')
      : 'var(--gray-400)';

    return `
      <div class="shop-section spin-section">
        <div class="shop-section-hdr">
          <div>
            <h3><i class="fas fa-star"></i> Daily Spin</h3>
            <p>One free spin per day — up to <strong>1000 pts!</strong></p>
          </div>
          ${spunToday ? '' : '<div class="spin-available-badge"><i class="fas fa-gift"></i> Ready!</div>'}
        </div>
        <div class="spin-drum-wrap">
          <div class="spin-drum-val" id="spin-drum-val" style="color:${drumColor}">${drumLabel}</div>
        </div>
        <button class="spin-btn" id="spin-btn" onclick="ShopModule.doSpin()"
          ${spunToday ? 'disabled' : ''}>
          ${spunToday
            ? `<i class="fas fa-check"></i> Spun Today — come back tomorrow!`
            : `<i class="fas fa-star"></i> Spin for Points!`}
        </button>
        <details class="spin-odds-details">
          <summary>Prize odds</summary>
          <div class="spin-odds-grid">${oddsRows}</div>
        </details>
      </div>`;
  }

  function doSpin() {
    const username = localStorage.getItem(KEY_CURRENT);
    if (!username) return;
    const profiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
    const idx      = profiles.findIndex(p => p.username === username);
    if (idx === -1) return;

    const profile  = profiles[idx];
    const todayStr = new Date().toISOString().slice(0, 10);
    if (profile.lastSpinDate === todayStr) return;
    if (typeof spinPrize !== 'function' || typeof SPIN_PRIZES === 'undefined') return;

    const drumEl  = document.getElementById('spin-drum-val');
    const spinBtn = document.getElementById('spin-btn');
    if (!drumEl || !spinBtn) return;

    spinBtn.disabled = true;
    spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Spinning…';
    drumEl.classList.remove('spin-drum-pop');

    const prize = spinPrize();

    // Slot-machine animation — rapid cycling then reveal
    let tick = 0;
    const TOTAL_TICKS = 22;

    function nextTick() {
      tick++;
      const fake = SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)];
      drumEl.textContent  = fake.label;
      drumEl.style.color  = fake.color;

      // Tick sound — every tick when slow, every other when fast
      if (tick < 12 ? tick % 2 === 0 : true) window.Sounds?.tick?.();

      if (tick < TOTAL_TICKS) {
        // Start fast, slow down toward the end
        const delay = tick < 12 ? 80 : tick < 18 ? 140 : 240;
        setTimeout(nextTick, delay);
      } else {
        // Land on the real prize
        drumEl.textContent = prize.label;
        drumEl.style.color = prize.color;

        // Win sound — fanfare for big prize, chime for normal
        if (prize.pts >= 500) window.Sounds?.perfect?.();
        else window.Sounds?.correct?.();
        void drumEl.offsetWidth; // reflow to restart animation
        drumEl.classList.add('spin-drum-pop');

        // Credit points
        profile.lastSpinDate   = todayStr;
        profile.lastSpinResult = prize.pts;
        profile.points         = (profile.points || 0) + prize.pts;
        profile.totalPoints    = (profile.totalPoints || 0) + prize.pts;

        // Lucky spin badge (≥500 pts)
        if (prize.pts >= 500) {
          if (!profile.badges) profile.badges = [];
          if (!profile.badges.includes('lucky_spin')) {
            profile.badges.push('lucky_spin');
            window.Toast?.show?.('🏆 New badge: Lucky Spin!', 'badge', 4500);
          }
        }

        profiles[idx] = profile;
        localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
        window.AuthModule?.syncProfileFlat?.(profile);

        const toastType = prize.pts >= 500 ? 'spin' : 'success';
        window.Toast?.show?.(`🎉 You won ${prize.label}! +${prize.pts} points`, toastType, 4000);

        spinBtn.innerHTML = '<i class="fas fa-check"></i> Spun Today — come back tomorrow!';

        // Update balance bar without full re-render
        const balEl = document.querySelector('.shop-balance-val');
        if (balEl) balEl.textContent = profile.points.toLocaleString();
      }
    }

    setTimeout(nextTick, 80);
  }

  function isFrameUnlocked(frameId, profile) {
    if (_isAdmin()) return true;
    if (frameId === 'frame_none') return true;
    return (profile?.purchasedItems || []).some(id => {
      const item = allShopItems().find(s => s.id === id);
      return item?.type === 'frame' && item.frameId === frameId;
    });
  }

  function renderItem(item, profile) {
    if (item.type === 'powerup') return renderPowerupItem(item, profile);
    if (item.type === 'frame')   return renderFrameItem(item, profile);

    const owned  = isItemOwned(item, profile);
    const afford = (profile.points || 0) >= item.cost;
    const preview = item.type === 'avatar'
      ? `<div class="shop-item-emoji">${AVATARS[item.idx]}</div>`
      : `<div class="shop-item-title-preview">${item.name}</div>`;
    const typeLabel = item.type === 'avatar' ? '🎭 Avatar' : '🏷️ Title';

    return `
      <div class="shop-item${owned ? ' owned' : ''}${!owned && !afford ? ' cant-afford' : ''}">
        ${preview}
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-type">${typeLabel}</div>
        ${owned
          ? `<div class="shop-item-badge owned-badge"><i class="fas fa-check-circle"></i> Owned</div>`
          : `<button class="btn btn-sm shop-buy-btn${afford ? '' : ' cant-afford'}"
               onclick="ShopModule.purchase('${item.id}')"
               ${afford ? '' : 'disabled'}>
               <i class="fas fa-star"></i> ${item.cost.toLocaleString()} pts
             </button>`}
        ${!owned && !afford ? `<div class="shop-item-badge need-badge">Need ${(item.cost-(profile.points||0)).toLocaleString()} more</div>` : ''}
      </div>`;
  }

  function renderFrameItem(item, profile) {
    const owned  = isItemOwned(item, profile);
    const afford = _isAdmin() || (profile.points || 0) >= item.cost;
    const frame  = FRAMES?.find(f => f.id === item.frameId) || {};
    const avatarCss = frame.css ? `avatar-frame-wrap ${frame.css}` : '';
    const preview = `
      <div style="display:flex;justify-content:center;padding:6px 0">
        <div class="${avatarCss}" style="font-size:1.8rem;${avatarCss ? 'width:42px;height:42px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center' : ''}">♻️</div>
      </div>`;
    return `
      <div class="shop-item${owned ? ' owned' : ''}${!owned && !afford ? ' cant-afford' : ''}">
        ${preview}
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-type">🖼️ Frame</div>
        ${owned
          ? `<div class="shop-item-badge owned-badge"><i class="fas fa-check-circle"></i> Owned</div>`
          : `<button class="btn btn-sm shop-buy-btn${afford ? '' : ' cant-afford'}"
               onclick="ShopModule.purchase('${item.id}')"
               ${afford ? '' : 'disabled'}>
               <i class="fas fa-star"></i> ${item.cost.toLocaleString()} pts
             </button>`}
        ${!owned && !afford ? `<div class="shop-item-badge need-badge">Need ${(item.cost-(profile.points||0)).toLocaleString()} more</div>` : ''}
      </div>`;
  }

  function renderPowerupItem(item, profile) {
    const pu     = POWERUPS.find(p => p.id === item.puId) || {};
    const afford = _isAdmin() || (profile.points || 0) >= item.cost;
    const owned  = _isAdmin() ? '∞' : (profile.powerups?.[item.puId] || 0);

    return `
      <div class="shop-item powerup-shop-item">
        <div class="shop-item-emoji">${pu.icon || '⚡'}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-type">⚡ Power-up</div>
        <div class="shop-pu-desc">${pu.desc || ''}</div>
        ${owned ? `<div class="shop-item-badge pu-owned-badge">Owned: ${owned}</div>` : ''}
        ${_isAdmin()
          ? `<div class="shop-item-badge owned-badge"><i class="fas fa-crown"></i> Admin</div>`
          : `<button class="btn btn-sm shop-buy-btn${afford ? '' : ' cant-afford'}"
               onclick="ShopModule.purchase('${item.id}')"
               ${afford ? '' : 'disabled'}>
               <i class="fas fa-star"></i> ${item.cost.toLocaleString()} pts
             </button>
             ${!afford ? `<div class="shop-item-badge need-badge">Need ${(item.cost-(profile.points||0)).toLocaleString()} more</div>` : ''}`}
      </div>`;
  }

  /* ====================================================
     PURCHASE
     ==================================================== */
  function purchase(itemId) {
    const username = localStorage.getItem(KEY_CURRENT);
    if (!username) { alert('Create a profile first to buy items!'); return; }

    const profiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
    const idx      = profiles.findIndex(p => p.username === username);
    if (idx === -1) return;

    const item = allShopItems().find(i => i.id === itemId);
    if (!item) return;

    const profile = profiles[idx];

    if (item.type !== 'powerup' && isItemOwned(item, profile)) { alert('You already own this!'); return; }
    if ((profile.points || 0) < item.cost) {
      alert(`Not enough points! You need ${item.cost.toLocaleString()} pts.`); return;
    }

    profile.points -= item.cost;

    if (item.type === 'powerup') {
      if (!profile.powerups) profile.powerups = {};
      profile.powerups[item.puId] = (profile.powerups[item.puId] || 0) + 1;
    } else {
      if (!profile.purchasedItems) profile.purchasedItems = [];
      profile.purchasedItems.push(itemId);
    }

    // Award First Haul badge on any first purchase
    if (!profile.badges) profile.badges = [];
    if (!profile.badges.includes('first_purchase')) profile.badges.push('first_purchase');

    profiles[idx] = profile;
    localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
    window.AuthModule?.syncProfileFlat?.(profile);

    render();
    window.ProfileModule?.reload?.();
    window.QuizModule?.reload?.();
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function isItemOwned(item, profile) {
    if (_isAdmin()) return true;
    if ((profile?.purchasedItems || []).includes(item.id)) return true;
    if (item.type === 'avatar') return isAvatarUnlocked(item.idx, profile);
    if (item.type === 'title')  return isTitleUnlocked(item.titleId, profile);
    if (item.type === 'frame')  return isFrameUnlocked(item.frameId, profile);
    return false;
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  return { init, render, purchase, doSpin, shuffleDailyShop, resetDailyShopSeed, isAvatarUnlocked, isTitleUnlocked, isFrameUnlocked };
})();

window.ShopModule = ShopModule;
