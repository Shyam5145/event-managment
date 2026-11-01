import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Ticket,
  Compass,
  Sparkles,
  CalendarDays,
  ListFilter,
  Check,
  Eye,
  Tag
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

// Category color mappings
const CATEGORY_COLORS = {
  Technical: {
    bg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-600',
    accent: 'border-l-indigo-600',
  },
  Cultural: {
    bg: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-600',
    accent: 'border-l-purple-600',
  },
  Sports: {
    bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
    accent: 'border-l-emerald-600',
  },
  Workshops: {
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    accent: 'border-l-amber-600',
  },
  Music: {
    bg: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-600',
    accent: 'border-l-rose-600',
  },
  Entrepreneurship: {
    bg: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
    accent: 'border-l-blue-600',
  },
  Photography: {
    bg: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-600',
    accent: 'border-l-cyan-600',
  },
  Gaming: {
    bg: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: 'bg-violet-600',
    accent: 'border-l-violet-600',
  },
};

export const StudentSchedulePage = () => {
  const { events, registrations } = useEvents();
  const navigate = useNavigate();

  // Current calendar view: default November 2026 to match mock dataset
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 10 = November (0-indexed)
  const [selectedDay, setSelectedDay] = useState(14); // default Nov 14 (Campus Hackathon day)
  const [activeView, setActiveView] = useState('month'); // 'month' | 'week' | 'agenda'
  const [filterRegisteredOnly, setFilterRegisteredOnly] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map registrations
  const isUserRegistered = (eventId) => {
    return registrations.some((r) => r.eventId === eventId && r.status !== 'cancelled');
  };

  // Filtered events
  const displayedEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterRegisteredOnly) {
        return isUserRegistered(e.id);
      }
      return true;
    });
  }, [events, registrations, filterRegisteredOnly]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(10);
    setSelectedDay(14);
  };

  // Helper to extract day number from event date string
  const getEventDayNumber = (eventDateStr) => {
    try {
      const d = new Date(eventDateStr);
      if (!isNaN(d.getTime())) {
        return d.getDate();
      }
    } catch (e) {
      // fallback
    }
    return 14;
  };

  // Get events on a specific day of the current month
  const getEventsForDay = (day) => {
    return displayedEvents.filter((e) => {
      const eDate = new Date(e.date);
      return (
        eDate.getFullYear() === currentYear &&
        eDate.getMonth() === currentMonth &&
        eDate.getDate() === day
      );
    });
  };

  // Events on currently selected day
  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDay);
  }, [selectedDay, currentMonth, currentYear, displayedEvents]);

  // Format full date label
  const formattedSelectedDate = `${monthNames[currentMonth]} ${selectedDay}, ${currentYear}`;

  // Week View calculation (7 days around the selected day)
  const weekDays = useMemo(() => {
    const startDay = Math.max(1, selectedDay - 3);
    const endDay = Math.min(daysInMonth, startDay + 6);
    const days = [];
    for (let d = startDay; d <= endDay; d++) {
      days.push(d);
    }
    return days;
  }, [selectedDay, daysInMonth]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <Badge variant="primary" size="sm" className="mb-1.5">Campus Schedule</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
            Academic & Event Calendar
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Track registration deadlines, hackathon checkpoints, and workshop sessions across campus.
          </p>
        </div>

        {/* View Switcher & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Registered Only Toggle */}
          <button
            onClick={() => setFilterRegisteredOnly(!filterRegisteredOnly)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              filterRegisteredOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-secondary border-border hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {filterRegisteredOnly ? 'Registered Only' : 'All Events'}
          </button>

          {/* View Buttons: Month / Week / Agenda */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-0.5">
            <button
              onClick={() => setActiveView('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'month'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-secondary hover:text-main'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setActiveView('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'week'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-secondary hover:text-main'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setActiveView('agenda')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === 'agenda'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-secondary hover:text-main'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: MONTH VIEW */}
      {activeView === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2 Cols: Main Calendar Grid */}
          <Card className="lg:col-span-2 p-5 sm:p-6 border-border/80">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-main">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-[11px] font-bold text-primary bg-primary-light/60 px-2.5 py-1 rounded-md border border-primary/20 hover:bg-primary-light"
                >
                  Nov 2026 (Live)
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 text-secondary hover:text-main transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 text-secondary hover:text-main transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-secondary uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Date Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty padding blocks before the 1st day */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-xl" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDay === day;
                const dayEvents = getEventsForDay(day);
                const hasRegistered = dayEvents.some((e) => isUserRegistered(e.id));

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`h-16 sm:h-20 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all relative group ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary-light/20'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold leading-none ${
                        isSelected ? 'text-primary' : 'text-main'
                      }`}>
                        {day}
                      </span>
                      {hasRegistered && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" title="You are registered for an event today" />
                      )}
                    </div>

                    {/* Event pills on the day */}
                    <div className="w-full space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const colorStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Technical;
                        return (
                          <div
                            key={evt.id}
                            className={`text-[9px] px-1 py-0.5 rounded truncate font-medium border ${colorStyle.bg}`}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-secondary font-bold pl-0.5">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Category Color Legend */}
            <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-secondary">
              <span className="font-semibold text-main">Categories:</span>
              {Object.keys(CATEGORY_COLORS).slice(0, 5).map((cat) => (
                <span key={cat} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat].dot}`} />
                  {cat}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="font-semibold text-emerald-700">Registered</span>
              </span>
            </div>
          </Card>

          {/* 1 Col: Selected Date Events Inspector */}
          <Card className="p-5 sm:p-6 border-border/80 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-main">{formattedSelectedDate}</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event scheduled' : 'events scheduled'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
                  {selectedDay}
                </div>
              </div>

              {selectedDayEvents.length > 0 ? (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((evt) => {
                    const registered = isUserRegistered(evt.id);
                    const colorStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Technical;

                    return (
                      <div
                        key={evt.id}
                        className={`p-3.5 rounded-xl border bg-surface hover:shadow-subtle transition-all border-l-4 ${colorStyle.accent}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="primary" size="sm" className="text-[10px]">
                            {evt.category}
                          </Badge>
                          {registered && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Registered
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-main mt-2 hover:text-primary transition-colors">
                          <Link to={`/events/${evt.id}`}>{evt.title}</Link>
                        </h4>

                        <div className="mt-2 space-y-1 text-xs text-secondary">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{evt.time || '10:00 AM - 04:00 PM'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-secondary" />
                            <span className="truncate">{evt.venue}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-secondary">
                            By {evt.organizer}
                          </span>
                          <Link
                            to={`/events/${evt.id}`}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-secondary">
                    <CalendarIcon className="w-5 h-5 opacity-50" />
                  </div>
                  <h4 className="text-sm font-semibold text-main">No events on this day</h4>
                  <p className="text-xs text-secondary max-w-xs mx-auto mt-1">
                    Select another day with event markers or explore upcoming campus programs.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <Link to="/events" className="w-full block">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Browse All Campus Events
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: WEEK VIEW */}
      {activeView === 'week' && (
        <Card className="p-5 sm:p-6 border-border/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-main">
                Week of {monthNames[currentMonth]} {weekDays[0]} - {monthNames[currentMonth]} {weekDays[weekDays.length - 1]}, {currentYear}
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Detailed 7-day campus activity timetable.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDay((d) => Math.max(1, d - 7))}
                className="p-1.5 rounded-lg border border-border hover:bg-slate-100 text-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDay((d) => Math.min(daysInMonth, d + 7))}
                className="p-1.5 rounded-lg border border-border hover:bg-slate-100 text-secondary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDay === day;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-3 rounded-xl border flex flex-col min-h-[220px] transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary-light/10 ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold text-main">Nov {day}</span>
                    <span className="text-[10px] text-secondary font-medium">
                      {dayEvents.length} events
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayEvents.map((evt) => {
                      const registered = isUserRegistered(evt.id);
                      const colorStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Technical;

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${evt.id}`);
                          }}
                          className={`p-2 rounded-lg text-left border ${colorStyle.bg} hover:shadow-xs transition-shadow`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase">{evt.category}</span>
                            {registered && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                          </div>
                          <h5 className="text-[11px] font-bold truncate mt-0.5">{evt.title}</h5>
                          <span className="text-[9px] block text-slate-500 mt-1">{evt.time || '10:00 AM'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* VIEW: AGENDA VIEW */}
      {activeView === 'agenda' && (
        <Card className="p-5 sm:p-6 border-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-lg font-bold text-main">Chronological Campus Agenda</h2>
              <p className="text-xs text-secondary">
                Upcoming timeline of all registered and campus-wide events in sequential order.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary-light/60 px-3 py-1 rounded-full border border-primary/20">
              {displayedEvents.length} Events Total
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {displayedEvents.map((evt) => {
              const registered = isUserRegistered(evt.id);
              const colorStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Technical;

              return (
                <div
                  key={evt.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-primary">Nov</span>
                      <span className="text-lg font-extrabold text-main leading-none">
                        {getEventDayNumber(evt.date)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorStyle.bg}`}>
                          {evt.category}
                        </span>
                        {registered && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Registered
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-main">
                        <Link to={`/events/${evt.id}`} className="hover:text-primary transition-colors">
                          {evt.title}
                        </Link>
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {evt.time || '10:00 AM - 04:00 PM'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-secondary" />
                          {evt.venue}
                        </span>
                        <span>•</span>
                        <span>By {evt.organizer}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/events/${evt.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        View Event Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentSchedulePage;
