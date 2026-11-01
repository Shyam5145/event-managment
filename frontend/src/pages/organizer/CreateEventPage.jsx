import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, Users, Tag, Image, Clock, ArrowLeft } from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { EVENT_CATEGORIES } from '../../data/mockCategories';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PosterUpload from '../../components/events/PosterUpload';

export const CreateEventPage = () => {
  const { createEvent } = useEvents();
  const { user } = useAuth();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    date: '2026-11-20',
    registrationDeadline: '2026-11-19',
    time: '02:00 PM - 05:00 PM',
    location: 'Student Innovation Center, Hall A',
    venueType: 'on-campus',
    capacity: 100,
    price: 'Free',
    description: '',
    tagsString: 'Collegiate, Tech, Hands-on',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    featured: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const presetImages = [
    { label: 'Conference / Tech', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80' },
    { label: 'Hackathon / Code', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80' },
    { label: 'Workshop / Design', url: 'https://images.unsplash.com/photo-1581291518655-9523c932694b?w=800&auto=format&fit=crop&q=80' },
    { label: 'Concert / Cultural', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80' },
  ];

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Event title is required';
    if (!formData.description.trim()) errs.description = 'Please provide an event description';
    if (!formData.date) errs.date = 'Event date is required';
    if (!formData.location.trim()) errs.location = 'Venue location is required';
    if (!formData.capacity || formData.capacity < 1) errs.capacity = 'Capacity must be at least 1 attendee';
    if (formData.registrationDeadline && formData.date && formData.registrationDeadline > formData.date) {
      errs.registrationDeadline = 'Registration deadline cannot be after the event date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e, status = 'published') => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted form errors');
      return;
    }

    setLoading(true);

    const tags = formData.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newEvent = {
      title: formData.title.trim(),
      category: formData.category,
      date: formData.date,
      eventDate: formData.date,
      registrationDeadline: formData.registrationDeadline || formData.date,
      time: formData.time,
      location: formData.location.trim(),
      venue: formData.location.trim(),
      venueType: formData.venueType,
      capacity: Number(formData.capacity),
      price: formData.price,
      description: formData.description.trim(),
      image: formData.image,
      posterURL: formData.image,
      featured: formData.featured,
      status: status,
      tags,
      organizer: {
        name: user?.clubName || user?.name || 'Campus Club',
        club: user?.organization || user?.clubName || 'Campus Events Council',
        avatar: user?.photoURL || user?.avatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      },
      agenda: [
        { time: 'Opening', title: 'Registration & Welcome Keynote' },
        { time: 'Main Session', title: formData.title },
        { time: 'Closing', title: 'Q&A, Networking & Wrap-up' },
      ],
    };

    try {
      const created = await createEvent(newEvent, user);

      if (status === 'published') {
        addNotification({
          title: 'New Campus Event Announced',
          message: `"${newEvent.title}" has been published by ${user?.clubName || user?.name || 'Campus Events'}. Check out registration!`,
          type: 'event',
          category: 'Events',
          link: `/events/${created?.id || 'new'}`,
        });
        toast.success(`Event "${newEvent.title}" published successfully to Cloud Firestore!`, 'Event Published');
      } else {
        toast.info(`Event "${newEvent.title}" saved as draft.`, 'Draft Saved');
      }

      navigate('/organizer/events');
    } catch (err) {
      toast.error(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-main mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
            Publish New Campus Event
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Create an event listing with seat limits, schedule, and automatic ticket passes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="border-b border-border/80 pb-4">
            <h3 className="text-base font-bold text-main">General Event Information</h3>
            <p className="text-xs text-secondary mt-0.5">Essential details for student discovery</p>
          </div>

          {/* Title */}
          <Input
            label="Event Title"
            required
            placeholder="e.g. Campus AI Hackathon 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />

          {/* Category & Venue Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-main">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {EVENT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-main">Venue Format</label>
              <select
                value={formData.venueType}
                onChange={(e) => setFormData({ ...formData, venueType: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="on-campus">On-Campus Physical Venue</option>
                <option value="virtual">Virtual / Online Livestream</option>
                <option value="hybrid">Hybrid (Both)</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              error={errors.date}
            />

            <Input
              label="Time Interval"
              placeholder="e.g. 10:00 AM - 04:00 PM"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          {/* Location */}
          <Input
            label="Location / Room"
            icon={MapPin}
            required
            placeholder="e.g. Engineering Hall, Lab 402"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={errors.location}
          />

          {/* Capacity & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Max Capacity (Seats)"
              type="number"
              icon={Users}
              required
              min={1}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              error={errors.capacity}
            />

            <Input
              label="Admission / Fee"
              placeholder="Free or Paid"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-main">Description *</label>
            <textarea
              rows={4}
              placeholder="Provide event overview, topics covered, what attendees should bring, prizes, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-main outline-none transition ${
                errors.description ? 'border-error focus:ring-error/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {errors.description && <p className="text-xs text-error font-medium">{errors.description}</p>}
          </div>

          {/* Tags */}
          <Input
            label="Tags (Comma separated)"
            icon={Tag}
            placeholder="Hackathon, AI, Networking, Free Pizza"
            value={formData.tagsString}
            onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
            helperText="Tags help students discover this event through search."
          />

          {/* Firebase Storage Event Poster Upload */}
          <div className="space-y-3 pt-1">
            <PosterUpload
              currentPosterUrl={formData.image}
              eventId={formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'new-event'}
              onUploadSuccess={(url) => {
                setFormData((prev) => ({ ...prev, image: url, posterURL: url }));
                toast.success('Event poster uploaded successfully to Firebase Storage!');
              }}
              onRemove={() => {
                setFormData((prev) => ({ ...prev, image: '', posterURL: '' }));
              }}
              disabled={loading}
            />

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
              <span className="text-[11px] font-semibold text-secondary">Or choose a preset banner:</span>
              {presetImages.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setFormData({ ...formData, image: preset.url, posterURL: preset.url })}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 text-main transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <label htmlFor="featured" className="text-xs font-semibold text-main cursor-pointer">
              Mark as Featured Event (Highlighted on Home Page)
            </label>
          </div>
        </Card>

        {/* Form Submission Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="outline"
            size="md"
            type="button"
            onClick={() => navigate('/organizer/events')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="md"
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            loading={loading}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            loading={loading}
            icon={Sparkles}
          >
            Publish Event Listing
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;

