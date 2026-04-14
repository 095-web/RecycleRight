/*
  ============================================================
  RecycleRight — Firebase Configuration
  ============================================================

  SETUP INSTRUCTIONS:
  ──────────────────
  1. Go to https://console.firebase.google.com and sign in.
  2. Click "Add project" and give it a name (e.g. "recycleright").
  3. In the left menu, go to Build → Authentication.
     • Click "Get started", then enable "Google" as a sign-in provider.
  4. In the left menu, go to Build → Firestore Database.
     • Click "Create database" → start in production mode → choose a region.
  5. In Firestore, go to Rules and paste this (then Publish):

       rules_version = '2';
       service cloud.firestore {
         match /databases/{database}/documents {
           match /users/{uid} {
             allow read, write: if request.auth != null && request.auth.uid == uid;
           }
         }
       }

  6. In Project Overview, click "Add app" → Web (</>), register your app.
  7. Copy the firebaseConfig object and paste the values below.
  8. In Authentication → Settings → Authorized domains, add:
       • localhost  (for local testing)
       • yourusername.github.io  (for GitHub Pages)

  ──────────────────
  Once configured, Google sign-in and cloud sync will activate automatically.
  Until then, the app works fully offline with localStorage.
  ============================================================
*/

window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCBnzh3KTrQ4CvdF6hhuVD4fqH0fW_CJx0",
  authDomain:        "asda-9cdc0.firebaseapp.com",
  projectId:         "asda-9cdc0",
  storageBucket:     "asda-9cdc0.firebasestorage.app",
  messagingSenderId: "249367806192",
  appId:             "1:249367806192:web:595d13552f562ff7b24235"
};
