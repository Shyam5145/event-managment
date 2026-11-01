import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase.js';

const EVENTS_COLLECTION = 'events';

// Supported event lifecycle statuses
export const EVENT_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

/**
 * Normalizes input date/string/timestamp into a Firestore Timestamp.
 *
 * @param {Date|string|number|Timestamp} val
 * @returns {Timestamp|null}
 */
export const toFirestoreTimestamp = (val) => {
  if (!val) return null;
  if (val instanceof Timestamp) return val;
  if (val?.seconds && val?.nanoseconds) return new Timestamp(val.seconds, val.nanoseconds);
  if (val instanceof Date) return Timestamp.fromDate(val);
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
  }
  return null;
};

/**
 * Validates event creation and update data fields.
 *
 * @param {Object} data
 * @returns {{ valid: boolean, errors: Object }}
 */
export const validateEventData = (data = {}) => {
  const errors = {};

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.title = 'Event title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.category = 'Category is required';
  }

  const venue = data.venue || data.location;
  if (!venue || typeof venue !== 'string' || !venue.trim()) {
    errors.venue = 'Venue location is required';
  }

  if (data.capacity === undefined || data.capacity === null || isNaN(Number(data.capacity)) || Number(data.capacity) < 1) {
    errors.capacity = 'Capacity must be at least 1 attendee';
  }

  const eventDate = toFirestoreTimestamp(data.eventDate || data.date);
  if (!eventDate) {
    errors.eventDate = 'A valid event date is required';
  }

  const deadline = toFirestoreTimestamp(data.registrationDeadline || data.deadline);
  if (deadline && eventDate && deadline.toMillis() > eventDate.toMillis()) {
    errors.registrationDeadline = 'Registration deadline cannot be after the event date';
  }

  if (data.status && !Object.values(EVENT_STATUSES).includes(data.status)) {
    errors.status = `Status must be one of: ${Object.values(EVENT_STATUSES).join(', ')}`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Creates a new event document in Cloud Firestore.
 *
 * @param {Object} eventData - Event fields conforming to the schema
 * @param {Object} [organizerUser={}] - Authenticated organizer info { uid, name, clubName }
 * @returns {Promise<Object>} Newly created event document with ID
 */
export const createEvent = async (eventData = {}, organizerUser = {}) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }

  const { valid, errors } = validateEventData(eventData);
  if (!valid) {
    const errorMsg = Object.values(errors).join('; ');
    throw new Error(`Event validation failed: ${errorMsg}`);
  }

  const currentAuthUser = auth?.currentUser;
  const organizerId = organizerUser.uid || currentAuthUser?.uid || eventData.organizerId;
  const organizerName = organizerUser.clubName || organizerUser.name || currentAuthUser?.displayName || eventData.organizerName || 'Campus Club';

  if (!organizerId) {
    throw new Error('Unauthorized: An organizer UID is required to create events.');
  }

  try {
    const eventsRef = collection(db, EVENTS_COLLECTION);

    const eventDate = toFirestoreTimestamp(eventData.eventDate || eventData.date) || Timestamp.now();
    const registrationDeadline = toFirestoreTimestamp(eventData.registrationDeadline || eventData.deadline) || eventDate;
    const initialStatus = eventData.status || EVENT_STATUSES.PUBLISHED;

    const payload = {
      title: eventData.title.trim(),
      description: (eventData.description || '').trim(),
      category: eventData.category.trim(),
      organizerId,
      organizerName,
      venue: (eventData.venue || eventData.location || '').trim(),
      location: (eventData.venue || eventData.location || '').trim(),
      venueType: eventData.venueType || 'on-campus',
      eventDate,
      date: eventData.date || new Date(eventDate.toMillis()).toISOString().split('T')[0],
      startTime: eventData.startTime || eventData.time?.split('-')[0]?.trim() || '10:00 AM',
      endTime: eventData.endTime || eventData.time?.split('-')[1]?.trim() || '05:00 PM',
      time: eventData.time || `${eventData.startTime || '10:00 AM'} - ${eventData.endTime || '05:00 PM'}`,
      registrationDeadline,
      capacity: Number(eventData.capacity),
      registeredCount: 0,
      posterURL: eventData.posterURL || eventData.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      image: eventData.posterURL || eventData.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      status: initialStatus,
      featured: Boolean(eventData.featured),
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      agenda: Array.isArray(eventData.agenda) ? eventData.agenda : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(eventsRef, payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('Error creating event in Firestore:', error);
    throw error;
  }
};

/**
 * Fetches published events using Firestore queries rather than loading all events.
 *
 * @param {Object} [filters={}] - Optional filters { category, upcomingOnly, maxLimit, searchTitle }
 * @returns {Promise<Array>} List of published events
 */
export const getPublishedEvents = async (filters = {}) => {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const constraints = [
      where('status', '==', EVENT_STATUSES.PUBLISHED),
    ];

    if (filters.category && filters.category !== 'all') {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters.upcomingOnly) {
      constraints.push(where('eventDate', '>=', Timestamp.now()));
      constraints.push(orderBy('eventDate', 'asc'));
    }

    if (filters.maxLimit) {
      constraints.push(limit(filters.maxLimit));
    }

    const q = query(eventsRef, ...constraints);
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // In-memory title search refinement when search query is specified
    if (filters.searchTitle && filters.searchTitle.trim()) {
      const term = filters.searchTitle.toLowerCase().trim();
      results = results.filter((evt) =>
        evt.title.toLowerCase().includes(term) ||
        evt.description.toLowerCase().includes(term) ||
        (evt.venue && evt.venue.toLowerCase().includes(term))
      );
    }

    return results;
  } catch (error) {
    console.error('Error querying published events from Firestore:', error);
    throw error;
  }
};

/**
 * Fetches all events created by a specific organizer.
 *
 * @param {string} organizerId - Organizer UID
 * @param {string} [statusFilter='all'] - Optional status filter
 * @returns {Promise<Array>} List of organizer events
 */
export const getEventsByOrganizer = async (organizerId, statusFilter = 'all') => {
  if (!isFirebaseConfigured || !db || !organizerId) {
    return [];
  }

  try {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const constraints = [
      where('organizerId', '==', organizerId),
    ];

    if (statusFilter && statusFilter !== 'all') {
      constraints.push(where('status', '==', statusFilter));
    }

    const q = query(eventsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error(`Error querying events for organizer ${organizerId}:`, error);
    throw error;
  }
};

/**
 * Fetches a single event document by ID from Firestore.
 *
 * @param {string} id - Event Document ID
 * @returns {Promise<Object|null>}
 */
export const getEventById = async (id) => {
  if (!isFirebaseConfigured || !db || !id) {
    return null;
  }

  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, id);
    const docSnap = await getDoc(eventDocRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching event ${id} from Firestore:`, error);
    throw error;
  }
};

/**
 * Updates an event. Enforces that only the creator organizer can update it.
 *
 * @param {string} id - Event Document ID
 * @param {Object} eventData - Fields to update
 * @param {string} [requestingOrganizerId] - UID of organizer requesting update
 * @returns {Promise<void>}
 */
export const updateEvent = async (id, eventData = {}, requestingOrganizerId = null) => {
  if (!isFirebaseConfigured || !db || !id) {
    return;
  }

  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, id);
    const existingSnap = await getDoc(eventDocRef);

    if (!existingSnap.exists()) {
      throw new Error(`Event with ID "${id}" does not exist.`);
    }

    const existingData = existingSnap.data();
    const currentUid = requestingOrganizerId || auth?.currentUser?.uid;

    // Verify organizer ownership
    if (currentUid && existingData.organizerId && existingData.organizerId !== currentUid) {
      throw new Error('Unauthorized: You can only edit events created by your club account.');
    }

    const updates = { ...eventData };

    if (updates.eventDate) {
      updates.eventDate = toFirestoreTimestamp(updates.eventDate);
    }
    if (updates.registrationDeadline) {
      updates.registrationDeadline = toFirestoreTimestamp(updates.registrationDeadline);
    }
    if (updates.capacity !== undefined) {
      updates.capacity = Number(updates.capacity);
    }

    updates.updatedAt = serverTimestamp();

    await updateDoc(eventDocRef, updates);
  } catch (error) {
    console.error(`Error updating event ${id} in Firestore:`, error);
    throw error;
  }
};

/**
 * Changes an event status to 'published'.
 *
 * @param {string} id
 * @param {string} [organizerId]
 * @returns {Promise<void>}
 */
export const publishEvent = async (id, organizerId = null) => {
  return updateEvent(id, { status: EVENT_STATUSES.PUBLISHED }, organizerId);
};

/**
 * Changes an event status to 'cancelled'.
 *
 * @param {string} id
 * @param {string} [organizerId]
 * @returns {Promise<void>}
 */
export const cancelEvent = async (id, organizerId = null) => {
  return updateEvent(id, { status: EVENT_STATUSES.CANCELLED }, organizerId);
};

/**
 * Deletes an event document from Firestore.
 * Enforces organizer ownership check.
 *
 * @param {string} id - Event Document ID
 * @param {string} [requestingOrganizerId]
 * @returns {Promise<void>}
 */
export const deleteEvent = async (id, requestingOrganizerId = null) => {
  if (!isFirebaseConfigured || !db || !id) {
    return;
  }

  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, id);
    const existingSnap = await getDoc(eventDocRef);

    if (!existingSnap.exists()) return;

    const currentUid = requestingOrganizerId || auth?.currentUser?.uid;
    const existingData = existingSnap.data();

    // Verify organizer ownership
    if (currentUid && existingData.organizerId && existingData.organizerId !== currentUid) {
      throw new Error('Unauthorized: You can only delete events created by your club account.');
    }

    await deleteDoc(eventDocRef);
  } catch (error) {
    console.error(`Error deleting event ${id} from Firestore:`, error);
    throw error;
  }
};

/**
 * Atomically adjusts registered count for an event.
 *
 * @param {string} eventId
 * @param {number} delta - Positive or negative count
 * @returns {Promise<void>}
 */
export const adjustRegisteredCount = async (eventId, delta = 1) => {
  if (!isFirebaseConfigured || !db || !eventId) return;

  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventDocRef, {
      registeredCount: increment(delta),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error adjusting registeredCount for event ${eventId}:`, error);
    throw error;
  }
};

// Backwards-compatible alias for existing imports
export const getEvents = getPublishedEvents;
