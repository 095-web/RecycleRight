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
    if (!window.TITLES) return '';
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

    const avatar = AVATARS[profile.avatarIdx] || AVATARS[0];
    const level  = calcLevel(profile.points || 0);
    const titleText = getTitle(profile);
    const photoHTML = user.photoURL
      ? `<img src="${esc(user.photoURL)}" alt="" class="profile-google-photo-sm">` : '';

    getContainer().innerHTML = `
      <div class="profile-page">

        <div class="profile-card">
          <div class="profile-card-top">
            <div class="profile-big-avatar">${avatar}</div>
            <div class="profile-card-info">
              <div class="profile-display-name">${esc(profile.username)} ${photoHTML}</div>
              <div class="profile-title-tag">${esc(titleText)}</div>
              <div class="profile-google-linked"><i class="fab fa-google"></i> ${esc(user.email||'')}</div>
              <div class="profile-level-badge">Level ${level}</div>
            </div>
            <button class="btn btn-sm btn-outline" id="profile-edit-btn">
              <i class="fas fa-pencil"></i> Edit
            </button>
          </div>
          <div class="profile-stats-band">
            <div class="pstat-lg"><div class="pstat-val">${(profile.points||0).toLocaleString()}</div><div class="pstat-lbl">Points</div></div>
            <div class="pstat-lg"><div class="pstat-val">${profile.quizzes||0}</div><div class="pstat-lbl">Quizzes</div></div>
            <div class="pstat-lg"><div class="pstat-val">${profile.bestStreak||0}</div><div class="pstat-lbl">Best Streak</div></div>
            <div class="pstat-lg"><div class="pstat-val">${(profile.badges||[]).length}</div><div class="pstat-lbl">Badges</div></div>
          </div>
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

      </div>`;

    document.getElementById('profile-edit-btn').addEventListener('click', () => renderEditScreen(user, profile));
    document.getElementById('prof-friend-send-btn').addEventListener('click', sendFriendRequest);
    document.getElementById('prof-friend-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendFriendRequest();
    });

    renderFriendsList();
    renderAchievementsList(profile);
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
      <div class="friend-entry">
        <div class="friend-avatar">${AVATARS[f.avatarIdx||0]}</div>
        <div class="friend-info">
          <div class="friend-name">${esc(f.displayName||f.username)}</div>
          <div class="friend-meta">Lv ${calcLevel(f.points)} · ${f.quizzes||0} quizzes · Best streak: ${f.bestStreak||0}</div>
        </div>
        <div class="friend-score">${(f.points||0).toLocaleString()} pts</div>
      </div>`).join('');
  }

  /* ====================================================
     ACHIEVEMENTS
     ==================================================== */
  function renderAchievementsList(profile) {
    const container = document.getElementById('prof-achievements-list');
    const pill      = document.getElementById('badge-count-pill');
    if (!container || !window.ACHIEVEMENTS) return;
    const earned = profile.badges || [];
    if (pill) pill.textContent = `${earned.length}/${ACHIEVEMENTS.length}`;
    container.innerHTML = ACHIEVEMENTS.map(ach => {
      const unlocked = earned.includes(ach.id);
      return `
        <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-info">
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>
          ${unlocked ? '<i class="fas fa-check-circle ach-check"></i>' : '<i class="fas fa-lock ach-lock"></i>'}
        </div>`;
    }).join('');
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

    document.getElementById('profile-edit-save').addEventListener('click', () =>
      saveEditedProfile(user, profile, selAvatar, selTitle));
    document.getElementById('profile-edit-cancel').addEventListener('click', () =>
      renderProfile(user, profile));
  }

  async function saveEditedProfile(user, oldProfile, avatarIdx, selectedTitle) {
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
    const updated = { ...oldProfile, username: finalUsername, avatarIdx, selectedTitle };
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
        : (profile?.points || 0) >= (AVATAR_UNLOCKS?.[i] || 0);
      return `
        <div class="avatar-opt${i === selectedIdx ? ' selected' : ''}${!unlocked ? ' av-locked' : ''}"
          data-idx="${i}" ${!unlocked ? `title="Unlock via points or Shop"` : ''}>
          ${av}${!unlocked ? `<span class="av-lock-label">${AVATAR_UNLOCKS[i]}pts</span>` : ''}
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
     TITLE PICKER (checks progression + shop purchases)
     ==================================================== */
  function buildTitlePicker(containerId, selectedId, profile, onSelect) {
    const container = document.getElementById(containerId);
    if (!container || !window.TITLES) return;
    container.innerHTML = TITLES.map(t => {
      const unlocked = window.ShopModule
        ? ShopModule.isTitleUnlocked(t.id, profile)
        : (profile?.points || 0) >= t.pts;
      const sel = t.id === selectedId;
      return `
        <div class="title-opt${sel ? ' selected' : ''}${!unlocked ? ' locked' : ''}"
          data-id="${t.id}" ${!unlocked ? `title="Unlock via points or Shop"` : ''}>
          ${t.label}
          ${!unlocked ? `<span class="title-req">${t.pts}pts</span>` : ''}
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

  return { init, reload, isProfane, _acceptReq, _declineReq };
})();

window.ProfileModule = ProfileModule;
