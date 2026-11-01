import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, isFirebaseConfigured } from './firebase.js';

// Configuration & Constraints
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validates file type and size for event posters.
 *
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export const validatePosterFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No image file was provided.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported image format. Allowed formats: JPEG, PNG, WebP, GIF.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB}MB) exceeds the maximum limit of 5MB.`,
    };
  }

  return { valid: true };
};

/**
 * Upload an event poster to Firebase Storage at `events/{eventId}/posters/{fileName}`.
 * Tracks upload progress via callback.
 *
 * @param {File} file - File object from browser file input
 * @param {string} eventId - Unique event identifier or temp ID
 * @param {Function} [onProgress] - Optional callback receiving progress percentage (0 - 100)
 * @returns {Promise<{ url: string, path: string, fileName: string, size: number }>}
 */
export const uploadEventPoster = (file, eventId = 'general', onProgress = null) => {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured || !storage) {
      return reject(new Error('Firebase Storage is not configured.'));
    }

    const validation = validatePosterFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    // Generate safe, unique file name to avoid collisions
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFileName = `${timestamp}_${cleanFileName}`;
    const storagePath = `events/${eventId}/posters/${safeFileName}`;

    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type,
      customMetadata: {
        eventId: String(eventId),
        uploadedAt: new Date().toISOString(),
      },
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (typeof onProgress === 'function') {
          onProgress(progress, snapshot);
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            path: storagePath,
            fileName: safeFileName,
            size: file.size,
          });
        } catch (err) {
          console.error('Failed to get download URL:', err);
          reject(err);
        }
      }
    );
  });
};

/**
 * Delete an event poster file from Firebase Storage.
 *
 * @param {string} posterPathOrUrl - Storage full path or https download URL
 * @returns {Promise<void>}
 */
export const deleteEventPoster = async (posterPathOrUrl) => {
  if (!isFirebaseConfigured || !storage || !posterPathOrUrl) {
    return;
  }

  // Only attempt deletion if it's a Firebase Storage resource
  const isFirebaseAsset =
    posterPathOrUrl.includes('firebasestorage.googleapis.com') ||
    posterPathOrUrl.startsWith('events/');

  if (!isFirebaseAsset) {
    return;
  }

  try {
    const fileRef = ref(storage, posterPathOrUrl);
    await deleteObject(fileRef);
  } catch (error) {
    // If object was already deleted or doesn't exist, ignore error
    if (error?.code !== 'storage/object-not-found') {
      console.warn('Could not delete poster from Firebase Storage:', error.message);
    }
  }
};

/**
 * Replace an existing event poster with a newly uploaded one,
 * safely deleting the previous storage object if applicable.
 *
 * @param {File} newFile - Newly selected image file
 * @param {string} eventId - Target event ID
 * @param {string} [oldPosterPathOrUrl] - Previous poster URL or path to remove
 * @param {Function} [onProgress] - Optional upload progress callback
 * @returns {Promise<{ url: string, path: string, fileName: string }>}
 */
export const replaceEventPoster = async (newFile, eventId, oldPosterPathOrUrl = null, onProgress = null) => {
  // 1. Upload new poster first
  const newPoster = await uploadEventPoster(newFile, eventId, onProgress);

  // 2. If upload succeeded and old asset exists in Firebase Storage, clean it up
  if (oldPosterPathOrUrl && oldPosterPathOrUrl !== newPoster.url) {
    deleteEventPoster(oldPosterPathOrUrl).catch((err) => {
      console.debug('Old poster cleanup completed with warning:', err.message);
    });
  }

  return newPoster;
};

/**
 * Updates the poster URL of an event document in Cloud Firestore.
 *
 * @param {string} eventId - Event document ID
 * @param {string} posterURL - New public poster download URL
 * @returns {Promise<void>}
 */
export const savePosterUrlInFirestore = async (eventId, posterURL) => {
  if (!isFirebaseConfigured || !db || !eventId || !posterURL) {
    return;
  }

  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      posterURL,
      image: posterURL,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error saving poster URL for event ${eventId} in Firestore:`, error);
    throw error;
  }
};

