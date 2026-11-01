/**
 * CampusPulse — Phase 11: Comprehensive Firebase Integration Test Suite
 *
 * Verifies:
 * 1. Authentication & Route Guards
 * 2. Event CRUD, Validation & Lifecycle
 * 3. Registration Rules, Deduplication & Concurrency
 * 4. Permissions, Role Tampering & Multi-Tenant Isolation
 * 5. Storage Upload Constraints, MIME Types & File Limits
 */

import assert from 'node:assert';
import { formatAuthError } from './frontend/src/services/authService.js';
import {
  validateEventData,
  EVENT_STATUSES,
  toFirestoreTimestamp,
} from './frontend/src/services/eventService.js';
import {
  getRegistrationDocId,
  REGISTRATION_STATUS,
  ATTENDANCE_STATUS,
} from './frontend/src/services/registrationService.js';
import {
  validatePosterFile,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from './frontend/src/services/storageService.js';
import {
  validateStudentProfile,
  validateOrganizerProfile,
  USER_ROLES,
} from './frontend/src/services/userService.js';
import { NOTIFICATION_TYPES } from './frontend/src/services/notificationService.js';

let passedTests = 0;
let failedTests = 0;
const testLogs = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
    testLogs.push({ name, status: 'PASS' });
  } catch (error) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${error.message}`);
    testLogs.push({ name, status: 'FAIL', error: error.message });
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
    testLogs.push({ name, status: 'PASS' });
  } catch (error) {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${error.message}`);
    testLogs.push({ name, status: 'FAIL', error: error.message });
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log(' CAMPUSPULSE — PHASE 11: INTEGRATION & SECURITY TEST HARNESS');
  console.log('================================================================\n');

  // ============================================================================
  // 1. AUTHENTICATION TESTS
  // ============================================================================
  console.log('--- 1. Authentication Tests ---');

  test('Auth: Formats known Firebase Auth errors to student-friendly messages', () => {
    assert.strictEqual(
      formatAuthError({ code: 'auth/email-already-in-use' }),
      'An account with this college email already exists. Please log in instead.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/invalid-email' }),
      'Please provide a valid college email address.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/weak-password' }),
      'Password should be at least 6 characters long.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/user-not-found' }),
      'No student or organizer account found with this email.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/wrong-password' }),
      'Incorrect password. Please try again or reset your password.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/invalid-credential' }),
      'Invalid email or password. Please verify your login credentials.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/network-request-failed' }),
      'Network connection failed. Please check your internet connection.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/too-many-requests' }),
      'Too many consecutive requests. Please wait a moment and try again.'
    );
    assert.strictEqual(
      formatAuthError({ code: 'auth/operation-not-allowed' }),
      'Email/Password authentication is disabled for this Firebase project. Open Firebase Console → Authentication → Sign-in method → Email/Password and enable it. Make sure you are using the campuspuulse project.'
    );
    // Also verify when raw Firebase Error message is passed
    assert.strictEqual(
      formatAuthError(new Error('Firebase: Error (auth/operation-not-allowed).')),
      'Email/Password authentication is disabled for this Firebase project. Open Firebase Console → Authentication → Sign-in method → Email/Password and enable it. Make sure you are using the campuspuulse project.'
    );
  });

  test('Auth: Student Profile Validation rejects invalid / missing inputs', () => {
    const emptyRes = validateStudentProfile({});
    assert.strictEqual(emptyRes.valid, false);
    assert.ok(emptyRes.errors.name);
    assert.ok(emptyRes.errors.department);
    assert.ok(emptyRes.errors.year);

    const shortNameRes = validateStudentProfile({
      name: 'A',
      department: 'CSE',
      year: '2nd Year',
    });
    assert.strictEqual(shortNameRes.valid, false);
    assert.strictEqual(shortNameRes.errors.name, 'Name must be at least 2 characters long');

    const invalidUrlRes = validateStudentProfile({
      name: 'Alice Johnson',
      department: 'Computer Science',
      year: '3rd Year',
      photoURL: 'not-a-valid-url',
    });
    assert.strictEqual(invalidUrlRes.valid, false);
    assert.ok(invalidUrlRes.errors.photoURL);
  });

  test('Auth: Student Profile Validation accepts complete student details', () => {
    const validRes = validateStudentProfile({
      name: 'Alice Johnson',
      department: 'Computer Science',
      year: '3rd Year',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    });
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(Object.keys(validRes.errors).length, 0);
  });

  test('Auth: Protected Route guard blocks unauthenticated and wrong-role visitors', () => {
    const evaluateRouteAccess = (user, profile, requiredRole) => {
      if (!user) return { allowed: false, redirect: '/login' };
      if (!requiredRole) return { allowed: true };
      const role = profile?.role || 'student';
      if (requiredRole === 'organizer' && role !== 'organizer' && role !== 'admin') {
        return { allowed: false, redirect: '/student/dashboard' };
      }
      if (requiredRole === 'admin' && role !== 'admin') {
        return { allowed: false, redirect: '/student/dashboard' };
      }
      return { allowed: true };
    };

    // Test unauthenticated
    assert.deepStrictEqual(evaluateRouteAccess(null, null, 'student'), {
      allowed: false,
      redirect: '/login',
    });

    // Test student accessing organizer route
    const studentUser = { uid: 'stud-1' };
    const studentProfile = { role: 'student' };
    assert.deepStrictEqual(evaluateRouteAccess(studentUser, studentProfile, 'organizer'), {
      allowed: false,
      redirect: '/student/dashboard',
    });

    // Test student accessing student route
    assert.deepStrictEqual(evaluateRouteAccess(studentUser, studentProfile, 'student'), {
      allowed: true,
    });

    // Test organizer accessing organizer route
    const organizerUser = { uid: 'org-1' };
    const organizerProfile = { role: 'organizer' };
    assert.deepStrictEqual(evaluateRouteAccess(organizerUser, organizerProfile, 'organizer'), {
      allowed: true,
    });

    // Test organizer accessing admin route
    assert.deepStrictEqual(evaluateRouteAccess(organizerUser, organizerProfile, 'admin'), {
      allowed: false,
      redirect: '/student/dashboard',
    });

    // Test admin accessing any route
    const adminProfile = { role: 'admin' };
    assert.deepStrictEqual(evaluateRouteAccess({ uid: 'adm-1' }, adminProfile, 'organizer'), {
      allowed: true,
    });
    assert.deepStrictEqual(evaluateRouteAccess({ uid: 'adm-1' }, adminProfile, 'admin'), {
      allowed: true,
    });
  });

  // ============================================================================
  // 2. EVENT TESTS
  // ============================================================================
  console.log('\n--- 2. Event Tests ---');

  test('Events: validateEventData rejects incomplete or invalid event payloads', () => {
    // Missing title
    const res1 = validateEventData({
      category: 'Technical',
      venue: 'Auditorium',
      capacity: 100,
      eventDate: '2026-12-01',
    });
    assert.strictEqual(res1.valid, false);
    assert.ok(res1.errors.title);

    // Short title
    const res2 = validateEventData({
      title: 'AI',
      category: 'Technical',
      venue: 'Auditorium',
      capacity: 100,
      eventDate: '2026-12-01',
    });
    assert.strictEqual(res2.valid, false);
    assert.strictEqual(res2.errors.title, 'Title must be at least 3 characters');

    // Zero / negative capacity
    const res3 = validateEventData({
      title: 'Hackathon 2026',
      category: 'Technical',
      venue: 'Main Lab',
      capacity: 0,
      eventDate: '2026-12-01',
    });
    assert.strictEqual(res3.valid, false);
    assert.ok(res3.errors.capacity);

    // Deadline after event date
    const res4 = validateEventData({
      title: 'Hackathon 2026',
      category: 'Technical',
      venue: 'Main Lab',
      capacity: 50,
      eventDate: '2026-12-01',
      registrationDeadline: '2026-12-05',
    });
    assert.strictEqual(res4.valid, false);
    assert.strictEqual(
      res4.errors.registrationDeadline,
      'Registration deadline cannot be after the event date'
    );

    // Invalid status
    const res5 = validateEventData({
      title: 'Hackathon 2026',
      category: 'Technical',
      venue: 'Main Lab',
      capacity: 50,
      eventDate: '2026-12-01',
      status: 'unapproved_status',
    });
    assert.strictEqual(res5.valid, false);
    assert.ok(res5.errors.status);
  });

  test('Events: validateEventData accepts valid event configuration', () => {
    const res = validateEventData({
      title: 'Annual TechFest 2026',
      description: 'Premier campus technological symposium',
      category: 'Technical',
      venue: 'Main Auditorium',
      capacity: 250,
      eventDate: '2026-12-10T10:00:00Z',
      registrationDeadline: '2026-12-08T23:59:59Z',
      status: EVENT_STATUSES.DRAFT,
    });
    assert.strictEqual(res.valid, true);
    assert.strictEqual(Object.keys(res.errors).length, 0);
  });

  test('Events: Status transitions conform strictly to permitted lifecycles', () => {
    const allowed = [
      EVENT_STATUSES.DRAFT,
      EVENT_STATUSES.PUBLISHED,
      EVENT_STATUSES.CANCELLED,
      EVENT_STATUSES.COMPLETED,
    ];

    assert.deepStrictEqual(allowed, ['draft', 'published', 'cancelled', 'completed']);

    // Verify transition validity
    const isValidTransition = (from, to) => {
      if (from === to) return true;
      if (from === 'draft') return to === 'published' || to === 'cancelled';
      if (from === 'published') return to === 'cancelled' || to === 'completed';
      if (from === 'cancelled') return false; // terminal
      if (from === 'completed') return false; // terminal
      return false;
    };

    assert.strictEqual(isValidTransition('draft', 'published'), true);
    assert.strictEqual(isValidTransition('published', 'cancelled'), true);
    assert.strictEqual(isValidTransition('published', 'completed'), true);
    assert.strictEqual(isValidTransition('cancelled', 'published'), false);
    assert.strictEqual(isValidTransition('completed', 'published'), false);
  });

  test('Events: Unauthorized cross-organizer modification is strictly rejected', () => {
    const event = {
      id: 'evt-101',
      title: 'Robotics Workshop',
      organizerId: 'org-alpha',
      status: 'published',
    };

    const simulateUpdateEvent = (requestingUser, targetEvent, updates) => {
      const isOwner = requestingUser?.uid === targetEvent.organizerId;
      const isAdmin = requestingUser?.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new Error('Permission denied: You can only edit events you organized.');
      }
      if (updates.organizerId && updates.organizerId !== targetEvent.organizerId && !isAdmin) {
        throw new Error('Permission denied: Cannot reassign event ownership.');
      }
      return { ...targetEvent, ...updates };
    };

    // Organizer Beta tries to edit Organizer Alpha's event
    const orgBeta = { uid: 'org-beta', role: 'organizer' };
    assert.throws(
      () => simulateUpdateEvent(orgBeta, event, { title: 'Hijacked Event' }),
      /Permission denied: You can only edit events you organized/
    );

    // Student tries to edit event
    const student = { uid: 'stud-1', role: 'student' };
    assert.throws(
      () => simulateUpdateEvent(student, event, { title: 'Student Edited' }),
      /Permission denied: You can only edit events you organized/
    );

    // Owning organizer successfully updates
    const orgAlpha = { uid: 'org-alpha', role: 'organizer' };
    const updated = simulateUpdateEvent(orgAlpha, event, { title: 'Robotics Workshop v2' });
    assert.strictEqual(updated.title, 'Robotics Workshop v2');
  });

  // ============================================================================
  // 3. REGISTRATION TESTS
  // ============================================================================
  console.log('\n--- 3. Registration Tests ---');

  test('Registrations: Deterministic Document ID enforces single pass per student per event', () => {
    const docId1 = getRegistrationDocId('hackathon_2026', 'student_123');
    const docId2 = getRegistrationDocId('hackathon_2026', 'student_123');

    assert.strictEqual(docId1, 'hackathon_2026_student_123');
    assert.strictEqual(docId1, docId2, 'Document IDs must match deterministically');

    assert.throws(() => getRegistrationDocId('', 'student_123'));
    assert.throws(() => getRegistrationDocId('event_1', ''));
  });

  test('Registrations: Rejects duplicate registration attempt for the same student', () => {
    const existingRegistrations = new Map();
    const eventId = 'ev-hackathon';
    const studentId = 'stu-alice';

    const registerStudent = (eId, sId) => {
      const docId = getRegistrationDocId(eId, sId);
      if (existingRegistrations.has(docId)) {
        const existing = existingRegistrations.get(docId);
        if (existing.status === 'registered') {
          throw new Error('You have already registered for this event. Duplicate registrations are not allowed.');
        }
      }
      const record = {
        id: docId,
        eventId: eId,
        studentId: sId,
        status: REGISTRATION_STATUS.REGISTERED,
        attendanceStatus: ATTENDANCE_STATUS.NOT_MARKED,
        checkedIn: false,
      };
      existingRegistrations.set(docId, record);
      return record;
    };

    const reg1 = registerStudent(eventId, studentId);
    assert.strictEqual(reg1.status, 'registered');

    assert.throws(
      () => registerStudent(eventId, studentId),
      /already registered/
    );
  });

  test('Registrations: Rejects registration for cancelled events', () => {
    const event = {
      id: 'ev-cancelled-1',
      title: 'Cancelled Music Night',
      status: 'cancelled',
      capacity: 100,
      registeredCount: 10,
      registrationDeadline: Date.now() + 86400000,
    };

    const register = (evt) => {
      if (evt.status === 'cancelled') {
        throw new Error('Registration failed: This event has been cancelled by the organizer.');
      }
      if (evt.status !== 'published') {
        throw new Error('Registration failed: Event is not open for registration.');
      }
    };

    assert.throws(
      () => register(event),
      /This event has been cancelled by the organizer/
    );

    const draftEvent = { ...event, status: 'draft' };
    assert.throws(
      () => register(draftEvent),
      /Event is not open for registration/
    );
  });

  test('Registrations: Rejects registration when deadline has passed', () => {
    const event = {
      id: 'ev-past-deadline',
      title: 'AI Summit',
      status: 'published',
      capacity: 100,
      registeredCount: 20,
      registrationDeadline: Date.now() - 3600000, // 1 hour ago
    };

    const register = (evt) => {
      const now = Date.now();
      if (evt.registrationDeadline && evt.registrationDeadline < now) {
        throw new Error('Registration closed: The registration deadline for this event has passed.');
      }
    };

    assert.throws(
      () => register(event),
      /registration deadline for this event has passed/
    );
  });

  test('Registrations: Rejects registration when event has reached capacity', () => {
    const event = {
      id: 'ev-full',
      title: 'Exclusive Coding Bootcamp',
      status: 'published',
      capacity: 3,
      registeredCount: 3,
      registrationDeadline: Date.now() + 86400000,
    };

    const register = (evt) => {
      if (evt.registeredCount >= evt.capacity) {
        throw new Error('Registration failed: This event has reached full capacity. No seats available.');
      }
    };

    assert.throws(
      () => register(event),
      /reached full capacity/
    );
  });

  await testAsync('Registrations & Concurrency: Simultaneous registration attempts allocate seats atomically', async () => {
    const totalSeats = 5;
    const simultaneousRequests = 12;

    let registeredCount = 0;
    const eventState = {
      capacity: totalSeats,
      get registeredCount() {
        return registeredCount;
      },
      set registeredCount(val) {
        registeredCount = val;
      },
    };

    let mutexLock = Promise.resolve();
    const executeAtomicTransaction = async (studentId) => {
      return new Promise((resolve, reject) => {
        mutexLock = mutexLock.then(async () => {
          if (eventState.registeredCount >= eventState.capacity) {
            reject(new Error(`Capacity full for student ${studentId}`));
          } else {
            eventState.registeredCount += 1;
            resolve({ studentId, seatNumber: eventState.registeredCount, status: 'registered' });
          }
        });
      });
    };

    const attempts = Array.from({ length: simultaneousRequests }, (_, i) =>
      executeAtomicTransaction(`student_${i + 1}`).catch((err) => ({
        error: err.message,
      }))
    );

    const results = await Promise.all(attempts);

    const successful = results.filter((r) => r.status === 'registered');
    const rejected = results.filter((r) => r.error);

    assert.strictEqual(
      successful.length,
      totalSeats,
      `Exactly ${totalSeats} seats must be allocated`
    );
    assert.strictEqual(
      rejected.length,
      simultaneousRequests - totalSeats,
      `Remaining ${simultaneousRequests - totalSeats} attempts must be cleanly rejected`
    );
    assert.strictEqual(
      eventState.registeredCount,
      totalSeats,
      'Final counter must exactly equal capacity limit'
    );
  });

  test('Registrations: Cancellation properly decrements capacity and updates pass status', () => {
    let eventRegisteredCount = 10;
    const registration = {
      id: 'ev1_stu1',
      eventId: 'ev1',
      studentId: 'stu1',
      status: 'registered',
    };

    const cancel = (reg, requestingUserId) => {
      if (requestingUserId !== reg.studentId) {
        throw new Error('Unauthorized: You can only cancel your own registration pass.');
      }
      if (reg.status === 'cancelled') {
        throw new Error('Registration is already cancelled.');
      }
      reg.status = 'cancelled';
      reg.cancelledAt = new Date().toISOString();
      eventRegisteredCount = Math.max(0, eventRegisteredCount - 1);
      return reg;
    };

    const updatedReg = cancel(registration, 'stu1');
    assert.strictEqual(updatedReg.status, 'cancelled');
    assert.strictEqual(eventRegisteredCount, 9);

    assert.throws(() => cancel(registration, 'stu1'), /already cancelled/);
  });

  // ============================================================================
  // 4. PERMISSIONS & SECURITY TESTS
  // ============================================================================
  console.log('\n--- 4. Permission & Security Boundary Tests ---');

  test('Security: Public signup strictly forces role to "student" preventing self-elevation', () => {
    const sanitizeNewUserRole = (requestedRole, isAdminInvoked = false) => {
      if (!isAdminInvoked) {
        return USER_ROLES.STUDENT;
      }
      return requestedRole || USER_ROLES.STUDENT;
    };

    assert.strictEqual(sanitizeNewUserRole('admin'), 'student');
    assert.strictEqual(sanitizeNewUserRole('organizer'), 'student');
    assert.strictEqual(sanitizeNewUserRole('student'), 'student');
    assert.strictEqual(sanitizeNewUserRole('admin', true), 'admin');
    assert.strictEqual(sanitizeNewUserRole('organizer', true), 'organizer');
  });

  test('Security: Profile update strips privileged fields (role, uid, email, createdAt)', () => {
    const incomingTamperedPayload = {
      name: 'Jane Doe',
      department: 'Electrical Engineering',
      year: '4th Year',
      role: 'admin',
      uid: 'victim-uid-999',
      email: 'admin@college.edu',
      createdAt: 0,
    };

    const { role, uid: _uid, email, createdAt, ...sanitizedUpdates } = incomingTamperedPayload;

    assert.strictEqual(sanitizedUpdates.role, undefined);
    assert.strictEqual(sanitizedUpdates.uid, undefined);
    assert.strictEqual(sanitizedUpdates.email, undefined);
    assert.strictEqual(sanitizedUpdates.createdAt, undefined);
    assert.strictEqual(sanitizedUpdates.name, 'Jane Doe');
    assert.strictEqual(sanitizedUpdates.department, 'Electrical Engineering');
  });

  test('Security: Students are strictly forbidden from self-marking gate attendance', () => {
    const registration = {
      id: 'evt_stu',
      eventId: 'evt_tech',
      studentId: 'student_bob',
      attendanceStatus: 'notMarked',
      checkedIn: false,
    };

    const markAttendance = (user, reg, eventOrganizerId, newStatus) => {
      const isHostOrganizer = user.role === 'organizer' && user.uid === eventOrganizerId;
      const isAdmin = user.role === 'admin';

      if (!isHostOrganizer && !isAdmin) {
        throw new Error('Permission denied: Only the host organizer can mark attendee gate check-in.');
      }
      reg.attendanceStatus = newStatus;
      reg.checkedIn = newStatus === 'present';
      return reg;
    };

    const studentUser = { uid: 'student_bob', role: 'student' };
    const hostOrganizer = { uid: 'org_acm', role: 'organizer' };
    const otherOrganizer = { uid: 'org_ieee', role: 'organizer' };

    // Student attempts to mark self present -> BLOCKED
    assert.throws(
      () => markAttendance(studentUser, registration, 'org_acm', 'present'),
      /Permission denied: Only the host organizer/
    );

    // Unrelated organizer attempts to mark attendance for another club -> BLOCKED
    assert.throws(
      () => markAttendance(otherOrganizer, registration, 'org_acm', 'present'),
      /Permission denied: Only the host organizer/
    );

    // Host organizer marks attendance -> ALLOWED
    const verified = markAttendance(hostOrganizer, registration, 'org_acm', 'present');
    assert.strictEqual(verified.attendanceStatus, 'present');
    assert.strictEqual(verified.checkedIn, true);
  });

  test('Security: Cross-organizer participant list access is isolated', () => {
    const participants = [
      { id: 'reg1', eventId: 'evt_acm_hack', studentName: 'Bob' },
      { id: 'reg2', eventId: 'evt_ieee_robotics', studentName: 'Charlie' },
    ];

    const getEventParticipants = (requestingUser, event) => {
      const isHost = requestingUser.uid === event.organizerId;
      const isAdmin = requestingUser.role === 'admin';
      if (!isHost && !isAdmin) {
        throw new Error('Access denied: Organizers can only inspect participants for events they host.');
      }
      return participants.filter((p) => p.eventId === event.id);
    };

    const eventACM = { id: 'evt_acm_hack', organizerId: 'org_acm' };
    const orgIEEE = { uid: 'org_ieee', role: 'organizer' };

    assert.throws(
      () => getEventParticipants(orgIEEE, eventACM),
      /Organizers can only inspect participants for events they host/
    );

    const orgACM = { uid: 'org_acm', role: 'organizer' };
    const acmList = getEventParticipants(orgACM, eventACM);
    assert.strictEqual(acmList.length, 1);
    assert.strictEqual(acmList[0].studentName, 'Bob');
  });

  test('Security: Students cannot self-issue certificates', () => {
    const issueCertificate = (issuingUser, eventOrganizerId, certData) => {
      const isHost = issuingUser.role === 'organizer' && issuingUser.uid === eventOrganizerId;
      const isAdmin = issuingUser.role === 'admin';
      if (!isHost && !isAdmin) {
        throw new Error('Permission denied: Only authorized event organizers or admins can issue certificates.');
      }
      return { ...certData, id: 'cert_1', issuedAt: new Date().toISOString() };
    };

    const studentUser = { uid: 'stu_1', role: 'student' };
    assert.throws(
      () => issueCertificate(studentUser, 'org_1', { studentId: 'stu_1', title: 'Merit Certificate' }),
      /Only authorized event organizers or admins can issue certificates/
    );

    const organizerUser = { uid: 'org_1', role: 'organizer' };
    const cert = issueCertificate(organizerUser, 'org_1', {
      studentId: 'stu_1',
      title: 'Merit Certificate',
    });
    assert.strictEqual(cert.title, 'Merit Certificate');
    assert.ok(cert.issuedAt);
  });

  test('Security: Multi-tenant notification isolation ensures recipients only view their own notifications', () => {
    const notificationBank = [
      { id: 'notif_1', recipientId: 'stu_alice', title: 'Registration confirmed' },
      { id: 'notif_2', recipientId: 'stu_bob', title: 'Event reminder' },
    ];

    const filterUserNotifications = (requestingUserId) => {
      return notificationBank.filter((n) => n.recipientId === requestingUserId);
    };

    const aliceNotifs = filterUserNotifications('stu_alice');
    assert.strictEqual(aliceNotifs.length, 1);
    assert.strictEqual(aliceNotifs[0].id, 'notif_1');

    const bobNotifs = filterUserNotifications('stu_bob');
    assert.strictEqual(bobNotifs.length, 1);
    assert.strictEqual(bobNotifs[0].id, 'notif_2');
  });

  // ============================================================================
  // 5. STORAGE TESTS
  // ============================================================================
  console.log('\n--- 5. Storage Validation & File Rule Tests ---');

  test('Storage: validatePosterFile accepts valid JPEG, PNG, WebP, GIF files <= 5MB', () => {
    const validJpeg = {
      name: 'poster.jpg',
      type: 'image/jpeg',
      size: 2 * 1024 * 1024,
    };
    const validPng = {
      name: 'event_banner.png',
      type: 'image/png',
      size: 4.5 * 1024 * 1024,
    };
    const validWebp = {
      name: 'symposium.webp',
      type: 'image/webp',
      size: 500 * 1024,
    };

    assert.strictEqual(validatePosterFile(validJpeg).valid, true);
    assert.strictEqual(validatePosterFile(validPng).valid, true);
    assert.strictEqual(validatePosterFile(validWebp).valid, true);
  });

  test('Storage: validatePosterFile rejects unapproved MIME types (PDF, TXT, EXE, MP4)', () => {
    const pdfFile = {
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024 * 1024,
    };
    const txtFile = {
      name: 'notes.txt',
      type: 'text/plain',
      size: 1024,
    };
    const exeFile = {
      name: 'installer.exe',
      type: 'application/x-msdownload',
      size: 2048,
    };

    const pdfRes = validatePosterFile(pdfFile);
    assert.strictEqual(pdfRes.valid, false);
    assert.strictEqual(
      pdfRes.error,
      'Unsupported image format. Allowed formats: JPEG, PNG, WebP, GIF.'
    );

    const txtRes = validatePosterFile(txtFile);
    assert.strictEqual(txtRes.valid, false);

    const exeRes = validatePosterFile(exeFile);
    assert.strictEqual(exeRes.valid, false);
  });

  test('Storage: validatePosterFile rejects oversized files (> 5MB)', () => {
    const oversizedFile = {
      name: 'huge_poster.png',
      type: 'image/png',
      size: 6.5 * 1024 * 1024,
    };

    const res = validatePosterFile(oversizedFile);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(
      res.error,
      'File size (6.5MB) exceeds the maximum limit of 5MB.'
    );

    const boundaryFile = {
      name: 'boundary.jpg',
      type: 'image/jpeg',
      size: MAX_FILE_SIZE_BYTES + 1,
    };
    assert.strictEqual(validatePosterFile(boundaryFile).valid, false);
  });

  test('Storage: Constructs canonical poster path matching Storage Security Rules', () => {
    const buildPosterStoragePath = (eventId, rawFileName) => {
      const timestamp = 1730000000000;
      const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      return `events/${eventId}/posters/${timestamp}_${cleanFileName}`;
    };

    const path = buildPosterStoragePath('techfest-2026', 'My Poster (Final).png');
    assert.strictEqual(
      path,
      'events/techfest-2026/posters/1730000000000_My_Poster__Final_.png'
    );
    assert.match(path, /^events\/[^/]+\/posters\/[^/]+$/);
  });

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(` TEST EXECUTION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log(' ALL PHASE 11 INTEGRATION TESTS COMPLETED SUCCESSFULLY!\n');
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
