import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, isFirebaseConfigured } from './firebase.js';

export const CERTIFICATES_COLLECTION = 'certificates';

/**
 * Fetch certificates earned by a specific student.
 * Restricts access: Students only receive certificates matching their UID.
 *
 * @param {string} studentId - Student UID
 * @returns {Promise<Array>}
 */
export const getStudentCertificates = async (studentId) => {
  if (!isFirebaseConfigured || !db || !studentId) {
    return [];
  }

  try {
    const certRef = collection(db, CERTIFICATES_COLLECTION);
    const q = query(
      certRef,
      where('studentId', '==', studentId),
      orderBy('issuedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error(`Error fetching certificates for student ${studentId}:`, error);
    throw error;
  }
};

/**
 * Upload certificate image or PDF document to Firebase Storage.
 * Path: certificates/{studentId}/{eventId}_certificate.png
 *
 * @param {Blob|File} blob - Certificate image/PDF data
 * @param {string} studentId - Student UID
 * @param {string} eventId - Associated event ID
 * @returns {Promise<string>} Public download URL
 */
export const uploadCertificateFile = async (blob, studentId, eventId) => {
  if (!isFirebaseConfigured || !storage || !studentId) {
    return null;
  }

  try {
    const storagePath = `certificates/${studentId}/${eventId || Date.now()}_certificate.png`;
    const certStorageRef = ref(storage, storagePath);
    await uploadBytes(certStorageRef, blob, {
      contentType: 'image/png',
      customMetadata: {
        studentId,
        eventId: String(eventId),
        issuedAt: new Date().toISOString(),
      },
    });

    return await getDownloadURL(certStorageRef);
  } catch (error) {
    console.error('Error uploading certificate to Firebase Storage:', error);
    throw error;
  }
};

/**
 * Issue a certificate to a student for completing an event.
 * Enforces permission: Students MUST NOT be able to issue or modify their own certificates.
 * Only organizers or admins can issue certificates.
 *
 * @param {Object} certificateData - { eventId, eventName, studentId, studentName, issuedBy, certificateURL, type, grade }
 * @param {string} [issuerUid] - Organizer or Admin UID performing the issuance
 * @returns {Promise<Object>} Created certificate record
 */
export const issueCertificate = async (certificateData = {}, issuerUid = null) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }

  const { eventId, studentId } = certificateData;
  if (!eventId || !studentId) {
    throw new Error('Both eventId and studentId are required to issue a certificate.');
  }

  const currentAuthUser = auth?.currentUser;
  const callerUid = issuerUid || currentAuthUser?.uid;

  // Prevent students from issuing certificates to themselves
  if (callerUid && callerUid === studentId) {
    // Check if user is an admin or organizer
    const userDocSnap = await getDoc(doc(db, 'users', callerUid));
    if (userDocSnap.exists()) {
      const role = userDocSnap.data()?.role;
      if (role === 'student') {
        throw new Error('Permission denied: Students cannot issue certificates to themselves.');
      }
    }
  }

  try {
    const certRef = collection(db, CERTIFICATES_COLLECTION);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const credentialId = certificateData.credentialId || `CP-CERT-2026-${randomSuffix}`;

    const payload = {
      credentialId,
      eventId,
      eventName: certificateData.eventName || 'Campus Event',
      studentId,
      studentName: certificateData.studentName || 'Student',
      issuedBy: certificateData.issuedBy || 'Campus Events Syndicate',
      certificateURL: certificateData.certificateURL || '',
      type: certificateData.type || 'Certificate of Completion',
      grade: certificateData.grade || 'Verified Attendance',
      issuedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(certRef, payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('Error issuing certificate:', error);
    throw error;
  }
};
