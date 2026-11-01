import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw, 
  ArrowUpDown,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { getPublishedEvents } from '../../services/eventService.js';
import { EVENT_CATEGORIES } from '../../data/mockCategories';
import EventCard from '../../components/events/EventCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export const EventsPage = () => {
  const { events } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query sync
  const queryCategory = searchParams.get('category') || 'all';
  const querySearch = searchParams.get('search') || '';
  const queryAvailability = searchParams.get('availability') || 'all';

  // React filter states
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'this-week' | 'this-month'
  const [venueFilter, setVenueFilter] = useState('all'); // 'all' | 'on-campus' | 'virtual' | 'hybrid'
  const [availabilityFilter, setAvailabilityFilter] = useState(queryAvailability); // 'all' | 'available' | 'almost-full'
  const [sortBy, setSortBy] = useState('date-asc'); // 'date-asc' | 'popular' | 'capacity-desc' | 'title-asc'
  
  // Pagination / Load More state
  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [firestoreEvents, setFirestoreEvents] = useState(null);
  const [loadingFirestore, setLoadingFirestore] = useState(false);

  // Firestore-based querying for published events
  useEffect(() => {
    let isMounted = true;
    setLoadingFirestore(true);

    getPublishedEvents({
      category: selectedCategory === 'all' ? null : selectedCategory,
      searchTitle: searchTerm,
    })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setFirestoreEvents(data);
        } else if (isMounted) {
          setFirestoreEvents(null);
        }
      })
      .catch((e) => console.warn('Firestore published events query notice:', e))
      .finally(() => {
        if (isMounted) setLoadingFirestore(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchTerm]);

  // Update states if URL search params change
  useEffect(() => {
    if (searchParams.get('category')) {
      setSelectedCategory(searchParams.get('category'));
    }
    if (searchParams.get('search')) {
      setSearchTerm(searchParams.get('search'));
    }
    if (searchParams.get('availability')) {
      setAvailabilityFilter(searchParams.get('availability'));
    }
  }, [searchParams]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedCategory, dateFilter, venueFilter, availabilityFilter, sortBy]);

  // Active dataset: Firestore results when available, falling back to local dataset
  const activeDataset = firestoreEvents && firestoreEvents.length > 0 ? firestoreEvents : events;

  // Main filter & sort calculation
  const filteredEvents = useMemo(() => {
    return activeDataset.filter((evt) => {
      // 1. Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        evt.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        evt.description.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        evt.location.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (evt.tags && evt.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase().trim())));

      // 2. Category filter
      const matchesCategory =
        selectedCategory === 'all' || evt.category.toLowerCase() === selectedCategory.toLowerCase();

      // 3. Venue filter
      const matchesVenue =
        venueFilter === 'all' || evt.venueType === venueFilter;

      // 4. Availability filter
      let matchesAvailability = true;
      const occupancy = (evt.registeredCount || 0) / (evt.capacity || 1);
      if (availabilityFilter === 'almost-full') {
        matchesAvailability = occupancy >= 0.85;
      } else if (availabilityFilter === 'available') {
        matchesAvailability = (evt.registeredCount || 0) < evt.capacity;
      }

      // 5. Date filter
      let matchesDate = true;
      if (dateFilter === 'this-week') {
        // Events before Nov 22
        matchesDate = new Date(evt.date) <= new Date('2026-11-22');
      } else if (dateFilter === 'this-month') {
        // Events in November
        matchesDate = evt.date.startsWith('2026-11');
      }

      return matchesSearch && matchesCategory && matchesVenue && matchesAvailability && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.registeredCount || 0) - (a.registeredCount || 0);
      }
      if (sortBy === 'capacity-desc') {
        return (b.capacity || 0) - (a.capacity || 0);
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      // default: date-asc
      return new Date(a.date) - new Date(b.date);
    });
  }, [events, searchTerm, selectedCategory, dateFilter, venueFilter, availabilityFilter, sortBy]);

  const totalFilteredCount = filteredEvents.length;
  const paginatedEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < totalFilteredCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setDateFilter('all');
    setVenueFilter('all');
    setAvailabilityFilter('all');
    setSortBy('date-asc');
    setSearchParams({});
  };

  const isFiltering =
    searchTerm ||
    selectedCategory !== 'all' ||
    dateFilter !== 'all' ||
    venueFilter !== 'all' ||
    availabilityFilter !== 'all';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">Event Discovery</Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-main tracking-tight">
              Discover Campus Events
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1 max-w-xl">
              Filter by category, upcoming dates, venue format, and availability. RSVP or bookmark instantly.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {loadingFirestore && (
              <span className="text-xs text-primary animate-pulse font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Live Firestore query...
              </span>
            )}
            <div className="text-xs text-secondary font-medium bg-surface px-4 py-2 rounded-xl border border-border shadow-xs">
              Showing <strong className="text-main">{paginatedEvents.length}</strong> of{' '}
              <strong className="text-main">{totalFilteredCount}</strong> matching events
            </div>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-subtle space-y-5">
          
          {/* Row 1: Search Bar & Sort Dropdown */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
            <div className="flex-1">
              <Input
                placeholder="Search by event title, speaker, keywords or tags..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="date-asc">Upcoming Soonest</option>
                  <option value="popular">Most Popular</option>
                  <option value="capacity-desc">Highest Capacity</option>
                  <option value="title-asc">Title (A - Z)</option>
                </select>
              </div>

              {isFiltering && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  icon={RotateCcw}
                  className="text-xs text-secondary hover:text-main"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Row 2: Secondary Dropdown Filters (Date, Venue, Availability) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/70 text-xs">
            
            {/* Date Filter */}
            <div className="space-y-1">
              <label className="font-semibold text-main block">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-primary"
              >
                <option value="all">All Upcoming Dates</option>
                <option value="this-week">Happening This Week</option>
                <option value="this-month">Happening in November</option>
              </select>
            </div>

            {/* Venue Filter */}
            <div className="space-y-1">
              <label className="font-semibold text-main block">Venue Format</label>
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="w-full bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-primary"
              >
                <option value="all">All Venues (Physical & Online)</option>
                <option value="on-campus">On-Campus Physical Venue</option>
                <option value="virtual">Virtual / Online Livestream</option>
                <option value="hybrid">Hybrid (Both)</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-1">
              <label className="font-semibold text-main block">Seat Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-primary"
              >
                <option value="all">All Events</option>
                <option value="available">Open Seats Available</option>
                <option value="almost-full">Almost Full (85%+)</option>
              </select>
            </div>

          </div>

          {/* Row 3: Category Pills Filter */}
          <div className="pt-3 border-t border-border/70 space-y-2">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
              Filter by Category:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5
                    ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 text-secondary hover:text-main hover:bg-slate-200/70'
                    }
                  `}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Event Grid (3-columns on desktop) */}
        {paginatedEvents.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination / Load More Button */}
            {hasMore ? (
              <div className="text-center pt-6 pb-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  className="font-semibold shadow-xs hover:border-primary hover:text-primary min-w-[200px]"
                >
                  Load More Events ({totalFilteredCount - visibleCount} remaining)
                </Button>
              </div>
            ) : totalFilteredCount > PAGE_SIZE ? (
              <div className="text-center pt-4 text-xs text-secondary">
                You&apos;ve reached the end of the events list.
              </div>
            ) : null}
          </div>
        ) : (
          /* Empty Filter State */
          <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-secondary flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 opacity-50" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-main">No events match your current filters</h3>
              <p className="text-xs text-secondary mt-1 max-w-md mx-auto">
                Try widening your search terms, changing the date or category filter, or resetting all filters.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResetFilters}
              icon={RotateCcw}
            >
              Reset All Filters
            </Button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default EventsPage;
