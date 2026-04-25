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

  /* ---- API Lookup ---- */
  async function lookupBarcode(barcode) {
    clearResults();
    showLoading();

    // Cache in sessionStorage to avoid redundant requests
    const cacheKey = 'rr_scan_' + barcode;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      clearResults();
      renderResult(JSON.parse(cached), 0); // no points for repeated lookup
      return;
    }

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      if (data.status === 0 || !data.product) {
        clearResults();
        showError(`Product not found for barcode <strong>${barcode}</strong>.<br>Try another barcode or check the number carefully.`);
        return;
      }

      const result = parseProduct(barcode, data.product);
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

  /* ---- Parse Product & Determine Recyclability ---- */
  function parseProduct(barcode, product) {
    const name  = product.product_name || product.product_name_en || 'Unknown Product';
    const brand = product.brands || '';

    // Collect packaging info from multiple fields
    const packagingFields = [
      product.packaging || '',
      (product.packaging_tags || []).join(', '),
      product.packaging_text || '',
    ].join(', ').toLowerCase();

    const materials = extractMaterials(packagingFields);
    const { verdict, tips } = determineVerdict(materials);

    return { barcode, name, brand, materials, verdict, tips };
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

  /* ---- Award scan points (5 pts, max 5 unique barcodes/day) ---- */
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

    const pts = 5;
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
