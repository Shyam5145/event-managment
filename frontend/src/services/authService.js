import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  deleteUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase.js';
import { getUserProfile, createUserProfile } from './userService.js';

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 *
 * @param {Error|Object|string} error - Error thrown by Firebase SDK or error code string
 * @returns {string} Human-readable error message
 */
export const formatAuthError = (error) => {
  const code = error?.code ||
    (typeof error?.message === 'string' ? error.message.match(/auth\/[a-z0-9-]+/)?.[0] : null) ||
    (typeof error === 'string' ? error.match(/auth\/[a-z0-9-]+/)?.[0] : null) ||
    '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication is disabled for this Firebase project. Open Firebase Console → Authentication → Sign-in method → Email/Password and enable it. Make sure you are using the campuspuulse project.';
    case 'auth/email-already-in-use':
      return 'An account with this college email already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please provide a valid college email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many consecutive requests. Please wait a moment and try again.';
    case 'auth/user-not-found':
      return 'No student or organizer account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your login credentials.';
    case 'auth/user-disabled':
      return 'This campus account has been disabled. Please contact the administrator.';
    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires recent authentication. Please re-login.';
    default:
      return error?.message || (typeof error === 'string' ? error : 'Authentication error. Please try again.');
  }
};

/**
 * Register a new user with Firebase Authentication and create their Firestore profile.
 * Defaults role strictly to 'student' to prevent privilege escalation.
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} additionalData - Extra profile info (name, department, year, photoURL)
 * @returns {Promise<{ user: Object, profile: Object }>}
 */
export const signUp = async (email, password, additionalData = {}) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured. Please supply VITE_FIREBASE_* credentials or use Demo Mode.');
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!cleanEmail) {
    throw new Error('College email is required.');
  }

  if (!cleanPassword) {
    throw new Error('Password is required.');
  }

  try {
    let firebaseUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      firebaseUser = userCredential.user;
    } catch (authError) {
      // If the account was already created in Auth (e.g. from an earlier attempt where profile creation failed),
      // authenticate the user and check if their Firestore profile is missing.
      // If missing, we continue to create the profile instead of failing or creating duplicates.
      if (authError.code === 'auth/email-already-in-use' && cleanEmail && cleanPassword) {
        try {
          const existingCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          const existingProfile = await getUserProfile(existingCred.user.uid);
          if (!existingProfile) {
            // Profile is missing; adopt this authenticated user and proceed to save profile
            firebaseUser = existingCred.user;
          } else {
            throw authError;
          }
        } catch (recoveryErr) {
          throw authError;
        }
      } else {
        throw authError;
      }
    }

    const displayName = (additionalData.name || additionalData.fullName || cleanEmail.split('@')[0]).trim();
    const photoURL = additionalData.photoURL || additionalData.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
    const department = additionalData.department || 'General';
    const academicYear = additionalData.academicYear || additionalData.year || '1st Year';

    // Update Firebase Auth display name and photo
    try {
      await updateFirebaseProfile(firebaseUser, {
        displayName,
        photoURL,
      });
    } catch (profileError) {
      console.warn('Could not update Firebase auth display profile:', profileError);
    }

    // Role is ALWAYS enforced as 'student' on public signup
    const userProfile = {
      uid: firebaseUser.uid,
      name: displayName,
      email: firebaseUser.email || cleanEmail,
      photoURL,
      role: 'student',
      department,
      year: academicYear,
      academicYear,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile, { merge: true });
      } catch (firestoreError) {
        console.error('Firestore user document creation failed after Auth creation:', firestoreError);
        throw new Error('Authentication account created, but saving profile in Firestore failed. Please try submitting again to complete setup.');
      }
    }

    return { user: firebaseUser, profile: userProfile };
  } catch (error) {
    console.error('Firebase signUp error:', error.code || error.message);
    const friendlyMessage = formatAuthError(error);
    const friendlyError = new Error(friendlyMessage);
    friendlyError.code = error.code || (typeof error?.message === 'string' ? error.message.match(/auth\/[a-z0-9-]+/)?.[0] : null);
    throw friendlyError;
  }
};

/**
 * Sign in an existing user with email and password.
 * Loads Firestore profile and handles missing profile backfills.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, profile: Object }>}
 */
export const signIn = async (email, password) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured. Please supply VITE_FIREBASE_* credentials or use Demo Mode.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    let profile = await getUserProfile(firebaseUser.uid);

    // If profile is missing from Firestore, auto-provision a default profile
    if (!profile && db) {
      profile = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        role: 'student',
        department: 'General',
        year: '1st Year',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), profile);
    }

    return { user: firebaseUser, profile };
  } catch (error) {
    console.error('Firebase signIn error:', error);
    const friendlyError = new Error(formatAuthError(error));
    friendlyError.code = error.code;
    throw friendlyError;
  }
};

/**
 * Sign out the currently authenticated user.
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  if (!isFirebaseConfigured || !auth) {
    return;
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase signOut error:', error);
    throw error;
  }
};

/**
 * Send password reset email to user.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured. Please configure credentials to send reset emails.');
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Firebase resetPassword error:', error);
    const friendlyError = new Error(formatAuthError(error));
    friendlyError.code = error.code;
    throw friendlyError;
  }
};

/**
 * Get currently authenticated user object from Firebase auth instance.
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  return auth.currentUser;
};

/**
 * Subscribe to Firebase Auth state changes and load corresponding Firestore user document.
 * Ensures persistent session state across page refreshes.
 *
 * @param {Function} callback - Called with ({ user, profile, role }) or (null)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        let profile = await getUserProfile(firebaseUser.uid);

        // Backfill profile if missing
        if (!profile && db) {
          profile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Campus Student',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
            role: 'student',
            department: 'General',
            year: '1st Year',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), profile);
        }

        const role = profile?.role || 'student';

        callback({
          user: firebaseUser,
          profile,
          role,
        });
      } catch (err) {
        console.warn('Could not fetch Firestore profile for authenticated user:', err);
        callback({
          user: firebaseUser,
          profile: {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            role: 'student',
          },
          role: 'student',
        });
      }
    } else {
      callback(null);
    }
  });
};
