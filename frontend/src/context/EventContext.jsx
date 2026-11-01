import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_EVENTS } from '../data/mockEvents';
import { isFirebaseConfigured } from '../services/firebase.js';
import * as eventService from '../services/eventService.js';
import * as registrationService from '../services/registrationService.js';

const EventContext = createContext(null);

const EVENTS_STORAGE_KEY = 'campuspulse_events';
const REGISTRATIONS_STORAGE_KEY = 'campuspulse_registrations';
const BOOKMARKS_STORAGE_KEY = 'campuspulse_bookmarks';
const WAITLIST_STORAGE_KEY = 'campuspulse_waitlist';

export const EventProvider = ({ children }) => {
  // Initialize events from localStorage or INITIAL_EVENTS
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.some((e) => e.id === 'evt-hackathon-2026')) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading events from localStorage', e);
    }
    return INITIAL_EVENTS;
  });

  // Default initial registrations with rich collegiate participant roster
  const [registrations, setRegistrations] = useState(() => {
    try {
      const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      if (saved && JSON.parse(saved).length > 2) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading registrations from localStorage', e);
    }
    return [
      {
        id: 'reg-demo-1',
        registrationId: 'CP-REG-2026-8842',
        ticketNumber: 'CP-TKT-HACK-884',
        eventId: 'evt-hackathon-2026',
        studentName: 'Rahul Sharma',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        email: 'rahul.sharma@campus.edu',
        department: 'Computer Science & Engineering',
        academicYear: '3rd Year (Class of 2026)',
        teamName: 'ByteForce AI',
        teamSize: 4,
        registeredAt: '2026-10-28T14:30:00Z',
        status: 'confirmed',
        checkedIn: false,
        checkedInAt: null,
      },
      {
        id: 'reg-demo-2',
        registrationId: 'CP-REG-2026-5120',
        ticketNumber: 'CP-TKT-HACK-512',
        eventId: 'evt-hackathon-2026',
        studentName: 'Jordan Lee',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        email: 'jordan.lee@campus.edu',
        department: 'Data Science & AI',
        academicYear: '4th Year (Senior)',
        teamName: 'NeuralByte',
        teamSize: 4,
        registeredAt: '2026-10-28T16:15:00Z',
        status: 'confirmed',
        checkedIn: true,
        checkedInAt: '2026-11-14T09:12:00Z',
      },
      {
        id: 'reg-demo-3',
        registrationId: 'CP-REG-2026-9341',
        ticketNumber: 'CP-TKT-HACK-934',
        eventId: 'evt-hackathon-2026',
        studentName: 'Maya Patel',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        email: 'maya.patel@campus.edu',
        department: 'Electrical Engineering',
        academicYear: '2nd Year (Sophomore)',
        teamName: 'ElectroSpark',
        teamSize: 2,
        registeredAt: '2026-10-29T10:00:00Z',
        status: 'confirmed',
        checkedIn: false,
        checkedInAt: null,
      },
      {
        id: 'reg-demo-4',
        registrationId: 'CP-REG-2026-4421',
        ticketNumber: 'CP-TKT-HACK-442',
        eventId: 'evt-hackathon-2026',
        studentName: 'Ethan Brooks',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        email: 'ethan.b@campus.edu',
        department: 'Business & Technology',
        academicYear: '3rd Year (Junior)',
        teamName: 'FinVenture',
        teamSize: 3,
        registeredAt: '2026-10-29T11:45:00Z',
        status: 'confirmed',
        checkedIn: true,
        checkedInAt: '2026-11-14T09:24:00Z',
      },
      {
        id: 'reg-demo-5',
        registrationId: 'CP-REG-2026-7819',
        ticketNumber: 'CP-TKT-HACK-781',
        eventId: 'evt-hackathon-2026',
        studentName: 'Chloe Zhao',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        email: 'chloe.z@campus.edu',
        department: 'Design & Media Arts',
        academicYear: '4th Year (Senior)',
        teamName: 'PixelWave',
        teamSize: 2,
        registeredAt: '2026-10-29T14:20:00Z',
        status: 'confirmed',
        checkedIn: true,
        checkedInAt: '2026-11-14T09:35:00Z',
      },
      {
        id: 'reg-demo-6',
        registrationId: 'CP-REG-2026-6632',
        ticketNumber: 'CP-TKT-HACK-663',
        eventId: 'evt-hackathon-2026',
        studentName: 'Sneha Kulkarni',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        email: 'sneha.k@campus.edu',
        department: 'Biotechnology & Life Sciences',
        academicYear: '2nd Year (Sophomore)',
        teamName: 'BioHealth Labs',
        teamSize: 4,
        registeredAt: '2026-10-30T09:10:00Z',
        status: 'confirmed',
        checkedIn: false,
        checkedInAt: null,
      },
      {
        id: 'reg-demo-7',
        registrationId: 'CP-REG-2026-2184',
        ticketNumber: 'CP-TKT-HACK-218',
        eventId: 'evt-hackathon-2026',
        studentName: 'Daniel Kim',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        email: 'daniel.k@campus.edu',
        department: 'Computer Science & Engineering',
        academicYear: '1st Year (Freshman)',
        teamName: 'Solo',
        teamSize: 1,
        registeredAt: '2026-10-30T10:30:00Z',
        status: 'confirmed',
        checkedIn: false,
        checkedInAt: null,
      },
      {
        id: 'reg-demo-8',
        registrationId: 'CP-REG-2026-3910',
        ticketNumber: 'CP-TKT-FOOT-391',
        eventId: 'evt-football-cup',
        studentName: 'Rahul Sharma',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        email: 'rahul.sharma@campus.edu',
        department: 'Computer Science & Engineering',
        academicYear: '3rd Year (Class of 2026)',
        teamName: 'Solo',
        teamSize: 1,
        registeredAt: '2026-10-29T10:15:00Z',
        status: 'confirmed',
        checkedIn: false,
        checkedInAt: null,
      },
    ];
  });

  // Default bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading bookmarks from localStorage', e);
    }
    return ['evt-hackathon-2026', 'evt-cultural-night'];
  });

  // Waitlist initial state
  const [waitlist, setWaitlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading waitlist from localStorage', e);
    }
    return [
      {
        id: 'wt-demo-1',
        eventId: 'evt-hackathon-2026',
        studentName: 'Aarav Patel',
        email: 'aarav.patel@campus.edu',
        department: 'Computer Science & Engineering',
        academicYear: '3rd Year',
        joinedAt: '2026-10-30T11:20:00Z',
        queuePosition: 1,
      },
      {
        id: 'wt-demo-2',
        eventId: 'evt-hackathon-2026',
        studentName: 'Ananya Deshmukh',
        email: 'ananya.d@campus.edu',
        department: 'Information Technology',
        academicYear: '2nd Year',
        joinedAt: '2026-10-30T14:45:00Z',
        queuePosition: 2,
      },
      {
        id: 'wt-demo-3',
        eventId: 'evt-hackathon-2026',
        studentName: 'Rohan Gupta',
        email: 'rohan.g@campus.edu',
        department: 'Electrical Engineering',
        academicYear: '4th Year',
        joinedAt: '2026-10-31T09:10:00Z',
        queuePosition: 3,
      },
      {
        id: 'wt-demo-4',
        eventId: 'evt-football-cup',
        studentName: 'Vikram Singh',
        email: 'vikram.s@campus.edu',
        department: 'Mechanical Engineering',
        academicYear: '3rd Year',
        joinedAt: '2026-10-31T15:30:00Z',
        queuePosition: 1,
      },
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Error persisting events', e);
    }
  }, [events]);

  // Optionally fetch Firestore events if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let isMounted = true;
    eventService.getEvents()
      .then((remoteEvents) => {
        if (isMounted && remoteEvents && remoteEvents.length > 0) {
          setEvents((prev) => {
            const merged = [...remoteEvents];
            prev.forEach((localEvt) => {
              if (!merged.some((r) => r.id === localEvt.id)) {
                merged.push(localEvt);
              }
            });
            return merged;
          });
        }
      })
      .catch((e) => console.warn('Could not fetch events from Firestore:', e.message));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
    } catch (e) {
      console.error('Error persisting registrations', e);
    }
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Error persisting bookmarks', e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(waitlist));
    } catch (e) {
      console.error('Error persisting waitlist', e);
    }
  }, [waitlist]);

  const isRegistered = (eventId) => {
    return registrations.some((r) => r.eventId === eventId && r.status !== 'cancelled');
  };

  const getRegistration = (eventId) => {
    return registrations.find((r) => r.eventId === eventId && r.status !== 'cancelled') || null;
  };

  const isWaitlisted = (eventId) => {
    return waitlist.some((w) => w.eventId === eventId);
  };

  const isBookmarked = (eventId) => {
    return bookmarks.includes(eventId);
  };

  const toggleBookmark = (eventId) => {
    setBookmarks((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  // Register for Event (Supports Firestore Transaction + Concurrency Safety)
  const registerForEvent = async (eventId, studentDetails = {}) => {
    const existing = getRegistration(eventId);
    if (existing) {
      throw new Error('You are already registered for this event.');
    }

    const eventObj = events.find((e) => e.id === eventId);
    if (eventObj?.status === 'cancelled') {
      throw new Error('This event has been cancelled.');
    }
    if (eventObj && (eventObj.registeredCount || 0) >= (eventObj.capacity || 1)) {
      throw new Error('Event has reached maximum capacity. All seats are filled.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const eventSuffix = eventId.replace('evt-', '').substring(0, 4).toUpperCase();
    let createdTicketNumber = `CP-TKT-${eventSuffix}-${Math.floor(100 + Math.random() * 900)}`;
    let remoteId = null;

    if (isFirebaseConfigured) {
      try {
        const savedReg = await registrationService.registerForEvent(eventId, studentDetails, studentDetails);
        if (savedReg?.ticketNumber) createdTicketNumber = savedReg.ticketNumber;
        if (savedReg?.id) remoteId = savedReg.id;
      } catch (err) {
        // If it's a real business rule violation (capacity, duplicate, deadline, cancelled), throw immediately
        const msg = err.message || '';
        if (
          msg.includes('capacity') ||
          msg.includes('already registered') ||
          msg.includes('deadline') ||
          msg.includes('cancelled') ||
          msg.includes('Authentication required')
        ) {
          throw err;
        }
        console.warn('Firestore registration error, falling back to local session state:', err);
      }
    }

    const newRegistration = {
      id: remoteId || `reg-${Date.now()}`,
      firestoreId: remoteId,
      registrationId: `CP-REG-2026-${randomSuffix}`,
      ticketNumber: createdTicketNumber,
      eventId,
      studentName: studentDetails.studentName || 'Rahul Sharma',
      avatar: studentDetails.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      email: studentDetails.email || 'rahul.sharma@campus.edu',
      department: studentDetails.department || 'Computer Science & Engineering',
      academicYear: studentDetails.academicYear || '3rd Year (Class of 2026)',
      teamName: studentDetails.teamName || 'Solo',
      teamSize: studentDetails.teamSize || 1,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
      checkedIn: false,
      checkedInAt: null,
    };

    setRegistrations((prev) => [newRegistration, ...prev]);

    // Update event participant count
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, registeredCount: (evt.registeredCount || 0) + 1 }
          : evt
      )
    );

    // Remove from waitlist if was on waitlist
    setWaitlist((prev) => prev.filter((w) => w.eventId !== eventId));

    return newRegistration;
  };

  // Cancel Registration (Supports Firestore Transaction)
  const cancelRegistration = async (eventId, studentId = null) => {
    const reg = getRegistration(eventId);
    if (!reg) return false;

    if (isFirebaseConfigured) {
      try {
        await registrationService.cancelRegistration(eventId, studentId || reg.studentId);
      } catch (e) {
        console.warn('Could not cancel registration in Firestore:', e.message);
      }
    }

    setRegistrations((prev) => prev.filter((r) => r.eventId !== eventId));

    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, registeredCount: Math.max(0, (evt.registeredCount || 0) - 1) }
          : evt
      )
    );

    return true;
  };

  // Join Waitlist
  const joinWaitlist = (eventId, studentDetails = {}) => {
    if (isWaitlisted(eventId) || isRegistered(eventId)) return false;

    const currentEventWaitlist = waitlist.filter((w) => w.eventId === eventId);
    const waitlistEntry = {
      id: `wt-${Date.now()}`,
      eventId,
      studentName: studentDetails.studentName || 'Rahul Sharma',
      email: studentDetails.email || 'rahul.sharma@campus.edu',
      department: studentDetails.department || 'Computer Science & Engineering',
      academicYear: studentDetails.academicYear || '3rd Year',
      joinedAt: new Date().toISOString(),
      queuePosition: currentEventWaitlist.length + 1,
    };

    setWaitlist((prev) => [...prev, waitlistEntry]);
    return waitlistEntry;
  };

  // Promote from Waitlist to Registered
  const promoteFromWaitlist = (eventId, waitlistEntryId) => {
    const entry = waitlist.find((w) => w.id === waitlistEntryId);
    if (!entry) return null;

    // Register this student
    const createdReg = registerForEvent(eventId, {
      studentName: entry.studentName,
      email: entry.email,
      department: entry.department,
      academicYear: entry.academicYear,
    });

    // Remove from waitlist & recalculate queue positions
    setWaitlist((prev) => {
      const remaining = prev.filter((w) => w.id !== waitlistEntryId);
      let pos = 1;
      return remaining.map((w) => {
        if (w.eventId === eventId) {
          return { ...w, queuePosition: pos++ };
        }
        return w;
      });
    });

    return createdReg;
  };

  // Remove from Waitlist
  const removeFromWaitlist = (eventId, waitlistEntryId) => {
    setWaitlist((prev) => {
      const remaining = prev.filter((w) => w.id !== waitlistEntryId);
      let pos = 1;
      return remaining.map((w) => {
        if (w.eventId === eventId) {
          return { ...w, queuePosition: pos++ };
        }
        return w;
      });
    });
  };

  // Mark Attendance (Present / Absent / Undo) - Restricts attendance changes to authorized organizers
  const markAttendance = async (eventId, identifier, isPresent, organizerId = null) => {
    let matchedReg = null;

    setRegistrations((prev) =>
      prev.map((r) => {
        const matches =
          r.id === identifier ||
          r.ticketNumber === identifier ||
          r.registrationId === identifier ||
          r.studentId === identifier;
        if (matches && (r.eventId === eventId || !eventId)) {
          matchedReg = r;
          return {
            ...r,
            checkedIn: isPresent,
            attendanceStatus: isPresent ? 'present' : 'absent',
            checkedInAt: isPresent ? new Date().toISOString() : null,
          };
        }
        return r;
      })
    );

    if (isFirebaseConfigured && matchedReg) {
      const regId = matchedReg.firestoreId || matchedReg.id;
      try {
        await registrationService.updateRegistrationStatus(
          regId,
          isPresent ? 'present' : 'absent',
          organizerId,
          { checkedIn: isPresent }
        );
      } catch (e) {
        console.warn('Could not sync attendance to Firestore:', e.message);
        throw e;
      }
    }
  };

  // Verify Ticket Registration (Supports Firestore and Local session roster)
  const verifyTicket = async (ticketId) => {
    if (isFirebaseConfigured) {
      try {
        const result = await registrationService.verifyTicketRegistration(ticketId);
        if (result && result.status !== 'not_found') {
          return result;
        }
      } catch (err) {
        console.warn('Firestore verification error, checking local state:', err);
      }
    }

    const cleanId = String(ticketId || '').trim().toLowerCase();
    const matched = registrations.find(
      (r) =>
        r.id?.toLowerCase() === cleanId ||
        r.ticketNumber?.toLowerCase() === cleanId ||
        r.ticketId?.toLowerCase() === cleanId ||
        r.registrationId?.toLowerCase() === cleanId
    );

    if (!matched) {
      return {
        isValid: false,
        status: 'not_found',
        statusLabel: 'Ticket Not Found',
        message: `No active ticket matching "${ticketId}" was found in the system registry.`,
      };
    }

    const matchedEvent = events.find((e) => e.id === matched.eventId);
    const rawName = matched.studentName || 'Student Attendee';
    const parts = rawName.split(' ');
    const maskedName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : rawName;

    if (matched.status === 'cancelled') {
      return {
        isValid: false,
        status: 'cancelled',
        statusLabel: 'Registration Cancelled',
        message: 'This registration ticket was cancelled and is no longer valid for venue admission.',
        registration: matched,
        event: matchedEvent,
        sanitizedAttendee: { name: maskedName, department: matched.department || 'General' },
      };
    }

    if (matched.checkedIn || matched.attendanceStatus === 'present') {
      return {
        isValid: false,
        status: 'already_checked_in',
        statusLabel: 'Already Checked In',
        message: 'Attendee has already been checked in at the gate.',
        registration: matched,
        event: matchedEvent,
        sanitizedAttendee: { name: maskedName, department: matched.department || 'General' },
      };
    }

    return {
      isValid: true,
      status: 'valid',
      statusLabel: 'Valid Registration',
      message: 'Ticket is genuine, confirmed, and authorized for venue admission.',
      registration: matched,
      event: matchedEvent,
      sanitizedAttendee: { name: maskedName, department: matched.department || 'General' },
    };
  };

  // Remove Participant from Event
  const removeParticipant = (eventId, identifier) => {
    setRegistrations((prev) =>
      prev.filter((r) => {
        const matches =
          (r.id === identifier || r.registrationId === identifier || r.ticketNumber === identifier) &&
          r.eventId === eventId;
        return !matches;
      })
    );

    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, registeredCount: Math.max(0, (evt.registeredCount || 0) - 1) }
          : evt
      )
    );
  };

  // Get current registration state for an event
  const getRegistrationState = (event) => {
    if (!event) return 'not_registered';
    if (event.status === 'cancelled') return 'cancelled';
    if (isRegistered(event.id)) return 'registered';
    if (isWaitlisted(event.id)) return 'waitlisted';

    // Check registration deadline if present
    const deadlineVal = event.registrationDeadline || event.deadline;
    if (deadlineVal) {
      const deadlineDate = new Date(deadlineVal);
      if (!isNaN(deadlineDate.getTime()) && Date.now() > deadlineDate.getTime()) {
        return 'registration_closed';
      }
    }

    if (event.status === 'closed' || event.status === 'draft') return 'registration_closed';
    if ((event.registeredCount || 0) >= (event.capacity || 1)) return 'event_full';

    return 'not_registered';
  };

  const [loadingEvents, setLoadingEvents] = useState(false);

  const refreshEvents = useCallback(async (filters = {}) => {
    if (!isFirebaseConfigured) return;
    setLoadingEvents(true);
    try {
      const fetched = await eventService.getPublishedEvents(filters);
      if (fetched && fetched.length > 0) {
        setEvents((prev) => {
          const merged = [...fetched];
          prev.forEach((localEvt) => {
            if (!merged.some((r) => r.id === localEvt.id)) {
              merged.push(localEvt);
            }
          });
          return merged;
        });
      }
    } catch (e) {
      console.warn('Error refreshing events from Firestore:', e);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const createEvent = async (eventData, organizerUser = {}) => {
    const localId = `evt-${Date.now()}`;
    const initialStatus = eventData.status || 'published';

    const newEvent = {
      id: localId,
      registeredCount: 0,
      status: initialStatus,
      featured: false,
      tags: [],
      agenda: [],
      ...eventData,
    };

    setEvents((prev) => [newEvent, ...prev]);

    if (isFirebaseConfigured) {
      try {
        const createdRemote = await eventService.createEvent(newEvent, organizerUser);
        if (createdRemote?.id) {
          setEvents((prev) =>
            prev.map((e) => (e.id === localId ? { ...e, ...createdRemote, id: createdRemote.id } : e))
          );
          return { ...newEvent, ...createdRemote, id: createdRemote.id };
        }
      } catch (e) {
        console.error('Could not sync created event to Firestore:', e);
        throw e;
      }
    }

    return newEvent;
  };

  const updateEvent = async (eventId, updatedFields, requestingOrganizerId = null) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === eventId ? { ...evt, ...updatedFields } : evt))
    );

    if (isFirebaseConfigured) {
      try {
        await eventService.updateEvent(eventId, updatedFields, requestingOrganizerId);
      } catch (e) {
        console.error('Could not sync event update to Firestore:', e);
        throw e;
      }
    }
  };

  const publishEvent = async (eventId, organizerId = null) => {
    return updateEvent(eventId, { status: 'published' }, organizerId);
  };

  const cancelEvent = async (eventId, organizerId = null) => {
    return updateEvent(eventId, { status: 'cancelled' }, organizerId);
  };

  const deleteEvent = async (eventId, requestingOrganizerId = null) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
    setRegistrations((prev) => prev.filter((r) => r.eventId !== eventId));
    setBookmarks((prev) => prev.filter((id) => id !== eventId));
    setWaitlist((prev) => prev.filter((w) => w.eventId !== eventId));

    if (isFirebaseConfigured) {
      try {
        await eventService.deleteEvent(eventId, requestingOrganizerId);
      } catch (e) {
        console.error('Could not delete event from Firestore:', e);
        throw e;
      }
    }
  };

  const checkInParticipant = (eventId, identifier) => {
    markAttendance(eventId, identifier, true);
  };

  const resetAllData = () => {
    localStorage.removeItem(EVENTS_STORAGE_KEY);
    localStorage.removeItem(REGISTRATIONS_STORAGE_KEY);
    localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
    localStorage.removeItem(WAITLIST_STORAGE_KEY);
    setEvents(INITIAL_EVENTS);
    setRegistrations([]);
    setBookmarks([]);
    setWaitlist([]);
  };

  return (
    <EventContext.Provider
      value={{
        events,
        registrations,
        bookmarks,
        waitlist,
        loadingEvents,
        refreshEvents,
        isRegistered,
        isWaitlisted,
        isBookmarked,
        getRegistration,
        getRegistrationState,
        toggleBookmark,
        registerForEvent,
        cancelRegistration,
        joinWaitlist,
        promoteFromWaitlist,
        removeFromWaitlist,
        markAttendance,
        removeParticipant,
        createEvent,
        updateEvent,
        publishEvent,
        cancelEvent,
        deleteEvent,
        checkInParticipant,
        verifyTicket,
        resetAllData,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export default EventContext;
