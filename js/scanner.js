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
      renderResult(JSON.parse(cached));
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
      clearResults();
      renderResult(result);
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

  /* ---- Render ---- */
  function renderResult(result) {
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

    resultEl().innerHTML = `
      <div class="result-card">
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

  function clearResults() {
    resultEl().innerHTML = '';
    resultEl().classList.add('hidden');
    errorEl().innerHTML = '';
    errorEl().classList.add('hidden');
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, startScanner, stopScanner, clear: clearResults };
})();
