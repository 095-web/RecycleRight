/* ============================================================
   RecycleRight — Location Module
   Zip code → state lookup + local recycling rules display
   Uses https://api.zippopotam.us (free, no API key, CORS-enabled)
   ============================================================ */

const LocationModule = (function () {

  const KEY_LOC = 'rr_location';
  let   locData = null;  // { zip, state, stateAbbr, city }

  /* ====================================================
     STATE RECYCLING RULES (all 50 states + DC)
     Keys: 2-letter USPS abbreviation
     ──────────────────────────────────────────────────
     plastics:  which resin codes are typically accepted curbside
     glass:     'curbside' | 'drop-off' | 'varies'
     bottle:    false | deposit amount string
     bag:       false | 'ban' | 'fee' | 'local'
     organics:  false | 'statewide' | 'some-cities'
     notes:     key rules (array of strings)
     ==================================================== */
  const STATE_RULES = {
    'AL': { name:'Alabama',         plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Most recycling is drop-off only across the state.','Curbside availability varies by city and county.','Birmingham and Huntsville have city-run recycling programs.'] },
    'AK': { name:'Alaska',          plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Recycling infrastructure is limited, especially in rural areas.','Anchorage has curbside recycling for #1 and #2 plastics.','Many areas use community drop-off stations.'] },
    'AZ': { name:'Arizona',         plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Phoenix and Tucson accept plastics #1, #2, and #5 curbside.','Glass must be taken to drop-off recycling centers.','Maricopa County holds free large-item recycling events.'] },
    'AR': { name:'Arkansas',        plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Recycling programs vary widely by city.','Little Rock and Fayetteville have curbside programs.','Glass is generally drop-off only across the state.'] },
    'CA': { name:'California',      plastics:[1,2,3,4,5], glass:'curbside', bottle:'5¢–10¢',  bag:'ban',   organics:'statewide',  notes:['SB 1383 requires all residents to separate food scraps and yard waste for composting — law since 2022.','California Redemption Value (CRV) deposit applies to most beverage containers.','Statewide plastic bag ban; reusable bags required at checkout.','Many jurisdictions accept plastics #1–5 curbside.','CalRecycle provides a "What Do I Do With?" lookup tool by ZIP code.'] },
    'CO': { name:'Colorado',        plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:'fee',   organics:'some-cities',notes:['10-cent fee on single-use plastic and paper bags (effective 2023).','Denver has curbside organics collection.','Glass must be taken to drop-off centers in most areas.','Boulder County has an advanced recycling program accepting more materials.'] },
    'CT': { name:'Connecticut',     plastics:[1,2,5],     glass:'curbside', bottle:'5¢',       bag:'10¢',   organics:'some-cities',notes:['5-cent bottle deposit on beer, soda, and water containers.','10-cent fee on single-use plastic bags.','CT DEEP runs statewide hazardous household waste programs.','Hartford and New Haven have organics collection pilots.'] },
    'DE': { name:'Delaware',        plastics:[1,2],       glass:'curbside', bottle:false,      bag:'10¢',   organics:false,        notes:['10-cent fee on single-use plastic bags statewide.','Delaware Solid Waste Authority (DSWA) manages statewide recycling.','Glass is accepted at some curbside programs — check with DSWA.'] },
    'DC': { name:'Washington D.C.', plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:'10¢',   organics:'statewide',  notes:['10-cent bag fee has been in effect since 2010.','DC DPW runs composting drop-off locations across the city.','Electronics and hazardous waste events held quarterly.','Most plastics #1, #2, and #5 accepted curbside.'] },
    'FL': { name:'Florida',         plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['State law currently preempts local plastic bag restrictions.','Recycling programs vary widely by county — Miami-Dade and Broward have strong programs.','Glass is typically collected at drop-off sites.','Florida DEP encourages but does not mandate residential composting.'] },
    'GA': { name:'Georgia',         plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Atlanta has single-stream curbside recycling.','Georgia Recycling Coalition supports local programs and provides resources.','Glass is generally drop-off only outside major cities.','Cherokee, Gwinnett, and Fulton counties have strong programs.'] },
    'HI': { name:'Hawaii',          plastics:[1,2,5],     glass:'curbside', bottle:'5¢',       bag:'ban',   organics:'some-cities',notes:['Each county has enacted a plastic bag ban.','Hawaii has a 5-cent beverage container deposit system.','Honolulu has single-stream curbside recycling.','Maui and other counties have limited curbside options — check locally.'] },
    'ID': { name:'Idaho',           plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Boise and Coeur d\'Alene have single-stream curbside programs.','Recycling availability is limited in rural Idaho.','Glass must be dropped off at recycling centers.'] },
    'IL': { name:'Illinois',        plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:'local', organics:'some-cities',notes:['Chicago\'s blue cart program accepts #1, #2, and #5 plastics.','Some municipalities (Evanston, Naperville) have local bag restrictions.','Cook County has food scrap composting programs.','Illinois EPA runs statewide recycling grant programs.'] },
    'IN': { name:'Indiana',         plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Indianapolis (Indy Recycles) accepts #1 and #2 plastics curbside.','Recycling availability varies widely outside major cities.','Glass must be taken to drop-off recycling centers.'] },
    'IA': { name:'Iowa',            plastics:[1,2,5],     glass:'curbside', bottle:'5¢',       bag:false,   organics:'some-cities',notes:['Iowa has a 5-cent deposit on most beverage containers.','Des Moines and Iowa City have strong curbside programs.','Glass is accepted curbside in many larger cities.','Ames has a curbside food waste composting program.'] },
    'KS': { name:'Kansas',          plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Wichita and Kansas City (KS) have curbside recycling.','Recycling is largely determined by city and county governments.','Glass recycling is drop-off only in most areas.'] },
    'KY': { name:'Kentucky',        plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Louisville Metro has curbside recycling.','Lexington has single-stream recycling.','Kentucky does not have a bottle deposit or bag ban.','Rural areas often rely on county drop-off centers.'] },
    'LA': { name:'Louisiana',       plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['New Orleans has a single-stream curbside program.','Louisiana has limited statewide recycling policy.','Many rural parishes have no curbside recycling — rely on drop-off.'] },
    'ME': { name:'Maine',           plastics:[1,2,5],     glass:'curbside', bottle:'5¢–15¢',  bag:'ban',   organics:'some-cities',notes:['Maine has one of the highest bottle deposits in the US — up to 15¢.','Statewide plastic bag ban took effect in 2021.','Maine DEP manages comprehensive solid waste and hazardous material programs.','Portland has a curbside organics pilot program.'] },
    'MD': { name:'Maryland',        plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:'5¢',   organics:'some-cities', notes:['5-cent fee on single-use bags at most retail stores.','MDE runs statewide recycling education programs.','Montgomery and Prince George\'s counties have extensive recycling programs.','Baltimore City accepts plastics #1, #2, and #5 curbside.'] },
    'MA': { name:'Massachusetts',   plastics:[1,2,5],     glass:'drop-off', bottle:'5¢',       bag:'local', organics:'some-cities',notes:['5-cent bottle deposit on beer, soda, and water containers.','Over 100 municipalities have adopted local plastic bag bans or fees.','MassDEP bans commercial food waste from disposal (50+ lbs/week).','Boston has curbside organics collection for all residents.','Glass must be taken to drop-off in most communities.'] },
    'MI': { name:'Michigan',        plastics:[1,2,5],     glass:'curbside', bottle:'10¢',      bag:false,   organics:false,        notes:['Michigan\'s 10-cent bottle deposit is the highest in the US and drives a ~90% return rate.','Most communities have single-stream curbside recycling.','Grand Rapids and Detroit have strong recycling programs.','Michigan bottle return centers are located in most grocery stores.'] },
    'MN': { name:'Minnesota',       plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:'local', organics:'some-cities',notes:['Minneapolis has a single-use bag ban.','Minneapolis and St. Paul have curbside organics collection.','Recycling is mandatory for Minnesota businesses.','Glass recycling is typically drop-off only in most metro areas.'] },
    'MS': { name:'Mississippi',     plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Mississippi has limited statewide recycling infrastructure.','Some municipalities like Jackson offer drop-off centers.','Recycling access is very limited in rural areas.'] },
    'MO': { name:'Missouri',        plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Kansas City and St. Louis have single-stream curbside recycling.','Missouri has no bottle bill or statewide bag policy.','Rural areas have very limited recycling access.'] },
    'MT': { name:'Montana',         plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Billings and Missoula have city recycling programs.','Most rural areas have limited access — rely on transfer stations.','Montana has no statewide bag or bottle policies.'] },
    'NE': { name:'Nebraska',        plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Omaha and Lincoln have curbside recycling.','Nebraska has no statewide recycling mandates.','Glass is generally accepted at drop-off sites only.'] },
    'NV': { name:'Nevada',          plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Las Vegas (Republic Services) and Reno have single-stream recycling.','Clark County recently expanded which plastics are accepted.','Glass must be dropped off at recycling centers.'] },
    'NH': { name:'New Hampshire',   plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['NH relies on town-level transfer stations and drop-off programs.','Manchester and Nashua have curbside recycling.','NH has no bottle bill or statewide bag policy.'] },
    'NJ': { name:'New Jersey',      plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:'ban',   organics:'some-cities',notes:['NJ enacted a broad single-use plastics ban in May 2022 (bags, foam, single-use containers).','Most municipalities have single-stream curbside recycling.','NJ DEP mandates recycling for residences and businesses.','Bergen and Middlesex counties have organics collection pilots.'] },
    'NM': { name:'New Mexico',      plastics:[1,2],       glass:'drop-off', bottle:false,      bag:'local', organics:false,        notes:['Albuquerque has single-stream recycling.','Santa Fe and some municipalities have bag fees.','Glass is drop-off only in most of the state.'] },
    'NY': { name:'New York',        plastics:[1,2,5],     glass:'curbside', bottle:'5¢',       bag:'ban',   organics:'some-cities',notes:['Statewide plastic bag ban took effect in March 2020.','5-cent deposit on beer, soda, and water containers.','NYC expanded organics curbside collection to all five boroughs in 2024.','Many upstate cities accept #1, #2, and #5 plastics curbside.','Bottle return machines are in most grocery stores.'] },
    'NC': { name:'North Carolina',  plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Charlotte and Raleigh have single-stream curbside recycling.','NC has strong statewide electronics recycling laws.','Glass is accepted at drop-off sites in most counties.','NC DEQ bans certain materials from landfill (batteries, electronics, tires).'] },
    'ND': { name:'North Dakota',    plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Fargo and Bismarck have city recycling programs.','Most of the state relies on transfer stations.','North Dakota has no statewide recycling mandates.'] },
    'OH': { name:'Ohio',            plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Columbus, Cleveland, Cincinnati, and Toledo all have curbside recycling.','Ohio EPA provides recycling resources and grants to communities.','Glass is typically accepted at county drop-off centers.','Ohio bans electronics and some hazardous items from trash.'] },
    'OK': { name:'Oklahoma',        plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Oklahoma City has a curbside recycling program.','Recycling infrastructure is limited outside major cities.','Oklahoma has no statewide bottle bill or bag ban.'] },
    'OR': { name:'Oregon',          plastics:[1,2,5],     glass:'curbside', bottle:'10¢',      bag:'ban',   organics:'some-cities',notes:['Oregon\'s 10-cent bottle deposit was raised from 5¢ in 2017 — one of the highest in the US.','Oregon\'s 1971 bottle bill was the first in the nation.','Statewide single-use plastic bag ban since 2020.','Portland has extensive curbside organics collection.','Metro Portland accepts plastics #1, #2, and #5 curbside.'] },
    'PA': { name:'Pennsylvania',    plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:false,   organics:'some-cities',notes:['PA DEP mandates recycling for municipalities over 5,000 residents.','Philadelphia has single-stream curbside recycling.','Pittsburgh has curbside recycling and a food waste composting pilot.','Some glass is accepted curbside — varies by municipality.'] },
    'RI': { name:'Rhode Island',    plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:'5¢',    organics:'statewide',  notes:['5-cent fee on single-use plastic bags.','Rhode Island Resource Recovery runs statewide waste management.','RI has mandatory organics separation for large businesses and institutions.','Most communities accept plastics #1, #2, and #5 curbside.'] },
    'SC': { name:'South Carolina',  plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Charleston and Columbia have city-run recycling programs.','SC has limited statewide recycling mandates.','Glass and many materials are drop-off only in most areas.'] },
    'SD': { name:'South Dakota',    plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Sioux Falls has a city recycling program.','Most of the state relies on drop-off centers.','South Dakota has no statewide recycling mandates.'] },
    'TN': { name:'Tennessee',       plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Nashville and Memphis have single-stream recycling.','Tennessee has no statewide bottle bill.','Glass is accepted at drop-off sites in most major cities.','Rural counties often have limited recycling infrastructure.'] },
    'TX': { name:'Texas',           plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:'local', organics:false,        notes:['State law complicates local plastic bag restrictions — check your city.','Houston, Dallas, Austin, and San Antonio have single-stream recycling.','Glass must be taken to drop-off recycling centers in most Texas cities.','Texas Commission on Environmental Quality (TCEQ) manages waste programs.'] },
    'UT': { name:'Utah',            plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Salt Lake City and Provo have curbside recycling.','Utah has no statewide bottle bill or bag policy.','Glass must be taken to drop-off sites.','Recycling access is limited in rural parts of the state.'] },
    'VT': { name:'Vermont',         plastics:[1,2,5],     glass:'curbside', bottle:'5¢–15¢',  bag:'ban',   organics:'statewide',  notes:['Vermont was the first US state to ban ALL single-use plastic bags (2020).','Vermont has mandatory statewide organics (food waste) composting.','Vermont\'s bottle deposit system covers most beverage containers.','Act 148 bans food waste from disposal — composting is required.','Vermont has some of the most comprehensive waste reduction laws in the US.'] },
    'VA': { name:'Virginia',        plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:'5¢',    organics:'some-cities',notes:['5-cent fee on single-use plastic bags (with farmer\'s market exceptions).','Northern Virginia and Richmond have strong single-stream recycling.','Arlington and Alexandria have organics collection programs.','VA DEQ provides statewide recycling guidance and grants.'] },
    'WA': { name:'Washington',      plastics:[1,2,5],     glass:'drop-off', bottle:false,      bag:'ban',   organics:'some-cities',notes:['Statewide plastic bag ban plus 8-cent fee on paper bags (effective 2021).','Seattle requires mandatory composting — food scraps must be separated.','King County has one of the most advanced recycling programs in the US.','Washington is phasing in extended producer responsibility for packaging.','Glass is drop-off only in most areas.'] },
    'WV': { name:'West Virginia',   plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Recycling infrastructure is limited across most of the state.','Charleston and Huntington have city recycling programs.','Many communities rely on drop-off centers for recycling.'] },
    'WI': { name:'Wisconsin',       plastics:[1,2,5],     glass:'curbside', bottle:false,      bag:false,   organics:false,        notes:['Wisconsin bans glass, metal, paper, and certain plastics from landfills statewide.','Milwaukee and Madison have strong curbside recycling programs.','Wisconsin has statewide electronics recycling laws.','Glass is accepted curbside in many communities.'] },
    'WY': { name:'Wyoming',         plastics:[1,2],       glass:'drop-off', bottle:false,      bag:false,   organics:false,        notes:['Wyoming has very limited recycling infrastructure.','Cheyenne and Casper have city recycling programs.','Most of the state relies on landfills and drop-off sites.'] },
  };

  /* ====================================================
     INIT
     ==================================================== */
  function init() {
    locData = JSON.parse(localStorage.getItem(KEY_LOC) || 'null');

    // Bind events for all zip inputs
    document.querySelectorAll('.zip-input').forEach(input => {
      if (locData?.zip) input.value = locData.zip;
    });
    document.querySelectorAll('.zip-submit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.zip-form')?.querySelector('.zip-input');
        if (input) submitZip(input.value.trim());
      });
    });
    document.querySelectorAll('.zip-input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitZip(e.target.value.trim());
      });
    });

    if (locData?.stateAbbr) renderBanner(locData);
  }

  /* ====================================================
     ZIP LOOKUP
     ==================================================== */
  async function submitZip(zip) {
    if (!zip) return;
    if (!/^\d{5}$/.test(zip)) {
      showZipError('Please enter a valid 5-digit US ZIP code.');
      return;
    }

    showZipLoading();
    try {
      const res  = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) { showZipError('ZIP code not found. Please double-check it.'); return; }
      const data = await res.json();
      const place = data.places?.[0];
      if (!place) { showZipError('No location data found for that ZIP code.'); return; }

      const newLoc = {
        zip,
        city:      place['place name'],
        stateAbbr: place['state abbreviation'],
        state:     place['state'],
      };

      // Update all zip inputs
      document.querySelectorAll('.zip-input').forEach(i => i.value = zip);

      localStorage.setItem(KEY_LOC, JSON.stringify(newLoc));
      locData = newLoc;
      window.AuthModule?.syncLocation?.(newLoc);
      renderBanner(newLoc);
    } catch {
      showZipError('Could not connect. Please check your internet connection.');
    }
  }

  /* ====================================================
     RENDER BANNER
     ==================================================== */
  function renderBanner(loc) {
    const banner = document.getElementById('location-banner');
    if (!banner) return;

    const rules = STATE_RULES[loc.stateAbbr];
    if (!rules) {
      banner.innerHTML = buildUnknownBanner(loc);
      banner.classList.remove('hidden');
      return;
    }

    const plasticsStr = rules.plastics.map(n => `#${n}`).join(', ');
    const glassIcon   = rules.glass === 'curbside' ? '✔ Curbside' : 'Drop-off only';
    const bottleStr   = rules.bottle ? `${rules.bottle} deposit` : 'No deposit';
    const bagStr      = rules.bag === 'ban' ? 'Bag ban in effect' : rules.bag === 'fee' ? 'Single-use bag fee' : rules.bag === 'local' ? 'Local bag restrictions may apply' : 'No statewide restriction';
    const organicsStr = rules.organics === 'statewide' ? 'Statewide organics program' : rules.organics === 'some-cities' ? 'Organics in some cities' : 'No statewide organics program';

    const notesHTML = rules.notes.map(n => `<li><i class="fas fa-circle-check"></i> ${n}</li>`).join('');

    banner.innerHTML = `
      <div class="loc-banner-header">
        <div class="loc-banner-title">
          <i class="fas fa-location-dot"></i>
          <span>Local Recycling Rules — <strong>${loc.city}, ${rules.name}</strong></span>
        </div>
        <button class="loc-change-btn" onclick="LocationModule._changeZip()">
          <i class="fas fa-pen"></i> Change ZIP
        </button>
      </div>
      <div class="loc-facts-grid">
        <div class="loc-fact">
          <div class="loc-fact-label"><i class="fas fa-bottle-water"></i> Plastics (curbside)</div>
          <div class="loc-fact-value">${plasticsStr}</div>
        </div>
        <div class="loc-fact">
          <div class="loc-fact-label"><i class="fas fa-wine-bottle"></i> Glass</div>
          <div class="loc-fact-value">${glassIcon}</div>
        </div>
        <div class="loc-fact">
          <div class="loc-fact-label"><i class="fas fa-tag"></i> Bottle Bill</div>
          <div class="loc-fact-value">${bottleStr}</div>
        </div>
        <div class="loc-fact">
          <div class="loc-fact-label"><i class="fas fa-bag-shopping"></i> Bags</div>
          <div class="loc-fact-value">${bagStr}</div>
        </div>
        <div class="loc-fact">
          <div class="loc-fact-label"><i class="fas fa-seedling"></i> Organics</div>
          <div class="loc-fact-value">${organicsStr}</div>
        </div>
      </div>
      <ul class="loc-notes-list">${notesHTML}</ul>
      <p class="loc-disclaimer">Rules vary by city and county. Always check with your local waste hauler for the most accurate information.</p>`;

    banner.classList.remove('hidden');
  }

  function buildUnknownBanner(loc) {
    return `
      <div class="loc-banner-header">
        <div class="loc-banner-title"><i class="fas fa-location-dot"></i> <span>${loc.city}, ${loc.state}</span></div>
        <button class="loc-change-btn" onclick="LocationModule._changeZip()"><i class="fas fa-pen"></i> Change</button>
      </div>
      <p style="color:var(--gray-600);font-size:.88rem">We don't have specific rules for this state yet. Check your local waste hauler's website for accepted materials.</p>`;
  }

  function showZipLoading() {
    const banner = document.getElementById('location-banner');
    if (!banner) return;
    banner.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:4px 0;color:var(--gray-500)"><i class="fas fa-spinner fa-spin"></i> Looking up your area...</div>`;
    banner.classList.remove('hidden');
  }

  function showZipError(msg) {
    const errEl = document.getElementById('zip-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; setTimeout(() => errEl.style.display = 'none', 4000); }
  }

  function _changeZip() {
    const banner = document.getElementById('location-banner');
    if (banner) banner.classList.add('hidden');
    locData = null;
    localStorage.removeItem(KEY_LOC);
    document.querySelectorAll('.zip-input').forEach(i => i.value = '');
    document.getElementById('zip-form-section')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function getLocData() { return locData; }
  function getRules()   { return locData?.stateAbbr ? STATE_RULES[locData.stateAbbr] || null : null; }

  return { init, submitZip, getRules, getLocData, _changeZip };
})();

window.LocationModule = LocationModule;
