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
  };

  /* ---- Leaderboard live listener handle ---- */
  let _lbUnsubscribe = null;

  /* ====================================================
     STORAGE HELPERS
     ==================================================== */
  function loadProfiles()  { return JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]'); }
  function saveProfiles(p) { localStorage.setItem(KEY_PROFILES, JSON.stringify(p)); }
  function loadFriends()   { return JSON.parse(localStorage.getItem(KEY_FRIENDS)  || '[]'); }
  function saveFriends(f)  { localStorage.setItem(KEY_FRIENDS, JSON.stringify(f)); }
  function currentUser()   { return localStorage.getItem(KEY_CURRENT) || null; }
  function setCurrentUser(u) { localStorage.setItem(KEY_CURRENT, u); }

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
          // Cancel leaderboard listener when leaving
          if (_lbUnsubscribe) { _lbUnsubscribe(); _lbUnsubscribe = null; }
        }
      });
    });

    // Initial screen is decided by reload()
    _decideScreen();
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

  /* Guest / local profile creation */
  function createProfile() {
    const input = document.getElementById('setup-username');
    const errEl = document.getElementById('setup-error');
    const username = input.value.trim();

    if (!username) { errEl.textContent = 'Please enter a username.'; return; }
    if (username.length < 4) { errEl.textContent = 'Username must be at least 4 characters.'; return; }
    if (username.length > 20) { errEl.textContent = 'Username must be 20 characters or fewer.'; return; }
    if (/[^a-zA-Z0-9_]/.test(username)) { errEl.textContent = 'Only letters, numbers, and underscores allowed.'; return; }
    if (window.ProfileModule?.isProfane?.(username)) { errEl.textContent = 'That username is not allowed. Please choose another.'; return; }
    if (getProfile(username)) { errEl.textContent = 'That username is already taken on this device.'; return; }

    errEl.textContent = '';
    const profile = newProfile(username, selectedAvatar);
    saveProfile(profile);
    setCurrentUser(username);
    showHome();
  }

  /* Google-authenticated user picking a username for the first time */
  function createGoogleProfile() {
    const input = document.getElementById('google-username-input');
    const errEl = document.getElementById('google-setup-error');
    const username = input.value.trim();

    if (!username) { errEl.textContent = 'Please enter a username.'; return; }
    if (username.length < 4) { errEl.textContent = 'Username must be at least 4 characters.'; return; }
    if (username.length > 20) { errEl.textContent = 'Username must be 20 characters or fewer.'; return; }
    if (/[^a-zA-Z0-9_]/.test(username)) { errEl.textContent = 'Only letters, numbers, and underscores allowed.'; return; }
    if (window.ProfileModule?.isProfane?.(username)) { errEl.textContent = 'That username is not allowed. Please choose another.'; return; }

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

  function showSetup() {
    _hideAll();
    document.getElementById('quiz-profile-setup').classList.remove('hidden');
  }

  function showGoogleSetup() {
    const fbUser = window.AuthModule?.currentUser;
    _hideAll();
    document.getElementById('quiz-google-setup').classList.remove('hidden');
    // Pre-fill name hint
    const hint = document.getElementById('google-setup-name-hint');
    if (hint && fbUser?.displayName) hint.textContent = `Welcome, ${fbUser.displayName.split(' ')[0]}!`;
    const photo = document.getElementById('google-setup-photo');
    if (photo) {
      photo.innerHTML = fbUser?.photoURL
        ? `<img src="${fbUser.photoURL}" alt="avatar" class="google-setup-img">`
        : `<div class="google-setup-avatar-fallback">${(fbUser?.displayName||'G')[0]}</div>`;
    }
    // Pre-fill with Google first name as suggestion
    const input = document.getElementById('google-username-input');
    if (input && !input.value && fbUser?.displayName) {
      input.value = fbUser.displayName.split(' ')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    }
    // Build google avatar picker (separate ID to avoid duplicate)
    const googlePicker = document.getElementById('google-avatar-picker');
    if (googlePicker && googlePicker.children.length === 0) {
      googlePicker.innerHTML = AVATARS.map((av, i) =>
        `<div class="avatar-option ${i === selectedAvatar ? 'selected' : ''}" data-idx="${i}" onclick="Quiz._selectAvatar(${i})">${av}</div>`
      ).join('');
    }
  }

  function showHome() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) { _decideScreen(); return; }

    _hideAll();
    document.getElementById('quiz-home').classList.remove('hidden');

    // Update banner
    const isCloud = !!window.AuthModule?.currentUser;
    document.getElementById('banner-avatar').textContent   = AVATARS[profile.avatarIdx] || AVATARS[0];
    document.getElementById('banner-username').textContent = profile.username;
    document.getElementById('stat-points').textContent     = profile.points.toLocaleString();
    document.getElementById('stat-level').textContent      = calcLevel(profile.points);
    document.getElementById('stat-streak').textContent     = profile.bestStreak;
    document.getElementById('stat-quizzes').textContent    = profile.quizzes;

    // Show cloud sync indicator
    const badge = document.getElementById('cloud-badge');
    if (badge) badge.style.display = isCloud ? 'inline-flex' : 'none';

    // Show title
    const titleEl = document.getElementById('banner-title');
    if (titleEl && TITLES) {
      const t = TITLES.find(t => t.id === profile.selectedTitle)
        || [...TITLES].reverse().find(t => profile.points >= t.pts)
        || TITLES[0];
      titleEl.textContent = t.label;
    }

    // Switch back to Play tab
    document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.qsection').forEach(s => s.classList.remove('active'));
    document.querySelector('.qnav-btn[data-qsection="play"]')?.classList.add('active');
    document.getElementById('qsection-play')?.classList.add('active');

    updateCatBests();
  }

  /* Decides which screen to show based on auth + profile state */
  async function _decideScreen() {
    const fbUser = window.AuthModule?.currentUser;

    if (fbUser) {
      // Google user — check if they already have a local profile loaded
      const localUser = currentUser();
      if (localUser && getProfile(localUser)) {
        showHome();
      } else {
        // No local profile yet — check Firestore
        const cloudHas = await window.AuthModule?.hasProfile?.();
        if (cloudHas) {
          // Profile was loaded by auth.js into localStorage — try again
          const u2 = currentUser();
          if (u2 && getProfile(u2)) showHome();
          else showGoogleSetup();
        } else {
          showGoogleSetup();
        }
      }
    } else {
      const user = currentUser();
      if (user && getProfile(user)) showHome();
      else showSetup();
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
    state = { questions: shuffled, current: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, answered: false, category: categoryId };

    _hideAll();
    document.getElementById('quiz-active').classList.remove('hidden');
    renderQuestion();
  }

  function renderQuestion() {
    const q     = state.questions[state.current];
    const num   = state.current + 1;
    const total = state.questions.length;

    document.getElementById('q-label').textContent    = `Question ${num} / ${total}`;
    document.getElementById('q-progress').style.width = `${(num / total) * 100}%`;
    document.getElementById('live-score').textContent = state.score;
    document.getElementById('streak-alert').classList.add('hidden');
    document.getElementById('answer-feedback').classList.add('hidden');

    const catInfo = QUIZ_CATEGORIES.find(c => c.id === q.cat) || { name: q.cat };
    document.getElementById('q-cat-label').textContent = catInfo.name;
    document.getElementById('question-text').textContent = q.q;

    const letters = ['A','B','C','D'];
    const opts = [...q.opts].map((opt, i) => ({ opt, origIdx: i })).sort(() => Math.random() - 0.5);

    document.getElementById('options-list').innerHTML = opts.map((item, i) => `
      <button class="option-btn" data-orig="${item.origIdx}" onclick="Quiz._answer(this, ${item.origIdx})">
        <span class="option-letter">${letters[i]}</span>${escapeHtml(item.opt)}
      </button>`).join('');

    state.answered = false;
  }

  function _answer(btn, chosenOrigIdx) {
    if (state.answered) return;
    state.answered = true;

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
      if (state.streak >= 3) {
        const bonus = Math.min((state.streak - 2) * 5, 25);
        pts += bonus;
        const alertEl = document.getElementById('streak-alert');
        alertEl.innerHTML = `<i class="fas fa-fire"></i> ${state.streak}x Streak! +${bonus} bonus pts!`;
        alertEl.classList.remove('hidden');
      }
      state.score += pts;
      document.getElementById('live-score').textContent = state.score;
    } else {
      state.streak = 0;
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

  function endQuiz() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) return;

    profile.points     += state.score;
    profile.quizzes    += 1;
    profile.bestStreak  = Math.max(profile.bestStreak, state.bestStreak);
    if (!profile.catsPlayed) profile.catsPlayed = [];
    if (!profile.catsPlayed.includes(state.category)) profile.catsPlayed.push(state.category);
    if (!profile.catBests) profile.catBests = {};
    profile.catBests[state.category] = Math.max(profile.catBests[state.category] || 0, state.score);

    const statObj = {
      quizzes: profile.quizzes, totalPoints: profile.points, bestStreak: profile.bestStreak,
      lastPerfect: state.correct === state.questions.length,
      catsPlayed: new Set(profile.catsPlayed),
      friendsAdded: loadFriends().length,
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
    showResults(newBadges);
  }

  function showResults(newBadges) {
    _hideAll();
    document.getElementById('quiz-results').classList.remove('hidden');

    const pct = Math.round((state.correct / state.questions.length) * 100);
    const emojis  = pct === 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 40 ? '👍' : '🌱';
    const heading = pct === 100 ? 'Perfect Score!' : pct >= 70 ? 'Great Job!' : pct >= 40 ? 'Nice Try!' : 'Keep Learning!';
    const sub     = pct === 100
      ? 'You answered every question correctly!'
      : `You got ${state.correct} out of ${state.questions.length} correct.`;

    document.getElementById('results-emoji').textContent   = emojis;
    document.getElementById('results-heading').textContent = heading;
    document.getElementById('results-subtext').textContent = sub;
    document.getElementById('r-pts').textContent     = '+' + state.score;
    document.getElementById('r-correct').textContent = `${state.correct}/${state.questions.length}`;
    document.getElementById('r-streak').textContent  = state.bestStreak;
    document.getElementById('r-acc').textContent     = pct + '%';

    const badgesSec  = document.getElementById('new-badges-section');
    const badgesList = document.getElementById('new-badges-list');
    if (newBadges.length > 0) {
      badgesList.innerHTML = newBadges.map(b => `<span class="badge-pill">${b.icon} ${b.name}</span>`).join('');
      badgesSec.classList.remove('hidden');
    } else {
      badgesSec.classList.add('hidden');
    }
  }

  function playAgain() { startQuiz(state.category); }
  function goHome()    { showHome(); }
  function exit()      {
    if (confirm('Exit quiz? Your progress will not be saved.')) showHome();
  }

  /* ====================================================
     LEADERBOARD (live Firestore when signed in)
     ==================================================== */
  function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    // Cancel any previous listener
    if (_lbUnsubscribe) { _lbUnsubscribe(); _lbUnsubscribe = null; }

    if (!window.AuthModule?.isAvailable || !window.AuthModule?.currentUser) {
      container.innerHTML = `
        <div class="lb-signin-prompt">
          <i class="fas fa-trophy fa-2x"></i>
          <p>Sign in with Google to see the live leaderboard.</p>
          <button class="btn btn-primary" onclick="AuthModule.signInWithGoogle()">
            <i class="fab fa-google"></i> Sign In
          </button>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="lb-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    _renderLbBadges();

    _lbUnsubscribe = window.AuthModule.subscribeLeaderboard(entries => {
      if (entries.length === 0) {
        container.innerHTML = '<p class="lb-empty">No players yet — be the first!</p>';
      } else {
        container.innerHTML = entries.map((entry, i) => {
          const rankClass  = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          const rankLabel  = i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`;
          const titleLabel = TITLES
            ? (TITLES.find(t => t.id === entry.selectedTitle) || TITLES[0]).label
            : '';
          return `
            <div class="lb-entry ${entry.isMe ? 'is-me' : ''}">
              <div class="lb-rank ${rankClass}">${rankLabel}</div>
              <div class="lb-avatar">${AVATARS[entry.avatarIdx || 0]}</div>
              <div class="lb-info">
                <div class="lb-name">
                  ${escapeHtml(entry.displayName || entry.username)}
                  <span class="lb-title-badge">${escapeHtml(titleLabel)}</span>
                </div>
                <div class="lb-sub">@${escapeHtml(entry.username)} · Lv ${calcLevel(entry.points)} · ${entry.quizzes} quizzes${entry.isMe ? ' · <strong>You</strong>' : ''}</div>
              </div>
              <div class="lb-score">${entry.points.toLocaleString()}<small>pts</small></div>
            </div>`;
        }).join('');
      }

      // Badges panel (always rendered, not dependent on sign-in state)
      _renderLbBadges();
    });
  }

  /* ====================================================
     LEADERBOARD — BADGES PANEL
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
      msgEl.textContent = 'Sign in with Google to add friends.';
      msgEl.classList.add('error');
      return;
    }

    msgEl.textContent = 'Searching...';
    const found = await window.AuthModule.findUserByUsername(username);

    if (!found) { msgEl.textContent = `No user found with username "${username}".`; msgEl.classList.add('error'); return; }
    if (found.uid === window.AuthModule.currentUser?.uid) { msgEl.textContent = "That's you!"; msgEl.classList.add('error'); return; }

    const friends = loadFriends();
    if (friends.find(f => f.uid === found.uid)) {
      msgEl.textContent = `${found.username} is already your friend.`;
      msgEl.classList.add('error');
      return;
    }

    friends.push({ uid: found.uid, username: found.username, avatarIdx: found.avatarIdx || 0, points: found.points || 0, quizzes: found.quizzes || 0, bestStreak: found.bestStreak || 0 });
    saveFriends(friends);

    // Achievement
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

    container.innerHTML = friends
      .sort((a, b) => b.points - a.points)
      .map(f => `
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
     ACHIEVEMENTS
     ==================================================== */
  function buildAchievementsGrid() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    grid.innerHTML = ACHIEVEMENTS.map(ach => `
      <div class="ach-card locked" id="ach-${ach.id}">
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>`).join('');
  }

  function renderAchievements() {
    const user    = currentUser();
    const profile = getProfile(user);
    if (!profile) return;
    ACHIEVEMENTS.forEach(ach => {
      const el = document.getElementById('ach-' + ach.id);
      if (!el) return;
      const unlocked = profile.badges?.includes(ach.id);
      el.classList.toggle('unlocked', unlocked);
      el.classList.toggle('locked',   !unlocked);
    });
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
    init, startQuiz, playAgain, goHome, exit,
    _answer, _selectAvatar,
    _addFriendByUsername,
    reload: _decideScreen,
  };
  window.QuizModule = publicAPI;
  return publicAPI;
})();
