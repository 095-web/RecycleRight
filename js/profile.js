/* ============================================================
   RecycleRight — Profile Module
   Account, friends (with request flow), achievements, titles
   ============================================================ */

const ProfileModule = (function () {

  const KEY_PROFILES   = 'rr_profiles';
  const KEY_CURRENT    = 'rr_current';
  const KEY_FRIENDS    = 'rr_friends';
  const KEY_UN_CHANGES = 'rr_username_changes';

  let _reqUnsub = null; // incoming request listener

  /* ====================================================
     PROFANITY FILTER
     ==================================================== */
  const BANNED = [
    'fuck','shit','bitch','cunt','dick','cock','pussy','nigger','nigga',
    'faggot','fag','retard','whore','slut','bastard','asshole','piss',
    'rape','nazi','porn','sex','weed','drug','hack','kill','die',
    'arse','twat','wank','crap','ass',
  ];
  function isProfane(s) {
    const v = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return BANNED.some(w => v.includes(w));
  }

  /* ====================================================
     USERNAME VALIDATION
     ==================================================== */
  function validateUsername(u) {
    if (!u)                         return 'Please enter a username.';
    if (u.length < 4)               return 'Username must be at least 4 characters.';
    if (u.length > 20)              return 'Username must be 20 characters or fewer.';
    if (/[^a-zA-Z0-9_]/.test(u))   return 'Only letters, numbers, and underscores allowed.';
    if (isProfane(u))               return 'That username is not allowed. Please choose another.';
    return null;
  }

  /* ====================================================
     USERNAME CHANGE LIMIT
     ==================================================== */
  function changesThisMonth() {
    const all = JSON.parse(localStorage.getItem(KEY_UN_CHANGES) || '[]');
    return all.filter(d => d.startsWith(new Date().toISOString().slice(0, 7)));
  }
  function recordUsernameChange() {
    const all = JSON.parse(localStorage.getItem(KEY_UN_CHANGES) || '[]');
    all.push(new Date().toISOString());
    localStorage.setItem(KEY_UN_CHANGES, JSON.stringify(all));
  }

  /* ====================================================
     STORAGE HELPERS
     ==================================================== */
  function loadProfiles() { return JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]'); }
  function loadFriends()  { return JSON.parse(localStorage.getItem(KEY_FRIENDS)  || '[]'); }
  function saveFriends(f) { localStorage.setItem(KEY_FRIENDS, JSON.stringify(f)); }

  function calcLevel(pts) {
    if (pts < 100)  return 1; if (pts < 300)  return 2;
    if (pts < 700)  return 3; if (pts < 1500) return 4;
    return 5;
  }
  function getTitle(profile) {
    if (!TITLES) return '';
    return (TITLES.find(t => t.id === profile.selectedTitle)
      || [...TITLES].reverse().find(t => (profile.points||0) >= t.pts)
      || TITLES[0]).label;
  }

  /* ====================================================
     INIT / RELOAD
     ==================================================== */
  function init() { reload(); }

  async function reload() {
    if (!AuthModule.isAvailable) { renderOfflineMode(); return; }
    const user = AuthModule.currentUser;
    if (!user) { stopReqListener(); renderSignedOut(); return; }

    const hasProf = await AuthModule.hasProfile();
    if (!hasProf) {
      renderSetupScreen(user, localStorage.getItem(KEY_CURRENT) || null);
    } else {
      const username = localStorage.getItem(KEY_CURRENT);
      const profile  = loadProfiles().find(p => p.username === username) || null;
      renderProfile(user, profile);
      startReqListener(); // subscribe to incoming friend requests
      checkAcceptedRequests(); // pull in any newly accepted requests
    }
  }

  /* ====================================================
     FRIEND REQUEST LISTENER
     ==================================================== */
  function startReqListener() {
    stopReqListener();
    _reqUnsub = AuthModule.subscribeIncomingRequests(requests => {
      // Update badge count on Profile nav button
      const badge = document.getElementById('profile-req-badge');
      if (badge) {
        badge.textContent = requests.length;
        badge.style.display = requests.length > 0 ? 'flex' : 'none';
      }
      // Re-render pending section if friends card is visible
      const pending = document.getElementById('pending-requests-list');
      if (pending) renderPendingRequests(requests);
    });
  }

  function stopReqListener() {
    if (_reqUnsub) { _reqUnsub(); _reqUnsub = null; }
  }

  async function checkAcceptedRequests() {
    const accepted = await AuthModule.getAcceptedSentRequests?.() || [];
    if (accepted.length === 0) return;

    const friends = loadFriends();
    let changed = false;
    for (const req of accepted) {
      if (!friends.find(f => f.uid === req.toUid)) {
        friends.push({
          uid: req.toUid, username: req.toUsername,
          displayName: req.toUsername, avatarIdx: 0,
          points: 0, quizzes: 0, bestStreak: 0,
        });
        changed = true;
      }
    }
    if (changed) saveFriends(friends);
  }

  /* ====================================================
     SIGNED OUT
     ==================================================== */
  function renderSignedOut() {
    getContainer().innerHTML = `
      <div class="profile-signin-prompt">
        <div class="profile-signin-icon"><i class="fas fa-user-circle"></i></div>
        <h2>Sign in to RecycleRight</h2>
        <p>Create an account to save your progress, compete on leaderboards, and sync across devices.</p>
        <button class="btn btn-primary btn-lg profile-google-btn" onclick="AuthModule.signInWithGoogle()">
          <i class="fab fa-google"></i> Sign in with Google
        </button>
        <p class="profile-guest-note">Already playing as a guest? Your progress will be preserved when you sign in.</p>
      </div>`;
  }

  /* ====================================================
     SETUP SCREEN
     ==================================================== */
  function renderSetupScreen(user, suggestedUsername) {
    const photoHTML = user.photoURL
      ? `<img src="${esc(user.photoURL)}" alt="avatar" class="profile-google-photo">`
      : `<div class="profile-google-initials">${(user.displayName||'U')[0].toUpperCase()}</div>`;

    getContainer().innerHTML = `
      <div class="profile-setup-card">
        <div class="profile-setup-google-info">
          ${photoHTML}
          <div>
            <div class="profile-setup-name">${esc(user.displayName||'Google User')}</div>
            <div class="profile-setup-email">${esc(user.email||'')}</div>
          </div>
        </div>
        <h2>Choose Your Username</h2>
        <p class="profile-setup-subtitle">Pick a username (4–20 characters) for the leaderboard.</p>
        <div class="avatar-section" style="margin-bottom:1.5rem">
          <label>Pick an avatar:</label>
          <div class="avatar-picker" id="profile-avatar-picker"></div>
        </div>
        <div class="setup-form">
          <input type="text" id="profile-username-input"
            placeholder="Username (letters, numbers, _ only)"
            maxlength="20" autocomplete="off"
            value="${esc(suggestedUsername||'')}">
          <button class="btn btn-primary btn-lg" id="profile-save-btn">
            <i class="fas fa-check"></i> Save Profile
          </button>
        </div>
        <p class="setup-note" id="profile-setup-error"></p>
      </div>`;

    let selAvatar = 0;
    buildAvatarPicker('profile-avatar-picker', selAvatar, null, i => { selAvatar = i; });
    document.getElementById('profile-save-btn').addEventListener('click', () => saveNewProfile(user, selAvatar));
    document.getElementById('profile-username-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') saveNewProfile(user, selAvatar);
    });
  }

  async function saveNewProfile(user, avatarIdx) {
    const input = document.getElementById('profile-username-input');
    const errEl = document.getElementById('profile-setup-error');
    const username = input.value.trim();
    const err = validateUsername(username);
    if (err) { errEl.textContent = err; return; }
    errEl.textContent = 'Checking availability…';
    const existing = await AuthModule.findUserByUsername(username);
    if (existing) { errEl.textContent = 'That username is already taken. Try another.'; return; }

    const old = loadProfiles().find(p => p.username === localStorage.getItem(KEY_CURRENT));
    const profile = {
      username, avatarIdx, selectedTitle: 'newcomer', purchasedItems: [],
      points: old?.points||0, quizzes: old?.quizzes||0, bestStreak: old?.bestStreak||0,
      catsPlayed: old?.catsPlayed||[], catBests: old?.catBests||{}, badges: old?.badges||[],
    };
    const profiles = loadProfiles().filter(p => p.username !== username);
    profiles.push(profile);
    localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
    localStorage.setItem(KEY_CURRENT, username);
    await AuthModule.syncProfileFlat(profile);
    reload(); window.QuizModule?.reload?.();
  }

  /* ====================================================
     FULL PROFILE VIEW
     ==================================================== */
  function renderProfile(user, profile) {
    if (!profile) { renderSetupScreen(user, null); return; }

    const avatar     = AVATARS[profile.avatarIdx] || AVATARS[0];
    const level      = calcLevel(profile.points || 0);
    const titleText  = getTitle(profile);
    const photoHTML  = user.photoURL
      ? `<img src="${esc(user.photoURL)}" alt="" class="profile-google-photo-sm">` : '';
    const frameCss   = FRAMES?.find(f => f.id === profile.equippedFrame)?.css || '';
    const avatarHtml = frameCss
      ? `<div class="profile-big-avatar avatar-frame-wrap ${frameCss}">${avatar}</div>`
      : `<div class="profile-big-avatar">${avatar}</div>`;

    const nextTitleHtml = ''; // removed next-title bar

    getContainer().innerHTML = `
      <div class="profile-page">

        <div class="profile-card">
          <div class="profile-card-top">
            ${avatarHtml}
            <div class="profile-card-info">
              <div class="profile-display-name">
                ${esc(profile.username)} ${photoHTML}
                ${AuthModule.isAdmin ? '<span class="admin-crown-badge">👑 Admin</span>' : ''}
              </div>
              <div class="profile-title-tag">${esc(titleText)}</div>
              <div class="profile-google-linked"><i class="fab fa-google"></i> ${esc(user.email||'')}</div>
              <div class="profile-level-badge">Level ${level}</div>
            </div>
            <button class="btn btn-sm btn-primary" id="profile-edit-btn">
              <i class="fas fa-pencil"></i> Edit Profile
            </button>
          </div>
          <div class="profile-stats-band">
            <div class="pstat-lg"><div class="pstat-val">${(profile.points||0).toLocaleString()}</div><div class="pstat-lbl">Points</div></div>
            <div class="pstat-lg"><div class="pstat-val">${profile.quizzes||0}</div><div class="pstat-lbl">Quizzes</div></div>
            <div class="pstat-lg"><div class="pstat-val">${profile.bestStreak||0}</div><div class="pstat-lbl">Best Streak</div></div>
            <div class="pstat-lg"><div class="pstat-val">${(profile.badges||[]).length}</div><div class="pstat-lbl">Badges</div></div>
          </div>
          ${nextTitleHtml}
        </div>

        <div class="profile-section-card">
          <h3 class="profile-section-title"><i class="fas fa-shield-halved"></i> Account</h3>
          <div class="profile-account-row">
            <div>
              <div class="profile-account-label">Signed in with Google</div>
              <div class="profile-account-value">${esc(user.displayName||user.email||'')}</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="AuthModule.signOut()">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>

        <div class="profile-section-card">
          <h3 class="profile-section-title"><i class="fas fa-users"></i> Friends</h3>
          <div id="pending-requests-list"></div>
          <div class="add-friend-form" style="margin-bottom:12px">
            <input type="text" id="prof-friend-input" placeholder="Search by username to send a request…">
            <button class="btn btn-primary" id="prof-friend-send-btn">
              <i class="fas fa-paper-plane"></i> Send Request
            </button>
          </div>
          <p id="prof-friend-msg" class="friend-msg"></p>
          <div id="prof-friends-list" class="friends-list"></div>
        </div>

        <div class="profile-section-card">
          <h3 class="profile-section-title">
            <i class="fas fa-medal"></i> Badges
            <span class="badge-count-pill" id="badge-count-pill"></span>
          </h3>
          <div class="profile-achievements-list" id="prof-achievements-list"></div>
        </div>

        <div class="profile-section-card">
          <h3 class="profile-section-title">
            <i class="fas fa-clock-rotate-left"></i> Quiz History
          </h3>
          <div id="prof-quiz-history"></div>
        </div>

        <div class="profile-section-card">
          <h3 class="profile-section-title"><i class="fas fa-calendar-check"></i> Activity Calendar</h3>
          <div id="prof-streak-calendar"></div>
        </div>

        <div class="profile-section-card">
          <h3 class="profile-section-title"><i class="fas fa-chart-bar"></i> Stats Dashboard</h3>
          <div id="prof-stats-dashboard"></div>
        </div>

        <div class="profile-section-card danger-zone-card">
          <h3 class="profile-section-title danger-zone-title">
            <i class="fas fa-triangle-exclamation"></i> Danger Zone
          </h3>
          <p class="danger-zone-desc">Permanently wipes your points, stats, badges, and purchased items. Your username and Google account are kept.</p>
          <button class="btn btn-sm btn-danger" id="profile-reset-btn">
            <i class="fas fa-rotate-left"></i> Reset All Progress
          </button>
        </div>

      </div>`;

    document.getElementById('profile-edit-btn').addEventListener('click', () => renderEditScreen(user, profile));
    document.getElementById('prof-friend-send-btn').addEventListener('click', sendFriendRequest);
    document.getElementById('prof-friend-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendFriendRequest();
    });
    document.getElementById('profile-reset-btn').addEventListener('click', () => confirmResetProgress(user, profile));

    renderFriendsList();
    renderAchievementsList(profile);
    renderQuizHistory(profile);
    renderStreakCalendar(profile);
    renderStatsDashboard(profile);
    renderChallengeFriendSection();
  }

  /* ====================================================
     FRIEND REQUESTS UI
     ==================================================== */
  async function sendFriendRequest() {
    const input  = document.getElementById('prof-friend-input');
    const msgEl  = document.getElementById('prof-friend-msg');
    const username = (input?.value || '').trim().toLowerCase();

    msgEl.className = 'friend-msg';
    if (!username) { msgEl.textContent = 'Enter a username to search.'; msgEl.classList.add('error'); return; }
    if (!AuthModule.isAvailable || !AuthModule.currentUser) {
      msgEl.textContent = 'Sign in to send friend requests.'; msgEl.classList.add('error'); return;
    }

    msgEl.textContent = 'Searching…';
    const found = await AuthModule.findUserByUsername(username);
    if (!found)                                     { msgEl.textContent = `No user found with username "${username}".`; msgEl.classList.add('error'); return; }
    if (found.uid === AuthModule.currentUser?.uid)  { msgEl.textContent = "That's you!"; msgEl.classList.add('error'); return; }
    if (loadFriends().find(f => f.uid === found.uid)) { msgEl.textContent = `You're already friends with ${found.username}!`; msgEl.classList.add('error'); return; }

    msgEl.textContent = 'Sending request…';
    const result = await AuthModule.sendFriendRequest(found.uid, found.username);
    if (result?.error === 'already_sent') { msgEl.textContent = `Request already sent to ${found.username} — waiting for them to accept.`; msgEl.classList.add('error'); return; }
    if (result?.error)                    { msgEl.textContent = 'Something went wrong. Try again.'; msgEl.classList.add('error'); return; }

    input.value = '';
    msgEl.textContent = `Friend request sent to ${found.username}! ✓`;
    msgEl.classList.add('success');
  }

  function renderPendingRequests(requests) {
    const container = document.getElementById('pending-requests-list');
    if (!container) return;
    if (requests.length === 0) { container.innerHTML = ''; return; }

    container.innerHTML = `
      <div class="pending-requests-section">
        <div class="pending-requests-header">
          <i class="fas fa-user-clock"></i> Friend Requests
          <span class="pending-count">${requests.length}</span>
        </div>
        ${requests.map(req => `
          <div class="pending-request-card" id="req-${req.id}">
            <div class="req-avatar">${AVATARS[req.fromAvatarIdx||0]}</div>
            <div class="req-info">
              <div class="req-name">${esc(req.fromUsername)}</div>
              <div class="req-meta">Lv ${calcLevel(req.fromPoints||0)} · ${req.fromQuizzes||0} quizzes</div>
            </div>
            <div class="req-actions">
              <button class="btn btn-sm btn-primary" onclick="ProfileModule._acceptReq('${req.id}','${req.fromUid}','${req.fromUsername}',${req.fromAvatarIdx||0},${req.fromPoints||0},${req.fromQuizzes||0},${req.fromBestStreak||0})">
                <i class="fas fa-check"></i> Accept
              </button>
              <button class="btn btn-sm btn-outline" onclick="ProfileModule._declineReq('${req.id}')">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>`).join('')}
      </div>`;
  }

  async function _acceptReq(reqId, fromUid, fromUsername, fromAvatarIdx, fromPoints, fromQuizzes, fromBestStreak) {
    await AuthModule.respondToFriendRequest(reqId, true);
    const friends = loadFriends();
    if (!friends.find(f => f.uid === fromUid)) {
      friends.push({ uid:fromUid, username:fromUsername, displayName:fromUsername,
        avatarIdx:fromAvatarIdx, points:fromPoints, quizzes:fromQuizzes, bestStreak:fromBestStreak });
      saveFriends(friends);
      AuthModule.syncFriends?.(friends); // sync to Firestore
    }
    renderFriendsList();
  }

  async function _declineReq(reqId) {
    await AuthModule.respondToFriendRequest(reqId, false);
  }

  function renderFriendsList() {
    const container = document.getElementById('prof-friends-list');
    if (!container) return;
    const friends = loadFriends();
    if (friends.length === 0) {
      container.innerHTML = '<p class="friends-empty"><i class="fas fa-paper-plane"></i> No friends yet — search by username above to send a request!</p>';
      return;
    }
    container.innerHTML = friends.sort((a,b) => b.points - a.points).map(f => `
      <div class="friend-entry friend-entry-clickable" onclick="ProfileModule._viewFriend('${f.uid}')">
        <div class="friend-avatar">${AVATARS[f.avatarIdx||0]}</div>
        <div class="friend-info">
          <div class="friend-name">${esc(f.displayName||f.username)}</div>
          <div class="friend-meta">Lv ${calcLevel(f.points)} · ${f.quizzes||0} quizzes · Best streak: ${f.bestStreak||0}</div>
        </div>
        <div class="friend-score">${(f.points||0).toLocaleString()} pts</div>
        <button class="btn btn-sm friend-unfriend-btn"
          onclick="event.stopPropagation(); ProfileModule._unfriend('${f.uid}')"
          title="Unfriend">
          <i class="fas fa-user-minus"></i>
        </button>
      </div>`).join('');
  }

  /* ====================================================
     FRIEND PROFILE MODAL
     ==================================================== */
  async function _viewFriend(uid) {
    // Remove any existing modal
    _closeFriendModal();

    // Build overlay with loading state
    const overlay = document.createElement('div');
    overlay.className = 'fmodal-overlay';
    overlay.id = 'friend-modal-overlay';
    overlay.innerHTML = `
      <div class="fmodal" id="friend-modal">
        <button class="fmodal-close" onclick="ProfileModule._closeFriendModal()">
          <i class="fas fa-times"></i>
        </button>
        <div class="fmodal-loading"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeFriendModal(); });
    document.body.appendChild(overlay);

    // Fetch fresh data from Firestore, fall back to cached local data
    let data = null;
    if (AuthModule.isAvailable && AuthModule.currentUser) {
      data = await AuthModule.getUserByUid(uid);
    }
    if (!data) {
      const f = loadFriends().find(fr => fr.uid === uid);
      if (f) data = { ...f };
    }

    const modal = document.getElementById('friend-modal');
    if (!modal) return;

    if (!data) {
      modal.querySelector('.fmodal-loading').innerHTML =
        '<p style="color:var(--gray-500)">Could not load profile.</p>';
      return;
    }

    const avatar      = AVATARS[data.avatarIdx || 0];
    const titleLabel  = TITLES
      ? (TITLES.find(t => t.id === data.selectedTitle) || TITLES[0]).label : '';
    const earnedBadges = ACHIEVEMENTS
      ? ACHIEVEMENTS.filter(a => (data.badges || []).includes(a.id)) : [];

    modal.innerHTML = `
      <button class="fmodal-close" onclick="ProfileModule._closeFriendModal()">
        <i class="fas fa-times"></i>
      </button>
      <div class="fmodal-avatar">${avatar}</div>
      <div class="fmodal-username">${esc(data.displayName || data.username || '?')}</div>
      <div class="fmodal-title-tag">${esc(titleLabel)}</div>
      <div class="fmodal-stats">
        <div class="fmodal-stat">
          <div class="fmodal-stat-val">${(data.points||0).toLocaleString()}</div>
          <div class="fmodal-stat-lbl">Points</div>
        </div>
        <div class="fmodal-stat">
          <div class="fmodal-stat-val">${data.quizzes||0}</div>
          <div class="fmodal-stat-lbl">Quizzes</div>
        </div>
        <div class="fmodal-stat">
          <div class="fmodal-stat-val">${data.bestStreak||0}</div>
          <div class="fmodal-stat-lbl">Best Streak</div>
        </div>
        <div class="fmodal-stat">
          <div class="fmodal-stat-val">${(data.badges||[]).length}</div>
          <div class="fmodal-stat-lbl">Badges</div>
        </div>
      </div>
      ${earnedBadges.length > 0 ? `
        <div class="fmodal-badges-section">
          <div class="fmodal-badges-label">Badges Earned</div>
          <div class="fmodal-badges-row">
            ${earnedBadges.map(a =>
              `<span class="fmodal-badge" title="${esc(a.name)}: ${esc(a.desc)}">${a.icon}</span>`
            ).join('')}
          </div>
        </div>` : ''}
      <button class="btn btn-sm btn-danger fmodal-unfriend-btn"
        onclick="ProfileModule._unfriend('${uid}')">
        <i class="fas fa-user-minus"></i> Unfriend
      </button>`;
  }

  function _closeFriendModal() {
    document.getElementById('friend-modal-overlay')?.remove();
  }

  async function _unfriend(uid) {
    _closeFriendModal();
    if (!confirm('Remove this person from your friends list?')) return;
    const friends = loadFriends().filter(f => f.uid !== uid);
    saveFriends(friends);
    if (AuthModule.isAvailable && AuthModule.currentUser) {
      await AuthModule.syncFriends(friends);
    }
    renderFriendsList();
  }

  /* ====================================================
     NEXT TITLE PROGRESS BAR
     ==================================================== */
  function _buildNextTitleBar(totalPts, profile) {
    if (!TITLES || TITLES.length < 2) return '';
    // Find highest title the user has purchased or is newcomer
    const owned = profile.purchasedItems || [];
    const allShop = [...(SHOP_PERMANENT || []), ...(SHOP_ROTATING || [])];
    // Build sorted list of titles with pts thresholds from SHOP prices (use index as order)
    const titlesOrdered = [...TITLES]; // already sorted by pts ascending
    // Find the current highest title owned
    let currentTitleIdx = 0;
    for (let i = titlesOrdered.length - 1; i >= 0; i--) {
      const t = titlesOrdered[i];
      if (t.id === 'newcomer' || owned.some(id => { const s = allShop.find(s => s.id === id); return s?.type === 'title' && s.titleId === t.id; })) {
        currentTitleIdx = i;
        break;
      }
    }
    const nextTitle = titlesOrdered[currentTitleIdx + 1];
    if (!nextTitle) return `<div class="next-title-wrap"><div class="next-title-label"><span>Max title reached! 🎉</span></div></div>`;

    // Find shop cost for next title
    const shopItem = allShop.find(s => s.type === 'title' && s.titleId === nextTitle.id);
    const cost = shopItem?.cost || nextTitle.pts || 100;
    const spent = (profile.totalPoints || totalPts) - (profile.points || 0); // not reliable; use points directly
    const current = profile.points || 0;
    const pct = Math.min(100, Math.round((current / cost) * 100));

    return `
      <div class="next-title-wrap">
        <div class="next-title-label">
          <span>Next title: <strong>${esc(nextTitle.label)}</strong></span>
          <span>${current.toLocaleString()} / ${cost.toLocaleString()} pts</span>
        </div>
        <div class="next-title-bar-wrap">
          <div class="next-title-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  /* ====================================================
     QUIZ HISTORY
     ==================================================== */
  function renderQuizHistory(profile) {
    const container = document.getElementById('prof-quiz-history');
    if (!container) return;

    const history = profile.quizHistory || [];
    if (history.length === 0) {
      container.innerHTML = '<p class="qh-empty"><i class="fas fa-dumbbell"></i> No quizzes played yet — head to the Quiz tab to get started!</p>';
      return;
    }

    const catIconMap = { general:'fa-recycle', plastics:'fa-bottle-water', paper:'fa-newspaper', food:'fa-apple-whole', ewaste:'fa-laptop', mixed:'fa-shuffle' };
    container.innerHTML = `<div class="quiz-history-list">` +
      history.map(h => {
        const catInfo = QUIZ_CATEGORIES?.find(c => c.id === h.category) || { name: h.category, icon: 'fa-question' };
        const pct     = Math.round((h.correct / h.total) * 100);
        const emoji   = pct === 100 ? '🏆' : pct >= 70 ? '⭐' : pct >= 40 ? '👍' : '🌱';
        const badges  = [h.isDaily ? '⚡ Daily' : '', h.hardMode ? '🔥 Hard' : ''].filter(Boolean).join(' · ');
        return `
          <div class="qh-entry">
            <div class="qh-icon">${emoji}</div>
            <div class="qh-info">
              <div class="qh-cat"><i class="fas ${catInfo.icon || 'fa-question'}" style="font-size:.8rem;opacity:.7"></i> ${esc(catInfo.name)}</div>
              <div class="qh-meta">${h.date}${badges ? ' · ' + badges : ''} · ${h.correct}/${h.total} correct</div>
            </div>
            <div class="qh-score">+${h.score} pts</div>
          </div>`;
      }).join('') + `</div>`;
  }

  /* ====================================================
     STREAK CALENDAR (12-week GitHub-style heatmap)
     ==================================================== */
  function renderStreakCalendar(profile) {
    const container = document.getElementById('prof-streak-calendar');
    if (!container) return;

    const playDates = new Set(profile.playDates || []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // Build 12 weeks × 7 days going back from today
    const WEEKS = 12;
    const DAYS  = WEEKS * 7;

    // Compute current streak
    let currentStreak = 0;
    let checkDay = new Date(today);
    while (true) {
      const ds = checkDay.toISOString().slice(0, 10);
      if (playDates.has(ds)) {
        currentStreak++;
        checkDay.setDate(checkDay.getDate() - 1);
      } else if (ds === todayStr) {
        // Today not played yet, still check yesterday
        checkDay.setDate(checkDay.getDate() - 1);
      } else {
        break;
      }
    }

    // Find the start of 12 weeks ago (start of that Sunday)
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (DAYS - 1));
    // Pad so the grid starts on Sunday (day 0)
    const startDow = startDay.getDay(); // 0=Sun
    const paddingCells = Array(startDow).fill('<div class="streak-cal-day" style="visibility:hidden"></div>').join('');

    // Build cells from oldest to newest
    const cells = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const played  = playDates.has(ds);
      const isToday = ds === todayStr;
      cells.push(`<div class="streak-cal-day${played ? ' played' : ''}${isToday ? ' today' : ''}" title="${ds}"></div>`);
    }

    container.innerHTML = `
      <div class="streak-cal-meta">
        <span><i class="fas fa-fire"></i> Current streak: <strong>${currentStreak} day${currentStreak !== 1 ? 's' : ''}</strong></span>
        <span><i class="fas fa-calendar-check"></i> ${playDates.size} total days played</span>
      </div>
      <div class="streak-cal-wrap">
        <div class="streak-cal-day-labels">
          ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<span>${d}</span>`).join('')}
        </div>
        <div class="streak-calendar-grid">${paddingCells}${cells.join('')}</div>
      </div>
      <div class="streak-cal-legend">
        <span>Less</span>
        <div class="streak-cal-day"></div>
        <div class="streak-cal-day played" style="opacity:.4"></div>
        <div class="streak-cal-day played"></div>
        <span>More</span>
      </div>`;
  }

  /* ====================================================
     STATS DASHBOARD
     ==================================================== */
  function renderStatsDashboard(profile) {
    const container = document.getElementById('prof-stats-dashboard');
    if (!container) return;

    const history = profile.quizHistory || [];
    const totalQuizzes  = profile.quizzes || 0;
    const totalCorrect  = history.reduce((s, h) => s + (h.correct || 0), 0);
    const totalQs       = history.reduce((s, h) => s + (h.total || 0), 0);
    const avgAccuracy   = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

    // Favorite category (most played from history)
    const catCounts = {};
    history.forEach(h => { catCounts[h.category] = (catCounts[h.category] || 0) + 1; });
    const topCatId  = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topCat    = QUIZ_CATEGORIES?.find(c => c.id === topCatId) || null;

    // Category bar chart (catBests)
    const catBests = profile.catBests || {};
    const maxBest  = Math.max(...Object.values(catBests), 1);
    const catBars  = QUIZ_CATEGORIES?.map(cat => {
      const best    = catBests[cat.id] || 0;
      const pct     = best > 0 ? Math.max(4, Math.round((best / maxBest) * 100)) : 0;
      const unplayed = best === 0;
      return `
        <div class="cat-bar-wrap">
          <div class="cat-bar-label">${cat.name.split(' ')[0]}</div>
          <div class="cat-bar-track${unplayed ? ' cat-bar-unplayed' : ''}">
            ${unplayed ? '' : `<div class="cat-bar-fill" style="width:${pct}%"></div>`}
          </div>
          <div class="cat-bar-val${unplayed ? ' cat-bar-val-unplayed' : ''}">${best || 'Not played'}</div>
        </div>`;
    }).join('') || '';

    container.innerHTML = `
      <div class="stats-dashboard">
        <div class="stat-tile">
          <div class="stat-tile-val">${totalQuizzes}</div>
          <div class="stat-tile-lbl">Quizzes Played</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val">${totalCorrect}</div>
          <div class="stat-tile-lbl">Correct Answers</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val">${avgAccuracy}%</div>
          <div class="stat-tile-lbl">Avg Accuracy</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val">${profile.bestStreak || 0}</div>
          <div class="stat-tile-lbl">Best Streak</div>
        </div>
      </div>
      ${topCat ? `<p class="stat-fave-cat"><i class="fas ${topCat.icon}"></i> Favorite category: <strong>${esc(topCat.name)}</strong></p>` : ''}
      ${catBars ? `<div class="cat-bars-section"><div class="cat-bars-title">Best Score per Category</div>${catBars}</div>` : ''}`;
  }

  /* ====================================================
     CHALLENGE A FRIEND
     ==================================================== */
  function renderChallengeFriendSection() {
    // Inject a challenge section after the friends list if signed in
    const friendsCard = document.querySelector('.profile-section-card:has(#prof-friends-list)');
    if (!friendsCard) return;
    if (!AuthModule.isAvailable || !AuthModule.currentUser) return;

    let challengeDiv = document.getElementById('prof-challenge-section');
    if (!challengeDiv) {
      challengeDiv = document.createElement('div');
      challengeDiv.id = 'prof-challenge-section';
      friendsCard.appendChild(challengeDiv);
    }
    _renderChallenges(challengeDiv);
  }

  async function _renderChallenges(container) {
    const friends = loadFriends();
    if (friends.length === 0) { container.innerHTML = ''; return; }

    // Get incoming challenges
    const [incoming, outgoing] = await Promise.all([
      AuthModule.getIncomingChallenges?.() || Promise.resolve([]),
      AuthModule.getOutgoingChallenges?.() || Promise.resolve([]),
    ]);

    const pendingIn  = incoming.filter(c => c.status === 'pending');
    const pendingOut = outgoing.filter(c => c.status === 'pending');
    const done       = [...incoming, ...outgoing].filter(c => c.status === 'completed').slice(0, 5);

    let html = `<div class="challenge-section"><div class="challenge-section-title"><i class="fas fa-swords"></i> Friend Challenges</div>`;

    if (pendingIn.length > 0) {
      html += pendingIn.map(c => {
        const catInfo = QUIZ_CATEGORIES?.find(q => q.id === c.category) || { name: c.category };
        return `
          <div class="challenge-card cc-incoming">
            <div class="cc-avatar">⚔️</div>
            <div class="cc-info">
              <div class="cc-name">${esc(c.fromUsername)} challenged you!</div>
              <div class="cc-meta">${esc(catInfo.name)}</div>
            </div>
            <div class="cc-actions">
              <button class="btn btn-sm btn-primary" onclick="ProfileModule._acceptChallenge('${c.id}','${c.category}',${c.seed})">
                <i class="fas fa-play"></i> Play
              </button>
            </div>
          </div>`;
      }).join('');
    }

    if (pendingOut.length > 0) {
      html += pendingOut.map(c => {
        const catInfo = QUIZ_CATEGORIES?.find(q => q.id === c.category) || { name: c.category };
        return `
          <div class="challenge-card cc-pending">
            <div class="cc-avatar">⏳</div>
            <div class="cc-info">
              <div class="cc-name">Challenged ${esc(c.toUsername)}</div>
              <div class="cc-meta">${esc(catInfo.name)} · waiting for response</div>
            </div>
          </div>`;
      }).join('');
    }

    if (done.length > 0) {
      html += done.map(c => {
        const myScore   = c.fromUid === AuthModule.currentUser?.uid ? c.fromScore : c.toScore;
        const theirScore= c.fromUid === AuthModule.currentUser?.uid ? c.toScore   : c.fromScore;
        const theirName = c.fromUid === AuthModule.currentUser?.uid ? c.toUsername : c.fromUsername;
        const won = myScore >= theirScore;
        return `
          <div class="challenge-card cc-done">
            <div class="cc-avatar">${won ? '🏆' : '💪'}</div>
            <div class="cc-info">
              <div class="cc-name">vs ${esc(theirName)}</div>
              <div class="cc-meta">${myScore} vs ${theirScore} pts · ${won ? 'You won!' : 'They won'}</div>
            </div>
          </div>`;
      }).join('');
    }

    // Challenge buttons for each friend
    html += `<div class="challenge-friend-list" style="margin-top:10px">`;
    html += `<div style="font-size:.78rem;color:var(--gray-500);margin-bottom:8px">Challenge a friend:</div>`;
    html += friends.slice(0, 6).map(f => `
      <button class="btn btn-sm btn-outline" style="margin-right:6px;margin-bottom:6px"
        onclick="ProfileModule._openChallengeModal('${f.uid}','${esc(f.username)}')">
        ${AVATARS[f.avatarIdx||0]} ${esc(f.username)}
      </button>`).join('');
    html += `</div></div>`;

    container.innerHTML = html;
  }

  function _openChallengeModal(toUid, toUsername) {
    // Build category picker modal
    const existing = document.getElementById('challenge-cat-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'challenge-cat-modal';
    modal.className = 'challenge-cat-modal';
    modal.innerHTML = `
      <div class="challenge-cat-inner">
        <div class="challenge-cat-title">⚔️ Challenge ${esc(toUsername)}</div>
        <div class="challenge-cat-grid" id="cc-grid"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="cc-send-btn" disabled>
            <i class="fas fa-paper-plane"></i> Send Challenge
          </button>
          <button class="btn btn-outline" onclick="document.getElementById('challenge-cat-modal').remove()">Cancel</button>
        </div>
        <p id="cc-msg" style="margin-top:8px;font-size:.82rem;color:var(--red-600)"></p>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    let selectedCat = null;
    const grid = document.getElementById('cc-grid');
    grid.innerHTML = QUIZ_CATEGORIES.filter(c => c.id !== 'mixed').map(c => `
      <button class="challenge-cat-btn" data-cat="${c.id}">${c.name}</button>`).join('');

    grid.querySelectorAll('.challenge-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.challenge-cat-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedCat = btn.dataset.cat;
        document.getElementById('cc-send-btn').disabled = false;
      });
    });

    document.getElementById('cc-send-btn').addEventListener('click', async () => {
      if (!selectedCat) return;
      const msgEl = document.getElementById('cc-msg');
      msgEl.textContent = 'Sending...';
      const seed = Math.floor(Math.random() * 2147483647);
      const result = await AuthModule.sendChallenge?.(toUid, toUsername, selectedCat, seed);
      if (result?.error) { msgEl.textContent = result.error === 'already_pending' ? 'You already have a pending challenge with this person!' : 'Something went wrong.'; return; }
      modal.remove();
    });
  }

  async function _acceptChallenge(challengeId, category, seed) {
    if (typeof getChallengeQuestions !== 'function') return;
    const questions = getChallengeQuestions(seed, category);
    document.getElementById('challenge-cat-modal')?.remove();
    // Switch to quiz tab and start challenge
    document.querySelector('.nav-btn[data-tab="quiz"]')?.click();
    setTimeout(() => window.QuizModule?.startChallengeQuiz?.(challengeId, questions, category), 200);
  }

  /* ====================================================
     ACHIEVEMENTS
     ==================================================== */
  function renderAchievementsList(profile) {
    const container = document.getElementById('prof-achievements-list');
    const pill      = document.getElementById('badge-count-pill');
    if (!container || !ACHIEVEMENTS) return;
    const earned = profile.badges || [];
    if (pill) pill.textContent = `${earned.length}/${ACHIEVEMENTS.length}`;

    // Build stat object used by hint functions
    const statObj = {
      quizzes:      profile.quizzes      || 0,
      totalPoints:  profile.totalPoints  || profile.points || 0,
      bestStreak:   profile.bestStreak   || 0,
      lastPerfect:  false,
      catsPlayed:   new Set(profile.catsPlayed  || []),
      catPerfects:  new Set(profile.catPerfects || []),
      friendsAdded: loadFriends().length,
      scanCount:    profile.scanCount    || 0,
      powerupsUsed: profile.powerupsUsed || 0,
    };

    container.innerHTML = ACHIEVEMENTS.map(ach => {
      const unlocked = earned.includes(ach.id);
      const hintText = (!unlocked && typeof ach.hint === 'function')
        ? ach.hint(statObj) : null;
      return `
        <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-info">
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
            ${hintText ? `<div class="ach-hint"><i class="fas fa-chart-simple"></i> ${esc(hintText)}</div>` : ''}
          </div>
          ${unlocked ? '<i class="fas fa-check-circle ach-check"></i>' : '<i class="fas fa-lock ach-lock"></i>'}
        </div>`;
    }).join('');
  }

  /* ====================================================
     RESET PROGRESS
     ==================================================== */
  async function confirmResetProgress(user, profile) {
    const confirmed = confirm(
      '⚠️ Reset ALL progress?\n\n' +
      'This will permanently erase:\n' +
      '  • All points & total points\n' +
      '  • Quiz stats & badges\n' +
      '  • Purchased items & power-ups\n\n' +
      'Your username and Google account will be kept.\n\n' +
      'This CANNOT be undone. Continue?'
    );
    if (!confirmed) return;

    const reset = {
      username:      profile.username,
      avatarIdx:     0,
      selectedTitle: 'newcomer',
      points:        0,
      totalPoints:   0,
      quizzes:       0,
      bestStreak:    0,
      catsPlayed:    [],
      catBests:      {},
      catPerfects:   [],
      badges:        [],
      purchasedItems:[],
      powerups:      {},
      scanCount:     0,
      powerupsUsed:  0,
    };

    const profiles = loadProfiles().filter(p => p.username !== profile.username);
    profiles.push(reset);
    localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
    localStorage.removeItem('rr_scan_daily');

    await AuthModule.syncProfileFlat(reset);
    reload();
    window.QuizModule?.reload?.();
  }

  /* ====================================================
     EDIT SCREEN
     ==================================================== */
  function renderEditScreen(user, profile) {
    const remaining = 2 - changesThisMonth().length;
    getContainer().innerHTML = `
      <div class="profile-setup-card">
        <h2><i class="fas fa-pencil"></i> Edit Profile</h2>
        <div class="avatar-section" style="margin-bottom:1.5rem">
          <label>Avatar: <span class="unlock-hint">Earn points or visit the Shop to unlock more!</span></label>
          <div class="avatar-picker" id="profile-edit-picker"></div>
        </div>
        <div class="title-picker-section">
          <label>Title <span class="unlock-hint">(shown on leaderboard)</span></label>
          <div class="title-picker" id="title-picker"></div>
        </div>
        <div class="title-picker-section" style="margin-top:1.2rem">
          <label>Profile Frame <span class="unlock-hint">Purchase frames in the Shop</span></label>
          <div class="frame-picker" id="frame-picker"></div>
        </div>
        <div class="setup-form" style="margin-top:1.5rem">
          <label style="font-size:.85rem;color:var(--gray-600);margin-bottom:4px;display:block">
            Username
            <span class="unlock-hint">${remaining > 0 ? `${remaining} change${remaining===1?'':'s'} remaining this month` : 'No changes left this month'}</span>
          </label>
          <input type="text" id="profile-edit-username"
            placeholder="Username" maxlength="20" autocomplete="off"
            value="${esc(profile.username)}" ${remaining <= 0 ? 'disabled' : ''}>
          <button class="btn btn-primary btn-lg" id="profile-edit-save">
            <i class="fas fa-check"></i> Save Changes
          </button>
          <button class="btn btn-outline btn-lg" id="profile-edit-cancel">Cancel</button>
        </div>
        <p class="setup-note" id="profile-edit-error"></p>
      </div>`;

    let selAvatar = profile.avatarIdx || 0;
    buildAvatarPicker('profile-edit-picker', selAvatar, profile, i => { selAvatar = i; });

    let selTitle = profile.selectedTitle || 'newcomer';
    buildTitlePicker('title-picker', selTitle, profile, id => { selTitle = id; });

    let selFrame = profile.equippedFrame || 'frame_none';
    buildFramePicker('frame-picker', selFrame, profile, id => { selFrame = id; });

    document.getElementById('profile-edit-save').addEventListener('click', () =>
      saveEditedProfile(user, profile, selAvatar, selTitle, selFrame));
    document.getElementById('profile-edit-cancel').addEventListener('click', () =>
      renderProfile(user, profile));
  }

  async function saveEditedProfile(user, oldProfile, avatarIdx, selectedTitle, equippedFrame = 'frame_none') {
    const input = document.getElementById('profile-edit-username');
    const errEl = document.getElementById('profile-edit-error');
    const newUsername = (input?.value || '').trim();
    const usernameChanged = newUsername.toLowerCase() !== oldProfile.username.toLowerCase();

    if (usernameChanged) {
      const err = validateUsername(newUsername);
      if (err) { errEl.textContent = err; return; }
      if (changesThisMonth().length >= 2) { errEl.textContent = 'You have used all 2 username changes for this month.'; return; }
      errEl.textContent = 'Checking availability…';
      const existing = await AuthModule.findUserByUsername(newUsername);
      if (existing) { errEl.textContent = 'That username is already taken. Try another.'; return; }
    }

    const finalUsername = usernameChanged ? newUsername : oldProfile.username;
    const updated = { ...oldProfile, username: finalUsername, avatarIdx, selectedTitle, equippedFrame };
    const profiles = loadProfiles().filter(p => p.username !== oldProfile.username && p.username !== finalUsername);
    profiles.push(updated);
    localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
    localStorage.setItem(KEY_CURRENT, finalUsername);
    if (usernameChanged) recordUsernameChange();
    await AuthModule.syncProfileFlat(updated);
    reload(); window.QuizModule?.reload?.();
  }

  /* ====================================================
     OFFLINE MODE
     ==================================================== */
  function renderOfflineMode() {
    getContainer().innerHTML = `
      <div class="profile-signin-prompt">
        <div class="profile-signin-icon"><i class="fas fa-cloud-arrow-up"></i></div>
        <h2>Cloud Sync Unavailable</h2>
        <p>Firebase is not configured. Your progress is saved locally on this device.</p>
      </div>`;
  }

  /* ====================================================
     AVATAR PICKER (checks progression + shop purchases)
     ==================================================== */
  function buildAvatarPicker(containerId, selectedIdx, profile, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = AVATARS.map((av, i) => {
      const unlocked = window.ShopModule
        ? ShopModule.isAvatarUnlocked(i, profile)
        : i <= 2; // only first 3 free without ShopModule
      return `
        <div class="avatar-opt${i === selectedIdx ? ' selected' : ''}${!unlocked ? ' av-locked' : ''}"
          data-idx="${i}" ${!unlocked ? `title="Buy in the Shop to unlock"` : ''}>
          ${av}${!unlocked ? `<span class="av-lock-label">🛒 Shop</span>` : ''}
        </div>`;
    }).join('');
    container.querySelectorAll('.avatar-opt:not(.av-locked)').forEach(el => {
      el.addEventListener('click', () => {
        container.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        onSelect(parseInt(el.dataset.idx));
      });
    });
  }

  /* ====================================================
     FRAME PICKER (checks shop purchases)
     ==================================================== */
  function buildFramePicker(containerId, selectedId, profile, onSelect) {
    const container = document.getElementById(containerId);
    if (!container || !FRAMES) return;
    container.innerHTML = FRAMES.map(f => {
      const unlocked = f.id === 'frame_none' || (window.ShopModule ? ShopModule.isFrameUnlocked(f.id, profile) : false);
      const sel = f.id === selectedId;
      const previewCss = f.css ? `avatar-frame-wrap ${f.css}` : '';
      return `
        <div class="frame-opt${sel ? ' selected' : ''}${!unlocked ? ' locked' : ''}"
          data-id="${f.id}" ${!unlocked ? `title="Buy in the Shop to unlock"` : ''}>
          <div class="frame-preview-avatar ${previewCss}" style="${previewCss ? 'width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center' : ''}">♻️</div>
          ${f.label}
          ${!unlocked ? `<span class="title-req">🛒 Shop</span>` : ''}
        </div>`;
    }).join('');
    container.querySelectorAll('.frame-opt:not(.locked)').forEach(el => {
      el.addEventListener('click', () => {
        container.querySelectorAll('.frame-opt').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        onSelect(el.dataset.id);
      });
    });
  }

  /* ====================================================
     TITLE PICKER (checks progression + shop purchases)
     ==================================================== */
  function buildTitlePicker(containerId, selectedId, profile, onSelect) {
    const container = document.getElementById(containerId);
    if (!container || !TITLES) return;
    container.innerHTML = TITLES.map(t => {
      const unlocked = window.ShopModule
        ? ShopModule.isTitleUnlocked(t.id, profile)
        : t.id === 'newcomer'; // only newcomer free without ShopModule
      const sel = t.id === selectedId;
      return `
        <div class="title-opt${sel ? ' selected' : ''}${!unlocked ? ' locked' : ''}"
          data-id="${t.id}" ${!unlocked ? `title="Buy in the Shop to unlock"` : ''}>
          ${t.label}
          ${!unlocked ? `<span class="title-req">🛒 Shop</span>` : ''}
        </div>`;
    }).join('');
    container.querySelectorAll('.title-opt:not(.locked)').forEach(el => {
      el.addEventListener('click', () => {
        container.querySelectorAll('.title-opt').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        onSelect(el.dataset.id);
      });
    });
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function getContainer() { return document.getElementById('profile-content'); }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, reload, isProfane, _acceptReq, _declineReq, _viewFriend, _closeFriendModal, _unfriend, _openChallengeModal, _acceptChallenge };
})();

window.ProfileModule = ProfileModule;
