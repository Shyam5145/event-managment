import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Firebase configuration loaded using Vite environment variables (`import.meta.env`).
 * Firebase web configuration must be supplied through Vite environment variables.
 */
const env = (typeof import.meta !== 'undefined' && import.meta?.env) 
  ? import.meta.env 
  : (typeof process !== 'undefined' && process?.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForEnvironment0000',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'campuspuulse.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'campuspuulse',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'campuspuulse.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

/**
 * Helper flag indicating that valid credentials are configured.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your_api_key') &&
  !firebaseConfig.apiKey.includes('PlaceholderKey')
);

// Prevent duplicate Firebase application instances
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Core Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Analytics safely (only in supported browser environments)
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      // Gracefully silence analytics errors in unsupported environments
      console.debug('Firebase Analytics is not supported in this environment:', err);
    });
}

export { app, auth, db, storage, analytics };
export default app;
