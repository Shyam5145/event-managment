import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Download, 
  QrCode, 
  Trash2, 
  RotateCcw,
  AlertCircle,
  Clock3,
  XCircle,
  Compass
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { isFirebaseConfigured } from '../../services/firebase.js';
import { getStudentRegistrations } from '../../services/registrationService.js';
import { 
  buildPassQrPayload, 
  generatePassQrDataUrl, 
  downloadOfflinePassCard 
} from '../../utils/qrPass.js';

export const MyRegistrationsPage = () => {
  const { events, registrations, waitlist, cancelRegistration, registerForEvent } = useEvents();
  const { user } = useAuth();
  const toast = useToast();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled' | 'waitlisted'
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedEventToCancel, setSelectedEventToCancel] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPassForQr, setSelectedPassForQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [savingOfflinePass, setSavingOfflinePass] = useState(false);

  // Store cancelled registration history in local state
  const [cancelledEventsList, setCancelledEventsList] = useState([]);

  // Match registrations with event details
  const allRegistrationsWithEvents = useMemo(() => {
    return registrations
      .map((reg) => {
        const event = events.find((e) => e.id === reg.eventId);
        return event ? { event, registration: reg } : null;
      })
      .filter(Boolean);
  }, [registrations, events]);

  // Tab categorization
  const upcomingPasses = allRegistrationsWithEvents.filter(
    ({ event, registration }) => !registration.checkedIn && registration.status !== 'cancelled'
  );

  const completedPasses = allRegistrationsWithEvents.filter(
    ({ event, registration }) => registration.checkedIn
  );

  const waitlistedPasses = waitlist
    .map((w) => {
      const event = events.find((e) => e.id === w.eventId);
      return event ? { event, waitlistEntry: w } : null;
    })
    .filter(Boolean);

  const handleOpenCancel = (event) => {
    setSelectedEventToCancel(event);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedEventToCancel) {
      try {
        await cancelRegistration(selectedEventToCancel.id, user?.uid);
        // Add to cancelled history for the cancelled tab
        setCancelledEventsList((prev) => [
          {
            id: `canc-${Date.now()}`,
            event: selectedEventToCancel,
            cancelledAt: new Date().toLocaleDateString(),
          },
          ...prev,
        ]);

        addNotification({
          title: 'Registration Cancelled',
          message: `Your admission pass for "${selectedEventToCancel.title}" has been cancelled.`,
          type: 'cancel',
          category: 'Passes',
          link: '/student/registrations',
        });
        toast.info(`Registration for "${selectedEventToCancel.title}" has been cancelled.`);
        setCancelModalOpen(false);
        setSelectedEventToCancel(null);
      } catch (err) {
        toast.error(err.message || 'Could not cancel pass', 'Cancellation Error');
      }
    }
  };

  const handleReRegister = (event) => {
    registerForEvent(event.id);
    setCancelledEventsList((prev) => prev.filter((c) => c.event.id !== event.id));
    toast.success(`You are re-registered for ${event.title}!`, 'Ticket Pass Restored');
    setActiveTab('upcoming');
  };

  const handleOpenQr = async (item) => {
    setSelectedPassForQr(item);
    setQrModalOpen(true);
    setQrDataUrl('');
    setQrError('');

    const reg = item?.registration;
    const evt = item?.event;

    // 1. Verify ownership: registration must belong to authenticated user
    const currentUid = user?.uid || user?.id;
    if (reg?.studentId && currentUid && reg.studentId !== currentUid) {
      setQrError('Unauthorized: You can only view admission passes for your own registrations.');
      return;
    }

    // 2. Verify registration status: cannot display valid QR for cancelled passes
    if (reg?.status === 'cancelled') {
      setQrError('Registration Cancelled: This pass was cancelled and is no longer valid for gate admission.');
      return;
    }

    // 3. Verify event status: cannot display valid QR for cancelled events
    if (evt?.status === 'cancelled') {
      setQrError('Event Cancelled: This event has been cancelled by the host club.');
      return;
    }

    setQrLoading(true);
    try {
      const ticketId = reg?.ticketNumber || reg?.ticketId || `CP-TKT-${reg?.id || 'PASS'}`;
      const payload = buildPassQrPayload({
        registrationId: reg?.id || reg?.registrationId,
        eventId: evt?.id || reg?.eventId,
        ticketId,
      });

      const dataUrl = await generatePassQrDataUrl(payload, {
        width: 320,
        darkColor: '#0f172a',
        lightColor: '#ffffff',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate pass QR:', err);
      setQrError('Could not generate QR barcode. Please try again.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveOfflinePass = async () => {
    if (!selectedPassForQr || !qrDataUrl) return;

    setSavingOfflinePass(true);
    try {
      const success = await downloadOfflinePassCard({
        event: selectedPassForQr.event,
        registration: selectedPassForQr.registration,
        user,
        qrDataUrl,
      });
      if (success) {
        toast.success(
          `Digital ticket pass for "${selectedPassForQr.event?.title}" saved to your device.`,
          'Offline Pass Downloaded'
        );
      }
    } catch (err) {
      console.error('Offline pass download failed:', err);
      toast.error('Failed to save offline pass. Please try again.', 'Download Error');
    } finally {
      setSavingOfflinePass(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge variant="primary" size="sm" className="mb-2">Digital Passes</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          My Registrations & Event Passes
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Review your upcoming tickets, completed campus attendance, and waitlist queues.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-border flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-main'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Upcoming Passes</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'upcoming' ? 'bg-primary text-white' : 'bg-slate-100 text-secondary'
          }`}>
            {upcomingPasses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-main'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'completed' ? 'bg-primary text-white' : 'bg-slate-100 text-secondary'
          }`}>
            {completedPasses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cancelled')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'cancelled'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-main'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Cancelled</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'cancelled' ? 'bg-primary text-white' : 'bg-slate-100 text-secondary'
          }`}>
            {cancelledEventsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('waitlisted')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'waitlisted'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-main'
          }`}
        >
          <Clock3 className="w-4 h-4" />
          <span>Waitlisted</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeTab === 'waitlisted' ? 'bg-primary text-white' : 'bg-slate-100 text-secondary'
          }`}>
            {waitlistedPasses.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: UPCOMING PASSES */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingPasses.length > 0 ? (
            upcomingPasses.map(({ event, registration }) => (
              <Card key={registration.id} className="overflow-hidden border-border/80 shadow-subtle hover:shadow-premium transition-all">
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="w-full md:w-56 h-48 md:h-auto relative bg-slate-100 shrink-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="primary" size="sm" className="capitalize font-semibold">
                        {event.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed Active Pass
                        </span>

                        <div className="flex items-center gap-2">
                          {registration.registrationId && (
                            <span className="font-mono text-[11px] text-primary font-bold bg-primary-light/60 px-2.5 py-0.5 rounded-lg border border-primary/20">
                              {registration.registrationId}
                            </span>
                          )}
                          <span className="font-mono text-xs text-secondary bg-slate-100 px-2.5 py-1 rounded-lg">
                            {registration.ticketNumber}
                          </span>
                        </div>
                      </div>

                      <Link to={`/events/${event.id}`}>
                        <h3 className="text-lg font-bold text-main hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                      </Link>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-secondary pt-1">
                        <div className="flex items-center gap-1.5 font-medium text-main">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-secondary">
                        Attendee: <strong className="text-main">{registration.studentName || user?.name}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={QrCode}
                          onClick={() => handleOpenQr({ event, registration })}
                          className="font-bold shadow-xs text-xs"
                        >
                          View Pass QR
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleOpenCancel(event)}
                          className="text-error hover:bg-rose-50 text-xs"
                        >
                          Cancel Pass
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border-dashed">
              <Ticket className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-main">No Upcoming Passes</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                You don&apos;t have any active registrations right now. Find exciting events and reserve your seat.
              </p>
              <Link to="/events" className="inline-block mt-4">
                <Button variant="primary" size="sm" icon={Compass}>
                  Explore Events
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: COMPLETED ATTENDANCE */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedPasses.length > 0 ? (
            completedPasses.map(({ event, registration }) => (
              <Card key={registration.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={event.image} alt={event.title} className="w-16 h-16 rounded-xl object-cover border border-border shrink-0" />
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mb-1">
                      <CheckCircle2 className="w-3 h-3" /> Attended & Verified
                    </span>
                    <h4 className="text-base font-bold text-main">{event.title}</h4>
                    <p className="text-xs text-secondary">{event.date} &bull; {event.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline" size="sm">
                      View Event
                    </Button>
                  </Link>
                  <Link to="/student/certificates">
                    <Button variant="secondary" size="sm" className="text-primary font-semibold">
                      Claim Certificate
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border-dashed">
              <CheckCircle2 className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-main">No Completed Events Yet</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                Once an organizer scans your pass at the venue entrance, verified attendance will appear here.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Tab 3: CANCELLED PASSES */}
      {activeTab === 'cancelled' && (
        <div className="space-y-4">
          {cancelledEventsList.length > 0 ? (
            cancelledEventsList.map((item) => (
              <Card key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-dashed">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mb-1">
                    <XCircle className="w-3 h-3" /> Registration Cancelled
                  </span>
                  <h4 className="text-base font-bold text-main">{item.event.title}</h4>
                  <p className="text-xs text-secondary">
                    {item.event.date} &bull; Cancelled on {item.cancelledAt}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => handleReRegister(item.event)}
                  className="font-semibold text-xs"
                >
                  Re-Register Pass
                </Button>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border-dashed">
              <XCircle className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-main">No Cancelled Registrations</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                You haven&apos;t cancelled any active event tickets.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: WAITLISTED */}
      {activeTab === 'waitlisted' && (
        <div className="space-y-4">
          {waitlistedPasses.length > 0 ? (
            waitlistedPasses.map(({ event, waitlistEntry }) => (
              <Card key={waitlistEntry.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mb-1">
                    <Clock3 className="w-3 h-3" /> Waitlist Queue #{waitlistEntry.queuePosition || 1}
                  </span>
                  <h4 className="text-base font-bold text-main">{event.title}</h4>
                  <p className="text-xs text-secondary">{event.date} &bull; {event.location}</p>
                </div>

                <Link to={`/events/${event.id}`}>
                  <Button variant="outline" size="sm">
                    View Event Status
                  </Button>
                </Link>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border-dashed">
              <Clock3 className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-main">No Active Waitlists</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                When an event is sold out, you can join its waitlist to be automatically in line for seats.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* QR Ticket Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Digital Event Pass"
        description="Scan this barcode at the registration gate desk for entry badge."
        size="sm"
      >
        {selectedPassForQr && (
          <div className="space-y-4 text-center">
            
            {qrError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs text-center space-y-1.5 my-2">
                <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="font-bold text-sm">Pass Inactive</p>
                <p className="text-secondary leading-relaxed">{qrError}</p>
              </div>
            ) : qrLoading ? (
              <div className="w-56 h-56 mx-auto bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-[11px] font-semibold text-secondary">Generating secure QR pass...</p>
              </div>
            ) : qrDataUrl ? (
              <div className="p-4 bg-white border border-border rounded-2xl shadow-subtle inline-block mx-auto">
                <div className="w-52 h-52 bg-white rounded-xl p-1.5 flex items-center justify-center border border-slate-100">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code Pass for ${selectedPassForQr.registration.ticketNumber || selectedPassForQr.registration.id}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="font-mono text-xs font-bold text-main mt-2.5">
                  {selectedPassForQr.registration.ticketNumber || selectedPassForQr.registration.id}
                </p>
                <p className="text-[10px] text-secondary">
                  Ref: {(selectedPassForQr.registration.id || '').slice(0, 22)}
                </p>
              </div>
            ) : null}

            {/* Event & Attendee Info Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <p className="font-bold text-main text-sm">{selectedPassForQr.event.title}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active Pass
                </span>
              </div>
              <p className="text-secondary flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{selectedPassForQr.event.date} &bull; {selectedPassForQr.event.time}</span>
              </p>
              <p className="text-secondary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{selectedPassForQr.event.location || selectedPassForQr.event.venue}</span>
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-secondary">Attendee: <strong className="text-main">{selectedPassForQr.registration.studentName || user?.name}</strong></span>
                <span className="text-secondary font-mono">{selectedPassForQr.registration.department || 'Student'}</span>
              </div>
            </div>

            {/* Offline Pass Download */}
            {!qrError && qrDataUrl && (
              <Button
                variant="outline"
                fullWidth
                size="sm"
                icon={Download}
                loading={savingOfflinePass}
                onClick={handleSaveOfflinePass}
                className="font-bold shadow-xs text-xs"
              >
                Save Offline Pass (PNG)
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Event Registration?"
        description="Are you sure you want to release your reserved seat?"
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Registration
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmCancel}>
              Yes, Cancel Pass
            </Button>
          </div>
        }
      >
        <p className="text-xs text-secondary">
          Cancelling will open your seat for other students on the waitlist. You can always re-register if seats remain open.
        </p>
      </Modal>

    </div>
  );
};

export default MyRegistrationsPage;
