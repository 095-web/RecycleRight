/* ============================================================
   RecycleRight — Quiz Module
   Profile, game loop, scoring, leaderboard, friends, achievements
   ============================================================ */

const Quiz = (function () {

  /* ---- Storage keys ---- */
  const KEY_PROFILES     = 'rr_profiles';    // [{ username, avatarIdx, points, quizzes, bestStreak, catsPlayed, badges }]
  const KEY_CURRENT      = 'rr_current';     // username string
  const KEY_FRIENDS      = 'rr_friends';     // [{ username, avatarIdx, points, quizzes, importedAt }]

  /* ---- Game state ---- */
  let state = {
    questions:    [],
    current:      0,
    score:        0,
    streak:       0,
    bestStreak:   0,
    correct:      0,
    answered:     false,
    category:     null,
  };

  /* ====================================================
     STORAGE HELPERS
     ==================================================== */
  function loadProfiles()  { return JSON.parse(localStorage.getItem(KEY_PROFILES)  || '[]'); }
  function saveProfiles(p) { localStorage.setItem(KEY_PROFILES, JSON.stringify(p)); }
  function loadFriends()   { return JSON.parse(localStorage.getItem(KEY_FRIENDS)   || '[]'); }
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
    // Fire-and-forget cloud sync when signed in
    window.AuthModule?.syncProfile?.(profile);
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
    buildAchievementsGrid();

    document.getElementById('create-profile-btn').addEventListener('click', createProfile);
    document.getElementById('setup-username').addEventListener('keydown', e => {
      if (e.key === 'Enter') createProfile();
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
          if (btn.dataset.qsection === 'friends') renderFriends();
          if (btn.dataset.qsection === 'achievements') renderAchievements();
        }
      });
    });

    // Decide which screen to show
    const user = currentUser();
    if (user && getProfile(user)) {
      showHome();
    } else {
      showSetup();
    }
  }

  /* ====================================================
     PROFILE
     ==================================================== */
  let selectedAvatar = 0;

  function buildAvatarPicker() {
    const container = document.getElementById('avatar-picker');
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
    if (username.length < 2) { errEl.textContent = 'Username must be at least 2 characters.'; return; }
    if (/[^a-zA-Z0-9_ ]/.test(username)) { errEl.textContent = 'Only letters, numbers, spaces, and underscores allowed.'; return; }
    if (getProfile(username)) { errEl.textContent = 'That username is already taken on this device.'; return; }

    errEl.textContent = '';
    const profile = newProfile(username, selectedAvatar);
    saveProfile(profile);
    setCurrentUser(username);
    showHome();
  }

  function switchUser() {
    localStorage.removeItem(KEY_CURRENT);
    showSetup();
    document.getElementById('setup-username').value = '';
    document.getElementById('setup-error').textContent = '';
  }

  /* ====================================================
     HOME SCREEN
     ==================================================== */
  function showSetup() {
    document.getElementById('quiz-profile-setup').classList.remove('hidden');
    document.getElementById('quiz-home').classList.add('hidden');
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-results').classList.add('hidden');
  }

  function showHome() {
    const user = currentUser();
    const profile = getProfile(user);
    if (!profile) { showSetup(); return; }

    document.getElementById('quiz-profile-setup').classList.add('hidden');
    document.getElementById('quiz-home').classList.remove('hidden');
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-results').classList.add('hidden');

    // Update banner
    document.getElementById('banner-avatar').textContent    = AVATARS[profile.avatarIdx];
    document.getElementById('banner-username').textContent  = profile.username;
    document.getElementById('stat-points').textContent      = profile.points.toLocaleString();
    document.getElementById('stat-level').textContent       = calcLevel(profile.points);
    document.getElementById('stat-streak').textContent      = profile.bestStreak;
    document.getElementById('stat-quizzes').textContent     = profile.quizzes;

    // Share code
    document.getElementById('my-share-code').textContent = generateShareCode(profile);

    // Switch back to Play tab
    document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.qsection').forEach(s => s.classList.remove('active'));
    document.querySelector('.qnav-btn[data-qsection="play"]').classList.add('active');
    document.getElementById('qsection-play').classList.add('active');

    updateCatBests();
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
    const user = currentUser();
    const profile = getProfile(user);
    if (!profile || !profile.catBests) return;
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

    // Shuffle and take 10
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);

    state = {
      questions:  shuffled,
      current:    0,
      score:      0,
      streak:     0,
      bestStreak: 0,
      correct:    0,
      answered:   false,
      category:   categoryId,
    };

    document.getElementById('quiz-home').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    document.getElementById('quiz-results').classList.add('hidden');

    renderQuestion();
  }

  function renderQuestion() {
    const q    = state.questions[state.current];
    const num  = state.current + 1;
    const total = state.questions.length;

    document.getElementById('q-label').textContent   = `Question ${num} / ${total}`;
    document.getElementById('q-progress').style.width = `${(num / total) * 100}%`;
    document.getElementById('live-score').textContent = state.score;
    document.getElementById('streak-alert').classList.add('hidden');
    document.getElementById('answer-feedback').classList.add('hidden');

    const catInfo = QUIZ_CATEGORIES.find(c => c.id === q.cat) || { name: q.cat };
    document.getElementById('q-cat-label').textContent = catInfo.name;
    document.getElementById('question-text').textContent = q.q;

    const letters = ['A','B','C','D'];
    const opts = [...q.opts].map((opt, i) => ({ opt, origIdx: i }));
    // Shuffle answer options for variety
    opts.sort(() => Math.random() - 0.5);

    document.getElementById('options-list').innerHTML = opts.map((item, i) => `
      <button class="option-btn" data-orig="${item.origIdx}" onclick="Quiz._answer(this, ${item.origIdx})" >
        <span class="option-letter">${letters[i]}</span>
        ${escapeHtml(item.opt)}
      </button>`).join('');

    state.answered = false;
  }

  function _answer(btn, chosenOrigIdx) {
    if (state.answered) return;
    state.answered = true;

    const q = state.questions[state.current];
    const correct = chosenOrigIdx === q.ans;

    // Mark buttons
    document.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      const origIdx = parseInt(b.dataset.orig);
      if (origIdx === q.ans)      b.classList.add('correct');
      if (b === btn && !correct)  b.classList.add('wrong');
    });

    // Scoring
    if (correct) {
      state.streak++;
      state.correct++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;

      let pts = 10;
      let bonusMsg = '';
      if (state.streak >= 3) {
        const bonus = Math.min((state.streak - 2) * 5, 25);
        pts += bonus;
        bonusMsg = ` (+${bonus} streak bonus!)`;
        const alertEl = document.getElementById('streak-alert');
        alertEl.innerHTML = `<i class="fas fa-fire"></i> ${state.streak}x Streak!${bonusMsg}`;
        alertEl.classList.remove('hidden');
      }
      state.score += pts;
      document.getElementById('live-score').textContent = state.score;
    } else {
      state.streak = 0;
    }

    // Feedback
    const feedbackEl = document.getElementById('answer-feedback');
    document.getElementById('feedback-content').innerHTML = `
      <div class="fb-result ${correct ? 'correct' : 'wrong'}">
        <i class="fas fa-${correct ? 'check-circle' : 'circle-xmark'}"></i>
        ${correct ? 'Correct!' : 'Not quite.'}
        ${correct && state.score > 0 ? `<span style="font-size:.85rem;font-weight:400;color:var(--green-600);margin-left:6px">+${correct ? (state.streak >= 3 ? (10 + Math.min((state.streak-2)*5,25)) : 10) : 0} pts</span>` : ''}
      </div>
      <div class="fb-explanation">${q.exp}</div>`;
    feedbackEl.classList.remove('hidden');
  }

  function nextQuestion() {
    state.current++;
    if (state.current >= state.questions.length) {
      endQuiz();
    } else {
      renderQuestion();
    }
  }

  function endQuiz() {
    const user    = currentUser();
    const profile = getProfile(user);

    profile.points     += state.score;
    profile.quizzes    += 1;
    profile.bestStreak  = Math.max(profile.bestStreak, state.bestStreak);

    if (!profile.catsPlayed) profile.catsPlayed = [];
    if (!profile.catsPlayed.includes(state.category)) profile.catsPlayed.push(state.category);

    if (!profile.catBests) profile.catBests = {};
    profile.catBests[state.category] = Math.max(profile.catBests[state.category] || 0, state.score);

    // Check achievements
    const statObj = {
      quizzes:     profile.quizzes,
      totalPoints: profile.points,
      bestStreak:  profile.bestStreak,
      lastPerfect: state.correct === state.questions.length,
      catsPlayed:  new Set(profile.catsPlayed),
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
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');

    const pct = Math.round((state.correct / state.questions.length) * 100);
    const emojis = pct === 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 40 ? '👍' : '🌱';
    const headings = pct === 100 ? 'Perfect Score!' : pct >= 70 ? 'Great Job!' : pct >= 40 ? 'Nice Try!' : 'Keep Learning!';
    const subs = pct === 100
      ? 'You answered every question correctly. Outstanding!'
      : pct >= 70 ? `You got ${state.correct} out of ${state.questions.length} right. Well done!`
      : `You got ${state.correct} out of ${state.questions.length}. Practice makes perfect!`;

    document.getElementById('results-emoji').textContent   = emojis;
    document.getElementById('results-heading').textContent = headings;
    document.getElementById('results-subtext').textContent = subs;
    document.getElementById('r-pts').textContent     = '+' + state.score;
    document.getElementById('r-correct').textContent = `${state.correct}/${state.questions.length}`;
    document.getElementById('r-streak').textContent  = state.bestStreak;
    document.getElementById('r-acc').textContent     = pct + '%';

    const badgesSec  = document.getElementById('new-badges-section');
    const badgesList = document.getElementById('new-badges-list');
    if (newBadges.length > 0) {
      badgesList.innerHTML = newBadges.map(b =>
        `<span class="badge-pill">${b.icon} ${b.name}</span>`).join('');
      badgesSec.classList.remove('hidden');
    } else {
      badgesSec.classList.add('hidden');
    }
  }

  function playAgain() {
    startQuiz(state.category);
  }

  function goHome() {
    showHome();
  }

  function exit() {
    if (confirm('Exit quiz? Your progress will not be saved.')) {
      showHome();
    }
  }

  /* ====================================================
     LEADERBOARD
     ==================================================== */
  function renderLeaderboard() {
    const user = currentUser();
    const profiles = loadProfiles();
    const friends  = loadFriends();

    // Merge local profiles + friends
    const entries = [
      ...profiles.map(p => ({ ...p, isMe: p.username === user, isFriend: false })),
      ...friends.map(f  => ({ ...f, isMe: false,               isFriend: true  })),
    ].sort((a, b) => b.points - a.points);

    const container = document.getElementById('leaderboard-list');
    if (entries.length === 0) {
      container.innerHTML = '<p class="lb-empty">No players yet. Play some quizzes to appear here!</p>';
      return;
    }

    container.innerHTML = entries.map((entry, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const rankLabel = i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`;
      const avatar = AVATARS[entry.avatarIdx || 0];
      const sub = entry.isFriend ? 'Friend' : entry.isMe ? 'You' : 'Local player';
      return `
        <div class="lb-entry ${entry.isMe ? 'is-me' : ''}">
          <div class="lb-rank ${rankClass}">${rankLabel}</div>
          <div class="lb-avatar">${avatar}</div>
          <div class="lb-info">
            <div class="lb-name">${escapeHtml(entry.username)}</div>
            <div class="lb-sub">${sub} · Lv ${calcLevel(entry.points)} · ${entry.quizzes || 0} quizzes</div>
          </div>
          <div class="lb-score">${(entry.points || 0).toLocaleString()}<small>pts</small></div>
        </div>`;
    }).join('');
  }

  /* ====================================================
     FRIENDS
     ==================================================== */
  function generateShareCode(profile) {
    const data = {
      v: 1,
      u: profile.username,
      a: profile.avatarIdx,
      p: profile.points,
      q: profile.quizzes,
      s: profile.bestStreak,
    };
    return btoa(JSON.stringify(data));
  }

  function copyMyCode() {
    const code = document.getElementById('my-share-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.querySelector('[onclick="copyMyCode()"]');
      if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Copied!'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000); }
    }).catch(() => {
      window.prompt('Copy this code:', code);
    });
  }

  function addFriendByCode() {
    const input   = document.getElementById('friend-code-input');
    const msgEl   = document.getElementById('friend-msg');
    const code    = input.value.trim();

    msgEl.className = 'friend-msg';
    if (!code) { msgEl.textContent = 'Please paste a share code.'; msgEl.classList.add('error'); return; }

    try {
      const data = JSON.parse(atob(code));
      if (!data.u || typeof data.p !== 'number') throw new Error('Invalid');
      if (data.p > 99999 || data.p < 0) throw new Error('Suspicious score');

      const user = currentUser();
      if (data.u === user) { msgEl.textContent = 'That\'s your own code!'; msgEl.classList.add('error'); return; }

      const friends = loadFriends();
      if (friends.find(f => f.username === data.u)) {
        msgEl.textContent = `${data.u} is already your friend.`;
        msgEl.classList.add('error');
        return;
      }

      friends.push({ username: data.u, avatarIdx: data.a || 0, points: data.p, quizzes: data.q || 0, bestStreak: data.s || 0, importedAt: Date.now() });
      saveFriends(friends);

      // Check friend achievement
      const profile = getProfile(user);
      if (profile && !profile.badges.includes('friend_added')) {
        profile.badges.push('friend_added');
        saveProfile(profile);
      }

      input.value = '';
      msgEl.textContent = `Added ${data.u} as a friend!`;
      msgEl.classList.add('success');
      renderFriends();
    } catch {
      msgEl.textContent = 'Invalid share code. Ask your friend to copy it again.';
      msgEl.classList.add('error');
    }
  }

  function renderFriends() {
    const friends   = loadFriends();
    const container = document.getElementById('friends-list');

    if (friends.length === 0) {
      container.innerHTML = '<p class="friends-empty"><i class="fas fa-user-plus"></i> No friends added yet. Share your code and add theirs!</p>';
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
      if (profile.badges && profile.badges.includes(ach.id)) {
        el.classList.remove('locked');
        el.classList.add('unlocked');
      } else {
        el.classList.remove('unlocked');
        el.classList.add('locked');
      }
    });
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ---- Public API ---- */
  const publicAPI = {
    init,
    startQuiz,
    playAgain,
    goHome,
    exit,
    _answer,
    _selectAvatar,
    _copyMyCode:   copyMyCode,
    _addFriend:    addFriendByCode,
    // Called by AuthModule after sign-in / sign-out to refresh the UI
    reload: () => {
      const user = currentUser();
      if (user && getProfile(user)) showHome();
      else showSetup();
    },
  };

  // Expose for AuthModule communication
  window.QuizModule = publicAPI;
  return publicAPI;
})();

/* Global helpers called from inline onclick */
function copyMyCode()      { Quiz._copyMyCode(); }
function addFriendByCode() { Quiz._addFriend(); }
