/* ============================================================
   RecycleRight — Auth Module
   Google Sign-In via Firebase + Firestore profile sync
   Falls back to localStorage-only if Firebase is not configured.
   ============================================================ */

const AuthModule = (function () {

  let db   = null;
  let auth = null;
  let _currentUser = null;

  /* ---- Is Firebase properly configured? ---- */
  function isConfigured() {
    const cfg = window.FIREBASE_CONFIG;
    return cfg && cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY' && typeof firebase !== 'undefined';
  }

  /* ====================================================
     INIT
     ==================================================== */
  function init() {
    updateHeaderUI(null);

    if (!isConfigured()) {
      console.info('RecycleRight: Firebase not configured — running in offline mode.');
      showSetupHint();
      return;
    }

    try {
      if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
      auth = firebase.auth();
      db   = firebase.firestore();

      auth.onAuthStateChanged(async (user) => {
        _currentUser = user;
        updateHeaderUI(user);

        if (user) {
          await loadAndMergeProfile(user);
          window.QuizModule?.reload?.();
        } else {
          window.QuizModule?.reload?.();
        }
      });
    } catch (err) {
      console.error('Firebase init error:', err);
    }
  }

  /* ====================================================
     SIGN-IN / SIGN-OUT
     ==================================================== */
  function signInWithGoogle() {
    if (!isConfigured()) {
      alert('Firebase is not configured yet.\n\nOpen firebase-config.js and follow the setup instructions to enable Google sign-in.');
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Sign-in error:', err);
        alert('Sign-in failed. Please try again.');
      }
    });
  }

  function signOut() {
    if (!auth) return;
    auth.signOut().catch(console.error);
  }

  /* ====================================================
     PROFILE SYNC (Firestore ↔ localStorage)
     ==================================================== */

  /* Load from Firestore, migrate localStorage data if needed */
  async function loadAndMergeProfile(user) {
    if (!db) return;
    try {
      const docRef = db.collection('users').doc(user.uid);
      const snap   = await docRef.get();

      if (snap.exists) {
        const data = snap.data();
        // Write cloud profile to localStorage so quiz.js can read it synchronously
        if (data.profile) {
          const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]')
            .filter(p => p.username !== data.profile.username);
          profiles.push(data.profile);
          localStorage.setItem('rr_profiles', JSON.stringify(profiles));
          localStorage.setItem('rr_current', data.profile.username);
        }
        if (data.friends) {
          localStorage.setItem('rr_friends', JSON.stringify(data.friends));
        }
        if (data.zipCode) {
          const existing = JSON.parse(localStorage.getItem('rr_location') || 'null');
          if (!existing) localStorage.setItem('rr_location', JSON.stringify({ zip: data.zipCode, state: data.state || '', city: data.city || '' }));
        }
      } else {
        // First sign-in: migrate existing localStorage profile to Firestore
        const username = localStorage.getItem('rr_current');
        if (username) {
          const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
          const local = profiles.find(p => p.username === username);
          if (local) {
            await docRef.set({ profile: local, friends: [], updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
          }
        }
      }
    } catch (err) {
      console.error('Firestore load error:', err);
    }
  }

  /* Save a profile object to Firestore (fire-and-forget) */
  async function syncProfile(profile) {
    if (!db || !_currentUser) return;
    try {
      const friends = JSON.parse(localStorage.getItem('rr_friends') || '[]');
      const loc     = JSON.parse(localStorage.getItem('rr_location') || 'null');
      await db.collection('users').doc(_currentUser.uid).set({
        profile,
        friends,
        zipCode:    loc?.zip   || null,
        state:      loc?.state || null,
        city:       loc?.city  || null,
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Firestore sync error:', err);
    }
  }

  /* Sync location data to Firestore */
  async function syncLocation(locData) {
    if (!db || !_currentUser) return;
    try {
      await db.collection('users').doc(_currentUser.uid).set({
        zipCode: locData.zip,
        state:   locData.state,
        city:    locData.city,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Firestore location sync error:', err);
    }
  }

  /* ====================================================
     HEADER UI
     ==================================================== */
  function updateHeaderUI(user) {
    const signedOut = document.getElementById('auth-signed-out');
    const signedIn  = document.getElementById('auth-signed-in');
    if (!signedOut || !signedIn) return;

    if (user) {
      signedOut.style.display = 'none';
      signedIn.style.display  = 'flex';
      const nameEl   = document.getElementById('auth-user-name');
      const photoEl  = document.getElementById('auth-user-photo');
      if (nameEl)  nameEl.textContent = user.displayName?.split(' ')[0] || 'You';
      if (photoEl) {
        if (user.photoURL) {
          photoEl.innerHTML = `<img src="${user.photoURL}" alt="avatar" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--green-300)">`;
        } else {
          photoEl.innerHTML = `<span class="auth-avatar-fallback">${(user.displayName||'U')[0]}</span>`;
        }
      }
    } else {
      signedOut.style.display = 'flex';
      signedIn.style.display  = 'none';
    }
  }

  function showSetupHint() {
    const btn = document.getElementById('auth-google-btn');
    if (btn) {
      btn.title = 'Firebase not configured — see firebase-config.js';
      btn.style.opacity = '.6';
    }
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  return {
    init,
    signInWithGoogle,
    signOut,
    syncProfile,
    syncLocation,
    get currentUser() { return _currentUser; },
    get isAvailable()  { return isConfigured(); },
  };
})();

window.AuthModule = AuthModule;
