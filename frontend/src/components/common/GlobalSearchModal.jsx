import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  History, 
  Tag, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { CATEGORIES } from '../../data/mockCategories';
import Badge from './Badge';

const RECENT_SEARCHES_KEY = 'campuspulse_recent_searches';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['Hackathon', 'Football Cup', 'Design Sprint', 'Robotics'];
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Save recent searches to localStorage
  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter events
  const matchingEvents = query.trim()
    ? events.filter((e) => {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q))) ||
          (e.shortDescription && e.shortDescription.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSelectEvent = (event) => {
    saveRecentSearch(event.title);
    onClose();
    navigate(`/events/${event.id}`);
  };

  const handleCategoryClick = (categoryName) => {
    saveRecentSearch(categoryName);
    onClose();
    navigate(`/events?category=${encodeURIComponent(categoryName)}`);
  };

  const handleRecentClick = (term) => {
    setQuery(term);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-slate-50/70">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus events, hackathons, clubs, topics..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-main placeholder-secondary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && matchingEvents.length > 0) {
                handleSelectEvent(matchingEvents[0]);
              }
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-secondary hover:text-main rounded-md hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-secondary bg-white border border-slate-200 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-4 space-y-5">
          {/* Active Query: Matching Results */}
          {query.trim() ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Matching Events ({matchingEvents.length})
                </span>
                <span className="text-[11px] text-secondary">
                  Press enter for top result
                </span>
              </div>

              {matchingEvents.length > 0 ? (
                <div className="space-y-2">
                  {matchingEvents.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => handleSelectEvent(evt)}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-primary/40 hover:bg-primary-light/30 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={evt.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=150&q=80'}
                          alt={evt.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {evt.category}
                            </span>
                            {evt.status === 'Trending' && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Trending
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-main group-hover:text-primary transition-colors truncate">
                            {evt.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-secondary mt-0.5 truncate">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-primary" />
                              {evt.date}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-secondary" />
                              {evt.venue}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-secondary">
                    <Search className="w-5 h-5 opacity-60" />
                  </div>
                  <h4 className="text-sm font-semibold text-main mb-1">
                    No events found for "{query}"
                  </h4>
                  <p className="text-xs text-secondary max-w-sm mx-auto mb-4">
                    Try searching by category name, club organizer (e.g. ACM, Coding Club), or keyword like Hackathon.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/events');
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Browse all events catalog →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Idle View: Recent Searches & Categories */
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-primary" />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[11px] text-secondary hover:text-danger font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentClick(term)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-primary-light hover:text-primary text-slate-700 font-medium transition-colors flex items-center gap-1.5"
                      >
                        <History className="w-3 h-3 text-secondary" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Categories */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Explore By Category
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.name)}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-primary-light/40 hover:border-primary/30 text-left transition-all group"
                    >
                      <div className="text-sm font-bold text-main group-hover:text-primary transition-colors truncate">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-secondary truncate mt-0.5">
                        {cat.count || '12+'} events
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary-light to-indigo-50 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-main">Looking for curated picks?</h5>
                    <p className="text-[11px] text-secondary">Discover trending and almost full campus events</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/recommendations');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg shadow-xs transition-all"
                >
                  Explore Picks
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-secondary">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="px-1.5 py-0.5 bg-white border rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">↓</kbd></span>
            <span>Select: <kbd className="px-1.5 py-0.5 bg-white border rounded">↵</kbd></span>
          </div>
          <span>CampusPulse Global Index</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;

