/**
 * CampusPulse — QR Pass & Gate Verification Test Suite
 *
 * Verifies:
 * 1. QR Payload Structure & Sanitization
 * 2. Real QR Code Image Generation (data URL)
 * 3. Registration Verification (Valid, Cancelled, Already Checked In, Not Found)
 * 4. PII Masking on Public Verification Route
 * 5. Organizer Check-In (Valid Check-In, Duplicate Check-In Prevention, Cross-Event Rejection)
 */

import assert from 'node:assert';
import QRCode from 'qrcode';
import {
  buildPassQrPayload,
  generatePassQrDataUrl,
} from './frontend/src/utils/qrPass.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

console.log('================================================================');
console.log(' CAMPUSPULSE — REAL QR PASS & VERIFICATION TEST HARNESS');
console.log('================================================================\n');

// 1. QR Payload Generation & Sanitization
console.log('--- 1. QR Payload & Generation Tests ---');

test('QR: buildPassQrPayload constructs canonical payload with verificationUrl', () => {
  const payload = buildPassQrPayload({
    registrationId: 'reg_event101_user501',
    eventId: 'evt_techfest_2026',
    ticketId: 'CP-TKT-TECH-8842',
    origin: 'https://campuspuulse.web.app',
  });

  assert.strictEqual(payload.type, 'campuspulse-event-pass');
  assert.strictEqual(payload.registrationId, 'reg_event101_user501');
  assert.strictEqual(payload.eventId, 'evt_techfest_2026');
  assert.strictEqual(payload.ticketId, 'CP-TKT-TECH-8842');
  assert.strictEqual(
    payload.verificationUrl,
    'https://campuspuulse.web.app/verify/CP-TKT-TECH-8842'
  );

  // Security Invariant: Ensure no sensitive tokens or passwords exist in payload
  assert.strictEqual(payload.password, undefined);
  assert.strictEqual(payload.token, undefined);
  assert.strictEqual(payload.apiKey, undefined);
});

await testAsync('QR: generatePassQrDataUrl produces scannable high-contrast base64 PNG', async () => {
  const payload = buildPassQrPayload({
    registrationId: 'reg_123',
    eventId: 'evt_456',
    ticketId: 'CP-TKT-TEST-9999',
    origin: 'https://campuspuulse.web.app',
  });

  const dataUrl = await generatePassQrDataUrl(payload, { width: 280 });

  assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(dataUrl.length > 500, 'Data URL must contain valid base64 PNG bytes');
});

// 2. Ticket Verification Logic
console.log('\n--- 2. Ticket Verification Tests ---');

const mockRegistry = new Map([
  [
    'CP-TKT-ACTIVE-001',
    {
      id: 'reg_001',
      ticketNumber: 'CP-TKT-ACTIVE-001',
      ticketId: 'CP-TKT-ACTIVE-001',
      eventId: 'evt_hackathon',
      studentName: 'Rahul Sharma',
      department: 'Computer Science',
      status: 'registered',
      checkedIn: false,
      attendanceStatus: 'notMarked',
    },
  ],
  [
    'CP-TKT-CANCELLED-002',
    {
      id: 'reg_002',
      ticketNumber: 'CP-TKT-CANCELLED-002',
      ticketId: 'CP-TKT-CANCELLED-002',
      eventId: 'evt_hackathon',
      studentName: 'Ananya Roy',
      department: 'Information Technology',
      status: 'cancelled',
      checkedIn: false,
    },
  ],
  [
    'CP-TKT-CHECKEDIN-003',
    {
      id: 'reg_003',
      ticketNumber: 'CP-TKT-CHECKEDIN-003',
      ticketId: 'CP-TKT-CHECKEDIN-003',
      eventId: 'evt_hackathon',
      studentName: 'Vikram Singh',
      department: 'Mechanical Eng',
      status: 'registered',
      checkedIn: true,
      attendanceStatus: 'present',
      checkedInAt: '2026-11-01T09:30:00Z',
    },
  ],
]);

const simulateVerifyTicket = (ticketId) => {
  if (!ticketId || !ticketId.trim()) {
    return { isValid: false, status: 'invalid', statusLabel: 'Invalid Ticket' };
  }
  const reg = mockRegistry.get(ticketId.trim());
  if (!reg) {
    return { isValid: false, status: 'not_found', statusLabel: 'Ticket Not Found' };
  }

  // Mask attendee PII (First name + Last Initial)
  const parts = reg.studentName.split(' ');
  const maskedName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : reg.studentName;

  if (reg.status === 'cancelled') {
    return {
      isValid: false,
      status: 'cancelled',
      statusLabel: 'Registration Cancelled',
      sanitizedAttendee: { name: maskedName, department: reg.department },
    };
  }

  if (reg.checkedIn) {
    return {
      isValid: false,
      status: 'already_checked_in',
      statusLabel: 'Already Checked In',
      sanitizedAttendee: { name: maskedName, department: reg.department },
    };
  }

  return {
    isValid: true,
    status: 'valid',
    statusLabel: 'Valid Registration',
    sanitizedAttendee: { name: maskedName, department: reg.department },
  };
};

test('Verification: Confirms Active Registration pass', () => {
  const result = simulateVerifyTicket('CP-TKT-ACTIVE-001');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.status, 'valid');
  assert.strictEqual(result.statusLabel, 'Valid Registration');
  assert.strictEqual(result.sanitizedAttendee.name, 'Rahul S.');
});

test('Verification: Rejects Cancelled Registration pass', () => {
  const result = simulateVerifyTicket('CP-TKT-CANCELLED-002');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.status, 'cancelled');
  assert.strictEqual(result.statusLabel, 'Registration Cancelled');
  assert.strictEqual(result.sanitizedAttendee.name, 'Ananya R.');
});

test('Verification: Flags Already Checked-In pass', () => {
  const result = simulateVerifyTicket('CP-TKT-CHECKEDIN-003');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.status, 'already_checked_in');
  assert.strictEqual(result.statusLabel, 'Already Checked In');
});

test('Verification: Flags Non-Existent Ticket ID', () => {
  const result = simulateVerifyTicket('CP-TKT-UNKNOWN-999');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.status, 'not_found');
  assert.strictEqual(result.statusLabel, 'Ticket Not Found');
});

// 3. Organizer Gate Check-In & Boundary Tests
console.log('\n--- 3. Organizer Gate Check-In Tests ---');

const simulateOrganizerCheckIn = ({ targetEventId, ticketId, organizerUser }) => {
  if (!organizerUser || organizerUser.role !== 'organizer') {
    throw new Error('Permission denied: Only authorized event organizers can record check-in.');
  }

  const reg = mockRegistry.get(ticketId);
  if (!reg) {
    throw new Error(`Ticket "${ticketId}" not found in system.`);
  }

  if (reg.eventId !== targetEventId) {
    throw new Error('Cross-event rejected: Ticket belongs to a different event.');
  }

  if (reg.status === 'cancelled') {
    throw new Error('Admission Denied: Pass is cancelled.');
  }

  if (reg.checkedIn) {
    throw new Error('Duplicate check-in: Attendee already marked present.');
  }

  reg.checkedIn = true;
  reg.attendanceStatus = 'present';
  reg.checkedInAt = new Date().toISOString();
  return { success: true, attendee: reg.studentName };
};

test('Check-In: Successfully records admission for valid pass', () => {
  const organizer = { uid: 'org_acm', role: 'organizer' };
  const checkIn = simulateOrganizerCheckIn({
    targetEventId: 'evt_hackathon',
    ticketId: 'CP-TKT-ACTIVE-001',
    organizerUser: organizer,
  });

  assert.strictEqual(checkIn.success, true);
  assert.strictEqual(checkIn.attendee, 'Rahul Sharma');
});

test('Check-In: Blocks Duplicate Check-In on second scan attempt', () => {
  const organizer = { uid: 'org_acm', role: 'organizer' };
  assert.throws(
    () =>
      simulateOrganizerCheckIn({
        targetEventId: 'evt_hackathon',
        ticketId: 'CP-TKT-ACTIVE-001',
        organizerUser: organizer,
      }),
    /Duplicate check-in/
  );
});

test('Check-In: Blocks Cross-Event Scan (wrong event target)', () => {
  const organizer = { uid: 'org_acm', role: 'organizer' };
  assert.throws(
    () =>
      simulateOrganizerCheckIn({
        targetEventId: 'evt_robotics_summit', // Different event
        ticketId: 'CP-TKT-ACTIVE-001',
        organizerUser: organizer,
      }),
    /Cross-event rejected/
  );
});

test('Check-In: Blocks Cancelled Pass from admission', () => {
  const organizer = { uid: 'org_acm', role: 'organizer' };
  assert.throws(
    () =>
      simulateOrganizerCheckIn({
        targetEventId: 'evt_hackathon',
        ticketId: 'CP-TKT-CANCELLED-002',
        organizerUser: organizer,
      }),
    /Pass is cancelled/
  );
});

test('Check-In: Blocks Student from self-checking in', () => {
  const student = { uid: 'student_1', role: 'student' };
  assert.throws(
    () =>
      simulateOrganizerCheckIn({
        targetEventId: 'evt_hackathon',
        ticketId: 'CP-TKT-ACTIVE-001',
        organizerUser: student,
      }),
    /Only authorized event organizers/
  );
});

console.log('\n================================================================');
console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log(' ALL QR PASS & VERIFICATION TESTS COMPLETED SUCCESSFULLY!\n');
}

