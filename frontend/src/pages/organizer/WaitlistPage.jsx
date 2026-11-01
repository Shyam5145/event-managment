import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock3, 
  UserPlus, 
  Trash2, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const WaitlistPage = () => {
  const { 
    events, 
    waitlist, 
    promoteFromWaitlist, 
    removeFromWaitlist 
  } = useEvents();
  const toast = useToast();
  const { addNotification } = useNotifications();

  const [selectedEventId, setSelectedEventId] = useState(
    events.find((e) => e.id === 'evt-hackathon-2026')?.id || events[0]?.id || ''
  );
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Remove confirmation modal
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [entryToRemove, setEntryToRemove] = useState(null);

  // Filter waitlist for this event
  const eventWaitlist = waitlist.filter((w) => w.eventId === currentEvent?.id);

  const handlePromote = (entry) => {
    const newReg = promoteFromWaitlist(currentEvent.id, entry.id);
    if (newReg) {
      toast.success(
        `${entry.studentName} has been promoted to a Confirmed Participant! Pass ID: ${newReg.ticketNumber}`,
        'Waitlist Promotion Confirmed'
      );
      addNotification({
        title: 'Admitted from Waitlist',
        message: `${entry.studentName} was promoted to confirmed passholder for "${currentEvent.title}". Ticket #${newReg.ticketNumber}`,
        type: 'pass',
        category: 'Passes',
        link: '/student/registrations',
      });
    }
  };

  const handleOpenRemove = (entry) => {
    setEntryToRemove(entry);
    setRemoveModalOpen(true);
  };

  const handleConfirmRemove = () => {
    if (entryToRemove) {
      removeFromWaitlist(currentEvent.id, entryToRemove.id);
      toast.info(`Removed ${entryToRemove.studentName} from the waitlist.`);
      setRemoveModalOpen(false);
      setEntryToRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <Badge variant="purple" size="sm" className="mb-2">Queue Automation</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Waitlist & Queue Management
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Review students waiting for open seats. Promote candidates to active registered status or manage queue priority.
        </p>
      </div>

      {/* Event Picker & Queue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Event Selector (8 cols) */}
        <Card className="lg:col-span-8 p-5 space-y-3">
          <label className="block text-xs font-bold text-main uppercase tracking-wider">
            Select Event Queue to Manage
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-bold text-main outline-none focus:border-purple-600 shadow-xs"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.registeredCount} / {evt.capacity} seats)
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-3 text-xs text-secondary pt-1">
            <span>Date: <strong className="text-main">{currentEvent.date}</strong></span>
            <span>&bull;</span>
            <span>Capacity: <strong className="text-main">{currentEvent.capacity} seats</strong></span>
            <span>&bull;</span>
            <span>Current RSVPs: <strong className="text-main">{currentEvent.registeredCount}</strong></span>
          </div>
        </Card>

        {/* Queue Metric Card (4 cols) */}
        <Card className="lg:col-span-4 p-5 flex flex-col justify-between bg-amber-50/50 border-amber-200">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Waitlist Queue Size
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600">{eventWaitlist.length}</span>
              <span className="text-xs text-secondary">students waiting</span>
            </div>
          </div>
          <p className="text-[11px] text-amber-900 mt-2">
            Candidates are ordered chronologically by time of application.
          </p>
        </Card>

      </div>

      {/* WAITLIST TABLE */}
      <Card className="p-5 shadow-subtle space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <h3 className="text-base font-bold text-main">Waitlist Queue Roster</h3>
            <p className="text-xs text-secondary">
              Promote next student in line when a ticket is released or capacity increases.
            </p>
          </div>

          <Badge variant="warning" size="sm">
            {eventWaitlist.length} in Queue
          </Badge>
        </div>

        {eventWaitlist.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 w-24">Position</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">College Email</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Date Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60 bg-white">
                {eventWaitlist.map((entry, index) => {
                  const position = entry.queuePosition || index + 1;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Position */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-xs text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                          #{position}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="px-5 py-4 font-bold text-main">
                        {entry.studentName}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 text-secondary font-mono text-[11px]">
                        {entry.email}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4 text-secondary">
                        <p className="font-medium text-main">{entry.department || 'Computer Science'}</p>
                        <p className="text-[10px] text-secondary">{entry.academicYear || 'Undergraduate'}</p>
                      </td>

                      {/* Date Joined */}
                      <td className="px-4 py-4 text-secondary">
                        {new Date(entry.joinedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Actions: Promote to Registered & Remove */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Promote Button */}
                          <Button
                            variant="primary"
                            size="sm"
                            icon={UserPlus}
                            onClick={() => handlePromote(entry)}
                            className="text-xs py-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700"
                          >
                            Promote to Registered
                          </Button>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleOpenRemove(entry)}
                            className="p-1.5 text-error hover:bg-rose-50"
                            title="Remove from waitlist"
                          />
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-border p-8 space-y-3">
            <Clock3 className="w-12 h-12 text-secondary mx-auto opacity-40" />
            <h3 className="text-base font-bold text-main">Waitlist Queue is Empty</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              There are currently no students waiting for seats in <strong className="text-main">{currentEvent.title}</strong>.
            </p>
            <div className="pt-2">
              <Link to="/organizer/participants">
                <Button variant="outline" size="sm" icon={Users}>
                  View Active Roster
                </Button>
              </Link>
            </div>
          </div>
        )}

      </Card>

      {/* REMOVE FROM WAITLIST CONFIRMATION MODAL */}
      <Modal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        title="Remove Student from Waitlist?"
        description="Are you sure you want to dismiss this candidate from the waitlist queue?"
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRemoveModalOpen(false)}>
              Keep on Waitlist
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRemove}>
              Confirm Removal
            </Button>
          </div>
        }
      >
        <p className="text-xs text-secondary">
          Removing <strong className="text-main">&quot;{entryToRemove?.studentName}&quot;</strong> will take them out of line and shift subsequent queue positions up.
        </p>
      </Modal>

    </div>
  );
};

export default WaitlistPage;

