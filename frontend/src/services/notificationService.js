import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const NOTIFICATION_TYPES = {
  REGISTRATION_CONFIRMED: 'registration_confirmed',
  REGISTRATION_CANCELLED: 'registration_cancelled',
  EVENT_UPDATE: 'event_update',
  EVENT_REMINDER: 'event_reminder',
  CERTIFICATE_ISSUED: 'certificate_issued',
  GENERAL: 'general',
};

/**
 * Fetch notifications for a specific user (recipient).
 *
 * @param {string} recipientId - User UID
 * @param {Object} [options={}] - { unreadOnly, maxResults }
 * @returns {Promise<Array>} List of notifications
 */
export const getUserNotifications = async (recipientId, options = {}) => {
  if (!isFirebaseConfigured || !db || !recipientId) {
    return [];
  }

  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const constraints = [
      where('recipientId', '==', recipientId),
    ];

    if (options.unreadOnly) {
      constraints.push(where('isRead', '==', false));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (options.maxResults) {
      constraints.push(limit(options.maxResults));
    }

    const q = query(notifRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error(`Error fetching notifications for ${recipientId}:`, error);
    throw error;
  }
};

/**
 * Create a new notification for a user.
 *
 * @param {Object} notification - Notification details
 * @returns {Promise<Object>} Created notification with document ID
 */
export const createNotification = async ({
  recipientId,
  title,
  message,
  type = NOTIFICATION_TYPES.GENERAL,
  relatedEventId = null,
}) => {
  if (!isFirebaseConfigured || !db || !recipientId) {
    throw new Error('Firestore is not configured or recipientId is missing.');
  }

  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const payload = {
      recipientId,
      title: title || 'Campus Update',
      message: message || '',
      type,
      relatedEventId: relatedEventId || null,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(notifRef, payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark a single notification as read.
 *
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  if (!isFirebaseConfigured || !db || !notificationId) {
    return;
  }

  try {
    const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifDocRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

/**
 * Mark all unread notifications for a user as read.
 *
 * @param {string} recipientId
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (recipientId) => {
  if (!isFirebaseConfigured || !db || !recipientId) {
    return;
  }

  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where('recipientId', '==', recipientId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error marking all notifications read for ${recipientId}:`, error);
    throw error;
  }
};

/**
 * Delete a notification document.
 *
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  if (!isFirebaseConfigured || !db || !notificationId) {
    return;
  }

  try {
    const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notifDocRef);
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
};

