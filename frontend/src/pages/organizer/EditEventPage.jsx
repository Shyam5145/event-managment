import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit3, 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Image as ImageIcon, 
  Clock, 
  ArrowLeft,
  Sparkles,
  Save,
  Trash2,
  ExternalLink
} from 'lucide-react';
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

export const EditEventPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { events, updateEvent, deleteEvent, publishEvent, cancelEvent } = useEvents();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const eventToEdit = events.find((e) => e.id === id) || events[0];

  const [formData, setFormData] = useState({
    title: '',
    category: 'technical',
    date: '',
    time: '',
    location: '',
    venueType: 'on-campus',
    capacity: 100,
    price: 'Free',
    description: '',
    tagsString: '',
    image: '',
    status: 'published',
    featured: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title || '',
        category: (eventToEdit.category || 'technical').toLowerCase(),
        date: eventToEdit.date || '',
        time: eventToEdit.time || '',
        location: eventToEdit.location || eventToEdit.venue || '',
        venueType: eventToEdit.venueType || 'on-campus',
        capacity: eventToEdit.capacity || 100,
        price: eventToEdit.price || 'Free',
        description: eventToEdit.description || '',
        tagsString: Array.isArray(eventToEdit.tags) ? eventToEdit.tags.join(', ') : '',
        image: eventToEdit.image || eventToEdit.posterURL || '',
        status: eventToEdit.status || 'published',
        featured: !!eventToEdit.featured,
      });
    }
  }, [eventToEdit]);

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
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.location.trim()) errs.location = 'Location is required';
    if (!formData.capacity || formData.capacity < 1) errs.capacity = 'Capacity must be at least 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted form errors');
      return;
    }

    setLoading(true);
    const tags = formData.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated = {
      title: formData.title.trim(),
      category: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
      date: formData.date,
      eventDate: formData.date,
      time: formData.time,
      location: formData.location.trim(),
      venue: formData.location.trim(),
      venueType: formData.venueType,
      capacity: Number(formData.capacity),
      price: formData.price,
      description: formData.description.trim(),
      image: formData.image,
      posterURL: formData.image,
      status: formData.status,
      featured: formData.featured,
      tags,
    };

    try {
      await updateEvent(eventToEdit.id, updated, user?.uid);
      addNotification({
        title: 'Event Details Updated',
        message: `Organizer updated details for "${updated.title}". Check out the latest schedule.`,
        type: 'reminder',
        category: 'Events',
        link: `/events/${eventToEdit.id}`,
      });
      toast.success(`Event "${updated.title}" updated in Cloud Firestore!`, 'Changes Saved');
      navigate('/organizer/events');
    } catch (err) {
      toast.error(err.message || 'Failed to update event in Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (newStatus) => {
    setLoading(true);
    try {
      if (newStatus === 'published') {
        await publishEvent(eventToEdit.id, user?.uid);
        setFormData((prev) => ({ ...prev, status: 'published' }));
        toast.success(`Event published! It is now visible in the campus discovery feed.`);
      } else if (newStatus === 'cancelled') {
        await cancelEvent(eventToEdit.id, user?.uid);
        setFormData((prev) => ({ ...prev, status: 'cancelled' }));
        toast.info(`Event has been marked as cancelled.`);
      }
    } catch (err) {
      toast.error(err.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete "${eventToEdit.title}"?`)) {
      setLoading(true);
      try {
        await deleteEvent(eventToEdit.id, user?.uid);
        toast.info(`Deleted "${eventToEdit.title}"`);
        navigate('/organizer/events');
      } catch (err) {
        toast.error(err.message || 'Failed to delete event.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!eventToEdit) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-main">Event Not Found</h2>
        <Link to="/organizer/events">
          <Button variant="primary" size="sm">Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <Link
            to="/organizer/events"
            className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1.5 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Management
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
              Edit Event Listing
            </h1>
            <Badge variant="primary" size="sm" className="font-mono">
              {eventToEdit.id}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Modify event schedule, adjust seat capacity, and update description across the campus hub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/events/${eventToEdit.id}`} target="_blank">
            <Button variant="outline" size="sm" icon={ExternalLink} className="text-xs font-semibold">
              Preview Public View
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleDelete}
            className="text-error hover:bg-rose-50 text-xs font-semibold"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Info */}
        <Card className="p-6 space-y-5 border-border">
          <CardHeader className="p-0 border-b border-border/60 pb-3">
            <CardTitle className="text-base font-bold text-main">1. Basic Information</CardTitle>
            <CardDescription className="text-xs text-secondary">
              Title, classification, and event description shown on student cards.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label="Event Title"
              placeholder="e.g., Campus Hackathon 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-surface border border-border rounded-xl text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary capitalize font-medium"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Registration Access
                </label>
                <select
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-surface border border-border rounded-xl text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="Free">Free for All Students</option>
                  <option value="Departmental Pass">Departmental Pass Required</option>
                  <option value="Members Only">Club Members Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                Full Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-surface border border-border rounded-xl text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                required
              />
              {errors.description && (
                <p className="text-xs text-error mt-1">{errors.description}</p>
              )}
            </div>

            <Input
              label="Tags (comma separated)"
              placeholder="e.g. AI, Coding, Hackathon, Prizes"
              value={formData.tagsString}
              onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
              leftIcon={Tag}
            />
          </div>
        </Card>

        {/* Schedule & Venue */}
        <Card className="p-6 space-y-5 border-border">
          <CardHeader className="p-0 border-b border-border/60 pb-3">
            <CardTitle className="text-base font-bold text-main">2. Schedule & Venue</CardTitle>
            <CardDescription className="text-xs text-secondary">
              Set the event timing and physical location or virtual link.
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="text"
              placeholder="e.g., November 14, 2026"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              error={errors.date}
              leftIcon={Calendar}
              required
            />

            <Input
              label="Time Interval"
              type="text"
              placeholder="e.g., 09:00 AM - 09:00 PM"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              leftIcon={Clock}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Venue Location"
              placeholder="e.g., Main Auditorium, Tech Block"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              error={errors.location}
              leftIcon={MapPin}
              required
            />

            <Input
              label="Maximum Seat Capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              error={errors.capacity}
              leftIcon={Users}
              required
            />
          </div>
        </Card>

        {/* Cover Imagery & Firebase Storage Poster Upload */}
        <Card className="p-6 space-y-5 border-border">
          <CardHeader className="p-0 border-b border-border/60 pb-3">
            <CardTitle className="text-base font-bold text-main">3. Event Poster & Cover Imagery</CardTitle>
            <CardDescription className="text-xs text-secondary">
              Upload, preview, replace, or delete your high-resolution event banner stored in Firebase Storage.
            </CardDescription>
          </CardHeader>

          <PosterUpload
            currentPosterUrl={formData.image}
            eventId={eventToEdit?.id || id || 'edit-event'}
            onUploadSuccess={(url) => {
              setFormData((prev) => ({ ...prev, image: url, posterURL: url }));
              toast.success('Event poster uploaded and linked to event!');
            }}
            onRemove={() => {
              setFormData((prev) => ({ ...prev, image: '', posterURL: '' }));
              toast.info('Event poster removed.');
            }}
            disabled={loading}
          />

          <div className="space-y-2 pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-secondary">Or choose a preset banner:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetImages.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, image: p.url })}
                  className="p-1.5 rounded-xl border border-border hover:border-primary text-left bg-surface transition-all group overflow-hidden"
                >
                  <img src={p.url} alt={p.label} className="w-full h-16 object-cover rounded-lg mb-1" />
                  <p className="text-[10px] font-semibold text-secondary group-hover:text-primary truncate">
                    {p.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured-checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
            />
            <label htmlFor="featured-checkbox" className="text-xs font-medium text-main">
              Mark as Featured Event (prominently displayed on homepage hero & top banner)
            </label>
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:bg-red-50 hover:border-red-200"
            icon={Trash2}
          >
            Delete Event
          </Button>

          <div className="flex items-center gap-2">
            {formData.status === 'published' ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleToggleStatus('cancelled')}
                disabled={loading}
              >
                Cancel Event
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleToggleStatus('published')}
                disabled={loading}
              >
                Publish Event
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              loading={loading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditEventPage;
