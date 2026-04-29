/* ============================================================
   RecycleRight — Scanner Module
   Handles barcode scanning via camera + Open Food Facts lookup
   ============================================================ */

const Scanner = (function () {
  let html5QrCode = null;
  let isScanning = false;

  /* ---- DOM refs ---- */
  const startBtn        = () => document.getElementById('start-scanner-btn');
  const stopBtn         = () => document.getElementById('stop-scanner-btn');
  const placeholder     = () => document.getElementById('scanner-placeholder');
  const resultEl        = () => document.getElementById('scan-result');
  const errorEl         = () => document.getElementById('scan-error');

  /* ---- Init ---- */
  function init() {
    document.getElementById('start-scanner-btn').addEventListener('click', startScanner);
    document.getElementById('stop-scanner-btn').addEventListener('click', stopScanner);
    document.getElementById('lookup-btn').addEventListener('click', () => {
      const val = document.getElementById('barcode-input').value.trim();
      if (val) lookupBarcode(val);
    });
    document.getElementById('barcode-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) lookupBarcode(val);
      }
    });

    // Populate drop-off finder with ZIP if available
    _initDropOffFinder();

    // Render existing scan history on load
    renderScanHistory();
  }

  function _initDropOffFinder() {
    const loc = JSON.parse(localStorage.getItem('rr_location') || 'null');
    const note     = document.getElementById('dropoff-zip-note');
    const earth911 = document.getElementById('earth911-link');
    if (loc?.zip) {
      if (earth911) earth911.href = `https://search.earth911.com/?utm_source=recycleright&where=${loc.zip}`;
      if (note)     note.textContent = `📍 Links pre-filled for ${loc.city ? loc.city + ', ' : ''}${loc.zip}. Results open in a new tab.`;
    } else {
      if (note) note.textContent = '📍 Enter your ZIP in the Recycling Index tab to get location-specific search links.';
    }
  }

  /* ---- Camera Scanner ---- */
  function startScanner() {
    if (isScanning) return;
    clearResults();
    placeholder().style.display = 'none';
    startBtn().style.display = 'none';
    stopBtn().style.display  = 'inline-flex';

    html5QrCode = new Html5Qrcode('scanner-reader');
    // Restrict to real product barcode formats only — prevents the scanner
    // from misreading the human-readable digits printed beside the barcode.
    const config = {
      fps: 10,
      qrbox: { width: 280, height: 100 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
    };

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      () => { /* scan error — ignore per-frame errors */ }
    ).then(() => {
      isScanning = true;
    }).catch(err => {
      console.warn('Camera error:', err);
      placeholder().style.display = 'flex';
      startBtn().style.display = 'inline-flex';
      stopBtn().style.display  = 'none';
      showError('Camera access denied or unavailable. Please use the manual entry below.');
    });
  }

  function stopScanner() {
    if (!isScanning || !html5QrCode) return;
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode  = null;
      isScanning   = false;
      placeholder().style.display = 'flex';
      startBtn().style.display = 'inline-flex';
      stopBtn().style.display  = 'none';
    }).catch(console.error);
  }

  function onScanSuccess(barcode) {
    if (!isScanning) return;
    stopScanner();
    document.getElementById('barcode-input').value = barcode;
    lookupBarcode(barcode);
  }

  /* ---- API Lookup (multi-source with fallbacks) ---- */
  async function lookupBarcode(barcode) {
    clearResults();
    showLoading();

    const cacheKey = 'rr_scan_' + barcode;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      clearResults();
      renderResult(JSON.parse(cached), 0);
      return;
    }

    try {
      let result = null;

      // 1. Open Food Facts — best international + EU coverage
      result = await _tryOFApi('food', barcode);

      // 2. EAN-13 ↔ UPC-A normalization:
      //    US barcodes are 12-digit UPC-A; OFT stores them as 13-digit EAN-13 with a leading 0.
      if (!result && barcode.length === 12) {
        result = await _tryOFApi('food', '0' + barcode);
      } else if (!result && barcode.length === 13 && barcode.startsWith('0')) {
        result = await _tryOFApi('food', barcode.slice(1));
      }

      // 3. Open Beauty Facts — cosmetics & personal care
      if (!result) result = await _tryOFApi('beauty', barcode);

      // 4. Open Pet Food Facts — pet products
      if (!result) result = await _tryOFApi('petfood', barcode);

      // 5. UPC Item DB — strong US product coverage; returns category for inference
      if (!result) result = await _tryUpcItemDb(barcode);

      if (!result) {
        clearResults();
        showError(`No product data found for barcode <strong>${barcode}</strong>.<br>This item may not be in any public database yet — try checking the label directly.`);
        return;
      }

      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      const pts = awardScanPoints(barcode);
      addToScanHistory(result);
      clearResults();
      renderResult(result, pts);
    } catch (err) {
      clearResults();
      if (err.message === 'Failed to fetch') {
        showError('Unable to connect. Check your internet connection and try again.');
      } else {
        showError('Something went wrong. Please try again.');
      }
    }
  }

  /* ---- Source helpers ---- */

  // Tries an Open*Facts database (food / beauty / petfood)
  async function _tryOFApi(db, barcode) {
    try {
      const host = db === 'beauty'  ? 'world.openbeautyfacts.org'
                 : db === 'petfood' ? 'world.openpetfoodfacts.org'
                 : 'world.openfoodfacts.org';
      const res = await fetch(`https://${host}/api/v0/product/${barcode}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status === 0 || !data.product) return null;
      return parseProduct(barcode, data.product);
    } catch { return null; }
  }

  // Tries UPC Item DB (US-focused; returns product name + category for inference)
  async function _tryUpcItemDb(barcode) {
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.items?.length) return null;
      const item = data.items[0];
      const catStr = [item.category || '', item.description || ''].join(' ');
      const materials = _inferFromCategory(catStr);
      const { verdict, tips } = determineVerdict(materials);
      return {
        barcode,
        name:      item.title || 'Unknown Product',
        brand:     item.brand || '',
        materials,
        verdict:   materials.length ? verdict : 'unknown',
        tips:      materials.length ? tips : ['Check the product label for recycling symbols.', 'Verify with your local recycling guidelines.'],
        estimated: materials.length > 0,
      };
    } catch { return null; }
  }

  // Infers likely packaging materials from a product category string
  function _inferFromCategory(catStr) {
    const c = catStr.toLowerCase();

    if (c.includes('canned') || c.includes('tinned'))
      return extractMaterials('steel tin');

    if (c.includes('beer') || c.includes('wine') || c.includes('spirit') || c.includes('liquor') || c.includes('whisky') || c.includes('whiskey') || c.includes('vodka') || c.includes('rum'))
      return extractMaterials(c.includes('can') ? 'aluminum' : 'glass');

    if (c.includes('beverage') || c.includes('drink') || c.includes('water') || c.includes('juice') || c.includes('soda') || c.includes('cola') || c.includes('lemonade') || c.includes('sports drink') || c.includes('energy drink'))
      return extractMaterials(c.includes('can') ? 'aluminum' : 'pet');

    if (c.includes('milk') || c.includes('dairy') || c.includes('yogurt') || c.includes('yoghurt') || c.includes('butter') || c.includes('cream cheese'))
      return extractMaterials('hdpe');

    if (c.includes('cereal') || c.includes('breakfast') || c.includes('cracker') || c.includes('cookie') || c.includes('biscuit') || c.includes('pasta') || c.includes('rice') || c.includes('flour') || c.includes('grain'))
      return extractMaterials('cardboard');

    if (c.includes('shampoo') || c.includes('conditioner') || c.includes('body wash') || c.includes('hair care') || c.includes('soap') || c.includes('lotion') || c.includes('beauty') || c.includes('cosmetic') || c.includes('skincare') || c.includes('deodorant'))
      return extractMaterials('hdpe');

    if (c.includes('cleaning') || c.includes('cleaner') || c.includes('detergent') || c.includes('laundry') || c.includes('bleach') || c.includes('dishwash'))
      return extractMaterials('hdpe');

    return []; // Cannot infer — leave as unknown
  }

  /* ---- Parse Product & Determine Recyclability ---- */
  function parseProduct(barcode, product) {
    const name  = product.product_name || product.product_name_en || product.abbreviated_product_name || 'Unknown Product';
    const brand = product.brands || '';

    // Collect packaging info from every available field
    const packagingFields = [
      product.packaging || '',
      (product.packaging_tags || []).join(', '),
      product.packaging_text || '',
      product.packaging_text_en || '',
      (product.packaging_materials_tags || []).join(', '),
    ].join(', ').toLowerCase();

    let materials = extractMaterials(packagingFields);
    let estimated = false;

    // If no explicit packaging data, try to infer from product categories
    if (materials.length === 0) {
      const catStr = [
        product.categories || '',
        (product.categories_tags || []).join(', '),
        product.labels || '',
      ].join(', ');
      materials = _inferFromCategory(catStr);
      if (materials.length > 0) estimated = true;
    }

    const { verdict, tips } = determineVerdict(materials);
    return { barcode, name, brand, materials, verdict, tips, estimated };
  }

  function extractMaterials(packagingStr) {
    const found = [];
    const seen  = new Set();

    for (const [key, info] of Object.entries(PACKAGING_MAP)) {
      if (packagingStr.includes(key) && !seen.has(info.label)) {
        seen.add(info.label);
        found.push({ key, ...info });
      }
    }
    return found;
  }

  function determineVerdict(materials) {
    if (materials.length === 0) {
      return {
        verdict: 'unknown',
        tips: ['No packaging information found for this product.', 'Check the product label for material symbols and your local recycling guidelines.']
      };
    }

    // Most conservative verdict wins
    const priority = { 'not-recyclable': 0, 'check-local': 1, 'recyclable': 2 };
    let worstVerdict = 'recyclable';
    const allTips = [];

    for (const mat of materials) {
      if (priority[mat.verdict] < priority[worstVerdict]) worstVerdict = mat.verdict;
      allTips.push(...mat.tips);
    }

    return { verdict: worstVerdict, tips: [...new Set(allTips)] };
  }

  /* ---- Award scan points (30 pts, max 5 unique barcodes/day) ---- */
  function awardScanPoints(barcode) {
    const username = localStorage.getItem('rr_current');
    if (!username) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const daily = JSON.parse(localStorage.getItem('rr_scan_daily') || '{}');

    // Reset if new day
    if (daily.date !== today) {
      daily.date = today;
      daily.barcodes = [];
    }

    // Already scanned this barcode today
    if ((daily.barcodes || []).includes(barcode)) return 0;

    // Daily cap: 5 unique barcodes
    if ((daily.barcodes || []).length >= 5) {
      // Check if user has a Daily Reset powerup and show a hint
      const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
      const idx = profiles.findIndex(p => p.username === username);
      if (idx !== -1 && (profiles[idx].powerups?.daily_reset || 0) > 0) {
        // Show reset button in the DOM — renderResult handles the ptsHTML slot
        // We return a special sentinel so the caller can surface the button
        return -1; // -1 = cap hit but reset available
      }
      return 0;
    }

    const pts = 30;
    daily.barcodes = [...(daily.barcodes || []), barcode];
    localStorage.setItem('rr_scan_daily', JSON.stringify(daily));

    // Update profile
    const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
    const idx = profiles.findIndex(p => p.username === username);
    if (idx === -1) return 0;
    profiles[idx].points      = (profiles[idx].points      || 0) + pts;
    profiles[idx].totalPoints = (profiles[idx].totalPoints || 0) + pts;
    profiles[idx].scanCount   = (profiles[idx].scanCount   || 0) + 1;

    // Award scan-related badges
    _checkScanBadges(profiles[idx]);

    localStorage.setItem('rr_profiles', JSON.stringify(profiles));

    // Sync to cloud
    window.AuthModule?.syncProfileFlat?.(profiles[idx]);

    // Notify quiz module to update scan missions
    window.QuizModule?.updateScanMissions?.(profiles[idx].scanCount || 0);

    return pts;
  }

  /* ---- Render ---- */
  function renderResult(result, earnedPts) {
    const { name, brand, materials, verdict, tips } = result;

    const verdictConfig = {
      'recyclable':     { icon: '♻️', title: 'Recyclable!',            subtitle: 'This product can be recycled in most curbside programs.' },
      'check-local':    { icon: '⚠️', title: 'Check Locally',          subtitle: 'Recyclability varies by location — verify with your local program.' },
      'not-recyclable': { icon: '🚫', title: 'Not Recyclable',         subtitle: 'This product is generally not accepted in curbside recycling.' },
      'unknown':        { icon: '❓', title: 'Unknown Recyclability',   subtitle: 'Packaging information was not found for this product.' },
    };

    const vc = verdictConfig[verdict];

    let materialsHTML = '';
    if (materials.length > 0) {
      const tags = materials.map(m =>
        `<span class="mat-tag ${m.verdict}"><i class="fas fa-circle" style="font-size:.5rem"></i> ${m.label}</span>`
      ).join('');
      materialsHTML = `
        <div>
          <div class="section-label">Packaging Materials</div>
          <div class="materials-wrap">${tags}</div>
        </div>`;
    }

    const tipsHTML = tips.length > 0 ? `
      <div>
        <div class="section-label">Recycling Tips</div>
        <ul class="tips-list">
          ${tips.map(t => `<li><i class="fas fa-lightbulb"></i> ${t}</li>`).join('')}
        </ul>
      </div>` : '';

    const ptsHTML = earnedPts > 0
      ? `<div class="scan-pts-earned"><i class="fas fa-star"></i> +${earnedPts} pts earned!</div>`
      : earnedPts === -1
        ? `<div class="scan-daily-cap">
             <i class="fas fa-moon"></i> Daily scan limit reached (5/5)
             <button class="btn btn-sm scan-reset-btn" onclick="Scanner.useDailyReset()">
               🔄 Use Daily Reset
             </button>
           </div>`
        : '';

    resultEl().innerHTML = `
      <div class="result-card">
        ${ptsHTML}
        <div class="verdict-banner ${verdict}">
          <div class="verdict-icon">${vc.icon}</div>
          <div>
            <div class="verdict-title">${vc.title}</div>
            <div class="verdict-subtitle">${vc.subtitle}</div>
          </div>
        </div>
        <div class="result-details">
          <div>
            <div class="result-product-name">${escapeHtml(name)}</div>
            ${brand ? `<div class="result-brand">${escapeHtml(brand)}</div>` : ''}
          </div>
          ${materialsHTML}
          ${tipsHTML}
        </div>
        <div class="result-footer">
          <button class="btn btn-secondary btn-sm" onclick="Scanner.clear()">
            <i class="fas fa-times"></i> Clear
          </button>
          ${result.estimated ? `<p class="result-estimated-note"><i class="fas fa-circle-info"></i> Verdict estimated from product category — check the label to confirm.</p>` : ''}
        </div>
      </div>`;

    resultEl().classList.remove('hidden');
    resultEl().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showLoading() {
    resultEl().innerHTML = `
      <div class="result-card" style="padding:40px; text-align:center">
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;color:var(--gray-500)">
          <i class="fas fa-spinner fa-spin fa-2x" style="color:var(--green-500)"></i>
          <p>Looking up product information...</p>
        </div>
      </div>`;
    resultEl().classList.remove('hidden');
  }

  function showError(msg) {
    errorEl().innerHTML = `
      <div class="error-card">
        <i class="fas fa-circle-xmark"></i>
        <p>${msg}</p>
        <button class="btn btn-secondary btn-sm" onclick="Scanner.clear()">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>`;
    errorEl().classList.remove('hidden');
  }

  /* ---- Scan badge helper ---- */
  function _checkScanBadges(profile) {
    if (!profile.badges) profile.badges = [];
    const sc = profile.scanCount || 0;
    if (sc >= 1  && !profile.badges.includes('first_scan'))  profile.badges.push('first_scan');
    if (sc >= 5  && !profile.badges.includes('scanner_5'))   profile.badges.push('scanner_5');
    if (sc >= 25 && !profile.badges.includes('scanner_25'))  profile.badges.push('scanner_25');
  }

  /* ---- Daily Reset powerup ---- */
  function useDailyReset() {
    const username = localStorage.getItem('rr_current');
    if (!username) return;

    const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
    const idx = profiles.findIndex(p => p.username === username);
    if (idx === -1) return;

    const resetCount = profiles[idx].powerups?.daily_reset || 0;
    if (resetCount <= 0) return;

    // Consume one Daily Reset
    profiles[idx].powerups.daily_reset = resetCount - 1;

    // Award Daily Reset badge
    if (!profiles[idx].badges) profiles[idx].badges = [];
    if (!profiles[idx].badges.includes('daily_reset_used')) profiles[idx].badges.push('daily_reset_used');

    localStorage.setItem('rr_profiles', JSON.stringify(profiles));
    window.AuthModule?.syncProfileFlat?.(profiles[idx]);

    // Clear today's scan log
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('rr_scan_daily', JSON.stringify({ date: today, barcodes: [] }));

    // Re-run the last barcode lookup so the user gets credit
    const lastBarcode = document.getElementById('barcode-input')?.value?.trim();
    if (lastBarcode) {
      lookupBarcode(lastBarcode);
    } else {
      // Just refresh the scan cap message away
      clearResults();
    }
  }

  function clearResults() {
    resultEl().innerHTML = '';
    resultEl().classList.add('hidden');
    errorEl().innerHTML = '';
    errorEl().classList.add('hidden');
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ---- Scan History ---- */
  function addToScanHistory(result) {
    const KEY = 'rr_scan_history';
    let history = JSON.parse(localStorage.getItem(KEY) || '[]');
    // Avoid duplicates for the same barcode
    history = history.filter(h => h.barcode !== result.barcode);
    history.unshift({
      barcode: result.barcode,
      name:    result.name,
      brand:   result.brand,
      verdict: result.verdict,
      ts:      Date.now(),
    });
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(history));
    renderScanHistory();
  }

  function renderScanHistory() {
    const container = document.getElementById('scan-history-list');
    if (!container) return;
    const history = JSON.parse(localStorage.getItem('rr_scan_history') || '[]');
    if (history.length === 0) {
      container.innerHTML = '<p class="sh-empty">No scans yet — scan a product barcode above!</p>';
      return;
    }
    container.innerHTML = history.map(h => `
      <div class="sh-entry" onclick="document.getElementById('barcode-input').value='${h.barcode}'; Scanner.lookupFromHistory('${h.barcode}')">
        <div class="sh-verdict-dot ${h.verdict || 'unknown'}"></div>
        <div class="sh-name">${escapeHtml(h.name || 'Unknown')}</div>
        ${h.brand ? `<div class="sh-brand">${escapeHtml(h.brand)}</div>` : ''}
      </div>`).join('');
  }

  function lookupFromHistory(barcode) {
    lookupBarcode(barcode);
  }

  return { init, startScanner, stopScanner, clear: clearResults, useDailyReset, lookupFromHistory, renderScanHistory };
})();
