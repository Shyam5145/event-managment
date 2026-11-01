import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const AttendeeRosterPage = () => {
  const { events, registrations, checkInParticipant } = useEvents();
  const toast = useToast();

  const [selectedEventId, setSelectedEventId] = useState(
    events.find((e) => e.id === 'evt-hackathon-2026')?.id || events[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCode, setManualCode] = useState('');

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Dynamic attendees for current event
  // Converts real registrations into attendee format
  const activeAttendees = useMemo(() => {
    const realForEvent = registrations
      .filter((r) => r.eventId === currentEvent?.id)
      .map((r) => ({
        id: r.id,
        name: r.studentName || 'Student',
        email: r.email,
        ticketNumber: r.ticketNumber,
        registrationId: r.registrationId,
        department: r.department || 'Computer Science',
        teamName: r.teamName || 'Solo',
        checkedIn: Boolean(r.checkedIn),
        isReal: true,
      }));

    // Additional mock attendees for realism if few
    const mockRoster = [
      {
        id: 'mock-1',
        name: 'Jordan Lee',
        email: 'jordan.lee@campus.edu',
        ticketNumber: 'CP-TKT-5120',
        registrationId: 'CP-REG-2026-5120',
        department: 'Data Science & AI',
        teamName: 'NeuralByte',
        checkedIn: true,
        isReal: false,
      },
      {
        id: 'mock-2',
        name: 'Maya Patel',
        email: 'maya.patel@campus.edu',
        ticketNumber: 'CP-TKT-9341',
        registrationId: 'CP-REG-2026-9341',
        department: 'Electrical Engineering',
        teamName: 'ElectroSpark',
        checkedIn: false,
        isReal: false,
      },
      {
        id: 'mock-3',
        name: 'Ethan Brooks',
        email: 'ethan.b@campus.edu',
        ticketNumber: 'CP-TKT-4421',
        registrationId: 'CP-REG-2026-4421',
        department: 'Business & Tech',
        teamName: 'FinVenture',
        checkedIn: false,
        isReal: false,
      },
      {
        id: 'mock-4',
        name: 'Chloe Zhao',
        email: 'chloe.z@campus.edu',
        ticketNumber: 'CP-TKT-7819',
        registrationId: 'CP-REG-2026-7819',
        department: 'Interactive Design',
        teamName: 'PixelWave',
        checkedIn: true,
        isReal: false,
      },
    ];

    // Combine real with mock, avoiding ticket duplicate
    const combined = [...realForEvent];
    mockRoster.forEach((m) => {
      if (!combined.some((c) => c.email === m.email || c.ticketNumber === m.ticketNumber)) {
        combined.push(m);
      }
    });

    return combined;
  }, [registrations, currentEvent]);

  // Local checked-in state overrides
  const [localCheckedIn, setLocalCheckedIn] = useState({});

  const filteredAttendees = useMemo(() => {
    return activeAttendees.filter((a) => {
      const isChecked = localCheckedIn[a.id] !== undefined ? localCheckedIn[a.id] : a.checkedIn;
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.registrationId && a.registrationId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [activeAttendees, searchTerm, localCheckedIn]);

  const totalAttendees = activeAttendees.length;
  const checkedInCount = activeAttendees.filter((a) =>
    localCheckedIn[a.id] !== undefined ? localCheckedIn[a.id] : a.checkedIn
  ).length;
  const checkInRate = Math.round((checkedInCount / (totalAttendees || 1)) * 100);

  const handleToggleCheckIn = (attendee) => {
    const currentStatus = localCheckedIn[attendee.id] !== undefined ? localCheckedIn[attendee.id] : attendee.checkedIn;
    const nextStatus = !currentStatus;

    setLocalCheckedIn((prev) => ({
      ...prev,
      [attendee.id]: nextStatus,
    }));

    checkInParticipant(currentEvent.id, attendee.ticketNumber || attendee.id);

    if (nextStatus) {
      toast.success(`${attendee.name} verified & checked in!`, 'Gate Admission Granted');
    } else {
      toast.info(`Revoked check-in for ${attendee.name}`);
    }
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const matched = activeAttendees.find(
      (a) =>
        a.ticketNumber.toLowerCase() === manualCode.trim().toLowerCase() ||
        (a.registrationId && a.registrationId.toLowerCase() === manualCode.trim().toLowerCase())
    );

    if (matched) {
      const isChecked = localCheckedIn[matched.id] !== undefined ? localCheckedIn[matched.id] : matched.checkedIn;
      if (isChecked) {
        toast.warning(`${matched.name} (${matched.ticketNumber}) is already checked in!`, 'Duplicate Scan');
      } else {
        handleToggleCheckIn(matched);
      }
      setManualCode('');
    } else {
      toast.error(`Ticket or Registration Code "${manualCode}" not found in current roster`, 'Invalid Pass');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge variant="purple" size="sm" className="mb-2">Gate Check-in Desk</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Attendee Roster & Live Gate Scanner
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Scan attendee ticket codes, verify student credentials, and manage admission queues in real-time.
        </p>
      </div>

      {/* Event Selection & Roster Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 md:col-span-2 space-y-3">
          <label className="block text-xs font-semibold text-main">Select Campus Event to Manage</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-semibold text-main outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.date}) - {evt.registeredCount} RSVPs
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary pt-1">
            <span>Location: <strong className="text-main">{currentEvent?.location}</strong></span>
            <span>&bull;</span>
            <span>Capacity: <strong className="text-main">{currentEvent?.capacity} seats</strong></span>
            <span>&bull;</span>
            <span>Registered: <strong className="text-main">{currentEvent?.registeredCount}</strong></span>
          </div>
        </Card>

        {/* Live Attendance Stats */}
        <Card className="p-5 flex flex-col justify-between bg-primary-light/40 border-primary/20">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Gate Check-in Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-primary">{checkedInCount}</span>
              <span className="text-xs text-secondary">/ {totalAttendees} Present</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-primary/20">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${checkInRate}%` }} />
            </div>
            <p className="text-[11px] font-semibold text-primary mt-1 text-right">{checkInRate}% checked in</p>
          </div>
        </Card>
      </div>

      {/* Manual Scanner Bar & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ticket Scanner simulation */}
        <form onSubmit={handleManualScan} className="bg-surface p-4 rounded-2xl border border-border flex gap-2 shadow-xs">
          <div className="flex-1">
            <Input
              icon={QrCode}
              placeholder="Scan or enter Ticket / Reg ID (e.g. CP-TKT-HACK-884)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Verify Pass
          </Button>
        </form>

        {/* Filter Roster by search */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs">
          <Input
            icon={Search}
            placeholder="Search attendee by name, email, team, or ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Attendee Table */}
      <Card className="overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-border text-secondary font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Student Attendee</th>
                <th className="px-4 py-3.5">Department & Team</th>
                <th className="px-4 py-3.5">Registration & Ticket</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAttendees.map((attendee) => {
                const isChecked = localCheckedIn[attendee.id] !== undefined ? localCheckedIn[attendee.id] : attendee.checkedIn;

                return (
                  <tr key={attendee.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-main">{attendee.name}</p>
                        {attendee.isReal && (
                          <Badge variant="primary" size="sm" className="text-[10px] py-0 px-1.5">
                            Active Session
                          </Badge>
                        )}
                      </div>
                      <p className="text-secondary text-[11px]">{attendee.email}</p>
                    </td>

                    <td className="px-4 py-4 text-secondary">
                      <p className="text-main font-medium">{attendee.department}</p>
                      {attendee.teamName && (
                        <p className="text-[11px] text-primary">Team: {attendee.teamName}</p>
                      )}
                    </td>

                    <td className="px-4 py-4 font-mono">
                      <p className="font-bold text-main">{attendee.ticketNumber}</p>
                      {attendee.registrationId && (
                        <p className="text-[10px] text-secondary">{attendee.registrationId}</p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {isChecked ? (
                        <Badge variant="success" size="sm" dot>Checked In</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm" dot dotColor="bg-slate-400">Registered</Badge>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        variant={isChecked ? 'outline' : 'success'}
                        size="sm"
                        onClick={() => handleToggleCheckIn(attendee)}
                        icon={isChecked ? XCircle : CheckCircle2}
                        className="text-xs font-semibold"
                      >
                        {isChecked ? 'Revoke Entry' : 'Verify & Check In'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AttendeeRosterPage;
