import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  ArrowRight, 
  Flame, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Code2, 
  Palette, 
  Trophy, 
  GraduationCap, 
  Music, 
  Rocket, 
  Camera, 
  Gamepad2,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EVENT_CATEGORIES } from '../../data/mockCategories';
import EventCard from '../../components/events/EventCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Card, { CardContent } from '../../components/common/Card';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export const HomePage = () => {
  const { events } = useEvents();
  const { switchRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [heroSearch, setHeroSearch] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-11-14');

  // Specific 3 Featured Events required
  const featuredEventIds = ['evt-hackathon-2026', 'evt-cultural-night', 'evt-football-cup'];
  const featuredEvents = featuredEventIds
    .map((id) => events.find((e) => e.id === id))
    .filter(Boolean);

  // Fallback to top featured if any missing
  const finalFeaturedEvents = featuredEvents.length === 3
    ? featuredEvents
    : events.filter((e) => e.featured).slice(0, 3);

  // Upcoming events (3-column grid)
  const upcomingEvents = events.slice(0, 6);

  // Trending events (high registration / velocity)
  const trendingEvents = events.filter((e) => e.trending || (e.registeredCount && e.registeredCount > 150)).slice(0, 4);

  // Almost full events (occupancy >= 85%)
  const almostFullEvents = events.filter((e) => {
    const occ = (e.registeredCount || 0) / (e.capacity || 1);
    return occ >= 0.85;
  }).slice(0, 3);

  // Categories icons map
  const categoryIconMap = {
    technical: Code2,
    cultural: Palette,
    sports: Trophy,
    workshops: GraduationCap,
    music: Music,
    entrepreneurship: Rocket,
    photography: Camera,
    gaming: Gamepad2,
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/events?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/events');
    }
  };

  // Calendar dates list for preview
  const calendarDates = [
    { date: '2026-11-14', label: 'Sat, Nov 14', eventCount: 1, title: 'Campus Hackathon 2026' },
    { date: '2026-11-16', label: 'Mon, Nov 16', eventCount: 1, title: 'Cultural Night' },
    { date: '2026-11-19', label: 'Thu, Nov 19', eventCount: 1, title: 'Inter-College Football Cup' },
    { date: '2026-11-20', label: 'Fri, Nov 20', eventCount: 1, title: 'Generative AI Systems' },
    { date: '2026-11-21', label: 'Sat, Nov 21', eventCount: 1, title: 'Sunset Acoustic Night' },
    { date: '2026-11-28', label: 'Sat, Nov 28', eventCount: 1, title: 'Collegiate Esports Showdown' },
  ];

  const selectedDateEvents = events.filter((e) => e.date === selectedCalendarDate);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/70 via-background to-background border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines, Search & Action Buttons */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary-light text-primary text-xs font-semibold shadow-xs">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>The Premier Campus Events Platform</span>
              </div>

              {/* Exact required headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-main tracking-tight leading-[1.1]">
                Your Campus.{' '}
                <span className="text-primary block sm:inline">Your Events.</span>{' '}
                Your Moments.
              </h1>

              {/* Exact required description */}
              <p className="text-base sm:text-lg text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover exciting events, meet new people, and make every moment of your college life count.
              </p>

              {/* Large Search Bar */}
              <form onSubmit={handleHeroSearch} className="max-w-xl mx-auto lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-2.5 p-2 bg-surface rounded-2xl border border-border shadow-premium">
                  <div className="flex-1 flex items-center px-3">
                    <Search className="w-5 h-5 text-secondary mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search hackathons, sports, concerts, clubs..."
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      className="w-full text-sm text-main placeholder-secondary/60 bg-transparent outline-none py-2"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="md" className="font-semibold shadow-xs">
                    Search Events
                  </Button>
                </div>
              </form>

              {/* Action Buttons: Explore Events & Host an Event */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/events">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="font-semibold shadow-sm">
                    Explore Events
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="lg"
                  icon={PlusCircle}
                  onClick={() => {
                    switchRole('organizer');
                    navigate('/organizer/events/create');
                  }}
                  className="font-semibold hover:border-primary hover:text-primary"
                >
                  Host an Event
                </Button>
              </div>

              {/* Highlights tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs text-secondary">
                <span className="font-medium text-main">Popular tags:</span>
                <Link to="/events?category=technical" className="hover:text-primary transition-colors">#Hackathons</Link>
                <span>&bull;</span>
                <Link to="/events?category=cultural" className="hover:text-primary transition-colors">#CulturalNight</Link>
                <span>&bull;</span>
                <Link to="/events?category=sports" className="hover:text-primary transition-colors">#FootballCup</Link>
                <span>&bull;</span>
                <Link to="/events?category=gaming" className="hover:text-primary transition-colors">#Esports</Link>
              </div>
            </div>

            {/* Right Column: Attractive College Event Imagery & Floating Statistics */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Hero Image */}
                <div className="rounded-3xl overflow-hidden border border-border shadow-elevated bg-slate-100 aspect-[4/5] relative">
                  <img
                    src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1000&auto=format&fit=crop&q=80"
                    alt="College students celebrating campus event"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/10" />

                  {/* Overlaid Bottom Title */}
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                      Campus Life 2026
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">University Experience Redefined</h3>
                    <p className="text-xs text-slate-200">Connect with 60+ clubs, attend workshops, and cheer at varsity matches.</p>
                  </div>
                </div>

                {/* Floating Statistic Badge 1: 120+ Events */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-surface p-3.5 sm:p-4 rounded-2xl border border-border shadow-elevated flex items-center gap-3 animate-bounce [animation-duration:6s]">
                  <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-main leading-tight">120+</p>
                    <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">Campus Events</p>
                  </div>
                </div>

                {/* Floating Statistic Badge 2: 2,400+ Students */}
                <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-surface p-3.5 sm:p-4 rounded-2xl border border-border shadow-elevated flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-main leading-tight">2,400+</p>
                    <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">Active Students</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FEATURED EVENTS SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">Must Attend</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">Featured Events</h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Top curated campus experiences you shouldn’t miss this term.
            </p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              View All Events
            </Button>
          </Link>
        </div>

        {/* 3 Featured Cards: Campus Hackathon 2026, Cultural Night, Inter-College Football Cup */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalFeaturedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* 4. CATEGORIES SECTION */}
      <section id="categories" className="py-16 bg-slate-50/70 border-y border-border/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="purple" size="sm" className="mb-2">Find Your Vibe</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Browse through technical hackathons, cultural festivals, sports tournaments, and creative arts.
            </p>
          </div>

          {/* 8 Categories: Technical, Cultural, Sports, Workshops, Music, Entrepreneurship, Photography, Gaming */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((category) => {
              const Icon = categoryIconMap[category.id] || Sparkles;
              return (
                <div
                  key={category.id}
                  onClick={() => navigate(`/events?category=${category.id}`)}
                  className="bg-surface p-5 rounded-2xl border border-border/80 shadow-subtle hover:shadow-premium hover:-translate-y-1 hover:border-primary/50 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-main group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-[11px] text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {category.desc}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-xs text-secondary font-medium">
                    <span>{category.count} Events</span>
                    <ChevronRight className="w-4 h-4 text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. UPCOMING EVENTS (3-column responsive grid) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">Next on Campus</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
              Upcoming Events
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Mark your schedule for this week and month across departments.
            </p>
          </div>
          <Link to="/events">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Browse All ({events.length})
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* 6. ADDITIONAL SECTIONS */}

      {/* 6A. TRENDING EVENTS & ALMOST FULL EVENTS (Dual showcase) */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold mb-2 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>High Student Demand</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Trending & Almost Full Events
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Seats fill quickly — reserve your pass before registration closes.
              </p>
            </div>
            <Link to="/events?availability=almost-full">
              <Button variant="secondary" size="sm" className="text-main font-semibold">
                View High Occupancy Events
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {almostFullEvents.map((evt) => {
              const remainingSeats = Math.max(0, evt.capacity - evt.registeredCount);
              const occupancy = Math.round((evt.registeredCount / evt.capacity) * 100);

              return (
                <div
                  key={evt.id}
                  className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 flex flex-col justify-between space-y-4 hover:border-amber-400/50 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="relative h-40 rounded-xl overflow-hidden">
                      <img src={evt.image} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                          Only {remainingSeats} seats left!
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-xs px-2 py-0.5 rounded-lg">
                        {evt.date}
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2">{evt.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-700">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Capacity:</span>
                        <span className="font-bold text-amber-400">{evt.registeredCount} / {evt.capacity} ({occupancy}%)</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 to-rose-500 h-1.5 rounded-full" style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>

                    <Link to={`/events/${evt.id}`} className="block">
                      <Button variant="primary" fullWidth size="sm" className="font-bold text-xs bg-amber-500 hover:bg-amber-600 border-none text-slate-950">
                        Secure Last Pass
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 6B. CAMPUS CALENDAR PREVIEW */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="primary" size="sm" className="mb-2">Sync Your Schedule</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
            Campus Calendar Preview
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Click on key event dates to preview sessions occurring on campus.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Dates Selector Carousel */}
          <div className="lg:col-span-5 space-y-2">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
              Upcoming Schedule Dates
            </h3>
            {calendarDates.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedCalendarDate(item.date)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedCalendarDate === item.date
                    ? 'border-primary bg-primary-light/50 shadow-xs'
                    : 'border-border bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    selectedCalendarDate === item.date
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-main'
                  }`}>
                    {item.date.split('-')[2]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-main">{item.title}</h4>
                    <p className="text-[11px] text-secondary">{item.label}</p>
                  </div>
                </div>
                <Badge variant={selectedCalendarDate === item.date ? 'primary' : 'secondary'} size="sm">
                  {selectedCalendarDate === item.date ? 'Selected' : 'Active'}
                </Badge>
              </button>
            ))}
          </div>

          {/* Event Preview for that date */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-sm font-bold text-main">
                Events for {selectedCalendarDate}
              </span>
              <span className="text-xs text-secondary font-medium">
                {selectedDateEvents.length} Event Scheduled
              </span>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((evt) => (
                  <Card key={evt.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={evt.image} alt={evt.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border" />
                      <div>
                        <Badge variant="primary" size="sm" className="capitalize mb-1">{evt.category}</Badge>
                        <h4 className="text-base font-bold text-main">{evt.title}</h4>
                        <p className="text-xs text-secondary flex items-center gap-2 mt-1">
                          <span><Clock className="w-3.5 h-3.5 inline mr-1 text-primary" />{evt.time}</span>
                          <span>&bull;</span>
                          <span><MapPin className="w-3.5 h-3.5 inline mr-1 text-primary" />{evt.location}</span>
                        </p>
                      </div>
                    </div>

                    <Link to={`/events/${evt.id}`}>
                      <Button variant="primary" size="sm">
                        View Event
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-border p-6">
                <CalendarIcon className="w-8 h-8 text-secondary mx-auto mb-2 opacity-50" />
                <p className="text-xs text-secondary">Select any of the dates on the left to inspect agenda & details.</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6C. ABOUT SECTION (Why CampusPulse) */}
      <section id="about" className="py-16 bg-slate-50/70 border-y border-border/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="primary" size="sm" className="mb-2">About CampusPulse</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
              Built for Modern Campus Communities
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-2">
              CampusPulse bridges the gap between student club organizers and attendees with seamless discovery, verified ticket passes, and instant attendance analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-main">Centralized Discovery</h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                No more lost flyers or scattered chats. Every hackathon, fest, and seminar is listed in one unified calendar.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-main">Digital Ticket Passes</h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                Unique ticket numbers and scannable passes ensure seamless check-in at auditorium doors without paper waste.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-main">Live Seat Quotas</h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                Automatic capacity counters prevent overcrowded halls and keep waitlists updated dynamically.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-main">Organizer Studio</h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                Empower club leaders to publish listings, manage rosters, and monitor live check-ins with rich visual charts.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 6D. ORGANIZER CALL TO ACTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-r from-primary to-indigo-800 rounded-3xl p-8 sm:p-12 text-white shadow-premium relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="relative z-10 max-w-xl space-y-3 text-center md:text-left">
            <Badge variant="primary" size="sm" className="bg-white/20 text-white border-none backdrop-blur-xs font-semibold">
              Host on CampusPulse
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Leading a Club or Planning a Campus Event?
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Reach 2,400+ verified campus students, automate seat capacity, and manage gate check-ins effortlessly. It only takes 2 minutes to publish your event.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              icon={PlusCircle}
              onClick={() => {
                switchRole('organizer');
                navigate('/organizer/events/create');
              }}
              className="text-primary font-bold shadow-md"
            >
              Host an Event Now
            </Button>
            <Link to="/events">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 font-semibold"
              >
                Browse Catalog
              </Button>
            </Link>
          </div>

          {/* Decorative blur rings */}
          <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* 6E. FOOTER */}
      <Footer />
    </div>
  );
};

export default HomePage;
