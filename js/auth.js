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
        }
        // Notify both modules
        window.QuizModule?.reload?.();
        window.ProfileModule?.reload?.();
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
    // Clear local current-user pointer so quiz shows setup after sign-out
    localStorage.removeItem('rr_current');
    auth.signOut().catch(console.error);
  }

  /* ====================================================
     PROFILE SYNC (Firestore ↔ localStorage)
     ==================================================== */

  async function loadAndMergeProfile(user) {
    if (!db) return;
    try {
      const docRef = db.collection('users').doc(user.uid);
      const snap   = await docRef.get();

      if (snap.exists) {
        const data = snap.data();
        // Reconstruct a profile object from flat fields or nested profile
        const profile = data.profile || {
          username:    data.username    || '',
          avatarIdx:   data.avatarIdx   || 0,
          points:      data.points      || 0,
          quizzes:     data.quizzes     || 0,
          bestStreak:  data.bestStreak  || 0,
          catsPlayed:  data.catsPlayed  || [],
          catBests:    data.catBests    || {},
          badges:      data.badges      || [],
        };

        if (profile.username) {
          const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]')
            .filter(p => p.username !== profile.username);
          profiles.push(profile);
          localStorage.setItem('rr_profiles', JSON.stringify(profiles));
          localStorage.setItem('rr_current', profile.username);
        }
        if (data.friends) localStorage.setItem('rr_friends', JSON.stringify(data.friends));
        if (data.zipCode) {
          const existing = JSON.parse(localStorage.getItem('rr_location') || 'null');
          if (!existing) localStorage.setItem('rr_location', JSON.stringify({ zip: data.zipCode, state: data.state || '', stateAbbr: data.stateAbbr || '', city: data.city || '' }));
        }
      } else {
        // First sign-in: migrate existing localStorage profile to Firestore
        const username = localStorage.getItem('rr_current');
        if (username) {
          const profiles = JSON.parse(localStorage.getItem('rr_profiles') || '[]');
          const local = profiles.find(p => p.username === username);
          if (local) {
            await docRef.set({
              username:   local.username,
              displayName: local.username,
              avatarIdx:  local.avatarIdx || 0,
              points:     local.points    || 0,
              quizzes:    local.quizzes   || 0,
              bestStreak: local.bestStreak|| 0,
              catsPlayed: local.catsPlayed|| [],
              catBests:   local.catBests  || {},
              badges:     local.badges    || [],
              profile:    local,
              friends:    [],
              updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        // No localStorage profile either — quiz.js will show username picker
      }
    } catch (err) {
      console.error('Firestore load error:', err);
    }
  }

  /* Check if the current user has a Firestore document with a username */
  async function hasProfile() {
    if (!db || !_currentUser) return false;
    try {
      const snap = await db.collection('users').doc(_currentUser.uid).get();
      return snap.exists && !!snap.data()?.username;
    } catch { return false; }
  }

  /* Save flat fields to Firestore — enables leaderboard ordering & username search */
  async function syncProfileFlat(profile) {
    if (!db || !_currentUser) return;
    try {
      await db.collection('users').doc(_currentUser.uid).set({
        username:    (profile.username  || '').toLowerCase(),
        displayName: profile.username   || '',
        avatarIdx:      profile.avatarIdx      || 0,
        points:         profile.points         || 0,
        quizzes:        profile.quizzes        || 0,
        bestStreak:     profile.bestStreak     || 0,
        catsPlayed:     profile.catsPlayed     || [],
        catBests:       profile.catBests       || {},
        badges:         profile.badges         || [],
        selectedTitle:  profile.selectedTitle  || 'newcomer',
        purchasedItems: profile.purchasedItems || [],
        profile,   // keep nested copy for backwards compat
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Firestore flat sync error:', err);
    }
  }

  /* Legacy nested sync — also calls flat sync to keep both in step */
  async function syncProfile(profile) {
    if (!db || !_currentUser) return;
    syncProfileFlat(profile); // fire flat sync alongside
    try {
      const friends = JSON.parse(localStorage.getItem('rr_friends') || '[]');
      const loc     = JSON.parse(localStorage.getItem('rr_location') || 'null');
      await db.collection('users').doc(_currentUser.uid).set({
        friends,
        zipCode:   loc?.zip       || null,
        state:     loc?.state     || null,
        stateAbbr: loc?.stateAbbr || null,
        city:      loc?.city      || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
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
        zipCode:   locData.zip,
        state:     locData.state,
        stateAbbr: locData.stateAbbr || '',
        city:      locData.city,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('Firestore location sync error:', err);
    }
  }

  /* Search for a user by username (case-insensitive) */
  async function findUserByUsername(username) {
    if (!db || !_currentUser) return null;
    try {
      const snap = await db.collection('users')
        .where('username', '==', username.toLowerCase().trim())
        .limit(1)
        .get();
      if (snap.empty) return null;
      return { uid: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (err) {
      console.error('Username search error:', err);
      return null;
    }
  }

  /* Subscribe to real-time leaderboard — returns unsubscribe fn */
  function subscribeLeaderboard(callback) {
    if (!db || !_currentUser) return () => {};
    try {
      return db.collection('users')
        .orderBy('points', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
          const uid = _currentUser?.uid;
          const entries = snapshot.docs.map(doc => ({
            uid:           doc.id,
            username:      doc.data().username      || '?',
            displayName:   doc.data().displayName   || doc.data().username || '?',
            avatarIdx:     doc.data().avatarIdx      || 0,
            points:        doc.data().points         || 0,
            quizzes:       doc.data().quizzes        || 0,
            bestStreak:    doc.data().bestStreak     || 0,
            selectedTitle: doc.data().selectedTitle  || 'newcomer',
            isMe:          doc.id === uid,
          }));
          callback(entries);
        }, err => console.error('Leaderboard listener error:', err));
    } catch (err) {
      console.error('subscribeLeaderboard error:', err);
      return () => {};
    }
  }

  /* ====================================================
     FRIEND REQUESTS
     ==================================================== */
  async function sendFriendRequest(toUid, toUsername) {
    if (!db || !_currentUser) return { error: 'not_signed_in' };
    const myProfile = JSON.parse(localStorage.getItem('rr_profiles') || '[]')
      .find(p => p.username === localStorage.getItem('rr_current'));
    if (!myProfile) return { error: 'no_profile' };

    // Check for duplicate pending request
    const dup = await db.collection('friendRequests')
      .where('fromUid', '==', _currentUser.uid)
      .where('toUid',   '==', toUid)
      .where('status',  '==', 'pending')
      .limit(1).get();
    if (!dup.empty) return { error: 'already_sent' };

    await db.collection('friendRequests').add({
      fromUid:       _currentUser.uid,
      fromUsername:  myProfile.username,
      fromAvatarIdx: myProfile.avatarIdx  || 0,
      fromPoints:    myProfile.points     || 0,
      fromQuizzes:   myProfile.quizzes    || 0,
      fromBestStreak:myProfile.bestStreak || 0,
      toUid,
      toUsername,
      status:  'pending',
      sentAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  }

  function subscribeIncomingRequests(callback) {
    if (!db || !_currentUser) return () => {};
    try {
      return db.collection('friendRequests')
        .where('toUid',  '==', _currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snap => {
          callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => console.error('Incoming requests error:', err));
    } catch(e) { return () => {}; }
  }

  async function respondToFriendRequest(requestId, accept) {
    if (!db || !_currentUser) return;
    await db.collection('friendRequests').doc(requestId).update({
      status: accept ? 'accepted' : 'declined',
      respondedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  async function getAcceptedSentRequests() {
    if (!db || !_currentUser) return [];
    try {
      const snap = await db.collection('friendRequests')
        .where('fromUid', '==', _currentUser.uid)
        .where('status',  '==', 'accepted')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { return []; }
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
      const nameEl  = document.getElementById('auth-user-name');
      const photoEl = document.getElementById('auth-user-photo');
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
    if (btn) { btn.title = 'Firebase not configured — see firebase-config.js'; btn.style.opacity = '.6'; }
  }

  /* ====================================================
     PUBLIC API
     ==================================================== */
  return {
    init,
    signInWithGoogle,
    signOut,
    syncProfile,
    syncProfileFlat,
    syncLocation,
    hasProfile,
    findUserByUsername,
    subscribeLeaderboard,
    sendFriendRequest,
    subscribeIncomingRequests,
    respondToFriendRequest,
    getAcceptedSentRequests,
    get currentUser() { return _currentUser; },
    get isAvailable()  { return isConfigured(); },
  };
})();

window.AuthModule = AuthModule;
