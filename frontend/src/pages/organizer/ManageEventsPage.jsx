import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Trash2, 
  ExternalLink, 
  Users, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  QrCode,
  Edit3
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const ManageEventsPage = () => {
  const { events, deleteEvent } = useEvents();
  const { user } = useAuth();
  const toast = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenDelete = (event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      setDeleting(true);
      try {
        await deleteEvent(eventToDelete.id, user?.uid);
        toast.info(`Deleted "${eventToDelete.title}"`);
        setDeleteModalOpen(false);
        setEventToDelete(null);
      } catch (err) {
        toast.error(err.message || 'Failed to delete event.');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="purple" size="sm" className="mb-2">Event Portfolio</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
            Manage Campus Events ({events.length})
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Review event status, registration quotas, attendee rosters, or remove event listings.
          </p>
        </div>

        <Link to="/organizer/events/create">
          <Button variant="primary" size="md" icon={PlusCircle}>
            Create New Event
          </Button>
        </Link>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main">No Events In Portfolio</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                Create your club's first campus event to begin managing registrations and check-ins.
              </p>
            </div>
            <Link to="/organizer/events/create">
              <Button variant="primary" size="md" icon={PlusCircle}>
                Create First Event
              </Button>
            </Link>
          </Card>
        ) : (
          events.map((event) => {
            const occupancyRate = Math.min(100, Math.round(((event.registeredCount || 0) / (event.capacity || 1)) * 100));

            return (
              <Card key={event.id} className="overflow-hidden p-5 sm:p-6 transition-all hover:shadow-premium">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Meta & Title */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={event.image || event.posterURL}
                      alt={event.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="primary" size="sm" className="capitalize">
                          {event.category}
                        </Badge>
                        <Badge 
                          variant={event.status === 'published' ? 'success' : event.status === 'draft' ? 'default' : 'danger'} 
                          size="sm"
                          className="capitalize"
                        >
                          {event.status || 'published'}
                        </Badge>
                        {event.featured && (
                          <Badge variant="purple" size="sm">Featured</Badge>
                        )}
                        <span className="text-xs text-secondary font-mono">{event.id}</span>
                      </div>

                    <Link to={`/events/${event.id}`}>
                      <h3 className="text-base sm:text-lg font-bold text-main hover:text-primary transition-colors truncate">
                        {event.title}
                      </h3>
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Registration Fill Gauge */}
                <div className="w-full lg:w-48 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-border/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary font-medium">Registrations:</span>
                    <span className="font-bold text-main">{event.registeredCount} / {event.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${occupancyRate >= 90 ? 'bg-amber-500' : 'bg-primary'}`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-right text-secondary font-medium">{occupancyRate}% Capacity</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline" size="sm" icon={ExternalLink}>
                      Preview
                    </Button>
                  </Link>

                  <Link to={`/organizer/events/${event.id}/edit`}>
                    <Button variant="outline" size="sm" icon={Edit3}>
                      Edit
                    </Button>
                  </Link>

                  <Link to="/organizer/roster">
                    <Button variant="outline" size="sm" icon={Users}>
                      Roster
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleOpenDelete(event)}
                    className="text-error hover:bg-rose-50"
                  >
                    Delete
                  </Button>
                </div>

              </div>
            </Card>
          );
        })
      )}
    </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event Listing?"
        description="This action will delete the event and all linked attendee registrations."
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Keep Event
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete} loading={deleting}>
              Confirm Delete
            </Button>
          </div>
        }
      >
        <p className="text-xs text-secondary">
          Are you sure you want to permanently remove <strong className="text-main">&quot;{eventToDelete?.title}&quot;</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ManageEventsPage;

