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

  /* ---- Leaderboard live listener handle ---- */
  let _lbUnsubscribe = null;
  let _lbMode = 'current'; // 'current' | 'total'

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

    _decideScreen();
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
    ['quiz-profile-setup','quiz-google-setup','quiz-home','quiz-active','quiz-results']
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

    updateCatBests();
    _renderDailyChallenge(profile);
    _renderDailyMissions(profile);
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
      const user = currentUser();
      if (user && getProfile(user)) showHome(); else showSetup();
    }
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
    grid.innerHTML = QUIZ_CATEGORIES.map(cat => `
      <div class="quiz-cat-card" onclick="Quiz.startQuiz('${cat.id}')">
        <div class="cat-icon"><i class="fas ${cat.icon}"></i></div>
        <div class="cat-name">${cat.name}</div>
        <div class="cat-desc">${cat.desc}</div>
        <div class="cat-meta">
          <span><i class="fas fa-question-circle"></i> 10 questions</span>
          <span class="cat-best" id="best-${cat.id}"></span>
        </div>
      </div>`).join('');
  }

  function updateCatBests() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile?.catBests) return;
    for (const [catId, pts] of Object.entries(profile.catBests)) {
      const el = document.getElementById('best-' + catId);
      if (el) el.textContent = `Best: ${pts} pts`;
    }
  }

  /* ====================================================
     GAME LOOP
     ==================================================== */
  function startQuiz(categoryId) {
    const pool = categoryId === 'mixed'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter(q => q.cat === categoryId);
    if (pool.length === 0) { alert('No questions available for this category yet.'); return; }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    state = {
      questions: shuffled, current: 0, score: 0, streak: 0,
      bestStreak: 0, correct: 0, answered: false, category: categoryId,
      pointBooster: false, freezeArmed: false, fiftyFiftyUsed: false,
      isDaily: false, isChallenge: false, challengeId: null,
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
    _questionStartTime = Date.now();

    // Keyboard shortcuts
    _keyHandler = (e) => {
      if (state.answered) return;
      const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (map[e.key] !== undefined) {
        const btns = document.querySelectorAll('.option-btn');
        if (btns[map[e.key]]) btns[map[e.key]].click();
      }
    };
    document.addEventListener('keydown', _keyHandler);

    // Hard mode timer
    if (_hardMode) _startTimer();
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
    if (streakWrap) streakWrap.classList.toggle('streak-active', state.streak >= 2);

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

    // 1.5× multiplier for daily challenge
    let finalScore = state.score;
    if (state.isDaily) finalScore = Math.round(finalScore * 1.5);

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
    document.getElementById('r-pts').textContent     = '+' + finalScore + (state.isDaily ? ' (1.5×!)' : '');
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
    } else if (missionBonus > 0) {
      badgesList.innerHTML = `<span class="badge-pill">🎯 Mission Bonus: +${missionBonus} pts!</span>`;
      badgesSec.classList.remove('hidden');
    } else {
      badgesSec.classList.add('hidden');
    }

    // Confetti on perfect score
    if (pct === 100 && typeof confetti !== 'undefined') {
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 } });
      setTimeout(() => confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0 } }), 400);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 600);
    }
  }

  function playAgain() { startQuiz(state.category); }
  function goHome()    { showHome(); }
  function exit()      {
    if (confirm('Exit quiz? Your progress will not be saved.')) showHome();
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
        _subscribeLeaderboardData();
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

    _subscribeLeaderboardData();
    _renderLbBadges();
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
    const defs = [
      { id:'fifty_fifty',   el:'pu-btn-5050',  },
      { id:'streak_freeze', el:'pu-btn-freeze', },
      { id:'point_booster', el:'pu-btn-boost',  },
    ];
    defs.forEach(({ id, el }) => {
      const btn   = document.getElementById(el);
      const count = pu[id] || 0;
      if (!btn) return;
      btn.disabled = count <= 0
        || (id === 'fifty_fifty'   && state.fiftyFiftyUsed)
        || (id === 'streak_freeze' && state.freezeArmed)
        || (id === 'point_booster' && state.pointBooster);
      btn.querySelector('.pu-count').textContent = count;
      btn.classList.toggle('pu-empty',  count <= 0);
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
    const count = profile.powerups?.[puId] || 0;
    if (count <= 0) return;

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

    if (!profile.powerups) profile.powerups = {};
    profile.powerups[puId] = Math.max(0, (profile.powerups[puId] || 0) - 1);
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
    _answer, _selectAvatar,
    _addFriendByUsername,
    usePowerup,
    updateScanMissions,
    reload: _decideScreen,
  };
  window.QuizModule = publicAPI;
  return publicAPI;
})();
