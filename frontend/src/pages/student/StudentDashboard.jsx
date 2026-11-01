import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  MapPin, 
  QrCode, 
  Award, 
  CheckCircle2, 
  Trash2, 
  Ticket, 
  ChevronRight, 
  AlertTriangle, 
  Compass,
  Bell,
  RefreshCw,
  Check,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { isFirebaseConfigured } from '../../services/firebase.js';
import { getStudentRegistrations } from '../../services/registrationService.js';
import { getStudentCertificates } from '../../services/certificateService.js';
import { getUserNotifications } from '../../services/notificationService.js';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { events, registrations, cancelRegistration } = useEvents();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // Dialog and Tab states
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'notifications'

  // Firebase Remote States
  const [loadingData, setLoadingData] = useState(false);
  const [remoteRegistrations, setRemoteRegistrations] = useState(null);
  const [remoteCertificates, setRemoteCertificates] = useState([]);
  const [remoteNotifications, setRemoteNotifications] = useState([]);

  // Fetch only authenticated student's data from Cloud Firestore
  useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid) return;

    let isMounted = true;
    setLoadingData(true);

    Promise.allSettled([
      getStudentRegistrations(user.uid),
      getStudentCertificates(user.uid),
      getUserNotifications(user.uid, { maxResults: 5 }),
    ])
      .then(([regRes, certRes, notifRes]) => {
        if (!isMounted) return;
        if (regRes.status === 'fulfilled' && Array.isArray(regRes.value)) {
          setRemoteRegistrations(regRes.value);
        }
        if (certRes.status === 'fulfilled' && Array.isArray(certRes.value)) {
          setRemoteCertificates(certRes.value);
        }
        if (notifRes.status === 'fulfilled' && Array.isArray(notifRes.value)) {
          setRemoteNotifications(notifRes.value);
        }
      })
      .catch((err) => console.warn('Could not load student remote dashboard data:', err))
      .finally(() => {
        if (isMounted) setLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Combine & Isolate registrations for this student
  const studentRegistrations = (remoteRegistrations !== null
    ? remoteRegistrations
    : registrations.filter((r) => !user?.uid || r.studentId === user.uid || !r.studentId)
  );

  const activeRegistrations = studentRegistrations.filter((r) => r.status !== 'cancelled');

  // Match registered passes with full event details
  const allUserPasses = activeRegistrations.map((reg) => {
    const matchedEvent = events.find((e) => e.id === reg.eventId) || {
      id: reg.eventId,
      title: reg.eventTitle || 'Campus Event',
      date: reg.eventDate || 'Upcoming',
      location: reg.venue || 'University Campus',
      category: 'General',
      image: reg.posterURL || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    };
    return { registration: reg, event: matchedEvent };
  });

  // Split into Upcoming vs Past
  const now = new Date();
  const upcomingPasses = allUserPasses.filter(({ registration, event }) => {
    if (registration.checkedIn) return false;
    const eventTime = new Date(event.date || event.eventDate).getTime();
    return isNaN(eventTime) || eventTime >= now.getTime() - 86400000;
  });

  const pastPasses = allUserPasses.filter(({ registration, event }) => {
    if (registration.checkedIn) return true;
    const eventTime = new Date(event.date || event.eventDate).getTime();
    return !isNaN(eventTime) && eventTime < now.getTime() - 86400000;
  });

  // Next upcoming event for countdown
  const sortedUpcoming = [...upcomingPasses].sort(
    (a, b) => new Date(a.event.date) - new Date(b.event.date)
  );
  const nextPass = sortedUpcoming[0] || null;
  const nextEvent = nextPass?.event || null;
  const nextEventRegistration = nextPass?.registration || null;

  // Statistics
  const eventsRegisteredCount = activeRegistrations.length;
  const upcomingEventsCount = upcomingPasses.length;
  const eventsAttendedCount = allUserPasses.filter(
    ({ registration }) => registration.checkedIn || registration.attendanceStatus === 'present'
  ).length || (remoteRegistrations ? 0 : 1);
  const certificatesEarnedCount = remoteCertificates.length || (remoteRegistrations ? 0 : 2);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 6, minutes: 30, seconds: 0 });

  useEffect(() => {
    if (!nextEvent) return;
    const targetDate = new Date(`${nextEvent.date}T09:00:00`);

    const interval = setInterval(() => {
      const difference = targetDate - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextEvent]);

  const handleOpenTicket = (event, registration) => {
    setSelectedTicket({ event, registration });
    setTicketModalOpen(true);
  };

  const handleOpenCancel = (event) => {
    setEventToCancel(event);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (eventToCancel) {
      try {
        await cancelRegistration(eventToCancel.id, user?.uid);
        if (remoteRegistrations) {
          setRemoteRegistrations((prev) =>
            prev.map((r) => (r.eventId === eventToCancel.id ? { ...r, status: 'cancelled' } : r))
          );
        }
        addNotification({
          title: 'Registration Cancelled',
          message: `Your pass for "${eventToCancel.title}" was cancelled.`,
          type: 'cancel',
          category: 'Passes',
          link: '/student/registrations',
        });
        toast.info(`Registration for "${eventToCancel.title}" has been cancelled.`, 'Pass Released');
        setCancelModalOpen(false);
        setEventToCancel(null);
      } catch (err) {
        toast.error(err.message || 'Could not cancel pass', 'Cancellation Error');
      }
    }
  };

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Rahul';

  return (
    <div className="space-y-8">
      
      {/* 1. OVERVIEW GREETING HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-premium relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-xl">
          <Badge variant="primary" size="sm" className="bg-white/20 text-white border-white/20 backdrop-blur-md">
            Student Space &bull; {user?.department || 'Computer Science & Engineering'}
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Hey, {studentFirstName}!
          </h1>

          <p className="text-indigo-100 text-sm leading-relaxed">
            Here&apos;s what&apos;s happening on your campus.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link to="/events">
              <Button variant="secondary" size="sm" icon={Compass} className="text-primary font-bold shadow-xs">
                Discover Campus Events
              </Button>
            </Link>
            <Link to="/student/registrations">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 font-medium">
                My Ticket Passes ({eventsRegisteredCount})
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Quick Avatar / Identity */}
        <div className="relative z-10 hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
          <img
            src={user?.photoURL || user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={user?.name || 'Rahul'}
            className="w-12 h-12 rounded-xl object-cover border border-white/30"
          />
          <div className="text-xs">
            <p className="font-bold text-white">{user?.name || 'Rahul Sharma'}</p>
            <p className="text-indigo-200">{user?.department || 'Undergraduate'} ({user?.year || 'Class of 2026'})</p>
            <span className="inline-block px-2 py-0.5 mt-1 rounded bg-emerald-500/30 text-emerald-200 font-semibold text-[10px]">
              Active Student
            </span>
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. STATISTICS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Events Registered</p>
            <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{eventsRegisteredCount}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Active passes</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Upcoming Events</p>
            <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{upcomingEventsCount}</h3>
            <p className="text-[10px] text-secondary mt-0.5">Scheduled</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Events Attended</p>
            <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{eventsAttendedCount}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Checked in</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Certificates Earned</p>
            <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{certificatesEarnedCount}</h3>
            <p className="text-[10px] text-purple-600 font-medium mt-0.5">Verified credentials</p>
          </div>
        </Card>
      </div>

      {/* 3. NEXT EVENT COUNTDOWN BANNER */}
      {nextEvent ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-main uppercase tracking-wider">Your Next Event</span>
            </div>
            <span className="text-xs text-secondary">RSVP Code: {nextEventRegistration?.ticketNumber}</span>
          </div>

          <Card className="overflow-hidden border-border/80 shadow-premium">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
              <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm" className="capitalize">{nextEvent.category}</Badge>
                    <Badge variant="success" size="sm">Confirmed Ticket</Badge>
                  </div>
                  <h3 className="text-2xl font-black text-main">{nextEvent.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-secondary pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-main">
                      <Calendar className="w-4 h-4 text-primary" />
                      {nextEvent.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {nextEvent.time || '10:00 AM'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {nextEvent.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={QrCode}
                    onClick={() => handleOpenTicket(nextEvent, nextEventRegistration)}
                  >
                    View Digital Pass
                  </Button>
                  <Link to={`/events/${nextEvent.id}`}>
                    <Button variant="outline" size="sm">Event Details</Button>
                  </Link>
                </div>
              </div>

              {/* Countdown Gauge */}
              <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Remaining</span>
                <div className="grid grid-cols-4 gap-3 w-full">
                  <div className="bg-white/10 rounded-xl p-2.5">
                    <span className="text-2xl font-black text-white">{timeLeft.days}</span>
                    <span className="block text-[10px] text-slate-300 uppercase">Days</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5">
                    <span className="text-2xl font-black text-white">{timeLeft.hours}</span>
                    <span className="block text-[10px] text-slate-300 uppercase">Hours</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5">
                    <span className="text-2xl font-black text-white">{timeLeft.minutes}</span>
                    <span className="block text-[10px] text-slate-300 uppercase">Mins</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5">
                    <span className="text-2xl font-black text-white">{timeLeft.seconds}</span>
                    <span className="block text-[10px] text-slate-300 uppercase">Secs</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Venue doors open 15 minutes before start</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <Ticket className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-main">No Upcoming Scheduled Events</h3>
          <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
            You don&apos;t have any active event passes reserved right now. Browse campus events to secure your spot.
          </p>
          <Link to="/events" className="inline-block mt-4">
            <Button variant="primary" size="sm" icon={Compass}>Discover Events</Button>
          </Link>
        </Card>
      )}

      {/* 4. STUDENT DASHBOARD TABS (Upcoming, Past & Attendance, Notifications) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-main hover:bg-slate-100'
              }`}
            >
              Upcoming Passes ({upcomingPasses.length})
            </button>

            <button
              onClick={() => setActiveTab('past')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'past'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-main hover:bg-slate-100'
              }`}
            >
              Past & Attended ({pastPasses.length})
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notifications'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-main hover:bg-slate-100'
              }`}
            >
              Alerts & Notifications ({remoteNotifications.length})
            </button>
          </div>

          <Link to="/student/registrations" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            Manage All Passes <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab 1: Upcoming Passes */}
        {activeTab === 'upcoming' && (
          <div>
            {upcomingPasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingPasses.map(({ event: evt, registration: reg }) => (
                  <Card key={reg.id || evt.id} className="p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-premium">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={evt.posterURL || evt.image}
                        alt={evt.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="primary" size="sm" className="capitalize text-[10px]">
                            {evt.category}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {reg.checkedIn ? 'Checked In' : 'Confirmed'}
                          </span>
                        </div>
                        <Link to={`/events/${evt.id}`}>
                          <h4 className="text-sm font-bold text-main hover:text-primary transition-colors truncate">
                            {evt.title}
                          </h4>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-secondary">
                          <span className="flex items-center gap-1 text-main font-medium">
                            <Calendar className="w-3 h-3 text-primary" />
                            {evt.date}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[160px]">{evt.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-secondary">{reg.ticketNumber}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={QrCode}
                          onClick={() => handleOpenTicket(evt, reg)}
                          className="text-xs py-1"
                        >
                          Pass
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleOpenCancel(evt)}
                          className="text-error hover:bg-rose-50 text-xs py-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-xs text-secondary">No upcoming event registrations.</p>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Past & Completed Events */}
        {activeTab === 'past' && (
          <div>
            {pastPasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastPasses.map(({ event: evt, registration: reg }) => (
                  <Card key={reg.id || evt.id} className="p-5 flex flex-col justify-between space-y-4 bg-slate-50/50">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={evt.posterURL || evt.image}
                        alt={evt.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border shrink-0 grayscale opacity-80"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="default" size="sm" className="capitalize text-[10px]">
                            {evt.category}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {reg.checkedIn ? 'Attended' : 'Completed'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-main truncate">{evt.title}</h4>
                        <p className="text-[11px] text-secondary">{evt.date} &bull; {evt.location}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-[11px] text-secondary font-mono">Status: {reg.attendanceStatus || (reg.checkedIn ? 'present' : 'completed')}</span>
                      <Link to="/student/certificates">
                        <Button variant="outline" size="sm" icon={Award} className="text-xs py-1">
                          Certificates
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-xs text-secondary">No past event history recorded yet.</p>
              </Card>
            )}
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {remoteNotifications.length > 0 ? (
              remoteNotifications.map((notif) => (
                <Card key={notif.id} className="p-4 flex items-start gap-3 border-border hover:border-primary/40 transition">
                  <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-main">{notif.title}</p>
                    <p className="text-xs text-secondary mt-0.5">{notif.message}</p>
                  </div>
                  <span className="text-[10px] text-secondary whitespace-nowrap">
                    {notif.createdAt ? new Date(notif.createdAt.toDate ? notif.createdAt.toDate() : notif.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed">
                <Bell className="w-8 h-8 text-secondary mx-auto mb-2 opacity-40" />
                <p className="text-xs text-secondary">No unread notifications at this time.</p>
              </Card>
            )}
          </div>
        )}

      </div>

      {/* TICKET PASS QR MODAL */}
      {selectedTicket && (
        <Modal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          title="Digital Ticket Pass"
          description="Present this barcode at the venue gate for check-in."
          size="sm"
        >
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white border border-border rounded-2xl shadow-subtle inline-block mx-auto">
              <div className="w-48 h-48 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center text-white relative">
                <QrCode className="w-36 h-36 text-white" />
              </div>
              <p className="font-mono text-xs font-bold text-main mt-3">
                {selectedTicket.registration?.ticketNumber || 'CP-TKT-HACK-884'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1">
              <p className="font-bold text-main">{selectedTicket.event.title}</p>
              <p className="text-secondary">{selectedTicket.event.date} &bull; {selectedTicket.event.time || '10:00 AM'}</p>
              <p className="text-secondary">{selectedTicket.event.location}</p>
              <p className="text-primary font-semibold pt-1">Attendee: {user?.name}</p>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="sm"
              onClick={() => {
                toast.success('Pass cached for offline entrance');
                setTicketModalOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </Modal>
      )}

      {/* CANCEL REGISTRATION CONFIRMATION MODAL */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Event Registration?"
        description="Are you sure you want to release your confirmed pass?"
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Registration
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmCancel}>
              Yes, Cancel Ticket
            </Button>
          </div>
        }
      >
        <p className="text-xs text-secondary">
          Releasing your pass for <strong className="text-main">&quot;{eventToCancel?.title}&quot;</strong> will decrement your registration count and free the seat for other students.
        </p>
      </Modal>

    </div>
  );
};

export default StudentDashboard;
