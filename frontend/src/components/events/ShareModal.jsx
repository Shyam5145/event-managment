import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  ExternalLink,
  MessageCircle,
  Linkedin,
  Twitter,
  Calendar,
  MapPin
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const ShareModal = ({ isOpen, onClose, event }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const currentUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/events/${event.id}` 
    : `https://campuspulse.edu/events/${event.id}`;

  const shareText = `Check out "${event.title}" on CampusPulse! Date: ${event.date} at ${event.venue}.`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Invitation to ${event.title} on CampusPulse`);
    const body = encodeURIComponent(
      `Hey,\n\nI thought you'd be interested in attending "${event.title}".\n\nDate: ${event.date} (${event.time})\nVenue: ${event.venue}\nOrganizer: ${event.organizer}\n\nRegister or view event details here:\n${currentUrl}\n\nSee you on CampusPulse!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Event"
      size="md"
    >
      <div className="space-y-5">
        {/* Event Preview Card */}
        <div className="flex gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl items-center">
          <img
            src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80'}
            alt={event.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-main truncate">{event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-secondary mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {event.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                {event.venue}
              </span>
            </div>
            <p className="text-[11px] text-primary font-medium mt-1">
              By {event.organizer}
            </p>
          </div>
        </div>

        {/* Copy Link Field */}
        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
            Event URL
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100/70 border border-slate-200 rounded-lg text-slate-700 font-mono select-all focus:outline-none"
              />
            </div>
            <Button
              variant={copied ? 'primary' : 'outline'}
              size="sm"
              onClick={handleCopyLink}
              icon={copied ? Check : Copy}
              className="px-4 py-2.5 font-medium shrink-0"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* Share Channel Buttons */}
        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2.5">
            Share via Social & Messaging
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={handleWhatsApp}
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-800 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>

            <button
              onClick={handleLinkedIn}
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-200/80 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <Linkedin className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">LinkedIn</span>
            </button>

            <button
              onClick={handleTwitter}
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-sky-200/80 bg-sky-50/60 hover:bg-sky-100/80 text-sky-800 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <Twitter className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">X / Twitter</span>
            </button>

            <button
              onClick={handleEmail}
              type="button"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-purple-200/80 bg-purple-50/60 hover:bg-purple-100/80 text-purple-800 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Email</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-secondary">
          <span>CampusPulse • Instant Social Sharing</span>
          <button
            onClick={onClose}
            className="text-primary hover:underline font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;

