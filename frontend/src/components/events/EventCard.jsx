import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Bookmark, ArrowRight, CheckCircle2, User, Share2 } from 'lucide-react';
import Card, { CardContent } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ShareModal from './ShareModal';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const EventCard = ({ event }) => {
  const { isRegistered, isBookmarked, toggleBookmark, registerForEvent } = useEvents();
  const { isAuthenticated, role, switchRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [shareOpen, setShareOpen] = useState(false);

  const registered = isRegistered(event.id);
  const bookmarked = isBookmarked(event.id);

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(event.id);
    toast.info(
      bookmarked ? `Removed "${event.title}" from saved` : `Saved "${event.title}" to bookmarks`
    );
  };

  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      switchRole('student');
    }
    registerForEvent(event.id);
    toast.success(`You are registered for "${event.title}"!`, 'Registration Confirmed');
  };

  const categoryVariantMap = {
    technical: 'primary',
    cultural: 'purple',
    sports: 'warning',
    workshops: 'blue',
    music: 'purple',
    entrepreneurship: 'teal',
    photography: 'blue',
    gaming: 'warning',
  };

  const categoryKey = (event.category || 'technical').toLowerCase();
  const badgeVariant = categoryVariantMap[categoryKey] || 'primary';
  const occupancyPercent = Math.min(100, Math.round(((event.registeredCount || 0) / (event.capacity || 1)) * 100));
  const isAlmostFull = occupancyPercent >= 85;

  const organizerName = typeof event.organizer === 'object' ? (event.organizer?.name || 'Campus Events') : (event.organizer || 'Campus Events');
  const organizerAvatar = typeof event.organizer === 'object' ? event.organizer?.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const organizerClub = typeof event.organizer === 'object' ? event.organizer?.club : null;
  const eventLocation = event.location || event.venue || 'Campus Auditorium';

  return (
    <Card hoverEffect className="flex flex-col h-full overflow-hidden group border-border/80 hover:border-primary/40">
      {/* Event Image Banner with Category & Bookmark */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={event.posterURL || event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <Badge variant={badgeVariant} size="sm" className="bg-white/95 backdrop-blur-xs font-semibold capitalize shadow-xs">
            {event.category}
          </Badge>
          {event.featured && (
            <Badge variant="primary" size="sm" className="bg-primary text-white border-none shadow-xs font-semibold">
              Featured
            </Badge>
          )}
          {isAlmostFull && (
            <Badge variant="error" size="sm" className="bg-rose-500 text-white border-none shadow-xs font-bold animate-pulse">
              Almost Full
            </Badge>
          )}
        </div>

        {/* Top Right Action Buttons (Share & Bookmark) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={handleShareClick}
            className="p-2 rounded-xl backdrop-blur-md bg-white/90 text-main hover:bg-white hover:text-primary transition-all shadow-xs"
            aria-label="Share Event"
            title="Share Event"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleBookmarkClick}
            className={`p-2 rounded-xl backdrop-blur-md transition-all ${
              bookmarked
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/90 text-main hover:bg-white hover:text-primary shadow-xs'
            }`}
            aria-label="Save Event"
            title={bookmarked ? 'Saved' : 'Bookmark Event'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Date on Image Banner */}
        <div className="absolute bottom-3 left-3 text-white flex items-center gap-1.5 text-xs font-semibold drop-shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-indigo-300" />
          <span>{event.date} &bull; {event.time ? event.time.split('-')[0].trim() : ''}</span>
        </div>
      </div>

      {/* Card Content Details */}
      <CardContent className="flex-1 flex flex-col justify-between p-5 space-y-4">
        <div className="space-y-2.5">
          {/* Event Title */}
          <Link to={`/events/${event.id}`}>
            <h3 className="text-base sm:text-lg font-bold text-main line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Description preview */}
          <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Venue Location */}
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate font-medium">{eventLocation}</span>
          </div>

          {/* Organizer Info */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/60">
            <img
              src={organizerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={organizerName}
              className="w-5 h-5 rounded-full object-cover border border-border"
            />
            <span className="text-xs text-secondary truncate">
              By <strong className="text-main font-semibold">{organizerName}</strong>
              {organizerClub ? ` (${organizerClub.split('&')[0].trim()})` : ''}
            </span>
          </div>
        </div>

        {/* Footer Meta & Registration / View Details Action Buttons */}
        <div className="pt-3 border-t border-border/80 space-y-3">
          {/* Registration Count & Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-primary" />
                Registrations:
              </span>
              <span>
                <strong className="text-main font-bold">{event.registeredCount}</strong> / {event.capacity}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${occupancyPercent >= 85 ? 'bg-rose-500' : 'bg-primary'}`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons: View Details & Quick RSVP */}
          <div className="flex items-center gap-2 pt-1">
            <Link to={`/events/${event.id}`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={ArrowRight}
                iconPosition="right"
                className="text-xs font-semibold hover:border-primary hover:text-primary"
              >
                View Details
              </Button>
            </Link>

            {registered ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                RSVP&apos;d
              </span>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleRegisterClick}
                className="text-xs shrink-0"
              >
                RSVP
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        event={event}
      />
    </Card>
  );
};

export default EventCard;
