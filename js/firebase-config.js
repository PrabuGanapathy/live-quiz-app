// ============================================================================
// FIREBASE CONFIGURATION & SETUP INSTRUCTIONS
// ============================================================================
// 
// STEP-BY-STEP SETUP FOR NON-TECHNICAL USERS:
//
// 1. Go to https://console.firebase.google.com/
// 2. Click "Create a project" or "Add project"
// 3. Enter a project name (e.g., "Live Quiz App") and click Continue
// 4. Disable Google Analytics (optional, you can enable if you want)
// 5. Click "Create project" and wait for it to complete
//
// 6. In the Firebase Console, click the "</>" icon to create a web app
// 7. Register the app with a nickname (e.g., "Live Quiz Web")
// 8. Firebase will show you a config object. Copy these values:
//    - apiKey
//    - authDomain
//    - projectId
//    - storageBucket
//    - messagingSenderId
//    - appId
//
// 9. Paste those values into the firebaseConfig object below (replace the placeholders)
//
// 10. In the Firebase Console left sidebar, go to "Firestore Database"
// 11. Click "Create database"
// 12. Select "Start in test mode" (for development; use production rules before going live)
// 13. Select your preferred region and click "Enable"
// 14. Firestore is now ready!
//
// 15. Below, set your own ADMIN_PIN and ADMIN_PASSWORD (any numeric PIN and password you want)
// ============================================================================

// Replace these with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Admin credentials for the host console
// Change these to any PIN and password you want
const ADMIN_PIN = "1234";
const ADMIN_PASSWORD = "admin123";

// Maximum number of players per run (safety limit)
const MAX_PLAYERS_PER_RUN = 250;

// Initialize Firebase (this happens when firebase-app-compat.js and firebase-firestore-compat.js are loaded)
let db;
function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    // Optional: disable offline persistence for simplicity
    db.settings({ experimentalForceLongPolling: false });
  }
}

// Call this once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
  initializeFirebase();
}
