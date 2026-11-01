import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isFirebaseConfigured, auth } from '../services/firebase.js';
import {
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteRemoteNotification,
} from '../services/notificationService.js';

const NotificationContext = createContext(null);

const NOTIFICATIONS_STORAGE_KEY = 'campuspulse_notifications';

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Registration Confirmed',
    message: 'Your admission pass for Campus Hackathon 2026 is confirmed. Ticket #CP-TKT-HACK-884 is ready.',
    type: 'pass',
    category: 'Passes',
    read: false,
    timestamp: '10 minutes ago',
    date: '2026-11-01T00:00:00Z',
    link: '/student/registrations',
  },
  {
    id: 'notif-2',
    title: 'Event Starts Tomorrow',
    message: 'Reminder: Inter-College Football Cup kicks off tomorrow at 03:30 PM in Varsity Stadium.',
    type: 'reminder',
    category: 'Events',
    read: false,
    timestamp: '2 hours ago',
    date: '2026-10-31T22:00:00Z',
    link: '/events/evt-football-cup',
  },
  {
    id: 'notif-3',
    title: 'Certificate Available',
    message: 'Congratulations! Your certificate for Full-Stack React Bootcamp is now available to download.',
    type: 'certificate',
    category: 'Certificates',
    read: false,
    timestamp: '1 day ago',
    date: '2026-10-30T14:30:00Z',
    link: '/student/certificates',
  },
  {
    id: 'notif-4',
    title: 'New Event Announced',
    message: 'Design & Product Guild just published: UI/UX Design Sprint Masterclass. Check out the agenda!',
    type: 'event',
    category: 'Events',
    read: true,
    timestamp: '2 days ago',
    date: '2026-10-29T11:00:00Z',
    link: '/events/evt-ai-masterclass',
  },
  {
    id: 'notif-5',
    title: 'Registration Released',
    message: 'Your registration for Sunset Acoustic Night was cancelled. Seat returned to student catalog.',
    type: 'cancel',
    category: 'Passes',
    read: true,
    timestamp: '3 days ago',
    date: '2026-10-28T09:15:00Z',
    link: '/student/registrations',
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading notifications', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Sync from Cloud Firestore when user is authenticated
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.uid) {
        getUserNotifications(user.uid)
          .then((remoteList) => {
            if (remoteList && remoteList.length > 0) {
              const formatted = remoteList.map((n) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type || 'general',
                category: n.category || (n.type === 'pass' ? 'Passes' : 'Events'),
                read: n.isRead !== undefined ? n.isRead : !!n.read,
                date: n.createdAt ? (n.createdAt.toDate ? n.createdAt.toDate().toISOString() : n.createdAt) : new Date().toISOString(),
                timestamp: 'Recently',
                link: n.link || '/events',
                ...n,
              }));
              setNotifications(formatted);
            }
          })
          .catch((err) => console.warn('Could not fetch notifications from Firestore:', err.message));
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
    );

    if (isFirebaseConfigured && id && !id.startsWith('notif-')) {
      try {
        await markNotificationAsRead(id);
      } catch (e) {
        console.warn('Could not sync markAsRead to Firestore:', e);
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));

    const currentUid = auth?.currentUser?.uid;
    if (isFirebaseConfigured && currentUid) {
      try {
        await markAllNotificationsAsRead(currentUid);
      } catch (e) {
        console.warn('Could not sync markAllAsRead to Firestore:', e);
      }
    }
  };

  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (isFirebaseConfigured && id && !id.startsWith('notif-')) {
      try {
        await deleteRemoteNotification(id);
      } catch (e) {
        console.warn('Could not sync deleteNotification to Firestore:', e);
      }
    }
  };

  const addNotification = async (notif) => {
    let remoteId = null;
    const currentUid = auth?.currentUser?.uid || notif.recipientId;

    if (isFirebaseConfigured && currentUid) {
      try {
        const created = await createNotification({
          recipientId: currentUid,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          relatedEventId: notif.relatedEventId || notif.eventId,
        });
        if (created?.id) remoteId = created.id;
      } catch (e) {
        console.warn('Could not push notification to Firestore:', e.message);
      }
    }

    const newNotif = {
      id: remoteId || `notif-${Date.now()}`,
      read: false,
      timestamp: 'Just now',
      date: new Date().toISOString(),
      ...notif,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
