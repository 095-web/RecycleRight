/* ============================================================
   RecycleRight — Profile Module
   Account management tab: sign-in, profile display, edit
   ============================================================ */

const ProfileModule = (function () {

  /* ====================================================
     INIT / RELOAD
     ==================================================== */
  function init() {
    reload();
  }

  async function reload() {
    if (!AuthModule.isAvailable) {
      renderOfflineMode();
      return;
    }

    const user = AuthModule.currentUser;

    if (!user) {
      renderSignedOut();
      return;
    }

    // Firebase user — check for profile
    const hasProf = await AuthModule.hasProfile();
    if (!hasProf) {
      const localUsername = localStorage.getItem('rr_current');
      const profiles      = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
      const localProfile  = profiles.find(p => p.username === localUsername);
      renderSetupScreen(user, localProfile?.username || null);
    } else {
      const username = localStorage.getItem('rr_current');
      const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
      const profile  = profiles.find(p => p.username === username);
      renderProfile(user, profile || null);
    }
  }

  /* ====================================================
     RENDER: SIGNED OUT
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
     RENDER: SETUP (Google user needs username)
     ==================================================== */
  function renderSetupScreen(user, suggestedUsername) {
    const photoHTML = user.photoURL
      ? `<img src="${escapeHtml(user.photoURL)}" alt="avatar" class="profile-google-photo">`
      : `<div class="profile-google-initials">${(user.displayName || 'U')[0].toUpperCase()}</div>`;

    getContainer().innerHTML = `
      <div class="profile-setup-card">
        <div class="profile-setup-google-info">
          ${photoHTML}
          <div>
            <div class="profile-setup-name">${escapeHtml(user.displayName || 'Google User')}</div>
            <div class="profile-setup-email">${escapeHtml(user.email || '')}</div>
          </div>
        </div>
        <h2>Choose Your Username</h2>
        <p class="profile-setup-subtitle">Pick a username that will appear on the leaderboard.</p>
        <div class="avatar-section" style="margin-bottom:1.5rem">
          <label>Pick an avatar:</label>
          <div class="avatar-picker" id="profile-avatar-picker"></div>
        </div>
        <div class="setup-form">
          <input type="text" id="profile-username-input"
            placeholder="Username (letters, numbers, _ only)"
            maxlength="20" autocomplete="off"
            value="${escapeHtml(suggestedUsername || '')}">
          <button class="btn btn-primary btn-lg" id="profile-save-btn">
            <i class="fas fa-check"></i> Save Profile
          </button>
        </div>
        <p class="setup-note" id="profile-setup-error"></p>
      </div>`;

    let selectedAvatarIdx = 0;
    const picker = document.getElementById('profile-avatar-picker');
    picker.innerHTML = AVATARS.map((av, i) =>
      `<div class="avatar-opt${i === 0 ? ' selected' : ''}" data-idx="${i}">${av}</div>`
    ).join('');
    picker.querySelectorAll('.avatar-opt').forEach(el => {
      el.addEventListener('click', () => {
        picker.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        selectedAvatarIdx = parseInt(el.dataset.idx);
      });
    });

    document.getElementById('profile-save-btn').addEventListener('click', () => {
      saveNewProfile(user, selectedAvatarIdx);
    });
    document.getElementById('profile-username-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') saveNewProfile(user, selectedAvatarIdx);
    });
  }

  async function saveNewProfile(user, avatarIdx) {
    const input   = document.getElementById('profile-username-input');
    const errorEl = document.getElementById('profile-setup-error');
    const username = input.value.trim();

    if (!username) { errorEl.textContent = 'Please enter a username.'; return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      errorEl.textContent = 'Username must be 3–20 characters: letters, numbers, underscores only.';
      return;
    }

    errorEl.textContent = 'Checking availability…';
    const existing = await AuthModule.findUserByUsername(username);
    if (existing) {
      errorEl.textContent = 'That username is already taken. Try another.';
      return;
    }

    const oldProfiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
    const oldProfile  = oldProfiles.find(p => p.username === localStorage.getItem('rr_current'));

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

    const profiles = oldProfiles.filter(p => p.username !== username);
    profiles.push(profile);
    localStorage.setItem('rr_profiles', JSON.stringify(profiles));
    localStorage.setItem('rr_current', username);

    await AuthModule.syncProfileFlat(profile);

    reload();
    window.QuizModule?.reload?.();
  }

  /* ====================================================
     RENDER: FULL PROFILE
     ==================================================== */
  function renderProfile(user, profile) {
    if (!profile) { renderSetupScreen(user, null); return; }

    const avatar = AVATARS[profile.avatarIdx] || AVATARS[0];
    const level  = calcLevel(profile.points || 0);

    const photoHTML = user.photoURL
      ? `<img src="${escapeHtml(user.photoURL)}" alt="avatar" class="profile-google-photo-sm">`
      : '';

    getContainer().innerHTML = `
      <div class="profile-page">

        <div class="profile-card">
          <div class="profile-card-top">
            <div class="profile-big-avatar">${avatar}</div>
            <div class="profile-card-info">
              <div class="profile-display-name">
                ${escapeHtml(profile.username)} ${photoHTML}
              </div>
              <div class="profile-google-linked">
                <i class="fab fa-google"></i> ${escapeHtml(user.email || '')}
              </div>
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

        <div class="profile-section-card">
          <h3 class="profile-section-title"><i class="fas fa-shield-halved"></i> Account</h3>
          <div class="profile-account-row">
            <div>
              <div class="profile-account-label">Signed in with Google</div>
              <div class="profile-account-value">${escapeHtml(user.displayName || user.email || '')}</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="AuthModule.signOut()">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>

        ${renderBadgesSection(profile)}

      </div>`;

    document.getElementById('profile-edit-btn').addEventListener('click', () => {
      renderEditScreen(user, profile);
    });
  }

  function renderBadgesSection(profile) {
    if (!window.ACHIEVEMENTS) return '';
    const earned = profile.badges || [];
    const items  = ACHIEVEMENTS.map(ach => {
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

    return `
      <div class="profile-section-card">
        <h3 class="profile-section-title">
          <i class="fas fa-medal"></i> Badges
          <span class="badge-count-pill">${earned.length}/${ACHIEVEMENTS.length}</span>
        </h3>
        <div class="profile-achievements-list">${items}</div>
      </div>`;
  }

  /* ====================================================
     RENDER: EDIT PROFILE
     ==================================================== */
  function renderEditScreen(user, profile) {
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
            value="${escapeHtml(profile.username)}">
          <button class="btn btn-primary btn-lg" id="profile-edit-save">
            <i class="fas fa-check"></i> Save Changes
          </button>
          <button class="btn btn-outline btn-lg" id="profile-edit-cancel">
            Cancel
          </button>
        </div>
        <p class="setup-note" id="profile-edit-error"></p>
      </div>`;

    let selectedAvatarIdx = profile.avatarIdx || 0;
    const picker = document.getElementById('profile-edit-picker');
    picker.innerHTML = AVATARS.map((av, i) =>
      `<div class="avatar-opt${i === selectedAvatarIdx ? ' selected' : ''}" data-idx="${i}">${av}</div>`
    ).join('');
    picker.querySelectorAll('.avatar-opt').forEach(el => {
      el.addEventListener('click', () => {
        picker.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        selectedAvatarIdx = parseInt(el.dataset.idx);
      });
    });

    document.getElementById('profile-edit-save').addEventListener('click', () => {
      saveEditedProfile(user, profile, selectedAvatarIdx);
    });
    document.getElementById('profile-edit-cancel').addEventListener('click', () => {
      renderProfile(user, profile);
    });
  }

  async function saveEditedProfile(user, oldProfile, avatarIdx) {
    const input   = document.getElementById('profile-edit-username');
    const errorEl = document.getElementById('profile-edit-error');
    const newUsername = input.value.trim();

    if (!newUsername) { errorEl.textContent = 'Username cannot be empty.'; return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
      errorEl.textContent = 'Username must be 3–20 characters: letters, numbers, underscores only.';
      return;
    }

    if (newUsername.toLowerCase() !== oldProfile.username.toLowerCase()) {
      errorEl.textContent = 'Checking availability…';
      const existing = await AuthModule.findUserByUsername(newUsername);
      if (existing) {
        errorEl.textContent = 'That username is already taken. Try another.';
        return;
      }
    }

    const updatedProfile = { ...oldProfile, username: newUsername, avatarIdx };

    const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]')
      .filter(p => p.username !== oldProfile.username && p.username !== newUsername);
    profiles.push(updatedProfile);
    localStorage.setItem('rr_profiles', JSON.stringify(profiles));
    localStorage.setItem('rr_current', newUsername);

    await AuthModule.syncProfileFlat(updatedProfile);

    reload();
    window.QuizModule?.reload?.();
  }

  /* ====================================================
     RENDER: OFFLINE MODE
     ==================================================== */
  function renderOfflineMode() {
    getContainer().innerHTML = `
      <div class="profile-signin-prompt">
        <div class="profile-signin-icon"><i class="fas fa-cloud-arrow-up"></i></div>
        <h2>Cloud Sync Unavailable</h2>
        <p>Firebase is not configured. The app is running in offline mode — your progress is saved locally on this device.</p>
        <p class="profile-guest-note">To enable cloud sync and leaderboards, set up Firebase in <code>firebase-config.js</code>.</p>
      </div>`;
  }

  /* ====================================================
     UTILS
     ==================================================== */
  function calcLevel(points) {
    if (points < 100)  return 1;
    if (points < 300)  return 2;
    if (points < 700)  return 3;
    if (points < 1500) return 4;
    return 5;
  }

  function getContainer() {
    return document.getElementById('profile-content');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  return { init, reload };
})();

window.ProfileModule = ProfileModule;
