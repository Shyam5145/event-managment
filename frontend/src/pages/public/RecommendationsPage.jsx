import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  AlertTriangle, 
  Clock, 
  Compass, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Users, 
  Bookmark,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';

export const RecommendationsPage = () => {
  const { events, toggleBookmark, isBookmarked } = useEvents();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('recommended');

  const userInterests = user?.interests || ['Technical', 'Workshops', 'Entrepreneurship'];

  // 1. Recommended for You (events matching user interests)
  const recommendedEvents = events.filter((e) => 
    userInterests.includes(e.category) ||
    (e.tags && e.tags.some((t) => userInterests.includes(t)))
  );

  // 2. Trending on Campus (events with highest registration count)
  const trendingEvents = [...events].sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0)).slice(0, 6);

  // 3. Almost Full (>80% capacity)
  const almostFullEvents = events.filter((e) => {
    const ratio = (e.registeredCount || 0) / (e.capacity || 1);
    return ratio >= 0.75;
  });

  // 4. New This Week (recent additions or specific tags)
  const newThisWeekEvents = [...events].reverse().slice(0, 6);

  const sections = [
    { id: 'recommended', label: 'Recommended for You', icon: Sparkles, data: recommendedEvents },
    { id: 'trending', label: 'Trending on Campus', icon: Flame, data: trendingEvents },
    { id: 'almost-full', label: 'Almost Full (>80%)', icon: AlertTriangle, data: almostFullEvents },
    { id: 'new', label: 'New This Week', icon: Clock, data: newThisWeekEvents },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <Badge variant="primary" size="sm" className="mb-1">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> CampusPulse Curated Picks
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main tracking-tight">
            Personalized Event Recommendations
          </h1>
          <p className="text-sm text-secondary max-w-2xl">
            Tailored suggestions based on your academic major ({user?.department || 'Computer Science'}), followed clubs, and high-demand campus opportunities.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-border/80 scrollbar-none">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface text-secondary hover:text-main hover:bg-slate-100 border border-border/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary'}`} />
                <span>{sec.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {sec.data.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        {sections
          .filter((sec) => sec.id === activeTab)
          .map((sec) => {
            const Icon = sec.icon;
            return (
              <div key={sec.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-main">{sec.label}</h2>
                      <p className="text-xs text-secondary">
                        Showing top {sec.data.length} curated opportunities
                      </p>
                    </div>
                  </div>

                  <Link to="/events" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Explore entire catalog <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sec.data.map((evt) => {
                    const capacity = evt.capacity || 200;
                    const registered = evt.registeredCount || 0;
                    const seatsLeft = Math.max(0, capacity - registered);
                    const pct = Math.min(100, Math.round((registered / capacity) * 100));

                    return (
                      <Card
                        key={evt.id}
                        className="overflow-hidden flex flex-col justify-between border-border/80 hover:shadow-elevated transition-all group"
                      >
                        <div>
                          {/* Image Thumbnail */}
                          <div className="relative h-44 overflow-hidden bg-slate-100">
                            <img
                              src={evt.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'}
                              alt={evt.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <Badge variant="primary" size="sm">
                                {evt.category}
                              </Badge>
                              {pct >= 80 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                  {seatsLeft} seats left
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-3">
                            <h3 className="text-base font-bold text-main group-hover:text-primary transition-colors line-clamp-1">
                              <Link to={`/events/${evt.id}`}>{evt.title}</Link>
                            </h3>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {evt.shortDescription || evt.description}
                            </p>

                            <div className="space-y-1.5 text-xs text-secondary pt-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span>{evt.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-secondary" />
                                <span className="truncate">{evt.venue}</span>
                              </div>
                            </div>

                            {/* Capacity progress */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-secondary">Filled {registered} / {capacity}</span>
                                <span className="font-bold text-main">{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 85 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-5 pt-0">
                          <Link to={`/events/${evt.id}`} className="block">
                            <Button variant="primary" size="sm" className="w-full text-xs font-semibold">
                              View Event & Register
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </main>

      <Footer />
    </div>
  );
};

export default RecommendationsPage;

