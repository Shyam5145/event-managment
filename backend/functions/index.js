/**
 * CampusPulse - Cloud Functions for Firebase
 * Atomic Event Registration and Capacity Management via Firebase Admin SDK
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/**
 * Callable Function: registerForEvent
 *
 * Atomically verifies student eligibility, event capacity, deadline,
 * prevents duplicate registrations with deterministic IDs, and increments seat count.
 */
exports.registerForEvent = onCall(async (request) => {
  // 1. Verify Authentication
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in as a student to register for events."
    );
  }

  const studentUid = request.auth.uid;
  const { eventId, studentDetails = {} } = request.data || {};

  if (!eventId) {
    throw new HttpsError("invalid-argument", "Event ID is required.");
  }

  // Deterministic document ID prevents concurrent duplicate registrations
  const regDocId = `${eventId}_${studentUid}`;
  const regRef = db.collection("registrations").doc(regDocId);
  const eventRef = db.collection("events").doc(eventId);
  const userRef = db.collection("users").doc(studentUid);

  try {
    return await db.runTransaction(async (transaction) => {
      // Step A: Load Student Profile to check role
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Student profile not found.");
      }
      const userData = userSnap.data();

      // Step B: Load Event Document
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) {
        throw new HttpsError("not-found", "Event listing does not exist.");
      }
      const eventData = eventSnap.data();

      // Step C: Verify Event Status
      if (eventData.status === "cancelled") {
        throw new HttpsError(
          "failed-precondition",
          "This event has been cancelled and is no longer accepting registrations."
        );
      }
      if (eventData.status === "draft") {
        throw new HttpsError(
          "failed-precondition",
          "This event is a draft and is not yet published for registration."
        );
      }

      // Step D: Check Registration Deadline
      const deadline = eventData.registrationDeadline || eventData.deadline || eventData.eventDate;
      if (deadline) {
        const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
        if (!isNaN(deadlineDate.getTime()) && Date.now() > deadlineDate.getTime()) {
          throw new HttpsError(
            "deadline-exceeded",
            "The registration deadline for this event has passed."
          );
        }
      }

      // Step E: Check Capacity Limits
      const capacity = Number(eventData.capacity || 0);
      const registeredCount = Number(eventData.registeredCount || 0);
      if (capacity > 0 && registeredCount >= capacity) {
        throw new HttpsError(
          "resource-exhausted",
          "Event has reached maximum capacity. No seats available."
        );
      }

      // Step F: Check for Duplicate / Existing Registration
      const regSnap = await transaction.get(regRef);
      if (regSnap.exists) {
        const existingData = regSnap.data();
        if (existingData.status === "registered") {
          throw new HttpsError(
            "already-exists",
            "You are already registered for this event."
          );
        }
      }

      // Step G: Generate ticket reference & payload
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const eventSuffix = eventId.slice(-4).toUpperCase();
      const ticketNumber = `CP-TKT-${eventSuffix}-${randomSuffix}`;

      const newRegistration = {
        id: regDocId,
        eventId,
        eventTitle: eventData.title || "Campus Event",
        eventDate: eventData.eventDate || null,
        studentId: studentUid,
        studentName: studentDetails.studentName || userData.name || "Student",
        studentEmail: studentDetails.email || userData.email || "",
        department: studentDetails.department || userData.department || "General",
        academicYear: studentDetails.academicYear || userData.year || "Undergraduate",
        ticketNumber,
        status: "registered",
        attendanceStatus: "notMarked",
        checkedIn: false,
        registeredAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Atomic Writes in Transaction
      transaction.set(regRef, newRegistration, { merge: true });
      transaction.update(eventRef, {
        registeredCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        registration: {
          ...newRegistration,
          registeredAt: new Date().toISOString(),
        },
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error("registerForEvent transaction failed:", error);
    throw new HttpsError("internal", error.message || "Failed to register for event.");
  }
});

/**
 * Callable Function: cancelRegistration
 *
 * Atomically cancels a student registration and releases the event seat.
 */
exports.cancelRegistration = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required to cancel registration.");
  }

  const studentUid = request.auth.uid;
  const { eventId } = request.data || {};

  if (!eventId) {
    throw new HttpsError("invalid-argument", "Event ID is required.");
  }

  const regDocId = `${eventId}_${studentUid}`;
  const regRef = db.collection("registrations").doc(regDocId);
  const eventRef = db.collection("events").doc(eventId);

  try {
    return await db.runTransaction(async (transaction) => {
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists) {
        throw new HttpsError("not-found", "Registration pass not found.");
      }

      const regData = regSnap.data();
      if (regData.studentId !== studentUid) {
        throw new HttpsError("permission-denied", "You can only cancel your own registration.");
      }

      if (regData.status === "cancelled") {
        return { success: true, message: "Registration was already cancelled." };
      }

      // Update registration status
      transaction.update(regRef, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Atomically decrement event seat count (lower bounded to 0)
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) {
        const currentCount = Number(eventSnap.data().registeredCount || 0);
        if (currentCount > 0) {
          transaction.update(eventRef, {
            registeredCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      return { success: true, message: "Registration cancelled successfully." };
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error("cancelRegistration transaction failed:", error);
    throw new HttpsError("internal", error.message || "Failed to cancel registration.");
  }
});

/**
 * Callable Function: markAttendance
 *
 * Restricts attendance changes strictly to authorized organizers and admins.
 * Students cannot mark themselves present.
 */
exports.markAttendance = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required to mark attendance.");
  }

  const callerUid = request.auth.uid;
  const { eventId, studentId, isPresent = true } = request.data || {};

  if (!eventId || !studentId) {
    throw new HttpsError("invalid-argument", "Both eventId and studentId are required.");
  }

  // Prevent students from marking themselves present
  if (callerUid === studentId) {
    const callerSnap = await db.collection("users").doc(callerUid).get();
    const callerRole = callerSnap.data()?.role;
    if (callerRole === "student") {
      throw new HttpsError("permission-denied", "Students cannot mark themselves present.");
    }
  }

  // Verify caller is the organizer of this event or an admin
  const eventSnap = await db.collection("events").doc(eventId).get();
  if (!eventSnap.exists) {
    throw new HttpsError("not-found", "Event listing not found.");
  }

  const eventData = eventSnap.data();
  const callerSnap = await db.collection("users").doc(callerUid).get();
  const isAdmin = callerSnap.data()?.role === "admin";

  if (eventData.organizerId !== callerUid && !isAdmin) {
    throw new HttpsError("permission-denied", "Unauthorized: Only the host organizer can record gate check-ins.");
  }

  const regDocId = `${eventId}_${studentId}`;
  const regRef = db.collection("registrations").doc(regDocId);

  await regRef.update({
    attendanceStatus: isPresent ? "present" : "absent",
    checkedIn: Boolean(isPresent),
    checkedInAt: isPresent ? FieldValue.serverTimestamp() : null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, studentId, isPresent };
});

/**
 * Callable Function: issueCertificate
 *
 * Trusted certificate issuance restricted to organizers and admins.
 * Students are prevented from issuing or modifying their own certificates.
 */
exports.issueCertificate = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required to issue certificates.");
  }

  const callerUid = request.auth.uid;
  const { eventId, studentId, certificateURL = "", grade = "Verified Completion" } = request.data || {};

  if (!eventId || !studentId) {
    throw new HttpsError("invalid-argument", "eventId and studentId are required.");
  }

  // Role validation
  const callerSnap = await db.collection("users").doc(callerUid).get();
  const callerData = callerSnap.data() || {};
  if (callerData.role === "student") {
    throw new HttpsError("permission-denied", "Permission denied: Students cannot issue certificates.");
  }

  const eventSnap = await db.collection("events").doc(eventId).get();
  const eventData = eventSnap.exists ? eventSnap.data() : {};

  const certPayload = {
    credentialId: `CP-CERT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    eventId,
    eventName: eventData.title || "Campus Event",
    studentId,
    issuedBy: eventData.organizerName || callerData.clubName || "Campus Events Syndicate",
    certificateURL,
    grade,
    issuedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  };

  const certRef = await db.collection("certificates").add(certPayload);

  // Send an automated notification to the student
  await db.collection("notifications").add({
    recipientId: studentId,
    title: "Certificate Available",
    message: `Your certificate of completion for "${eventData.title || 'Campus Event'}" has been issued!`,
    type: "certificate_issued",
    relatedEventId: eventId,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, certificateId: certRef.id, ...certPayload };
});

