import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkX, Ticket, Calendar, Clock, MapPin, ArrowRight, Compass } from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const BookmarksPage = () => {
  const { events, bookmarks, toggleBookmark, registerForEvent, isRegistered } = useEvents();
  const { addNotification } = useNotifications();
  const toast = useToast();

  const savedEvents = events.filter((e) => bookmarks.includes(e.id));

  const handleRemove = (eventId, title) => {
    toggleBookmark(eventId);
    toast.info(`Removed "${title}" from bookmarks`);
  };

  const handleRegister = (eventId, title) => {
    const reg = registerForEvent(eventId);
    addNotification({
      title: 'Registration Confirmed',
      message: `Pass confirmed for bookmarked event "${title}". Ticket #${reg.ticketNumber}`,
      type: 'pass',
      category: 'Passes',
      link: '/student/registrations',
    });
    toast.success(`You are registered for "${title}"!`, 'Pass Confirmed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="primary" size="sm" className="mb-2">Saved Collection</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
            Bookmarked Events ({savedEvents.length})
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Events you have bookmarked to review or reserve passes for.
          </p>
        </div>

        <Link to="/events">
          <Button variant="outline" size="sm" icon={Compass}>
            Discover More
          </Button>
        </Link>
      </div>

      {savedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedEvents.map((event) => {
            const registered = isRegistered(event.id);

            return (
              <Card key={event.id} hoverEffect className="flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="primary" size="sm" className="capitalize font-semibold bg-white/95">
                        {event.category}
                      </Badge>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(event.id, event.title)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 text-error hover:bg-white shadow-xs transition-colors"
                      title="Remove bookmark"
                    >
                      <BookmarkX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <Link to={`/events/${event.id}`}>
                      <h3 className="font-bold text-base text-main hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                    </Link>

                    <div className="space-y-1 text-xs text-secondary">
                      <p className="flex items-center gap-1.5 text-main font-medium">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {event.date} &bull; {event.time}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-border/70 flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={BookmarkX}
                    onClick={() => handleRemove(event.id, event.title)}
                    className="text-xs text-secondary hover:text-error"
                  >
                    Remove
                  </Button>

                  {registered ? (
                    <Link to="/student/registrations" className="flex-1">
                      <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold">
                        View Pass
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={Ticket}
                      onClick={() => handleRegister(event.id, event.title)}
                      className="text-xs font-bold"
                    >
                      Register Now
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <Bookmark className="w-12 h-12 text-secondary mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-main">No Saved Events</h3>
          <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
            Click the bookmark icon on any campus event card to keep track of it here.
          </p>
          <Link to="/events" className="inline-block mt-4">
            <Button variant="primary" size="sm" icon={Compass}>
              Browse Campus Events
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default BookmarksPage;
