import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from './firebase.js';

const USERS_COLLECTION = 'users';

// Supported system roles
export const USER_ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
};

/**
 * Validates student profile data fields.
 *
 * @param {Object} data
 * @returns {{ valid: boolean, errors: Object }}
 */
export const validateStudentProfile = (data = {}) => {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Full name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }

  if (!data.department || typeof data.department !== 'string' || !data.department.trim()) {
    errors.department = 'Academic department is required';
  }

  if (!data.year || typeof data.year !== 'string' || !data.year.trim()) {
    errors.year = 'Academic year is required';
  }

  if (data.photoURL && typeof data.photoURL === 'string' && data.photoURL.trim()) {
    try {
      new URL(data.photoURL);
    } catch {
      errors.photoURL = 'Please enter a valid URL for profile photo';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates organizer profile data fields.
 *
 * @param {Object} data
 * @returns {{ valid: boolean, errors: Object }}
 */
export const validateOrganizerProfile = (data = {}) => {
  const errors = {};

  const clubName = data.name || data.clubName;
  if (!clubName || typeof clubName !== 'string' || !clubName.trim()) {
    errors.name = 'Club name is required';
  }

  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.category = 'Club category is required';
  }

  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.description = 'Club description is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Creates a user profile document in Firestore with strict role safeguarding.
 * Public signups ALWAYS default to 'student' role to prevent self-elevation.
 *
 * @param {string} uid - Firebase Auth user UID (used as document ID)
 * @param {Object} userData - User profile fields
 * @param {boolean} [isAdminProvisioned=false] - Flag allowing non-student roles during admin provisioning
 * @returns {Promise<Object>} Created user profile data
 */
export const createUserProfile = async (uid, userData = {}, isAdminProvisioned = false) => {
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('Firestore is not configured or UID is missing.');
  }

  try {
    // Role protection: All public signups default strictly to 'student'
    const assignedRole = isAdminProvisioned && Object.values(USER_ROLES).includes(userData.role)
      ? userData.role
      : USER_ROLES.STUDENT;

    const userDocRef = doc(db, USERS_COLLECTION, uid);

    const userPayload = {
      uid,
      name: (userData.name || '').trim(),
      email: (userData.email || '').trim().toLowerCase(),
      photoURL: userData.photoURL || userData.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      role: assignedRole,
      department: userData.department || 'General',
      year: userData.year || userData.academicYear || '1st Year',
      academicYear: userData.academicYear || userData.year || '1st Year',
      bio: userData.bio || '',
      interests: Array.isArray(userData.interests) ? userData.interests : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, userPayload, { merge: true });
    return { ...userPayload, id: uid };
  } catch (error) {
    console.error(`Error creating user profile for ${uid}:`, error);
    throw error;
  }
};

/**
 * Fetch a user profile document by UID from Firestore.
 *
 * @param {string} uid - Firebase Auth user UID
 * @returns {Promise<Object|null>} - User document data or null if not found
 */
export const getUserProfile = async (uid) => {
  if (!isFirebaseConfigured || !db || !uid) {
    return null;
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user profile for ${uid}:`, error);
    throw error;
  }
};

/**
 * Update an existing student's profile document in Firestore.
 * Strictly disallows client-side role tampering, email changes, and UID mutations.
 *
 * @param {string} uid - Firebase Auth user UID
 * @param {Object} data - Fields to update (role/uid/email stripped automatically)
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, data = {}) => {
  if (!isFirebaseConfigured || !db || !uid) {
    return;
  }

  // Ensure user cannot update another user's profile unless authenticated as that user
  if (auth?.currentUser && auth.currentUser.uid !== uid) {
    throw new Error('Unauthorized: You can only update your own user profile.');
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);

    // Filter out immutable and privilege-sensitive keys
    const { role, uid: _uid, email, createdAt, ...allowedUpdates } = data;

    // Normalize field names
    const updates = {
      ...allowedUpdates,
      updatedAt: serverTimestamp(),
    };

    if (updates.avatar && !updates.photoURL) {
      updates.photoURL = updates.avatar;
    }

    await updateDoc(userDocRef, updates);

    // Synchronize Firebase Auth display name and photoURL if active user matches
    if (auth?.currentUser && auth.currentUser.uid === uid) {
      try {
        const authUpdates = {};
        if (updates.name) authUpdates.displayName = updates.name;
        if (updates.photoURL) authUpdates.photoURL = updates.photoURL;

        if (Object.keys(authUpdates).length > 0) {
          await updateFirebaseProfile(auth.currentUser, authUpdates);
        }
      } catch (authSyncErr) {
        console.warn('Could not sync Auth display name/photo:', authSyncErr);
      }
    }
  } catch (error) {
    console.error(`Error updating user profile for ${uid}:`, error);
    throw error;
  }
};

/**
 * Update permitted profile fields for an organizer.
 *
 * @param {string} uid - Organizer user UID
 * @param {Object} data - Permitted organizer fields
 * @returns {Promise<void>}
 */
export const updateOrganizerProfile = async (uid, data = {}) => {
  if (!isFirebaseConfigured || !db || !uid) {
    return;
  }

  if (auth?.currentUser && auth.currentUser.uid !== uid) {
    throw new Error('Unauthorized: You can only update your own organizer profile.');
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);

    // Permitted fields only
    const {
      name,
      clubName,
      organizerName,
      description,
      about,
      category,
      website,
      github,
      linkedin,
      twitter,
      instagram,
      photoURL,
      logo,
      banner,
      tags,
      membersCount,
    } = data;

    const updates = {
      updatedAt: serverTimestamp(),
    };

    if (name !== undefined || clubName !== undefined) {
      updates.name = (name || clubName || '').trim();
      updates.clubName = updates.name;
    }
    if (organizerName !== undefined) updates.organizerName = organizerName.trim();
    if (description !== undefined) updates.description = description;
    if (about !== undefined) updates.about = about;
    if (category !== undefined) updates.category = category;
    if (website !== undefined) updates.website = website;
    if (github !== undefined) updates.github = github;
    if (linkedin !== undefined) updates.linkedin = linkedin;
    if (twitter !== undefined) updates.twitter = twitter;
    if (instagram !== undefined) updates.instagram = instagram;
    if (logo !== undefined || photoURL !== undefined) {
      updates.photoURL = logo || photoURL;
      updates.logo = updates.photoURL;
    }
    if (banner !== undefined) updates.banner = banner;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (membersCount !== undefined) updates.membersCount = Number(membersCount);

    await updateDoc(userDocRef, updates);

    // Update Firebase Auth display name if active
    if (auth?.currentUser && auth.currentUser.uid === uid && updates.name) {
      try {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: updates.name,
          photoURL: updates.photoURL || auth.currentUser.photoURL,
        });
      } catch (authErr) {
        console.warn('Could not sync organizer Auth display name:', authErr);
      }
    }
  } catch (error) {
    console.error(`Error updating organizer profile for ${uid}:`, error);
    throw error;
  }
};

/**
 * Get the role of a user ('student', 'organizer', or 'admin').
 * Defaults to 'student' if document or role is missing.
 *
 * @param {string} uid - Firebase Auth user UID
 * @returns {Promise<string>} - User role
 */
export const getUserRole = async (uid) => {
  try {
    const profile = await getUserProfile(uid);
    return profile?.role || USER_ROLES.STUDENT;
  } catch (error) {
    console.warn(`Could not determine role for ${uid}, defaulting to '${USER_ROLES.STUDENT}':`, error);
    return USER_ROLES.STUDENT;
  }
};

/**
 * Fetch full account metadata (creation date, email verified, role)
 *
 * @param {string} uid
 * @returns {Promise<Object>}
 */
export const getUserAccountInfo = async (uid) => {
  const profile = await getUserProfile(uid);
  const currentAuthUser = auth?.currentUser;

  return {
    profile,
    authMeta: currentAuthUser && currentAuthUser.uid === uid ? {
      emailVerified: currentAuthUser.emailVerified,
      creationTime: currentAuthUser.metadata?.creationTime,
      lastSignInTime: currentAuthUser.metadata?.lastSignInTime,
    } : null,
  };
};

/**
 * Query all organizers (e.g. for directory or organizer selection).
 *
 * @returns {Promise<Array>}
 */
export const getOrganizers = async () => {
  if (!isFirebaseConfigured || !db) return [];

  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', USER_ROLES.ORGANIZER)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching organizers:', error);
    throw error;
  }
};
