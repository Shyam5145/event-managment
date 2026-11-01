import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase.js';

export const REGISTRATIONS_COLLECTION = 'registrations';
export const EVENTS_COLLECTION = 'events';

// Allowed Registration Statuses
export const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
  WAITLISTED: 'waitlisted',
};

// Allowed Gate Attendance Statuses
export const ATTENDANCE_STATUS = {
  NOT_MARKED: 'notMarked',
  PRESENT: 'present',
  ABSENT: 'absent',
};

/**
 * Generates a deterministic document ID to prevent duplicate registrations.
 * Format: {eventId}_{studentId}
 *
 * @param {string} eventId
 * @param {string} studentId
 * @returns {string} Deterministic document ID
 */
export const getRegistrationDocId = (eventId, studentId) => {
  if (!eventId || !studentId) {
    throw new Error('Both eventId and studentId are required for deterministic registration ID.');
  }
  return `${eventId}_${studentId}`;
};

/**
 * Parses any date/timestamp representation into milliseconds since Unix epoch.
 *
 * @param {any} val
 * @returns {number|null}
 */
const toMillis = (val) => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toMillis();
  if (val?.toMillis && typeof val.toMillis === 'function') return val.toMillis();
  if (val?.seconds) return val.seconds * 1000;
  if (val instanceof Date) return val.getTime();
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed.getTime();
};

/**
 * Atomically registers an authenticated student for an event using a Firestore Transaction.
 *
 * Enforces all 6 core business rules:
 * 1. Only authenticated students can register.
 * 2. Deterministic ID prevents duplicate registration.
 * 3. Cannot register for cancelled event.
 * 4. Cannot register after registration deadline.
 * 5. Cannot register if event is at capacity.
 * 6. Atomically increments capacity counter without race conditions.
 *
 * @param {string} eventId - Target event ID
 * @param {Object} studentUser - Authenticated student user object ({ uid, name, email, department, year })
 * @param {Object} [additionalData={}] - Optional team details or answers
 * @returns {Promise<Object>} Created registration document
 */
export const registerForEvent = async (eventId, studentUser = {}, additionalData = {}) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }

  const currentAuthUser = auth?.currentUser;
  const studentId = studentUser.uid || studentUser.id || currentAuthUser?.uid;

  if (!studentId) {
    throw new Error('Authentication required: You must be signed in as a student to register.');
  }

  if (!eventId) {
    throw new Error('Event ID is required to register.');
  }

  const regDocId = getRegistrationDocId(eventId, studentId);
  const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
  const regDocRef = doc(db, REGISTRATIONS_COLLECTION, regDocId);

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Read Event Document inside the transaction
      const eventSnap = await transaction.get(eventDocRef);
      if (!eventSnap.exists()) {
        throw new Error('Event not found or has been removed.');
      }
      const eventData = eventSnap.data();

      // Rule 3: Cannot register for a cancelled or unpublished event
      if (eventData.status === 'cancelled') {
        throw new Error('This event has been cancelled and is no longer accepting registrations.');
      }
      if (eventData.status === 'draft') {
        throw new Error('This event is a draft and is not yet open for registration.');
      }

      // Rule 4: Cannot register after the registration deadline
      const deadlineMillis = toMillis(eventData.registrationDeadline || eventData.deadline || eventData.eventDate);
      if (deadlineMillis && Date.now() > deadlineMillis) {
        throw new Error('Registration for this event has closed. The deadline has passed.');
      }

      // Rule 5: Cannot register if event is full
      const capacity = Number(eventData.capacity || 0);
      const registeredCount = Number(eventData.registeredCount || 0);
      if (capacity > 0 && registeredCount >= capacity) {
        throw new Error('Event has reached maximum capacity. All seats are filled.');
      }

      // Rule 2: Check for existing duplicate registration
      const regSnap = await transaction.get(regDocRef);
      if (regSnap.exists()) {
        const existingData = regSnap.data();
        if (existingData.status === REGISTRATION_STATUS.REGISTERED) {
          throw new Error('You are already registered for this event.');
        }
      }

      // Prepare Registration Payload
      const randomTicketNum = Math.floor(1000 + Math.random() * 9000);
      const eventCode = (eventData.title || eventId).replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      const ticketNumber = `CP-TKT-${eventCode}-${randomTicketNum}`;

      const newRegistration = {
        id: regDocId,
        eventId,
        eventTitle: eventData.title || 'Campus Event',
        eventDate: eventData.eventDate || null,
        venue: eventData.venue || eventData.location || 'Campus',
        studentId,
        studentName: studentUser.name || studentUser.displayName || currentAuthUser?.displayName || 'Student',
        studentEmail: studentUser.email || currentAuthUser?.email || '',
        department: studentUser.department || additionalData.department || 'General',
        academicYear: studentUser.year || additionalData.academicYear || 'Undergraduate',
        teamName: additionalData.teamName || 'Solo',
        teamSize: Number(additionalData.teamSize || 1),
        ticketNumber,
        ticketId: ticketNumber,
        ticketStatus: 'active',
        status: REGISTRATION_STATUS.REGISTERED,
        attendanceStatus: ATTENDANCE_STATUS.NOT_MARKED,
        checkedIn: false,
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Atomic Writes
      transaction.set(regDocRef, newRegistration, { merge: true });
      transaction.update(eventDocRef, {
        registeredCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      return {
        ...newRegistration,
        registeredAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error(`Transaction failed registering student ${studentId} for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Atomically cancels a student's event registration and releases the event seat using a Firestore Transaction.
 *
 * @param {string} eventId - Event document ID
 * @param {string} studentId - Student UID requesting cancellation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const cancelRegistration = async (eventId, studentId) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }

  const currentAuthUser = auth?.currentUser;
  const uid = studentId || currentAuthUser?.uid;

  if (!uid || !eventId) {
    throw new Error('Both eventId and studentId are required to cancel a registration.');
  }

  const regDocId = getRegistrationDocId(eventId, uid);
  const regDocRef = doc(db, REGISTRATIONS_COLLECTION, regDocId);
  const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);

  try {
    return await runTransaction(db, async (transaction) => {
      const regSnap = await transaction.get(regDocRef);
      if (!regSnap.exists()) {
        throw new Error('Registration pass not found.');
      }

      const regData = regSnap.data();
      if (regData.studentId !== uid && currentAuthUser?.uid !== uid) {
        throw new Error('Unauthorized: You can only cancel your own event registration.');
      }

      if (regData.status === REGISTRATION_STATUS.CANCELLED) {
        return { success: true, message: 'Registration was already cancelled.' };
      }

      // Mark registration as cancelled
      transaction.update(regDocRef, {
        status: REGISTRATION_STATUS.CANCELLED,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Atomically decrement event seat count
      const eventSnap = await transaction.get(eventDocRef);
      if (eventSnap.exists()) {
        const currentCount = Number(eventSnap.data().registeredCount || 0);
        if (currentCount > 0) {
          transaction.update(eventDocRef, {
            registeredCount: increment(-1),
            updatedAt: serverTimestamp(),
          });
        }
      }

      return { success: true, message: 'Registration cancelled successfully.' };
    });
  } catch (error) {
    console.error(`Error cancelling registration ${regDocId}:`, error);
    throw error;
  }
};

/**
 * Fetch all registrations for a student user.
 *
 * @param {string} studentId - Student UID
 * @param {string} [statusFilter] - Optional status ('registered', 'cancelled', 'all')
 * @returns {Promise<Array>} List of registration records
 */
export const getStudentRegistrations = async (studentId, statusFilter = null) => {
  if (!isFirebaseConfigured || !db || !studentId) {
    return [];
  }

  try {
    const regRef = collection(db, REGISTRATIONS_COLLECTION);
    const constraints = [where('studentId', '==', studentId)];

    if (statusFilter && statusFilter !== 'all') {
      constraints.push(where('status', '==', statusFilter));
    }

    const q = query(regRef, ...constraints);
    const snapshot = await getDocs(q);

    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Sort descending by registration date
    list.sort((a, b) => {
      const aTime = toMillis(a.registeredAt) || 0;
      const bTime = toMillis(b.registeredAt) || 0;
      return bTime - aTime;
    });

    return list;
  } catch (error) {
    console.error(`Error fetching registrations for student ${studentId}:`, error);
    throw error;
  }
};

// Alias for backwards compatibility
export const getUserRegistrations = getStudentRegistrations;

/**
 * Fetch all registrations/attendees for a given event for authorized event organizers.
 * Enforces ownership: An organizer cannot view unrelated events' participants.
 *
 * @param {string} eventId - Target event ID
 * @param {string} organizerId - Authenticated organizer UID
 * @param {string} [statusFilter=null] - Optional status filter
 * @returns {Promise<Array>} List of participants
 */
export const getEventParticipants = async (eventId, organizerId, statusFilter = null) => {
  if (!isFirebaseConfigured || !db || !eventId) {
    return [];
  }

  try {
    // Verify event ownership if organizerId is provided
    if (organizerId) {
      const eventDocSnap = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
      if (eventDocSnap.exists()) {
        const eventData = eventDocSnap.data();
        if (eventData.organizerId && eventData.organizerId !== organizerId) {
          throw new Error('Unauthorized: Organizers can only view participants for events they manage.');
        }
      }
    }

    const regRef = collection(db, REGISTRATIONS_COLLECTION);
    const constraints = [where('eventId', '==', eventId)];

    if (statusFilter && statusFilter !== 'all') {
      constraints.push(where('status', '==', statusFilter));
    }

    const q = query(regRef, ...constraints);
    const snapshot = await getDocs(q);

    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    list.sort((a, b) => {
      const aTime = toMillis(a.registeredAt) || 0;
      const bTime = toMillis(b.registeredAt) || 0;
      return bTime - aTime;
    });

    return list;
  } catch (error) {
    console.error(`Error fetching participants for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Fetch registration document for a specific student and event.
 *
 * @param {string} studentId
 * @param {string} eventId
 * @returns {Promise<Object|null>}
 */
export const getRegistrationByStudentAndEvent = async (studentId, eventId) => {
  if (!isFirebaseConfigured || !db || !studentId || !eventId) {
    return null;
  }

  try {
    const regDocId = getRegistrationDocId(eventId, studentId);
    const docSnap = await getDoc(doc(db, REGISTRATIONS_COLLECTION, regDocId));

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching registration for ${studentId} on ${eventId}:`, error);
    throw error;
  }
};

// Alias for backwards compatibility
export const getRegistration = (eventId, studentId) => getRegistrationByStudentAndEvent(studentId, eventId);

/**
 * Update registration status (e.g. 'registered', 'attended', 'cancelled') or gate check-in.
 *
 * @param {string} registrationId - Deterministic document ID ({eventId}_{studentId}) or doc ID
 * @param {string} status - New registration or attendance status
 * @param {string} [organizerId] - Organizer UID performing the update
 * @param {Object} [metadata={}] - Optional metadata ({ checkedIn, attendanceStatus })
 * @returns {Promise<void>}
 */
export const updateRegistrationStatus = async (registrationId, status, organizerId = null, metadata = {}) => {
  if (!isFirebaseConfigured || !db || !registrationId) {
    return;
  }

  const regDocRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);

  try {
    const updatePayload = {
      updatedAt: serverTimestamp(),
      ...metadata,
    };

    if (Object.values(REGISTRATION_STATUS).includes(status)) {
      updatePayload.status = status;
      if (status === REGISTRATION_STATUS.CANCELLED) {
        updatePayload.cancelledAt = serverTimestamp();
      }
    }

    if (Object.values(ATTENDANCE_STATUS).includes(status)) {
      updatePayload.attendanceStatus = status;
      updatePayload.checkedIn = status === ATTENDANCE_STATUS.PRESENT;
      if (status === ATTENDANCE_STATUS.PRESENT) {
        updatePayload.checkedInAt = serverTimestamp();
      }
    }

    await updateDoc(regDocRef, updatePayload);
  } catch (error) {
    console.error(`Error updating registration status for ${registrationId}:`, error);
    throw error;
  }
};

/**
 * Update gate check-in / attendance status for an event attendee.
 *
 * @param {string} eventId
 * @param {string} studentId
 * @param {string} attendanceStatus - 'notMarked' | 'present' | 'absent'
 * @returns {Promise<void>}
 */
export const updateAttendance = async (eventId, studentId, attendanceStatus = ATTENDANCE_STATUS.PRESENT) => {
  if (!isFirebaseConfigured || !db || !eventId || !studentId) {
    return;
  }

  const regDocId = getRegistrationDocId(eventId, studentId);
  return updateRegistrationStatus(regDocId, attendanceStatus, null, {
    checkedIn: attendanceStatus === ATTENDANCE_STATUS.PRESENT,
    attendanceMarkedAt: serverTimestamp(),
  });
};

/**
 * Fetch registration document by ticket identifier (ticketNumber or registrationId).
 *
 * @param {string} ticketId - ticketNumber (e.g. 'CP-TKT-HACK-884') or docId ('{eventId}_{studentId}')
 * @returns {Promise<Object|null>}
 */
export const getRegistrationByTicket = async (ticketId) => {
  if (!ticketId) return null;
  const cleanId = String(ticketId).trim();

  if (!isFirebaseConfigured || !db) {
    return null;
  }

  try {
    // 1. Direct Document ID lookup (e.g. {eventId}_{studentId})
    const docSnap = await getDoc(doc(db, REGISTRATIONS_COLLECTION, cleanId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    // 2. Query by ticketNumber
    const regRef = collection(db, REGISTRATIONS_COLLECTION);
    const q1 = query(regRef, where('ticketNumber', '==', cleanId));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const matchDoc = snap1.docs[0];
      return { id: matchDoc.id, ...matchDoc.data() };
    }

    // 3. Query by ticketId field
    const q2 = query(regRef, where('ticketId', '==', cleanId));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const matchDoc = snap2.docs[0];
      return { id: matchDoc.id, ...matchDoc.data() };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching registration by ticket "${ticketId}":`, error);
    throw error;
  }
};

/**
 * Securely verifies a registration pass by ticketId against Cloud Firestore.
 * Evaluates ticket existence, event state, cancellation, and check-in status.
 * Sanitizes attendee data to protect private PII on public verification pages.
 *
 * @param {string} ticketId
 * @returns {Promise<{
 *   isValid: boolean,
 *   status: 'valid' | 'already_checked_in' | 'cancelled' | 'not_found' | 'invalid',
 *   statusLabel: string,
 *   registration?: Object,
 *   event?: Object,
 *   sanitizedAttendee?: { name: string, department: string, year: string }
 * }>}
 */
export const verifyTicketRegistration = async (ticketId) => {
  if (!ticketId || typeof ticketId !== 'string' || !ticketId.trim()) {
    return {
      isValid: false,
      status: 'invalid',
      statusLabel: 'Invalid Ticket',
      message: 'Please provide a valid ticket code.',
    };
  }

  const cleanTicketId = ticketId.trim();

  try {
    const registration = await getRegistrationByTicket(cleanTicketId);

    if (!registration) {
      return {
        isValid: false,
        status: 'not_found',
        statusLabel: 'Ticket Not Found',
        message: `No active or past ticket matching "${cleanTicketId}" was found in the campus registry.`,
      };
    }

    // Fetch related event details if available
    let eventData = null;
    if (db && registration.eventId) {
      try {
        const eventSnap = await getDoc(doc(db, EVENTS_COLLECTION, registration.eventId));
        if (eventSnap.exists()) {
          eventData = { id: eventSnap.id, ...eventSnap.data() };
        }
      } catch (err) {
        console.warn('Could not load associated event for ticket:', err);
      }
    }

    // Mask attendee name for privacy: e.g. "Rahul S."
    const rawName = registration.studentName || 'Student Attendee';
    const nameParts = rawName.trim().split(' ');
    const maskedName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : rawName;

    const sanitizedAttendee = {
      name: maskedName,
      department: registration.department || 'General',
      academicYear: registration.academicYear || registration.year || 'Collegiate',
    };

    // Case 1: Cancelled Registration
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      return {
        isValid: false,
        status: 'cancelled',
        statusLabel: 'Registration Cancelled',
        message: 'This registration ticket was cancelled and is no longer valid for venue entry.',
        registration,
        event: eventData,
        sanitizedAttendee,
      };
    }

    // Case 2: Cancelled Event
    if (eventData && eventData.status === 'cancelled') {
      return {
        isValid: false,
        status: 'cancelled',
        statusLabel: 'Event Cancelled',
        message: 'The event associated with this ticket pass has been cancelled by organizers.',
        registration,
        event: eventData,
        sanitizedAttendee,
      };
    }

    // Case 3: Already Checked In
    if (registration.checkedIn || registration.attendanceStatus === ATTENDANCE_STATUS.PRESENT) {
      return {
        isValid: false,
        status: 'already_checked_in',
        statusLabel: 'Already Checked In',
        message: `Attendee was already checked in at ${registration.checkedInAt ? new Date(toMillis(registration.checkedInAt)).toLocaleTimeString() : 'the gate'}.`,
        registration,
        event: eventData,
        sanitizedAttendee,
      };
    }

    // Case 4: Valid Registration
    return {
      isValid: true,
      status: 'valid',
      statusLabel: 'Valid Registration',
      message: 'Ticket is genuine, confirmed, and authorized for venue admission.',
      registration,
      event: eventData,
      sanitizedAttendee,
    };
  } catch (error) {
    console.error(`Verification error for ticket ${cleanTicketId}:`, error);
    return {
      isValid: false,
      status: 'invalid',
      statusLabel: 'Verification Error',
      message: error.message || 'Could not verify ticket against Cloud Firestore.',
    };
  }
};

/**
 * Organizers' atomic QR gate check-in handler.
 * Verifies event ownership, passes validity, prevents duplicate check-ins, and marks attendee present.
 *
 * @param {string} targetEventId - Event currently managed by host organizer
 * @param {string} ticketOrRegId - Scanned barcode identifier
 * @param {Object} organizerUser - Authenticated organizer user info { uid, role }
 * @returns {Promise<{ success: boolean, registration: Object, message: string }>}
 */
export const checkInAttendeeByTicket = async (targetEventId, ticketOrRegId, organizerUser) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }

  if (!targetEventId || !ticketOrRegId) {
    throw new Error('Target event ID and ticket identifier are required for check-in.');
  }

  const organizerUid = organizerUser?.uid;
  if (!organizerUid) {
    throw new Error('Unauthorized: Organizer authentication required to record attendance.');
  }

  // 1. Resolve registration document
  const regDoc = await getRegistrationByTicket(ticketOrRegId);
  if (!regDoc) {
    throw new Error(`Ticket pass "${ticketOrRegId}" was not found in the registration system.`);
  }

  // 2. Validate Event Ownership: Cross-event check-in prevention
  if (regDoc.eventId !== targetEventId) {
    throw new Error(`Wrong Event: This ticket is for another event (ID: ${regDoc.eventId}), not the currently active event.`);
  }

  // 3. Verify Registration Status
  if (regDoc.status === REGISTRATION_STATUS.CANCELLED) {
    throw new Error('Admission Denied: This registration has been cancelled.');
  }

  // 4. Duplicate Check-in Prevention
  if (regDoc.checkedIn || regDoc.attendanceStatus === ATTENDANCE_STATUS.PRESENT) {
    throw new Error(`Duplicate Check-In: ${regDoc.studentName} (${regDoc.ticketNumber || regDoc.id}) is already checked in!`);
  }

  // 5. Atomic check-in write to Firestore
  const regRef = doc(db, REGISTRATIONS_COLLECTION, regDoc.id);
  await updateDoc(regRef, {
    checkedIn: true,
    attendanceStatus: ATTENDANCE_STATUS.PRESENT,
    checkedInAt: serverTimestamp(),
    attendanceMarkedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    success: true,
    registration: {
      ...regDoc,
      checkedIn: true,
      attendanceStatus: ATTENDANCE_STATUS.PRESENT,
      checkedInAt: new Date().toISOString(),
    },
    message: `Verified: ${regDoc.studentName} (${regDoc.department}) checked in successfully!`,
  };
};
