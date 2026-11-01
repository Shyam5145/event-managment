import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bookmark, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  Ticket,
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
  FileText,
  UserCheck,
  ChevronDown,
  Sparkles,
  QrCode,
  Flame,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { getEventById } from '../../services/eventService.js';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card, { CardContent } from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import RegistrationModal from '../../components/events/RegistrationModal';
import RegistrationSuccessModal from '../../components/events/RegistrationSuccessModal';
import ShareModal from '../../components/events/ShareModal';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    events, 
    isRegistered, 
    isWaitlisted, 
    isBookmarked, 
    getRegistration, 
    getRegistrationState,
    toggleBookmark, 
    cancelRegistration,
    joinWaitlist
  } = useEvents();
  
  const { user, isAuthenticated, switchRole } = useAuth();
  const toast = useToast();
  const { addNotification } = useNotifications();

  // Dialog and Flow states
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [recentRegistration, setRecentRegistration] = useState(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Accordion open/close state for FAQs
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  // Fallback remote fetch for Firestore documents
  const [remoteEvent, setRemoteEvent] = useState(null);
  const [fetchingRemote, setFetchingRemote] = useState(false);

  React.useEffect(() => {
    const existing = events.find((e) => e.id === id);
    if (!existing && id && !id.startsWith('evt-')) {
      setFetchingRemote(true);
      getEventById(id)
        .then((doc) => {
          if (doc) setRemoteEvent(doc);
        })
        .catch((e) => console.warn('Could not fetch event document:', e))
        .finally(() => setFetchingRemote(false));
    }
  }, [id, events]);

  // Find event (supports direct match, remote Firestore doc, or default)
  const event = events.find((e) => e.id === id) || remoteEvent || events.find((e) => e.id === 'evt-hackathon-2026') || events[0];

  if (fetchingRemote) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md animate-spin mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-main">Loading Event Details...</h2>
          <p className="text-xs text-secondary">Fetching verified event schedule from Cloud Firestore.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-secondary opacity-60" />
          <h2 className="text-xl font-bold text-main">Event Not Found</h2>
          <p className="text-xs text-secondary">The requested event could not be found or has ended.</p>
          <Link to="/events">
            <Button variant="primary" size="sm">Browse Events</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate dynamic capacity & state
  const availableSeats = Math.max(0, event.capacity - (event.registeredCount || 0));
  const occupancyPercent = Math.min(100, Math.round(((event.registeredCount || 0) / (event.capacity || 1)) * 100));
  const isFull = availableSeats === 0;

  const organizerName = typeof event.organizer === 'object' ? (event.organizer?.name || 'Campus Events') : (event.organizer || 'Campus Events');
  const organizerAvatar = typeof event.organizer === 'object' ? event.organizer?.avatar : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150';
  const organizerClub = typeof event.organizer === 'object' ? (event.organizer?.club || 'Campus Events Hub') : 'Campus Events Hub';
  const eventVenue = event.venue || event.location || 'University Campus';

  // Registration state
  const regState = getRegistrationState(event); // 'registered' | 'waitlisted' | 'event_full' | 'registration_closed' | 'not_registered'
  const activeRegistration = getRegistration(event.id);
  const bookmarked = isBookmarked(event.id);

  // Handlers
  const handleRegisterSuccess = (reg) => {
    setRecentRegistration(reg);
    setSuccessModalOpen(true);
    addNotification({
      title: 'Registration Confirmed',
      message: `Your admission pass for "${event.title}" is ready. Ticket #${reg.ticketNumber}`,
      type: 'pass',
      category: 'Passes',
      link: '/student/registrations',
    });
  };

  const handleCancelClick = () => {
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelRegistration(event.id, user?.uid);
      setCancelConfirmOpen(false);
      toast.info(`Registration for ${event.title} has been cancelled.`, 'Pass Released');
      addNotification({
        title: 'Registration Cancelled',
        message: `Your pass for "${event.title}" has been released back to student catalog.`,
        type: 'cancel',
        category: 'Passes',
        link: '/student/registrations',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration.', 'Cancellation Error');
    }
  };

  const handleJoinWaitlist = () => {
    joinWaitlist(event.id, {
      studentName: user?.name || 'Rahul Sharma',
      email: user?.email || 'rahul.sharma@campus.edu',
    });
    setWaitlistModalOpen(false);
    toast.success('You have been added to the waitlist queue! We will notify you if a seat opens.', 'Waitlist Joined');
    addNotification({
      title: 'Waitlist Joined',
      message: `You are in the waitlist queue for "${event.title}".`,
      type: 'reminder',
      category: 'Events',
      link: `/events/${event.id}`,
    });
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleBookmarkToggle = () => {
    toggleBookmark(event.id);
    toast.info(bookmarked ? `Removed from saved events` : `Saved "${event.title}" to your bookmarks`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 w-full pb-16">
        
        {/* Top Back Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Events
          </Link>
        </div>

        {/* 1. LARGE EVENT HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-elevated bg-slate-900 text-white min-h-[420px] sm:min-h-[460px] flex flex-col justify-end p-6 sm:p-10 lg:p-12">
            
            {/* Background Cover Image with cinematic gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src={event.posterURL || event.image}
                alt={event.title}
                className="w-full h-full object-cover opacity-45 filter saturate-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-4xl space-y-4">
              
              {/* Category, Status & Deadline Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="md" className="bg-white/95 text-primary backdrop-blur-md font-bold uppercase tracking-wider shadow-sm">
                  {event.category}
                </Badge>
                
                {event.featured && (
                  <Badge variant="purple" size="md" className="font-bold shadow-sm">
                    Featured Event
                  </Badge>
                )}

                {regState === 'registered' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    You are Registered
                  </span>
                )}

                {regState === 'waitlisted' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    Waitlisted
                  </span>
                )}

                {event.registrationDeadline && (
                  <span className="text-xs text-slate-300 font-medium bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    RSVP Deadline: <strong className="text-white">{event.registrationDeadline}</strong>
                  </span>
                )}
              </div>

              {/* Event Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Key Meta row: Date/Time, Venue, Organizer, Participants, Available Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/15 text-xs text-slate-200">
                
                {/* Date and Time */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Date & Time</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{event.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{event.time}</p>
                </div>

                {/* Venue */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Venue</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 capitalize">{event.venueType} Venue</p>
                </div>

                {/* Organizer */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Organizer</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <img
                      src={organizerAvatar}
                      alt={organizerName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{organizerName}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">{organizerClub}</p>
                </div>

                {/* Participants & Available Seats */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Seat Quota</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{event.registeredCount} Confirmed</span>
                  </div>
                  <p className={`text-[11px] font-bold ${availableSeats <= 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {availableSeats} seats remaining
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* 2. TWO-COLUMN DESKTOP LAYOUT */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Detailed Event Sections (8 Cols) */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* About the Event */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Overview</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight">
                  About the Event
                </h2>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Agenda */}
              {event.agenda && event.agenda.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                        <Clock className="w-4 h-4" />
                        <span>Itinerary</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight">
                        Event Agenda & Schedule
                      </h2>
                    </div>
                    <Badge variant="primary" size="sm">Timeline</Badge>
                  </div>

                  <div className="space-y-3">
                    {event.agenda.map((slot, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/30 transition-colors">
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-xl shrink-0">
                            {slot.time}
                          </span>
                          <span className="text-sm font-bold text-main">
                            {slot.title}
                          </span>
                        </div>
                        {slot.speaker && (
                          <span className="text-xs text-secondary font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-border/70 self-start sm:self-auto shrink-0">
                            Host: {slot.speaker}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speakers and Judges */}
              {event.speakersAndJudges && event.speakersAndJudges.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4" />
                      <span>Panel</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight">
                      Distinguished Speakers & Judges
                    </h2>
                    <p className="text-xs text-secondary mt-1">
                      Learn from industry leaders and faculty mentors evaluating this edition.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.speakersAndJudges.map((speaker, index) => (
                      <Card key={index} className="p-4 flex items-center gap-4">
                        <img
                          src={speaker.avatar}
                          alt={speaker.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          {speaker.badge && (
                            <Badge variant="purple" size="sm" className="text-[10px] py-0 px-2 mb-1">
                              {speaker.badge}
                            </Badge>
                          )}
                          <h4 className="text-sm font-bold text-main truncate">{speaker.name}</h4>
                          <p className="text-xs font-medium text-secondary truncate">{speaker.role}</p>
                          <p className="text-[11px] text-primary truncate font-semibold">{speaker.org}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Prizes and Awards */}
              {event.prizes && event.prizes.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      <span>Bounties</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight">
                      Prizes & Track Awards
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.prizes.map((prize, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-border bg-surface shadow-xs space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                            {prize.place}
                          </span>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-main">{prize.award}</h3>
                        <p className="text-xs text-secondary leading-relaxed">{prize.perks}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & Eligibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
                {/* Rules */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>Guidelines</span>
                  </div>
                  <h3 className="text-lg font-bold text-main">Event Rules</h3>
                  <ul className="space-y-2 text-xs text-secondary">
                    {(event.rules || [
                      'Teams may consist of 1 to 4 collegiate students.',
                      'All code and submissions must be developed during the event.',
                      'Adhere to fair play, safety, and campus code of conduct.',
                    ]).map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                    <UserCheck className="w-4 h-4" />
                    <span>Who Can Attend</span>
                  </div>
                  <h3 className="text-lg font-bold text-main">Eligibility</h3>
                  <ul className="space-y-2 text-xs text-secondary">
                    {(event.eligibility || [
                      'Enrolled collegiate students from all departments.',
                      'Valid student ID required at gate registration.',
                      'No prior experience required — beginners welcome.',
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* FAQs Accordion */}
              {event.faqs && event.faqs.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4" />
                      <span>Answers</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-main tracking-tight">
                      Frequently Asked Questions
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    {event.faqs.map((faq, index) => {
                      const isOpen = expandedFaqIndex === index;
                      return (
                        <div
                          key={index}
                          className="rounded-2xl border border-border bg-surface overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFaqIndex(isOpen ? -1 : index)}
                            className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-main hover:bg-slate-50 transition-colors"
                          >
                            <span>{faq.q}</span>
                            <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5 text-xs text-secondary leading-relaxed border-t border-border/50 pt-3">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Sticky Registration Card (4 Cols) */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <Card className="p-6 shadow-premium border-border/80 space-y-6">
                
                {/* Header Price & Status */}
                <div className="flex items-baseline justify-between border-b border-border/80 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Admission</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-3xl font-black text-main">{event.price || 'Free'}</span>
                      <span className="text-xs text-secondary">/ Verified Student</span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      regState === 'registered'
                        ? 'success'
                        : regState === 'waitlisted'
                        ? 'warning'
                        : isFull
                        ? 'error'
                        : 'primary'
                    }
                    size="sm"
                    className="capitalize font-semibold"
                  >
                    {regState === 'registered'
                      ? 'Pass Active'
                      : regState === 'waitlisted'
                      ? 'On Waitlist'
                      : isFull
                      ? 'Sold Out'
                      : 'RSVP Open'}
                  </Badge>
                </div>

                {/* Key Event Snapshot Details */}
                <div className="space-y-3.5 text-xs">
                  {/* Event Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-main block">{event.date}</span>
                      <span className="text-secondary text-[11px]">{event.time}</span>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-main block">{event.location}</span>
                      <span className="text-secondary text-[11px] capitalize">{event.venueType} Facility</span>
                    </div>
                  </div>

                  {/* Available Seats with Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-border/70">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary font-medium">Available Seats:</span>
                      <span className="font-bold text-main">
                        {availableSeats} / {event.capacity} left
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          occupancyPercent >= 90 ? 'bg-rose-500' : 'bg-primary'
                        }`}
                        style={{ width: `${occupancyPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-right text-secondary">{occupancyPercent}% filled</p>
                  </div>
                </div>

                {/* Dynamic Register Action Based on State */}
                <div className="space-y-2 pt-2">
                  
                  {/* State 0: Event Cancelled */}
                  {regState === 'cancelled' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-800 font-semibold flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>This event has been cancelled by the host club.</span>
                    </div>
                  )}

                  {/* State 1: Already Registered */}
                  {regState === 'registered' && (
                    <div className="space-y-2.5">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Pass confirmed for {activeRegistration?.studentName || user?.name}</span>
                      </div>

                      <Button
                        variant="primary"
                        fullWidth
                        size="md"
                        icon={Ticket}
                        onClick={() => {
                          setRecentRegistration(activeRegistration);
                          setSuccessModalOpen(true);
                        }}
                        className="font-bold shadow-xs"
                      >
                        View My Digital Pass (QR)
                      </Button>

                      <Button
                        variant="ghost"
                        fullWidth
                        size="sm"
                        onClick={handleCancelClick}
                        className="text-error hover:bg-rose-50 text-xs"
                      >
                        Cancel Registration Pass
                      </Button>
                    </div>
                  )}

                  {/* State 2: Waitlisted */}
                  {regState === 'waitlisted' && (
                    <div className="space-y-2.5">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-semibold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>You are on the waitlist queue (#1 in line)</span>
                      </div>
                      <p className="text-[11px] text-secondary text-center">
                        If an attendee cancels, your pass will be reserved automatically.
                      </p>
                    </div>
                  )}

                  {/* State 3: Event Full (Sold out) */}
                  {regState === 'event_full' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>All {event.capacity} seats are currently claimed</span>
                      </div>
                      <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={() => setWaitlistModalOpen(true)}
                        className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 border-none"
                      >
                        Join Waitlist Queue
                      </Button>
                    </div>
                  )}

                  {/* State 4: Registration Closed */}
                  {regState === 'registration_closed' && (
                    <div className="p-3.5 bg-slate-100 rounded-xl text-center text-xs text-secondary font-medium">
                      Registration has officially closed for this session.
                    </div>
                  )}

                  {/* State 5: Not Registered (Open RSVP) */}
                  {regState === 'not_registered' && (
                    !isAuthenticated ? (
                      <div className="space-y-2">
                        <Link to="/login" state={{ from: `/events/${event.id}` }}>
                          <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            icon={Ticket}
                            className="font-bold shadow-sm"
                          >
                            Sign In to Register
                          </Button>
                        </Link>
                        <p className="text-[11px] text-center text-secondary">
                          Authentication required to reserve collegiate seats.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={() => setRegisterModalOpen(true)}
                        icon={Ticket}
                        className="font-bold shadow-sm"
                      >
                        Register Now
                      </Button>
                    )
                  )}

                  {/* Bookmark and Share Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Bookmark}
                      onClick={handleBookmarkToggle}
                      className={`text-xs font-semibold ${bookmarked ? 'text-primary border-primary/40 bg-primary-light/30' : ''}`}
                    >
                      {bookmarked ? 'Saved' : 'Bookmark'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={Share2}
                      onClick={handleShare}
                      className="text-xs font-semibold"
                    >
                      Share
                    </Button>
                  </div>

                </div>

                {/* Organizer Verification Card */}
                <div className="pt-4 border-t border-border flex items-center gap-3">
                  <img
                    src={organizerAvatar}
                    alt={organizerName}
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-main truncate">{organizerName}</p>
                    <p className="text-[11px] text-secondary truncate">{organizerClub}</p>
                  </div>
                </div>

              </Card>
            </div>

          </div>
        </section>

      </main>

      {/* REGISTRATION MODAL */}
      <RegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        event={event}
        onSuccess={handleRegisterSuccess}
      />

      {/* REGISTRATION SUCCESS DIALOG */}
      <RegistrationSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        registration={recentRegistration || activeRegistration}
        event={event}
      />

      {/* CANCEL REGISTRATION CONFIRMATION MODAL */}
      <Modal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Release Your Event Seat?"
        description="Are you sure you want to cancel your confirmed registration?"
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelConfirmOpen(false)}>
              Keep My Seat
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmCancel}>
              Yes, Cancel Registration
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-xs text-secondary">
          <p>
            Releasing your ticket pass for <strong className="text-main">&quot;{event.title}&quot;</strong> will decrement your attendance and notify students on the waitlist queue.
          </p>
          <p className="text-[11px] text-slate-500">
            You can always re-register later if seats remain open.
          </p>
        </div>
      </Modal>

      {/* JOIN WAITLIST MODAL */}
      <Modal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        title="Join Waitlist Queue"
        description="Get automatically notified if another student cancels their reservation."
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWaitlistModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleJoinWaitlist}>
              Join Waitlist
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-border">
            <p className="font-bold text-main">{event.title}</p>
            <p className="text-secondary mt-0.5">{event.date} &bull; Capacity: {event.capacity} seats</p>
          </div>
          <p className="text-secondary">
            Candidate: <strong className="text-main">{user?.name || 'Rahul Sharma'}</strong> ({user?.email || 'rahul.sharma@campus.edu'})
          </p>
        </div>
      </Modal>

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        event={event}
      />

      <Footer />
    </div>
  );
};

export default EventDetailPage;
