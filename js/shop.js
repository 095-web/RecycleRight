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
  function isAvatarUnlocked(idx, profile) {
    if (!AVATAR_UNLOCKS?.[idx]) return true; // free
    if ((profile?.points || 0) >= AVATAR_UNLOCKS[idx]) return true;
    return (profile?.purchasedItems || []).some(id => {
      const item = allShopItems().find(s => s.id === id);
      return item?.type === 'avatar' && item.idx === idx;
    });
  }

  function isTitleUnlocked(titleId, profile) {
    const def = TITLES?.find(t => t.id === titleId);
    if (!def || (profile?.points || 0) >= def.pts) return true;
    return (profile?.purchasedItems || []).some(id => {
      const item = allShopItems().find(s => s.id === id);
      return item?.type === 'title' && item.titleId === titleId;
    });
  }

  function allShopItems() {
    return [...(SHOP_PERMANENT || []), ...(SHOP_ROTATING || [])];
  }

  /* ====================================================
     DAILY ROTATION (seeded by date — same for every user)
     ==================================================== */
  function getDailyItems() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let seed = parseInt(today) % 2147483647 || 1;
    const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    const pool = [...(window.SHOP_ROTATING || [])];
    const picks = [];
    while (picks.length < 4 && pool.length > 0) {
      const i = Math.floor(rng() * pool.length);
      picks.push(pool.splice(i, 1)[0]);
    }
    return picks;
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

  function render() {
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

    const daily = getDailyItems();

    container.innerHTML = `
      <div class="shop-page">

        <div class="shop-balance-bar">
          <i class="fas fa-star shop-balance-icon"></i>
          <span class="shop-balance-val">${(profile.points || 0).toLocaleString()}</span>
          <span class="shop-balance-lbl">points available</span>
        </div>

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

  function renderItem(item, profile) {
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
             </button>`
        }
        ${!owned && !afford ? `<div class="shop-item-badge need-badge">Need ${(item.cost - (profile.points||0)).toLocaleString()} more</div>` : ''}
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

    if (isItemOwned(item, profile)) { alert('You already own this!'); return; }
    if ((profile.points || 0) < item.cost) {
      alert(`Not enough points! You need ${item.cost.toLocaleString()} pts.`); return;
    }

    profile.points -= item.cost;
    if (!profile.purchasedItems) profile.purchasedItems = [];
    profile.purchasedItems.push(itemId);

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
    if ((profile?.purchasedItems || []).includes(item.id)) return true;
    if (item.type === 'avatar') return isAvatarUnlocked(item.idx, profile);
    if (item.type === 'title')  return isTitleUnlocked(item.titleId, profile);
    return false;
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  return { init, render, purchase, isAvatarUnlocked, isTitleUnlocked };
})();

window.ShopModule = ShopModule;
