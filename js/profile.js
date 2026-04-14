/* ============================================================
   RecycleRight — Profile Module
   Account management, friends, achievements, username rules
   ============================================================ */

const ProfileModule = (function () {

  const KEY_PROFILES  = 'rr_profiles';
  const KEY_CURRENT   = 'rr_current';
  const KEY_FRIENDS   = 'rr_friends';
  const KEY_UN_CHANGES = 'rr_username_changes'; // array of ISO timestamps

  /* ====================================================
     PROFANITY FILTER
     ==================================================== */
  const BANNED = [
    'fuck','shit','bitch','cunt','dick','cock','pussy','nigger','nigga',
    'faggot','fag','retard','whore','slut','bastard','asshole','piss',
    'rape','nazi','porn','sex','weed','drug','hack','kill','die',
    'arse','twat','wank','damn','crap','ass',
  ];

  function isProfane(str) {
    const lower = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return BANNED.some(w => lower.includes(w));
  }

  /* ====================================================
     USERNAME VALIDATION
     ==================================================== */
  function validateUsername(username) {
    if (!username)                         return 'Please enter a username.';
    if (username.length < 4)               return 'Username must be at least 4 characters.';
    if (username.length > 20)              return 'Username must be 20 characters or fewer.';
    if (/[^a-zA-Z0-9_]/.test(username))   return 'Only letters, numbers, and underscores allowed.';
    if (isProfane(username))               return 'That username is not allowed. Please choose another.';
    return null; // valid
  }

  /* ====================================================
     USERNAME CHANGE TRACKING (2 per calendar month)
     ==================================================== */
  function changesThisMonth() {
    const all = JSON.parse(localStorage.getItem(KEY_UN_CHANGES) || '[]');
    const ym  = new Date().toISOString().slice(0, 7); // "2026-04"
    return all.filter(d => d.startsWith(ym));
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
    if (pts < 100)  return 1;
    if (pts < 300)  return 2;
    if (pts < 700)  return 3;
    if (pts < 1500) return 4;
    return 5;
  }

  /* ====================================================
     INIT / RELOAD
     ==================================================== */
  function init() { reload(); }

  async function reload() {
    if (!AuthModule.isAvailable) { renderOfflineMode(); return; }

    const user = AuthModule.currentUser;
    if (!user) { renderSignedOut(); return; }

    const hasProf = await AuthModule.hasProfile();
    if (!hasProf) {
      const local = localStorage.getItem(KEY_CURRENT);
      renderSetupScreen(user, local || null);
    } else {
      const username = localStorage.getItem(KEY_CURRENT);
      const profile  = loadProfiles().find(p => p.username === username) || null;
      renderProfile(user, profile);
    }
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
     SETUP (new Google user picking username)
     ==================================================== */
  function renderSetupScreen(user, suggestedUsername) {
    const photoHTML = user.photoURL
      ? `<img src="${esc(user.photoURL)}" alt="avatar" class="profile-google-photo">`
      : `<div class="profile-google-initials">${(user.displayName || 'U')[0].toUpperCase()}</div>`;

    getContainer().innerHTML = `
      <div class="profile-setup-card">
        <div class="profile-setup-google-info">
          ${photoHTML}
          <div>
            <div class="profile-setup-name">${esc(user.displayName || 'Google User')}</div>
            <div class="profile-setup-email">${esc(user.email || '')}</div>
          </div>
        </div>
        <h2>Choose Your Username</h2>
        <p class="profile-setup-subtitle">Pick a username (4–20 characters) that will appear on the leaderboard.</p>
        <div class="avatar-section" style="margin-bottom:1.5rem">
          <label>Pick an avatar:</label>
          <div class="avatar-picker" id="profile-avatar-picker"></div>
        </div>
        <div class="setup-form">
          <input type="text" id="profile-username-input"
            placeholder="Username (letters, numbers, _ only)"
            maxlength="20" autocomplete="off"
            value="${esc(suggestedUsername || '')}">
          <button class="btn btn-primary btn-lg" id="profile-save-btn">
            <i class="fas fa-check"></i> Save Profile
          </button>
        </div>
        <p class="setup-note" id="profile-setup-error"></p>
      </div>`;

    let selectedIdx = 0;
    buildAvatarPicker('profile-avatar-picker', selectedIdx, i => { selectedIdx = i; });

    document.getElementById('profile-save-btn').addEventListener('click', () => saveNewProfile(user, selectedIdx));
    document.getElementById('profile-username-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') saveNewProfile(user, selectedIdx);
    });
  }

  async function saveNewProfile(user, avatarIdx) {
    const input   = document.getElementById('profile-username-input');
    const errorEl = document.getElementById('profile-setup-error');
    const username = input.value.trim();

    const err = validateUsername(username);
    if (err) { errorEl.textContent = err; return; }

    errorEl.textContent = 'Checking availability…';
    const existing = await AuthModule.findUserByUsername(username);
    if (existing) { errorEl.textContent = 'That username is already taken. Try another.'; return; }

    const oldProfile = loadProfiles().find(p => p.username === localStorage.getItem(KEY_CURRENT));
    const profile = {
      username,
      avatarIdx,
      points:     oldProfile?.points     || 0,
      quizzes:    oldProfile?.quizzes    || 0,
      bestStreak: oldProfile?.bestStreak || 0,
      catsPlayed: oldProfile?.catsPlayed || [],
      catBests:   oldProfile?.catBests   || {},
      badges:     oldProfile?.badges     || [],
    };

    const profiles = loadProfiles().filter(p => p.username !== username);
    profiles.push(profile);
    localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
    localStorage.setItem(KEY_CURRENT, username);

    await AuthModule.syncProfileFlat(profile);
    reload();
    window.QuizModule?.reload?.();
  }

  /* ====================================================
     FULL PROFILE VIEW
     ==================================================== */
  function renderProfile(user, profile) {
    if (!profile) { renderSetupScreen(user, null); return; }

    const avatar = AVATARS[profile.avatarIdx] || AVATARS[0];
    const level  = calcLevel(profile.points || 0);
    const photoHTML = user.photoURL
      ? `<img src="${esc(user.photoURL)}" alt="avatar" class="profile-google-photo-sm">`
      : '';

    getContainer().innerHTML = `
      <div class="profile-page">

        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-card-top">
            <div class="profile-big-avatar">${avatar}</div>
            <div class="profile-card-info">
              <div class="profile-display-name">${esc(profile.username)} ${photoHTML}</div>
              <div class="profile-google-linked"><i class="fab fa-google"></i> ${esc(user.email || '')}</div>
              <div class="profile-level-badge">Level ${level}</div>
            </div>
            <button class="btn btn-sm btn-outline" id="profile-edit-btn">
              <i class="fas fa-pencil"></i> Edit
            </button>
          </div>
          <div class="profile-stats-band">
            <div class="pstat-lg"><div class="pstat-val">${(profile.points || 0).toLocaleString()}</div><div class="pstat-lbl">Points</div></div>
            <div class="pstat-lg"><div class="pstat-val">${profile.quizzes || 0}</div><div class="pstat-lbl">Quizzes</div></div>
            <div class="pstat-lg"><div class="pstat-val">${profile.bestStreak || 0}</div><div class="pstat-lbl">Best Streak</div></div>
            <div class="pstat-lg"><div class="pstat-val">${(profile.badges || []).length}</div><div class="pstat-lbl">Badges</div></div>
          </div>
        </div>

        <!-- Account -->
        <div class="profile-section-card">
          <h3 class="profile-section-title"><i class="fas fa-shield-halved"></i> Account</h3>
          <div class="profile-account-row">
            <div>
              <div class="profile-account-label">Signed in with Google</div>
              <div class="profile-account-value">${esc(user.displayName || user.email || '')}</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="AuthModule.signOut()">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>

        <!-- Friends -->
        <div class="profile-section-card" id="profile-friends-section">
          <h3 class="profile-section-title"><i class="fas fa-users"></i> Friends</h3>
          <div class="add-friend-form" style="margin-bottom:12px">
            <input type="text" id="prof-friend-input" placeholder="Search by username…">
            <button class="btn btn-primary" id="prof-friend-add-btn">
              <i class="fas fa-user-plus"></i> Add
            </button>
          </div>
          <p id="prof-friend-msg" class="friend-msg"></p>
          <div id="prof-friends-list" class="friends-list"></div>
        </div>

        <!-- Achievements -->
        <div class="profile-section-card">
          <h3 class="profile-section-title">
            <i class="fas fa-medal"></i> Badges
            <span class="badge-count-pill" id="badge-count-pill"></span>
          </h3>
          <div class="profile-achievements-list" id="prof-achievements-list"></div>
        </div>

      </div>`;

    document.getElementById('profile-edit-btn').addEventListener('click', () => renderEditScreen(user, profile));
    document.getElementById('prof-friend-add-btn').addEventListener('click', () => addFriendByUsername());
    document.getElementById('prof-friend-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') addFriendByUsername();
    });

    renderFriendsList();
    renderAchievementsList(profile);
  }

  /* ====================================================
     FRIENDS
     ==================================================== */
  async function addFriendByUsername() {
    const input  = document.getElementById('prof-friend-input');
    const msgEl  = document.getElementById('prof-friend-msg');
    const username = (input?.value || '').trim().toLowerCase();

    msgEl.className = 'friend-msg';
    if (!username) { msgEl.textContent = 'Enter a username to search.'; msgEl.classList.add('error'); return; }

    if (!AuthModule.isAvailable || !AuthModule.currentUser) {
      msgEl.textContent = 'Sign in with Google to add friends.';
      msgEl.classList.add('error');
      return;
    }

    msgEl.textContent = 'Searching…';
    const found = await AuthModule.findUserByUsername(username);

    if (!found) {
      msgEl.textContent = `No user found with username "${username}".`;
      msgEl.classList.add('error');
      return;
    }
    if (found.uid === AuthModule.currentUser?.uid) {
      msgEl.textContent = "That's you!";
      msgEl.classList.add('error');
      return;
    }

    const friends = loadFriends();
    if (friends.find(f => f.uid === found.uid)) {
      msgEl.textContent = `${found.displayName || found.username} is already your friend.`;
      msgEl.classList.add('error');
      return;
    }

    friends.push({
      uid: found.uid,
      username: found.username,
      displayName: found.displayName || found.username,
      avatarIdx: found.avatarIdx || 0,
      points: found.points || 0,
      quizzes: found.quizzes || 0,
      bestStreak: found.bestStreak || 0,
    });
    saveFriends(friends);

    input.value = '';
    msgEl.textContent = `Added ${found.displayName || found.username} as a friend!`;
    msgEl.classList.add('success');
    renderFriendsList();
  }

  function renderFriendsList() {
    const container = document.getElementById('prof-friends-list');
    if (!container) return;
    const friends = loadFriends();

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
            <div class="friend-name">${esc(f.displayName || f.username)}</div>
            <div class="friend-meta">Lv ${calcLevel(f.points)} · ${f.quizzes || 0} quizzes · Best streak: ${f.bestStreak || 0}</div>
          </div>
          <div class="friend-score">${(f.points || 0).toLocaleString()} pts</div>
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
          ${unlocked
            ? '<i class="fas fa-check-circle ach-check"></i>'
            : '<i class="fas fa-lock ach-lock"></i>'}
        </div>`;
    }).join('');
  }

  /* ====================================================
     EDIT PROFILE
     ==================================================== */
  function renderEditScreen(user, profile) {
    const remaining = 2 - changesThisMonth().length;
    const limitNote = remaining <= 0
      ? '<p class="setup-note" style="color:var(--amber-700)"><i class="fas fa-triangle-exclamation"></i> You have used all 2 username changes for this month.</p>'
      : `<p class="setup-note" style="color:var(--gray-500)">${remaining} username change${remaining === 1 ? '' : 's'} remaining this month.</p>`;

    getContainer().innerHTML = `
      <div class="profile-setup-card">
        <h2><i class="fas fa-pencil"></i> Edit Profile</h2>
        <div class="avatar-section" style="margin-bottom:1.5rem">
          <label>Avatar:</label>
          <div class="avatar-picker" id="profile-edit-picker"></div>
        </div>
        <div class="setup-form">
          <input type="text" id="profile-edit-username"
            placeholder="Username" maxlength="20" autocomplete="off"
            value="${esc(profile.username)}"
            ${remaining <= 0 ? 'disabled' : ''}>
          <button class="btn btn-primary btn-lg" id="profile-edit-save"
            ${remaining <= 0 ? 'disabled' : ''}>
            <i class="fas fa-check"></i> Save Changes
          </button>
          <button class="btn btn-outline btn-lg" id="profile-edit-cancel">Cancel</button>
        </div>
        ${limitNote}
        <p class="setup-note" id="profile-edit-error"></p>
      </div>`;

    let selectedIdx = profile.avatarIdx || 0;
    buildAvatarPicker('profile-edit-picker', selectedIdx, i => { selectedIdx = i; });

    document.getElementById('profile-edit-save')?.addEventListener('click', () => saveEditedProfile(user, profile, selectedIdx));
    document.getElementById('profile-edit-cancel').addEventListener('click', () => renderProfile(user, profile));
  }

  async function saveEditedProfile(user, oldProfile, avatarIdx) {
    const input   = document.getElementById('profile-edit-username');
    const errorEl = document.getElementById('profile-edit-error');
    const newUsername = (input?.value || '').trim();

    // Avatar-only change (no username change)
    const usernameChanged = newUsername.toLowerCase() !== oldProfile.username.toLowerCase();

    if (usernameChanged) {
      const err = validateUsername(newUsername);
      if (err) { errorEl.textContent = err; return; }

      if (changesThisMonth().length >= 2) {
        errorEl.textContent = 'You have used all 2 username changes for this month.';
        return;
      }

      errorEl.textContent = 'Checking availability…';
      const existing = await AuthModule.findUserByUsername(newUsername);
      if (existing) { errorEl.textContent = 'That username is already taken. Try another.'; return; }
    }

    const finalUsername = usernameChanged ? newUsername : oldProfile.username;
    const updatedProfile = { ...oldProfile, username: finalUsername, avatarIdx };

    const profiles = loadProfiles()
      .filter(p => p.username !== oldProfile.username && p.username !== finalUsername);
    profiles.push(updatedProfile);
    localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
    localStorage.setItem(KEY_CURRENT, finalUsername);

    if (usernameChanged) recordUsernameChange();

    await AuthModule.syncProfileFlat(updatedProfile);
    reload();
    window.QuizModule?.reload?.();
  }

  /* ====================================================
     OFFLINE MODE
     ==================================================== */
  function renderOfflineMode() {
    getContainer().innerHTML = `
      <div class="profile-signin-prompt">
        <div class="profile-signin-icon"><i class="fas fa-cloud-arrow-up"></i></div>
        <h2>Cloud Sync Unavailable</h2>
        <p>Firebase is not configured. The app is running in offline mode — your progress is saved locally on this device.</p>
      </div>`;
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function buildAvatarPicker(containerId, selectedIdx, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = AVATARS.map((av, i) =>
      `<div class="avatar-opt${i === selectedIdx ? ' selected' : ''}" data-idx="${i}">${av}</div>`
    ).join('');
    container.querySelectorAll('.avatar-opt').forEach(el => {
      el.addEventListener('click', () => {
        container.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        onSelect(parseInt(el.dataset.idx));
      });
    });
  }

  function getContainer() { return document.getElementById('profile-content'); }

  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  return { init, reload, isProfane };
})();

window.ProfileModule = ProfileModule;
