/* ============================================================
   RecycleRight — Quiz Module
   Profile, game loop, scoring, leaderboard, friends, achievements
   ============================================================ */

const Quiz = (function () {

  /* ---- Storage keys ---- */
  const KEY_PROFILES = 'rr_profiles';
  const KEY_CURRENT  = 'rr_current';
  const KEY_FRIENDS  = 'rr_friends';

  /* ---- Game state ---- */
  let state = {
    questions: [], current: 0, score: 0, streak: 0,
    bestStreak: 0, correct: 0, answered: false, category: null,
    pointBooster: false, freezeArmed: false, fiftyFiftyUsed: false,
    isDaily: false, isChallenge: false, challengeId: null,
  };

  /* ---- Timer state ---- */
  let _timerInterval  = null;
  let _timerSeconds   = 15;
  let _hardMode       = localStorage.getItem('rr_hard_mode') === 'true';
  let _questionStartTime = 0;

  /* ---- Quiz length ---- */
  let _quizLength = parseInt(localStorage.getItem('rr_quiz_length') || '10');

  /* ---- Leaderboard live listener handle ---- */
  let _lbUnsubscribe = null;
  let _lbMode = 'current'; // 'current' | 'total' | 'friends'

  /* ---- Sort game state ---- */
  let _sortState = { items: [], current: 0, score: 0, correct: 0, answered: false };

  /* ---- Keyboard listener cleanup ---- */
  let _keyHandler = null;

  /* ====================================================
     STORAGE HELPERS
     ==================================================== */
  function loadProfiles()  { return JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]'); }
  function saveProfiles(p) { localStorage.setItem(KEY_PROFILES, JSON.stringify(p)); }
  function loadFriends()   { return JSON.parse(localStorage.getItem(KEY_FRIENDS)  || '[]'); }
  function saveFriends(f)  { localStorage.setItem(KEY_FRIENDS, JSON.stringify(f)); }
  function currentUser()   { return localStorage.getItem(KEY_CURRENT) || null; }
  function setCurrentUser(u) { localStorage.setItem(KEY_CURRENT, u); }
  function today()         { return new Date().toISOString().slice(0, 10); }

  function getProfile(username) {
    return loadProfiles().find(p => p.username === username) || null;
  }
  function saveProfile(profile) {
    const list = loadProfiles().filter(p => p.username !== profile.username);
    list.push(profile);
    saveProfiles(list);
    window.AuthModule?.syncProfile?.(profile);
    window.AuthModule?.syncProfileFlat?.(profile);
  }
  function newProfile(username, avatarIdx) {
    return { username, avatarIdx, points: 0, quizzes: 0, bestStreak: 0, catsPlayed: [], badges: [] };
  }

  /* ====================================================
     INIT
     ==================================================== */
  function init() {
    buildAvatarPicker();
    buildQuizCategories();

    // Normal (guest) setup form
    document.getElementById('create-profile-btn').addEventListener('click', createProfile);
    document.getElementById('setup-username').addEventListener('keydown', e => {
      if (e.key === 'Enter') createProfile();
    });

    // Google user setup form
    document.getElementById('google-create-btn').addEventListener('click', createGoogleProfile);
    document.getElementById('google-username-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') createGoogleProfile();
    });

    document.getElementById('switch-user-btn').addEventListener('click', switchUser);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);

    // Quiz length picker
    document.querySelectorAll('.qlp-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.len) === _quizLength);
      btn.addEventListener('click', () => {
        _quizLength = parseInt(btn.dataset.len);
        localStorage.setItem('rr_quiz_length', String(_quizLength));
        document.querySelectorAll('.qlp-btn').forEach(b =>
          b.classList.toggle('active', b === btn));
      });
    });

    // Hard mode toggle
    const hmToggle = document.getElementById('hard-mode-toggle');
    if (hmToggle) {
      hmToggle.checked = _hardMode;
      _updateHardModeLabel();
      hmToggle.addEventListener('change', () => {
        _hardMode = hmToggle.checked;
        localStorage.setItem('rr_hard_mode', String(_hardMode));
        _updateHardModeLabel();
      });
    }

    // Quiz sub-nav
    document.querySelectorAll('.qnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.qsection').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        const sec = document.getElementById('qsection-' + btn.dataset.qsection);
        if (sec) {
          sec.classList.add('active');
          if (btn.dataset.qsection === 'leaderboard') renderLeaderboard();
        } else {
          if (_lbUnsubscribe) { _lbUnsubscribe(); _lbUnsubscribe = null; }
        }
      });
    });

    // If Firebase is configured, hold off — onAuthStateChanged will fire shortly
    // and call reload() → _decideScreen(). Calling it now would race and flash
    // the guest setup form for signed-in users.
    if (window.AuthModule?.isAvailable) {
      _showAuthLoading();
    } else {
      _decideScreen();
    }
  }

  function _updateHardModeLabel() {
    const lbl = document.getElementById('hard-mode-label');
    if (!lbl) return;
    lbl.classList.toggle('active', _hardMode);
  }

  /* ====================================================
     PROFILE CREATION
     ==================================================== */
  let selectedAvatar = 0;

  function buildAvatarPicker() {
    const container = document.getElementById('avatar-picker');
    if (!container) return;
    container.innerHTML = AVATARS.map((av, i) =>
      `<div class="avatar-option ${i === 0 ? 'selected' : ''}" data-idx="${i}" onclick="Quiz._selectAvatar(${i})">${av}</div>`
    ).join('');
  }

  function _selectAvatar(idx) {
    selectedAvatar = idx;
    document.querySelectorAll('.avatar-option').forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
    });
  }

  function createProfile() {
    const input = document.getElementById('setup-username');
    const errEl = document.getElementById('setup-error');
    const username = input.value.trim();
    if (!username) { errEl.textContent = 'Please enter a username.'; return; }
    if (username.length < 4) { errEl.textContent = 'Username must be at least 4 characters.'; return; }
    if (username.length > 20) { errEl.textContent = 'Username must be 20 characters or fewer.'; return; }
    if (/[^a-zA-Z0-9_]/.test(username)) { errEl.textContent = 'Only letters, numbers, and underscores allowed.'; return; }
    if (window.ProfileModule?.isProfane?.(username)) { errEl.textContent = 'That username is not allowed.'; return; }
    if (getProfile(username)) { errEl.textContent = 'That username is already taken on this device.'; return; }
    errEl.textContent = '';
    const profile = newProfile(username, selectedAvatar);
    saveProfile(profile);
    setCurrentUser(username);
    showHome();
  }

  function createGoogleProfile() {
    const input = document.getElementById('google-username-input');
    const errEl = document.getElementById('google-setup-error');
    const username = input.value.trim();
    if (!username) { errEl.textContent = 'Please enter a username.'; return; }
    if (username.length < 4) { errEl.textContent = 'Username must be at least 4 characters.'; return; }
    if (username.length > 20) { errEl.textContent = 'Username must be 20 characters or fewer.'; return; }
    if (/[^a-zA-Z0-9_]/.test(username)) { errEl.textContent = 'Only letters, numbers, and underscores allowed.'; return; }
    if (window.ProfileModule?.isProfane?.(username)) { errEl.textContent = 'That username is not allowed.'; return; }
    errEl.textContent = '';
    const profile = newProfile(username, selectedAvatar);
    saveProfile(profile);
    setCurrentUser(username);
    showHome();
  }

  function switchUser() {
    if (window.AuthModule?.currentUser) {
      if (confirm('Sign out of your Google account?')) window.AuthModule.signOut();
    } else {
      localStorage.removeItem(KEY_CURRENT);
      showSetup();
    }
  }

  /* ====================================================
     SCREEN MANAGEMENT
     ==================================================== */
  function _hideAll() {
    ['quiz-profile-setup','quiz-google-setup','quiz-home','quiz-active','quiz-sort-game','quiz-results']
      .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  }

  function showSetup() { _hideAll(); document.getElementById('quiz-profile-setup').classList.remove('hidden'); }

  function showGoogleSetup() {
    const fbUser = window.AuthModule?.currentUser;
    _hideAll();
    document.getElementById('quiz-google-setup').classList.remove('hidden');
    const hint = document.getElementById('google-setup-name-hint');
    if (hint && fbUser?.displayName) hint.textContent = `Welcome, ${fbUser.displayName.split(' ')[0]}!`;
    const photo = document.getElementById('google-setup-photo');
    if (photo) {
      photo.innerHTML = fbUser?.photoURL
        ? `<img src="${fbUser.photoURL}" alt="avatar" class="google-setup-img">`
        : `<div class="google-setup-avatar-fallback">${(fbUser?.displayName||'G')[0]}</div>`;
    }
    const input = document.getElementById('google-username-input');
    if (input && !input.value && fbUser?.displayName) {
      input.value = fbUser.displayName.split(' ')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    }
    const googlePicker = document.getElementById('google-avatar-picker');
    if (googlePicker && googlePicker.children.length === 0) {
      googlePicker.innerHTML = AVATARS.map((av, i) =>
        `<div class="avatar-option ${i === selectedAvatar ? 'selected' : ''}" data-idx="${i}" onclick="Quiz._selectAvatar(${i})">${av}</div>`
      ).join('');
    }
  }

  function showHome() {
    _stopTimer();
    _removeKeyHandler();
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) { _decideScreen(); return; }

    _hideAll();
    document.getElementById('quiz-home').classList.remove('hidden');

    const isCloud = !!window.AuthModule?.currentUser;
    document.getElementById('banner-avatar').textContent   = AVATARS[profile.avatarIdx] || AVATARS[0];
    document.getElementById('banner-username').textContent = profile.username;
    document.getElementById('stat-points').textContent     = profile.points.toLocaleString();
    document.getElementById('stat-level').textContent      = calcLevel(profile.points);
    document.getElementById('stat-streak').textContent     = profile.bestStreak;
    document.getElementById('stat-quizzes').textContent    = profile.quizzes;

    const badge = document.getElementById('cloud-badge');
    if (badge) badge.style.display = isCloud ? 'inline-flex' : 'none';

    const titleEl = document.getElementById('banner-title');
    if (titleEl && TITLES) {
      const t = TITLES.find(t => t.id === profile.selectedTitle) || TITLES[0];
      titleEl.textContent = t.label;
    }

    // Apply profile frame to banner avatar
    _applyFrame(document.getElementById('banner-avatar'), profile.equippedFrame);

    document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.qsection').forEach(s => s.classList.remove('active'));
    document.querySelector('.qnav-btn[data-qsection="play"]')?.classList.add('active');
    document.getElementById('qsection-play')?.classList.add('active');

    buildQuizCategories(); // rebuild so cat-stars update
    _updateSortGameStars(profile);
    _renderDailyChallenge(profile);
    _renderDailyMissions(profile);
    _renderFactStrip();
    _checkLoginBonus(profile);
  }

  /* ====================================================
     DAILY LOGIN BONUS
     ==================================================== */
  function _checkLoginBonus(profile) {
    const todayStr = today();
    if (profile.lastLoginDate === todayStr) return; // already claimed today

    // Calculate consecutive day streak
    const prev = new Date();
    prev.setDate(prev.getDate() - 1);
    const yesterdayStr = prev.toISOString().slice(0, 10);
    const consecutive  = profile.lastLoginDate === yesterdayStr;
    const newStreak    = consecutive ? (profile.loginStreak || 1) + 1 : 1;

    // Bonus: 10 pts base, +5 per streak day, capped at 50 pts
    const bonus = Math.min(10 + (newStreak - 1) * 5, 50);

    profile.lastLoginDate = todayStr;
    profile.loginStreak   = newStreak;
    profile.points        = (profile.points || 0) + bonus;
    profile.totalPoints   = (profile.totalPoints || 0) + bonus;
    saveProfile(profile);

    // Refresh the points counter on the home banner
    const ptEl = document.getElementById('stat-points');
    if (ptEl) ptEl.textContent = profile.points.toLocaleString();

    // Show toast after the home screen settles
    setTimeout(() => {
      const streakMsg = newStreak > 1 ? ` · ${newStreak}-day streak! 🔥` : '';
      window.Toast?.show?.(`🎁 Daily bonus: +${bonus} pts${streakMsg}`, 'success', 4000);
    }, 700);
  }

  /* Wrap an avatar element with a frame div if needed */
  function _applyFrame(el, frameId) {
    if (!el) return;
    // Remove any existing wrapper
    if (el.parentElement?.classList.contains('avatar-frame-wrap')) {
      const parent = el.parentElement;
      parent.parentElement?.replaceChild(el, parent);
    }
    const frame = FRAMES?.find(f => f.id === frameId);
    if (!frame || !frame.css) return;
    const wrap = document.createElement('div');
    wrap.className = `avatar-frame-wrap ${frame.css}`;
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
  }

  async function _decideScreen() {
    // If Firebase is configured but hasn't resolved auth yet, wait — don't flash the
    // guest setup form. onAuthStateChanged will call reload() once it fires.
    if (window.AuthModule?.isAvailable && !window.AuthModule?.isReady) {
      _showAuthLoading();
      return;
    }

    // Auth has settled — hide the loading spinner if it was shown
    const loader = document.getElementById('quiz-auth-loader');
    if (loader) loader.style.display = 'none';

    const fbUser = window.AuthModule?.currentUser;
    if (fbUser) {
      const localUser = currentUser();
      if (localUser && getProfile(localUser)) { showHome(); }
      else {
        const cloudHas = await window.AuthModule?.hasProfile?.();
        if (cloudHas) {
          const u2 = currentUser();
          if (u2 && getProfile(u2)) showHome(); else showGoogleSetup();
        } else { showGoogleSetup(); }
      }
    } else {
      // Firebase is available but user is not signed in (auth settled, no user)
      const user = currentUser();
      if (user && getProfile(user)) showHome(); else showSetup();
    }
  }

  function _showAuthLoading() {
    // Show all quiz screens hidden, just a spinner while Firebase resolves
    ['quiz-setup', 'google-setup', 'quiz-home', 'quiz-active', 'quiz-results'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    let loader = document.getElementById('quiz-auth-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'quiz-auth-loader';
      loader.style.cssText = 'display:flex;justify-content:center;align-items:center;padding:3rem;';
      loader.innerHTML = '<div class="spinner" style="width:2rem;height:2rem;border:3px solid var(--green-200);border-top-color:var(--green-500);border-radius:50%;animation:spin 0.7s linear infinite"></div>';
      const quizSection = document.getElementById('tab-quiz');
      if (quizSection) quizSection.appendChild(loader);
    }
    loader.style.display = 'flex';
  }

  function calcLevel(points) {
    if (points < 100)  return 1;
    if (points < 300)  return 2;
    if (points < 700)  return 3;
    if (points < 1500) return 4;
    return 5;
  }

  /* ====================================================
     DAILY CHALLENGE
     ==================================================== */
  function _renderDailyChallenge(profile) {
    const slot = document.getElementById('daily-challenge-slot');
    if (!slot || typeof getDailyChallengeInfo !== 'function') return;

    const d = today();
    const info = getDailyChallengeInfo(d);
    const cat  = QUIZ_CATEGORIES.find(c => c.id === info.category) || { name: info.category };
    const daily = profile.dailyChallengeData;
    const done  = daily && daily.date === d;

    slot.innerHTML = `
      <div class="daily-challenge-card${done ? ' dc-completed' : ''}"
           ${done ? '' : `onclick="Quiz.startDailyChallenge()"`}>
        <div class="dc-icon">⚡</div>
        <div class="dc-info">
          <div class="dc-title">Daily Challenge</div>
          <div class="dc-sub">${cat.name} · 1.5× point multiplier</div>
        </div>
        <div class="dc-badge${done ? ' dc-done' : ''}">
          ${done ? `✓ ${daily.score} pts` : 'Play Now'}
        </div>
      </div>`;
  }

  function startDailyChallenge() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) return;

    const d    = today();
    if (profile.dailyChallengeData?.date === d) {
      alert('You already completed today\'s Daily Challenge! Come back tomorrow.');
      return;
    }

    const info = getDailyChallengeInfo(d);
    state = {
      questions: info.questions, current: 0, score: 0, streak: 0,
      bestStreak: 0, correct: 0, answered: false, category: info.category,
      pointBooster: false, freezeArmed: false, fiftyFiftyUsed: false,
      isDaily: true, isChallenge: false, challengeId: null,
      wrongAnswers: [],
    };

    _hideAll();
    document.getElementById('quiz-active').classList.remove('hidden');
    updatePowerupBar();
    renderQuestion();
  }

  /* ====================================================
     DAILY MISSIONS
     ==================================================== */
  function _renderDailyMissions(profile) {
    const slot = document.getElementById('daily-missions-slot');
    if (!slot || typeof getDailyMissions !== 'function') return;

    const d        = today();
    const missions = getDailyMissions(d);
    const mdata    = (profile.dailyMissions?.date === d) ? profile.dailyMissions.progress : {};

    const resetTime = _timeUntilMidnight();

    slot.innerHTML = `
      <div class="missions-section">
        <div class="missions-header">
          <div class="missions-title"><i class="fas fa-list-check"></i> Daily Missions</div>
          <div class="missions-reset">Resets in ${resetTime}</div>
        </div>
        ${missions.map(m => {
          const prog = mdata[m.id]?.progress || 0;
          const done = mdata[m.id]?.completed || false;
          const pct  = Math.min(100, Math.round((prog / (typeof m.target === 'number' ? m.target : 1)) * 100));
          return `
            <div class="mission-card${done ? ' mc-done' : ''}">
              <div class="mission-icon">${m.icon}</div>
              <div class="mission-info">
                <div class="mission-label">${m.label}</div>
                <div class="mission-bar-wrap">
                  <div class="mission-bar-fill" style="width:${done ? 100 : pct}%"></div>
                </div>
              </div>
              <div class="mission-pts${done ? ' mc-done-pts' : ''}">+${m.pts} pts</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function _timeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  /* Update mission progress after a quiz ends */
  function _updateMissions(profile, quizResult) {
    if (typeof getDailyMissions !== 'function') return;
    const d        = today();
    const missions = getDailyMissions(d);

    if (!profile.dailyMissions || profile.dailyMissions.date !== d) {
      profile.dailyMissions = { date: d, progress: {} };
    }
    const mdata = profile.dailyMissions.progress;
    let bonusPts = 0;

    missions.forEach(m => {
      if (mdata[m.id]?.completed) return; // already done

      let prog = mdata[m.id]?.progress || 0;
      let newProg = prog;

      switch (m.type) {
        case 'quiz_count':    newProg = prog + 1; break;
        case 'streak':        newProg = Math.max(prog, quizResult.bestStreak); break;
        case 'perfect':       if (quizResult.perfect) newProg = 1; break;
        case 'scan_count':    newProg = prog; break; // handled in scanner.js
        case 'play_category': if (quizResult.category === m.target) newProg = 1; break;
        case 'accuracy':      if (quizResult.accuracy >= m.target) newProg = 1; break;
        case 'powerup_use':   if (quizResult.powerupUsed) newProg = 1; break;
      }

      const target = typeof m.target === 'number' ? m.target : 1;
      const done   = newProg >= target;
      mdata[m.id]  = { progress: newProg, completed: done };
      if (done && newProg !== prog) bonusPts += m.pts;
    });

    return bonusPts;
  }

  /* Update scan mission progress (called from scanner.js) */
  function updateScanMissions(scanCount) {
    if (typeof getDailyMissions !== 'function') return;
    const user = currentUser();
    const profile = getProfile(user);
    if (!profile) return;

    const d = today();
    const missions = getDailyMissions(d);
    if (!profile.dailyMissions || profile.dailyMissions.date !== d) {
      profile.dailyMissions = { date: d, progress: {} };
    }
    const mdata = profile.dailyMissions.progress;
    let bonusPts = 0;

    missions.filter(m => m.type === 'scan_count').forEach(m => {
      if (mdata[m.id]?.completed) return;
      const prev = mdata[m.id]?.progress || 0;
      const newP = Math.max(prev, scanCount);
      const done = newP >= m.target;
      mdata[m.id] = { progress: newP, completed: done };
      if (done && !mdata[m.id]?.wasAlreadyDone) bonusPts += m.pts;
    });

    if (bonusPts > 0) {
      profile.points      += bonusPts;
      profile.totalPoints  = (profile.totalPoints || 0) + bonusPts;
      saveProfile(profile);
    }
  }

  /* ====================================================
     QUIZ CATEGORIES
     ==================================================== */
  function buildQuizCategories() {
    const grid = document.getElementById('quiz-cat-grid');
    if (!grid) return;
    const user    = currentUser();
    const profile = getProfile(user);
    const catBests = profile?.catBests || {};
    const catPerfects = profile?.catPerfects || [];

    grid.innerHTML = QUIZ_CATEGORIES.map(cat => {
      const best   = catBests[cat.id] || 0;
      const played = best > 0;
      const star2  = best >= 70;
      const star3  = catPerfects.includes(cat.id);
      const stars  = `
        <div class="cat-stars">
          <span class="cat-star${played ? ' earned' : ''}">★</span>
          <span class="cat-star${star2  ? ' earned' : ''}">★</span>
          <span class="cat-star${star3  ? ' earned' : ''}">★</span>
        </div>`;
      return `
        <div class="quiz-cat-card" onclick="Quiz.startQuiz('${cat.id}')">
          <div class="cat-icon"><i class="fas ${cat.icon}"></i></div>
          <div class="cat-name">${cat.name}</div>
          <div class="cat-desc">${cat.desc}</div>
          ${stars}
          <div class="cat-meta">
            <span><i class="fas fa-question-circle"></i> 10 questions</span>
            <span class="cat-best" id="best-${cat.id}">${best ? 'Best: ' + best + ' pts' : ''}</span>
          </div>
        </div>`;
    }).join('');
  }

  function updateCatBests() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile?.catBests) return;
    for (const [catId, pts] of Object.entries(profile.catBests)) {
      const el = document.getElementById('best-' + catId);
      if (el) el.textContent = pts ? `Best: ${pts} pts` : '';
    }
  }

  function _updateSortGameStars(profile) {
    const badges = profile?.badges || [];
    const played  = badges.includes('sorter_played');
    const perfect = badges.includes('sorter_perfect');
    // Star 1 = played, Star 2 = played (always same), Star 3 = perfect
    const s1 = document.getElementById('sort-star-1');
    const s2 = document.getElementById('sort-star-2');
    const s3 = document.getElementById('sort-star-3');
    if (s1) s1.classList.toggle('earned', played);
    if (s2) s2.classList.toggle('earned', played);
    if (s3) s3.classList.toggle('earned', perfect);
  }

  function _renderFactStrip() {
    const slot = document.getElementById('fact-strip-slot');
    if (!slot || typeof RECYCLING_FACTS === 'undefined' || RECYCLING_FACTS.length === 0) return;
    const fact = RECYCLING_FACTS[Math.floor(Math.random() * RECYCLING_FACTS.length)];
    slot.innerHTML = `
      <div class="fact-strip">
        <span class="fact-strip-icon"><i class="fas fa-lightbulb"></i></span>
        <span class="fact-strip-label"><strong>Did you know?</strong> ${escapeHtml(fact)}</span>
      </div>`;
  }

  /* ====================================================
     GAME LOOP
     ==================================================== */
  function startQuiz(categoryId) {
    const pool = categoryId === 'mixed'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter(q => q.cat === categoryId);
    if (pool.length === 0) { alert('No questions available for this category yet.'); return; }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, _quizLength);
    state = {
      questions: shuffled, current: 0, score: 0, streak: 0,
      bestStreak: 0, correct: 0, answered: false, category: categoryId,
      pointBooster: false, freezeArmed: false, fiftyFiftyUsed: false,
      isDaily: false, isChallenge: false, challengeId: null,
      wrongAnswers: [],
    };

    _hideAll();
    document.getElementById('quiz-active').classList.remove('hidden');
    updatePowerupBar();
    renderQuestion();
  }

  /* Start a friend challenge with pre-seeded questions */
  function startChallengeQuiz(challengeId, questions, category) {
    state = {
      questions, current: 0, score: 0, streak: 0,
      bestStreak: 0, correct: 0, answered: false, category,
      pointBooster: false, freezeArmed: false, fiftyFiftyUsed: false,
      isDaily: false, isChallenge: true, challengeId,
      wrongAnswers: [],
    };
    _hideAll();
    document.getElementById('quiz-active').classList.remove('hidden');
    updatePowerupBar();
    renderQuestion();
  }

  function renderQuestion() {
    _stopTimer();
    _removeKeyHandler();

    const q     = state.questions[state.current];
    const num   = state.current + 1;
    const total = state.questions.length;

    document.getElementById('q-label').textContent    = `Question ${num} / ${total}`;
    document.getElementById('q-progress').style.width = `${(num / total) * 100}%`;
    document.getElementById('live-score').textContent = state.score;
    document.getElementById('streak-alert').classList.add('hidden');
    document.getElementById('answer-feedback').classList.add('hidden');

    // Live streak counter
    const streakWrap = document.getElementById('live-streak-wrap');
    const streakNum  = document.getElementById('live-streak-num');
    if (streakNum) streakNum.textContent = state.streak;
    if (streakWrap) streakWrap.classList.toggle('streak-active', state.streak >= 2);

    state.fiftyFiftyUsed = false;
    updatePowerupBar();

    const catInfo = QUIZ_CATEGORIES.find(c => c.id === q.cat) || { name: q.cat };
    document.getElementById('q-cat-label').textContent = catInfo.name;
    document.getElementById('question-text').textContent = q.q;

    const letters = ['A','B','C','D'];
    const opts = [...q.opts].map((opt, i) => ({ opt, origIdx: i })).sort(() => Math.random() - 0.5);

    document.getElementById('options-list').innerHTML = opts.map((item, i) => `
      <button class="option-btn" data-orig="${item.origIdx}" data-letter="${letters[i]}"
        onclick="Quiz._answer(this, ${item.origIdx})">
        <span class="option-letter">${letters[i]}</span>${escapeHtml(item.opt)}
      </button>`).join('');

    state.answered = false;

    if (state.current === 0 && _hardMode) {
      // Show 3-2-1 countdown only in hard mode
      _showCountdown(() => _activateQuestion());
    } else {
      _activateQuestion();
    }
  }

  function _activateQuestion() {
    _questionStartTime = Date.now();
    _keyHandler = (e) => {
      // Enter or Space → advance to next question after answering
      if (e.key === 'Enter' || e.key === ' ') {
        if (state.answered) {
          e.preventDefault();
          document.getElementById('next-btn')?.click();
        }
        return;
      }
      if (state.answered) return;
      // 1–4 → select answer
      const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (map[e.key] !== undefined) {
        const btns = document.querySelectorAll('.option-btn');
        if (btns[map[e.key]]) btns[map[e.key]].click();
      }
    };
    document.addEventListener('keydown', _keyHandler);
    if (_hardMode) _startTimer();
  }

  function _showCountdown(callback) {
    const overlay = document.getElementById('quiz-countdown-overlay');
    if (!overlay) { callback(); return; }
    overlay.style.display = 'flex';
    const steps = ['3', '2', '1', 'Go!'];
    let i = 0;
    function step() {
      overlay.textContent = steps[i];
      overlay.style.animation = 'none';
      void overlay.offsetWidth;
      overlay.style.animation = '';
      if (i < 3) window.Sounds?.tick?.(); else window.Sounds?.go?.();
      i++;
      if (i < steps.length) {
        setTimeout(step, 700);
      } else {
        setTimeout(() => {
          overlay.style.display = 'none';
          callback();
        }, 500);
      }
    }
    step();
  }

  /* ---- Hard Mode Timer ---- */
  function _startTimer() {
    const wrap = document.getElementById('timer-wrap');
    const fill = document.getElementById('timer-bar-fill');
    const cd   = document.getElementById('timer-countdown');
    if (!wrap) return;
    wrap.style.display = 'block';
    _timerSeconds = 15;
    _updateTimerUI();

    _timerInterval = setInterval(() => {
      _timerSeconds--;
      _updateTimerUI();
      if (_timerSeconds <= 0) {
        _stopTimer();
        // Time's up — auto-answer wrong
        if (!state.answered) {
          const btns = document.querySelectorAll('.option-btn');
          const q = state.questions[state.current];
          // Trigger wrong answer on first non-correct button
          const wrongBtn = [...btns].find(b => parseInt(b.dataset.orig) !== q.ans);
          if (wrongBtn) wrongBtn.click();
        }
      }
    }, 1000);
  }

  function _updateTimerUI() {
    const fill = document.getElementById('timer-bar-fill');
    const cd   = document.getElementById('timer-countdown');
    if (!fill || !cd) return;
    const pct = (_timerSeconds / 15) * 100;
    fill.style.width = pct + '%';
    cd.textContent   = _timerSeconds + 's';
    const warn = _timerSeconds <= 7;
    const crit = _timerSeconds <= 4;
    fill.className = 'timer-bar-fill' + (crit ? ' timer-crit' : warn ? ' timer-warn' : '');
    cd.className   = 'timer-countdown' + (crit ? ' timer-crit' : warn ? ' timer-warn' : '');
  }

  function _stopTimer() {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    const wrap = document.getElementById('timer-wrap');
    if (wrap) wrap.style.display = 'none';
  }

  function _removeKeyHandler() {
    if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  }

  /* ====================================================
     ANSWERING
     ==================================================== */
  function _answer(btn, chosenOrigIdx) {
    if (state.answered) return;
    state.answered = true;
    _stopTimer();
    _removeKeyHandler();

    const elapsed = (Date.now() - _questionStartTime) / 1000;
    const q       = state.questions[state.current];
    const correct = chosenOrigIdx === q.ans;

    document.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.orig) === q.ans) b.classList.add('correct');
      if (b === btn && !correct)              b.classList.add('wrong');
    });

    if (correct) {
      window.Sounds?.correct?.();
      state.streak++;
      state.correct++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;

      let pts = 10;
      // Streak bonus
      if (state.streak >= 3) {
        const bonus = Math.min((state.streak - 2) * 5, 25);
        pts += bonus;
        const alertEl = document.getElementById('streak-alert');
        alertEl.innerHTML = `<i class="fas fa-fire"></i> ${state.streak}× Streak! +${bonus} bonus pts!`;
        alertEl.classList.remove('hidden');
      }
      // Hard mode speed bonus (+5 if answered within 5s)
      if (_hardMode && elapsed <= 5) {
        pts += 5;
        const alertEl = document.getElementById('streak-alert');
        const current = alertEl.classList.contains('hidden') ? '' : alertEl.innerHTML + ' · ';
        alertEl.innerHTML = current + `<i class="fas fa-bolt"></i> Quick! +5 speed bonus!`;
        alertEl.classList.remove('hidden');
      }
      // Point booster
      if (state.pointBooster) pts = pts * 2;
      state.score += pts;
      document.getElementById('live-score').textContent = state.score;
    } else {
      window.Sounds?.wrong?.();
      if (!state.wrongAnswers) state.wrongAnswers = [];
      state.wrongAnswers.push({ q: state.questions[state.current], chosen: chosenOrigIdx });
      if (state.freezeArmed) {
        state.freezeArmed = false;
        const alertEl = document.getElementById('streak-alert');
        alertEl.innerHTML = `<i class="fas fa-snowflake"></i> Streak Freeze activated! Streak protected!`;
        alertEl.classList.remove('hidden');
        updatePowerupBar();
      } else {
        state.streak = 0;
      }
    }

    // Update live streak display after answer
    const streakNum  = document.getElementById('live-streak-num');
    const streakWrap = document.getElementById('live-streak-wrap');
    if (streakNum) streakNum.textContent = state.streak;
    if (streakWrap) {
      streakWrap.classList.toggle('streak-active', state.streak >= 2);
      streakWrap.classList.toggle('streak-frozen', state.freezeArmed);
    }

    const feedbackEl = document.getElementById('answer-feedback');
    document.getElementById('feedback-content').innerHTML = `
      <div class="fb-result ${correct ? 'correct' : 'wrong'}">
        <i class="fas fa-${correct ? 'check-circle' : 'circle-xmark'}"></i>
        ${correct ? 'Correct!' : 'Not quite.'}
      </div>
      <div class="fb-explanation">${q.exp}</div>`;
    feedbackEl.classList.remove('hidden');
  }

  function nextQuestion() {
    state.current++;
    if (state.current >= state.questions.length) endQuiz();
    else renderQuestion();
  }

  /* ====================================================
     END QUIZ
     ==================================================== */
  function endQuiz() {
    _stopTimer();
    _removeKeyHandler();

    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) return;

    // Apply score multipliers
    let finalScore = state.score;
    if (_hardMode)    finalScore = Math.round(finalScore * 1.2); // hard mode 1.2×
    if (state.isDaily) finalScore = Math.round(finalScore * 1.5); // daily challenge 1.5×

    profile.points      += finalScore;
    profile.totalPoints  = (profile.totalPoints || 0) + finalScore;
    profile.quizzes     += 1;
    profile.bestStreak   = Math.max(profile.bestStreak, state.bestStreak);
    if (!profile.catsPlayed) profile.catsPlayed = [];
    if (!profile.catsPlayed.includes(state.category)) profile.catsPlayed.push(state.category);
    if (!profile.catBests) profile.catBests = {};
    profile.catBests[state.category] = Math.max(profile.catBests[state.category] || 0, finalScore);

    // Perfect score tracking per category
    const perfect = state.correct === state.questions.length;
    if (perfect && state.category !== 'mixed') {
      if (!profile.catPerfects) profile.catPerfects = [];
      if (!profile.catPerfects.includes(state.category)) profile.catPerfects.push(state.category);
    }

    // Daily challenge record
    if (state.isDaily) {
      profile.dailyChallengeData = { date: today(), score: finalScore, correct: state.correct };
    }

    // Quiz history (last 20)
    if (!profile.quizHistory) profile.quizHistory = [];
    profile.quizHistory.unshift({
      date:     today(),
      category: state.category,
      score:    finalScore,
      correct:  state.correct,
      total:    state.questions.length,
      hardMode: _hardMode,
      isDaily:  state.isDaily,
    });
    if (profile.quizHistory.length > 20) profile.quizHistory = profile.quizHistory.slice(0, 20);

    // Track play dates for streak calendar (deduplicated by date)
    if (!profile.playDates) profile.playDates = [];
    if (!profile.playDates.includes(today())) profile.playDates.push(today());

    // Daily missions update
    const accuracy = Math.round((state.correct / state.questions.length) * 100);
    const missionBonus = _updateMissions(profile, {
      bestStreak: state.bestStreak,
      perfect,
      category:   state.category,
      accuracy,
      powerupUsed: (profile.powerupsUsed || 0) > 0,
    }) || 0;

    if (missionBonus > 0) {
      profile.points      += missionBonus;
      profile.totalPoints  = (profile.totalPoints || 0) + missionBonus;
    }

    // Challenge friend — write result back to Firestore
    if (state.isChallenge && state.challengeId) {
      window.AuthModule?.markChallengeComplete?.(state.challengeId, finalScore);
    }

    // Achievements
    const statObj = {
      quizzes:      profile.quizzes,
      totalPoints:  profile.totalPoints,
      bestStreak:   profile.bestStreak,
      lastPerfect:  perfect,
      catsPlayed:   new Set(profile.catsPlayed),
      catPerfects:  new Set(profile.catPerfects || []),
      friendsAdded: loadFriends().length,
      scanCount:    profile.scanCount     || 0,
      powerupsUsed: profile.powerupsUsed  || 0,
    };
    if (!profile.badges) profile.badges = [];
    const newBadges = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!profile.badges.includes(ach.id) && ach.req(statObj)) {
        profile.badges.push(ach.id);
        newBadges.push(ach);
      }
    });

    saveProfile(profile);
    showResults(newBadges, finalScore, missionBonus);
  }

  /* ====================================================
     RESULTS
     ==================================================== */
  function showResults(newBadges, finalScore, missionBonus = 0) {
    _hideAll();
    document.getElementById('quiz-results').classList.remove('hidden');

    const pct     = Math.round((state.correct / state.questions.length) * 100);
    const emojis  = pct === 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 40 ? '👍' : '🌱';
    const heading = pct === 100 ? 'Perfect Score!' : pct >= 70 ? 'Great Job!' : pct >= 40 ? 'Nice Try!' : 'Keep Learning!';
    const sub     = pct === 100
      ? 'You answered every question correctly!'
      : `You got ${state.correct} out of ${state.questions.length} correct.`;

    document.getElementById('results-emoji').textContent   = emojis;
    document.getElementById('results-heading').textContent = heading;
    document.getElementById('results-subtext').textContent = sub;
    const ptsLabel = [
      state.isDaily ? '1.5×' : '',
      _hardMode     ? '1.2×' : '',
    ].filter(Boolean).join(' · ');
    document.getElementById('r-pts').textContent = '+' + finalScore + (ptsLabel ? ` (${ptsLabel})` : '');
    document.getElementById('r-correct').textContent = `${state.correct}/${state.questions.length}`;
    document.getElementById('r-streak').textContent  = state.bestStreak;
    document.getElementById('r-acc').textContent     = pct + '%';

    const badgesSec  = document.getElementById('new-badges-section');
    const badgesList = document.getElementById('new-badges-list');
    if (newBadges.length > 0) {
      let html = newBadges.map(b => `<span class="badge-pill">${b.icon} ${b.name}</span>`).join('');
      if (missionBonus > 0) html += `<span class="badge-pill">🎯 Mission Bonus: +${missionBonus} pts!</span>`;
      badgesList.innerHTML = html;
      badgesSec.classList.remove('hidden');
      // Toast each new badge
      newBadges.forEach(b => {
        window.Toast?.show?.(`${b.icon} Badge unlocked: ${b.name}!`, 'badge', 4000);
      });
    } else if (missionBonus > 0) {
      badgesList.innerHTML = `<span class="badge-pill">🎯 Mission Bonus: +${missionBonus} pts!</span>`;
      badgesSec.classList.remove('hidden');
      window.Toast?.show?.(`🎯 Mission complete! +${missionBonus} pts`, 'success', 3500);
    } else {
      badgesSec.classList.add('hidden');
    }

    // Toast for quiz result
    if (pct === 100) {
      window.Toast?.show?.('🏆 Perfect score! Incredible!', 'success', 4000);
    } else if (pct >= 70) {
      window.Toast?.show?.(`⭐ Great job! You scored ${finalScore} pts`, 'success', 3000);
    }

    // Confetti — big burst for perfect score, small pop for any new badge
    if (typeof confetti !== 'undefined') {
      if (pct === 100) {
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 } });
        setTimeout(() => confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0 } }), 400);
        setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 600);
      } else if (newBadges.length > 0) {
        confetti({ particleCount: 70, spread: 55, origin: { y: 0.6 },
          colors: ['#16a34a','#fbbf24','#3b82f6','#f97316'] });
      }
    }

    // Missed questions review
    const missedSec = document.getElementById('missed-questions-section');
    if (missedSec) {
      const wrongs = state.wrongAnswers || [];
      if (wrongs.length === 0) {
        missedSec.classList.add('hidden');
      } else {
        missedSec.classList.remove('hidden');
        const catName = id => (QUIZ_CATEGORIES.find(c => c.id === id) || { name: id }).name;
        missedSec.innerHTML = `
          <details class="missed-questions">
            <summary>
              <i class="fas fa-book-open"></i>
              Review ${wrongs.length} Missed Question${wrongs.length !== 1 ? 's' : ''}
            </summary>
            <div>
              ${wrongs.map((w, idx) => {
                const q = w.q;
                const chosenText  = q.opts[w.chosen] ?? '(no answer)';
                const correctText = q.opts[q.ans];
                return `
                  <div class="missed-item">
                    <div class="missed-q"><span class="missed-num">${idx + 1}.</span> ${escapeHtml(q.q)}</div>
                    <div class="missed-your"><i class="fas fa-times-circle"></i> Your answer: <strong>${escapeHtml(chosenText)}</strong></div>
                    <div class="missed-right"><i class="fas fa-check-circle"></i> Correct: <strong>${escapeHtml(correctText)}</strong></div>
                    <div class="missed-exp">${escapeHtml(q.exp)}</div>
                  </div>`;
              }).join('')}
            </div>
          </details>`;
      }
    }
  }

  function playAgain() { startQuiz(state.category); }
  function goHome()    { showHome(); }
  function exit()      {
    if (confirm('Exit quiz? Your progress will not be saved.')) showHome();
  }

  function shareScore() {
    const catInfo = QUIZ_CATEGORIES.find(c => c.id === state.category) || { name: state.category };
    const pct     = Math.round((state.correct / state.questions.length) * 100);
    const emoji   = pct === 100 ? '🏆' : pct >= 70 ? '⭐' : '🌱';
    const fallbackText = `${emoji} I scored ${pct}% on the "${catInfo.name}" quiz in RecycleRight! Can you beat me? 🌍♻️`;

    // Build share card canvas
    const canvas  = document.createElement('canvas');
    canvas.width  = 600;
    canvas.height = 320;
    const ctx     = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 320);
    grad.addColorStop(0, '#15803d');
    grad.addColorStop(1, '#166534');
    ctx.fillStyle = grad;
    _ctxRoundRect(ctx, 0, 0, 600, 320, 18);
    ctx.fill();

    // Subtle dot pattern overlay
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < 600; x += 24) {
      for (let y = 0; y < 320; y += 24) {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // App title
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font      = '600 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♻️  RecycleRight', 300, 44);

    // Category pill background
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    _ctxRoundRect(ctx, 180, 56, 240, 30, 15);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font      = '500 14px system-ui, sans-serif';
    ctx.fillText(catInfo.name, 300, 76);

    // Big score
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 96px system-ui, sans-serif';
    ctx.fillText(pct + '%', 300, 185);

    // Sub stats row
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font      = '500 16px system-ui, sans-serif';
    ctx.fillText(`${state.correct}/${state.questions.length} correct  ·  Best streak: ${state.bestStreak}`, 300, 220);

    // Points earned
    ctx.fillStyle = '#86efac'; // green-300
    ctx.font      = 'bold 22px system-ui, sans-serif';
    ctx.fillText(emoji + '  +' + (document.getElementById('r-pts')?.textContent || '?') + ' pts', 300, 265);

    // Footer CTA
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font      = '14px system-ui, sans-serif';
    ctx.fillText('Can you beat me?  recycleright.app', 300, 304);

    // Try sharing as image file, fall back to plain text
    canvas.toBlob(blob => {
      if (!blob) { _shareText(fallbackText); return; }
      const file = new File([blob], 'recycleright-score.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        navigator.share({ files: [file], title: 'RecycleRight Score', text: fallbackText }).catch(() => {});
      } else if (navigator.share) {
        navigator.share({ title: 'RecycleRight Quiz Score', text: fallbackText }).catch(() => {});
      } else {
        // Desktop: download the image
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = 'recycleright-score.png';
        a.click();
        URL.revokeObjectURL(url);
        window.Toast?.show?.('🖼️ Score card downloaded!', 'success', 3000);
      }
    }, 'image/png');
  }

  /* Draw a rounded rectangle path */
  function _ctxRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function _shareText(text) {
    if (navigator.share) {
      navigator.share({ title: 'RecycleRight Quiz Score', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        window.Toast?.show?.('Score copied to clipboard!', 'info', 3000);
      }).catch(() => {
        window.Toast?.show?.(text, 'info', 5000);
      });
    }
  }

  /* ====================================================
     SORTING MINI-GAME
     ==================================================== */
  function startSortGame() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) { alert('Create a profile first!'); return; }

    // Pick 10 random items from RECYCLING_ITEMS
    const pool = [...RECYCLING_ITEMS].sort(() => Math.random() - 0.5).slice(0, 10);
    _sortState = { items: pool, current: 0, score: 0, correct: 0, answered: false };

    _hideAll();
    document.getElementById('quiz-sort-game').classList.remove('hidden');

    // Remove any results overlay from a previous run
    document.getElementById('sort-results-overlay')?.remove();

    // Reset game UI to initial state
    const labels  = document.getElementById('sort-q-label');
    const score   = document.getElementById('sort-live-score');
    const nameEl  = document.getElementById('sort-item-name');
    const tipEl   = document.getElementById('sort-item-tip');
    const feedback= document.getElementById('sort-feedback');
    const bins    = document.querySelectorAll('.sort-bin-btn');

    if (labels)   labels.textContent  = 'Item 1 / 10';
    if (score)    score.textContent   = '0';
    if (nameEl)   nameEl.textContent  = '';
    if (tipEl)    tipEl.textContent   = '';
    if (feedback) feedback.classList.add('hidden');
    bins.forEach(b => { b.disabled = false; b.classList.remove('correct','wrong'); });

    _renderSortItem();
    document.getElementById('sort-next-btn').onclick = _sortNext;
  }

  function _renderSortItem() {
    const item = _sortState.items[_sortState.current];
    const num  = _sortState.current + 1;
    const tot  = _sortState.items.length;

    document.getElementById('sort-q-label').textContent     = `Item ${num} / ${tot}`;
    document.getElementById('sort-live-score').textContent  = _sortState.score;
    document.getElementById('sort-item-tip').textContent    = '';
    document.getElementById('sort-feedback').classList.add('hidden');

    // Animate item card in
    const card   = document.getElementById('sort-item-card');
    const nameEl = document.getElementById('sort-item-name');
    if (card) {
      card.classList.remove('sort-item-enter');
      void card.offsetWidth; // reflow to restart animation
      card.classList.add('sort-item-enter');
    }
    if (nameEl) nameEl.textContent = item.name;

    // Reset bin button states
    document.querySelectorAll('.sort-bin-btn').forEach(b => {
      b.disabled = false;
      b.classList.remove('correct', 'wrong');
    });
    _sortState.answered = false;
  }

  function _sortAnswer(binId) {
    if (_sortState.answered) return;
    _sortState.answered = true;

    const item    = _sortState.items[_sortState.current];
    const correct = binId === item.status;

    // Flash button state
    document.querySelectorAll('.sort-bin-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.bin === item.status) b.classList.add('correct');
      if (b.dataset.bin === binId && !correct) b.classList.add('wrong');
    });

    if (correct) {
      _sortState.score   += 10;
      _sortState.correct += 1;
    }

    const binLabels = { yes: '♻️ Recycle', no: '🗑️ Trash', special: '📦 Special Drop-Off', check: '❓ Check Locally' };
    const feedbackEl = document.getElementById('sort-feedback');
    document.getElementById('sort-feedback-text').innerHTML = `
      <div class="fb-result ${correct ? 'correct' : 'wrong'}">
        <i class="fas fa-${correct ? 'check-circle' : 'circle-xmark'}"></i>
        ${correct ? 'Correct!' : `Not quite — this goes in <strong>${binLabels[item.status]}</strong>`}
      </div>
      <div class="fb-explanation" style="font-size:.85rem;color:var(--gray-600);margin-top:4px">${escapeHtml(item.tip)}</div>`;
    feedbackEl.classList.remove('hidden');
  }

  function _sortNext() {
    _sortState.current++;
    if (_sortState.current >= _sortState.items.length) {
      _endSortGame();
    } else {
      _renderSortItem();
    }
  }

  function _endSortGame() {
    const total   = _sortState.items.length;
    const correct = _sortState.correct;
    const pct     = Math.round((correct / total) * 100);
    const perfect = correct === total;

    // Award points and achievements
    const user    = currentUser();
    const profile = getProfile(user);
    if (profile) {
      const earned = _sortState.score;
      profile.points      = (profile.points || 0) + earned;
      profile.totalPoints = (profile.totalPoints || 0) + earned;
      if (!profile.badges) profile.badges = [];
      if (!profile.badges.includes('sorter_played')) {
        profile.badges.push('sorter_played');
        window.Toast?.show?.('🎮 Badge unlocked: Bin Basics!', 'badge', 4000);
      }
      if (perfect && !profile.badges.includes('sorter_perfect')) {
        profile.badges.push('sorter_perfect');
        window.Toast?.show?.('🏆 Badge unlocked: Master Sorter!', 'badge', 4000);
      }
      saveProfile(profile);
    }

    if (perfect && typeof confetti !== 'undefined') {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.55 } });
    }

    // Overlay results on top without destroying the game HTML
    const screen = document.getElementById('quiz-sort-game');
    const overlay = document.createElement('div');
    overlay.id = 'sort-results-overlay';
    overlay.className = 'sort-results-overlay';
    overlay.innerHTML = `
      <div class="sort-results-card">
        <div class="results-emoji" style="font-size:3rem">${perfect ? '🏆' : pct >= 70 ? '⭐' : '🌱'}</div>
        <h2>${perfect ? 'Perfect Sort!' : pct >= 70 ? 'Nice Work!' : 'Keep Practicing!'}</h2>
        <p style="color:var(--gray-600);margin:6px 0 1.5rem">${correct} / ${total} items sorted correctly · <strong>+${_sortState.score} pts</strong></p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" onclick="Quiz.startSortGame()">
            <i class="fas fa-redo"></i> Play Again
          </button>
          <button class="btn btn-outline btn-lg" onclick="Quiz.goHome()">
            <i class="fas fa-home"></i> Menu
          </button>
        </div>
      </div>`;
    screen.appendChild(overlay);
  }

  function exitSortGame() {
    if (confirm('Exit the sorting game?')) showHome();
  }

  /* ====================================================
     LEADERBOARD
     ==================================================== */
  function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    document.querySelectorAll('.lb-type-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.lb-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _lbMode = btn.dataset.lb;
        if (_lbMode === 'friends') {
          if (_lbUnsubscribe) { _lbUnsubscribe(); _lbUnsubscribe = null; }
          _renderFriendsLeaderboard();
        } else {
          _subscribeLeaderboardData();
        }
      };
      btn.classList.toggle('active', btn.dataset.lb === _lbMode);
    });

    if (!window.AuthModule?.isAvailable || !window.AuthModule?.currentUser) {
      container.innerHTML = `
        <div class="lb-signin-prompt">
          <i class="fas fa-trophy fa-2x"></i>
          <p>Sign in with Google to see the live leaderboard.</p>
          <button class="btn btn-primary" onclick="AuthModule.signInWithGoogle()">
            <i class="fab fa-google"></i> Sign In
          </button>
        </div>`;
      _renderLbBadges();
      return;
    }

    if (_lbMode === 'friends') {
      _renderFriendsLeaderboard();
    } else {
      _subscribeLeaderboardData();
    }
    _renderLbBadges();
  }

  function _renderFriendsLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    const friends = loadFriends();
    const user    = currentUser();
    const profile = getProfile(user);

    if (friends.length === 0) {
      container.innerHTML = `
        <div class="lb-signin-prompt">
          <i class="fas fa-users fa-2x"></i>
          <p>You have no friends added yet! Add friends from the <strong>Profile</strong> tab.</p>
        </div>`;
      return;
    }

    // Include self in the comparison
    const selfEntry = profile ? {
      username: profile.username, avatarIdx: profile.avatarIdx,
      points: profile.points || 0, totalPoints: profile.totalPoints || 0,
      quizzes: profile.quizzes || 0, selectedTitle: profile.selectedTitle,
      equippedFrame: profile.equippedFrame, isMe: true,
    } : null;

    const allEntries = [...friends.map(f => ({ ...f, isMe: false })), ...(selfEntry ? [selfEntry] : [])];
    allEntries.sort((a, b) => (b.points || 0) - (a.points || 0));

    container.innerHTML = allEntries.map((entry, i) => {
      const rankClass  = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const rankLabel  = i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`;
      const titleLabel = TITLES ? (TITLES.find(t => t.id === entry.selectedTitle) || TITLES[0]).label : '';
      const frameCss   = FRAMES?.find(f => f.id === entry.equippedFrame)?.css || '';
      const avatarHtml = frameCss
        ? `<div class="avatar-frame-wrap ${frameCss}" style="width:36px;height:36px;font-size:1.5rem">${AVATARS[entry.avatarIdx || 0]}</div>`
        : `<div class="lb-avatar">${AVATARS[entry.avatarIdx || 0]}</div>`;
      return `
        <div class="lb-entry ${entry.isMe ? 'is-me' : ''}">
          <div class="lb-rank ${rankClass}">${rankLabel}</div>
          ${avatarHtml}
          <div class="lb-info">
            <div class="lb-name">
              ${escapeHtml(entry.displayName || entry.username)}
              <span class="lb-title-badge">${escapeHtml(titleLabel)}</span>
            </div>
            <div class="lb-sub">@${escapeHtml(entry.username)} · ${entry.quizzes || 0} quizzes${entry.isMe ? ' · <strong>You</strong>' : ''}</div>
          </div>
          <div class="lb-score">${(entry.points || 0).toLocaleString()}<small>pts</small></div>
        </div>`;
    }).join('');
  }

  function _subscribeLeaderboardData() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    if (_lbUnsubscribe) { _lbUnsubscribe(); _lbUnsubscribe = null; }
    container.innerHTML = `<div class="lb-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

    const orderField = _lbMode === 'total' ? 'totalPoints' : 'points';
    _lbUnsubscribe = window.AuthModule.subscribeLeaderboard(entries => {
      if (entries.length === 0) {
        container.innerHTML = '<p class="lb-empty">No players yet — be the first!</p>';
      } else {
        container.innerHTML = entries.map((entry, i) => {
          const rankClass  = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          const rankLabel  = i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`;
          const titleLabel = TITLES ? (TITLES.find(t => t.id === entry.selectedTitle) || TITLES[0]).label : '';
          const pts = _lbMode === 'total' ? (entry.totalPoints || 0) : entry.points;
          const frameCss = FRAMES?.find(f => f.id === entry.equippedFrame)?.css || '';
          const avatarHtml = frameCss
            ? `<div class="avatar-frame-wrap ${frameCss}" style="width:36px;height:36px;font-size:1.5rem">${AVATARS[entry.avatarIdx || 0]}</div>`
            : `<div class="lb-avatar">${AVATARS[entry.avatarIdx || 0]}</div>`;
          return `
            <div class="lb-entry ${entry.isMe ? 'is-me' : ''}">
              <div class="lb-rank ${rankClass}">${rankLabel}</div>
              ${avatarHtml}
              <div class="lb-info">
                <div class="lb-name">
                  ${escapeHtml(entry.displayName || entry.username)}
                  <span class="lb-title-badge">${escapeHtml(titleLabel)}</span>
                </div>
                <div class="lb-sub">@${escapeHtml(entry.username)} · ${entry.quizzes} quizzes${entry.isMe ? ' · <strong>You</strong>' : ''}</div>
              </div>
              <div class="lb-score">${pts.toLocaleString()}<small>pts</small></div>
            </div>`;
        }).join('');
      }
      _renderLbBadges();
    }, orderField);
  }

  /* ====================================================
     POWER-UPS
     ==================================================== */
  function updatePowerupBar() {
    const user    = currentUser();
    const profile = getProfile(user);
    const pu      = profile?.powerups || {};
    const admin   = window.AuthModule?.isAdmin === true;
    const defs = [
      { id:'fifty_fifty',   el:'pu-btn-5050',  },
      { id:'streak_freeze', el:'pu-btn-freeze', },
      { id:'point_booster', el:'pu-btn-boost',  },
    ];
    defs.forEach(({ id, el }) => {
      const btn   = document.getElementById(el);
      const count = admin ? '∞' : (pu[id] || 0);
      const hasAny = admin || (pu[id] || 0) > 0;
      if (!btn) return;
      btn.disabled = !hasAny
        || (id === 'fifty_fifty'   && state.fiftyFiftyUsed)
        || (id === 'streak_freeze' && state.freezeArmed)
        || (id === 'point_booster' && state.pointBooster);
      btn.querySelector('.pu-count').textContent = count;
      btn.classList.toggle('pu-empty',  !hasAny);
      btn.classList.toggle('pu-armed',  id === 'streak_freeze' && state.freezeArmed);
      btn.classList.toggle('pu-active', id === 'point_booster' && state.pointBooster);
      btn.classList.toggle('pu-used',   id === 'fifty_fifty'   && state.fiftyFiftyUsed);
    });
  }

  function usePowerup(puId) {
    if (state.answered && puId === 'fifty_fifty') return;
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) return;
    const admin = window.AuthModule?.isAdmin === true;
    const count = profile.powerups?.[puId] || 0;
    if (!admin && count <= 0) return; // admins bypass the count check

    switch (puId) {
      case 'fifty_fifty': {
        if (state.fiftyFiftyUsed) return;
        const q = state.questions[state.current];
        const wrongs = [...document.querySelectorAll('.option-btn')]
          .filter(b => parseInt(b.dataset.orig) !== q.ans);
        wrongs.sort(() => Math.random() - 0.5).slice(0, 2).forEach(b => {
          b.disabled = true;
          b.classList.add('pu-eliminated');
        });
        state.fiftyFiftyUsed = true;
        break;
      }
      case 'streak_freeze':
        if (state.freezeArmed) return;
        state.freezeArmed = true;
        break;
      case 'point_booster':
        if (state.pointBooster) return;
        state.pointBooster = true;
        const scoreEl = document.getElementById('live-score');
        if (scoreEl) scoreEl.parentElement.classList.add('score-boosted');
        break;
      default: return;
    }

    const admin = window.AuthModule?.isAdmin === true;
    if (!profile.powerups) profile.powerups = {};
    if (!admin) profile.powerups[puId] = Math.max(0, (profile.powerups[puId] || 0) - 1);
    profile.powerupsUsed = (profile.powerupsUsed || 0) + 1;
    if (!profile.badges) profile.badges = [];
    if (!profile.badges.includes('power_user')) profile.badges.push('power_user');

    saveProfile(profile);
    updatePowerupBar();
  }

  /* ====================================================
     LEADERBOARD BADGES PANEL
     ==================================================== */
  function _renderLbBadges() {
    const section = document.getElementById('lb-badges-section');
    if (!section || !ACHIEVEMENTS) return;
    const user    = currentUser();
    const profile = getProfile(user);
    const earned  = profile?.badges || [];
    const inventory = ACHIEVEMENTS.filter(a =>  earned.includes(a.id));
    const available = ACHIEVEMENTS.filter(a => !earned.includes(a.id));
    section.innerHTML = `
      <div class="lb-badges-wrap">
        <div class="lb-badges-group">
          <div class="lb-badges-header"><i class="fas fa-archive"></i> Your Inventory (${inventory.length}/${ACHIEVEMENTS.length})</div>
          <div class="lb-badge-icons">
            ${inventory.length === 0
              ? '<span class="lb-empty-small">Complete quizzes to earn badges!</span>'
              : inventory.map(a => `<div class="lb-badge-icon earned" title="${a.name}: ${a.desc}">${a.icon}</div>`).join('')}
          </div>
        </div>
        <div class="lb-badges-group">
          <div class="lb-badges-header"><i class="fas fa-medal"></i> Badges to Earn (${available.length})</div>
          <div class="lb-badge-icons">
            ${available.map(a => `<div class="lb-badge-icon locked" title="${a.name}: ${a.desc}">${a.icon}</div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  /* ====================================================
     FRIENDS (by username via Firestore)
     ==================================================== */
  async function _addFriendByUsername() {
    const input = document.getElementById('friend-username-input');
    const msgEl = document.getElementById('friend-msg');
    const username = (input?.value || '').trim().toLowerCase();
    msgEl.className = 'friend-msg';
    if (!username) { msgEl.textContent = 'Enter a username to search.'; msgEl.classList.add('error'); return; }
    if (!window.AuthModule?.isAvailable || !window.AuthModule?.currentUser) {
      msgEl.textContent = 'Sign in with Google to add friends.'; msgEl.classList.add('error'); return;
    }
    msgEl.textContent = 'Searching...';
    const found = await window.AuthModule.findUserByUsername(username);
    if (!found) { msgEl.textContent = `No user found with username "${username}".`; msgEl.classList.add('error'); return; }
    if (found.uid === window.AuthModule.currentUser?.uid) { msgEl.textContent = "That's you!"; msgEl.classList.add('error'); return; }
    const friends = loadFriends();
    if (friends.find(f => f.uid === found.uid)) {
      msgEl.textContent = `${found.username} is already your friend.`; msgEl.classList.add('error'); return;
    }
    friends.push({ uid: found.uid, username: found.username, avatarIdx: found.avatarIdx || 0, points: found.points || 0, quizzes: found.quizzes || 0, bestStreak: found.bestStreak || 0 });
    saveFriends(friends);
    const user = currentUser();
    const profile = getProfile(user);
    if (profile && !profile.badges.includes('friend_added')) {
      profile.badges.push('friend_added');
      saveProfile(profile);
    }
    input.value = '';
    msgEl.textContent = `Added ${found.username} as a friend!`;
    msgEl.classList.add('success');
    renderFriends();
  }

  function renderFriends() {
    const friends   = loadFriends();
    const container = document.getElementById('friends-list');
    if (!container) return;
    const isSignedIn = window.AuthModule?.isAvailable && window.AuthModule?.currentUser;
    if (!isSignedIn) {
      container.innerHTML = `
        <div class="friends-empty">
          <i class="fas fa-users fa-2x"></i>
          <p>Sign in with Google to add and view friends.</p>
          <button class="btn btn-primary btn-sm" onclick="AuthModule.signInWithGoogle()">
            <i class="fab fa-google"></i> Sign In
          </button>
        </div>`;
      return;
    }
    if (friends.length === 0) {
      container.innerHTML = '<p class="friends-empty"><i class="fas fa-user-plus"></i> No friends yet — search by username above!</p>';
      return;
    }
    container.innerHTML = friends.sort((a, b) => b.points - a.points).map(f => `
      <div class="friend-entry">
        <div class="friend-avatar">${AVATARS[f.avatarIdx || 0]}</div>
        <div class="friend-info">
          <div class="friend-name">${escapeHtml(f.username)}</div>
          <div class="friend-meta">Lv ${calcLevel(f.points)} · ${f.quizzes || 0} quizzes · Best streak: ${f.bestStreak || 0}</div>
        </div>
        <div class="friend-score">${(f.points || 0).toLocaleString()} pts</div>
      </div>`).join('');
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  const publicAPI = {
    init, startQuiz, startDailyChallenge, startChallengeQuiz,
    playAgain, goHome, exit,
    shareScore,
    startSortGame, exitSortGame, _sortAnswer,
    _answer, _selectAvatar,
    _addFriendByUsername,
    usePowerup,
    updateScanMissions,
    reload: _decideScreen,
  };
  window.QuizModule = publicAPI;
  return publicAPI;
})();
