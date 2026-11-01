import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  Eye, 
  Trash2, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  QrCode,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isFirebaseConfigured } from '../../services/firebase.js';
import { getEventParticipants } from '../../services/registrationService.js';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export const ParticipantManagementPage = () => {
  const { 
    events, 
    registrations, 
    waitlist, 
    removeParticipant, 
    markAttendance 
  } = useEvents();
  const { user } = useAuth();
  const toast = useToast();

  // Filter events: Organizers only see events they manage; Admins see all
  const organizerEvents = useMemo(() => {
    if (!user || user.role === 'admin') return events;
    return events.filter(
      (e) => !e.organizerId || e.organizerId === user.uid || e.organizer === user.name || e.organizer?.name === user.name
    );
  }, [events, user]);

  // Selected event (defaults to first available managed event)
  const [selectedEventId, setSelectedEventId] = useState(
    organizerEvents[0]?.id || events[0]?.id || ''
  );

  const currentEvent = organizerEvents.find((e) => e.id === selectedEventId) || organizerEvents[0] || events[0];

  // Filters & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'confirmed' | 'checked_in' | 'waitlisted'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'name-asc' | 'reg-id'
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // Selected rows for bulk operations
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // Participant profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Delete participant confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);

  // Registrations for the currently selected event
  const eventRegistrations = useMemo(() => {
    return registrations.filter((r) => r.eventId === currentEvent?.id);
  }, [registrations, currentEvent]);

  // Waitlist for the currently selected event
  const eventWaitlist = useMemo(() => {
    return waitlist.filter((w) => w.eventId === currentEvent?.id);
  }, [waitlist, currentEvent]);

  // Combined participant items
  const allEventParticipants = useMemo(() => {
    const regItems = eventRegistrations.map((r) => ({
      ...r,
      type: 'registration',
      displayStatus: r.checkedIn ? 'checked_in' : 'confirmed',
    }));

    return regItems;
  }, [eventRegistrations]);

  // Statistics
  const totalRegistrationsCount = currentEvent?.registeredCount || eventRegistrations.length;
  const maxCapacity = currentEvent?.capacity || 400;
  const registrationPercentage = Math.min(100, Math.round((totalRegistrationsCount / (maxCapacity || 1)) * 100));

  const confirmedCount = eventRegistrations.filter((r) => !r.checkedIn).length;
  const checkedInCount = eventRegistrations.filter((r) => r.checkedIn).length;
  const waitlistedCount = eventWaitlist.length;
  const cancelledCount = 2; // Demo historical cancellations

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set();
    allEventParticipants.forEach((p) => {
      if (p.department) depts.add(p.department);
    });
    return Array.from(depts);
  }, [allEventParticipants]);

  // Filtered & Sorted participants
  const filteredParticipants = useMemo(() => {
    return allEventParticipants.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        p.registrationId.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        p.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchesDept = selectedDept === 'all' || p.department === selectedDept;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'confirmed' && !p.checkedIn) ||
        (selectedStatus === 'checked_in' && p.checkedIn);

      return matchesSearch && matchesDept && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.studentName.localeCompare(b.studentName);
      }
      if (sortBy === 'reg-id') {
        return a.registrationId.localeCompare(b.registrationId);
      }
      // default: date-desc
      return new Date(b.registeredAt) - new Date(a.registeredAt);
    });
  }, [allEventParticipants, searchTerm, selectedDept, selectedStatus, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredParticipants.length / PAGE_SIZE) || 1;
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Select all checkbox handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(paginatedParticipants.map((p) => p.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRow = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // EXPORT CSV FUNCTIONALITY (Generates real CSV file on frontend)
  const handleExportCSV = () => {
    const rowsToExport = selectedRowIds.length > 0
      ? filteredParticipants.filter((p) => selectedRowIds.includes(p.id))
      : filteredParticipants;

    if (rowsToExport.length === 0) {
      toast.warning('No participant records to export');
      return;
    }

    const headers = [
      'Registration ID',
      'Ticket Number',
      'Student Name',
      'College Email',
      'Department',
      'Academic Year',
      'Team Name',
      'Team Size',
      'Status',
      'Checked In',
      'Registration Date'
    ];

    const csvRows = [headers.join(',')];

    rowsToExport.forEach((p) => {
      const row = [
        `"${p.registrationId}"`,
        `"${p.ticketNumber}"`,
        `"${p.studentName.replace(/"/g, '""')}"`,
        `"${p.email}"`,
        `"${p.department || ''}"`,
        `"${p.academicYear || ''}"`,
        `"${p.teamName || 'Solo'}"`,
        p.teamSize || 1,
        `"${p.checkedIn ? 'Checked In' : 'Confirmed'}"`,
        `"${p.checkedIn ? 'Yes' : 'No'}"`,
        `"${new Date(p.registeredAt).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CampusPulse-Roster-${currentEvent.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rowsToExport.length} participant records to CSV!`, 'CSV Export Complete');
  };

  const handleOpenProfile = (participant) => {
    setSelectedParticipant(participant);
    setProfileModalOpen(true);
  };

  const handleOpenDeleteConfirm = (participant) => {
    setParticipantToDelete(participant);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (participantToDelete) {
      removeParticipant(currentEvent.id, participantToDelete.id);
      toast.info(`Removed ${participantToDelete.studentName} from event registration.`);
      setDeleteConfirmOpen(false);
      setParticipantToDelete(null);
    }
  };

  const handleToggleAttendance = (participant) => {
    const nextStatus = !participant.checkedIn;
    markAttendance(currentEvent.id, participant.id, nextStatus);
    toast.success(
      `${participant.studentName} marked as ${nextStatus ? 'Present' : 'Absent'}!`,
      nextStatus ? 'Check-in Verified' : 'Check-in Revoked'
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <Badge variant="purple" size="sm" className="mb-2">Organizer Studio</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Participant Management & Rosters
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Review registered students, inspect academic credentials, filter departments, and export rosters.
        </p>
      </div>

      {/* 1. EVENT SELECTOR & CAPACITY SUMMARY CARD */}
      <Card className="p-6 space-y-4 shadow-subtle border-border/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Event Picker Dropdown */}
          <div className="space-y-2 flex-1 max-w-xl">
            <label className="block text-xs font-bold text-main uppercase tracking-wider">
              Selected Campus Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setCurrentPage(1);
                setSelectedRowIds([]);
              }}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-main outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 shadow-xs"
            >
              {organizerEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.date}) &bull; {evt.registeredCount} RSVPs
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-3 text-xs text-secondary pt-1">
              <span>Date: <strong className="text-main">{currentEvent.date}</strong></span>
              <span>&bull;</span>
              <span>Venue: <strong className="text-main">{currentEvent.location}</strong></span>
              <span>&bull;</span>
              <span>Category: <strong className="text-main capitalize">{currentEvent.category}</strong></span>
            </div>
          </div>

          {/* Registration Percentage & Maximum Capacity Bar */}
          <div className="w-full lg:w-72 space-y-2 p-4 bg-slate-50 rounded-2xl border border-border/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-medium">Capacity Fill Rate:</span>
              <span className="font-bold text-main">
                {totalRegistrationsCount} / {maxCapacity} ({registrationPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full ${
                  registrationPercentage >= 90 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${registrationPercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-right text-secondary font-medium">
              {maxCapacity - totalRegistrationsCount} seats remaining for admission
            </p>
          </div>

        </div>
      </Card>

      {/* 2. STATISTICS METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Registrations</p>
            <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{totalRegistrationsCount}</h3>
            <p className="text-[10px] text-secondary mt-0.5">All student RSVPs</p>
          </div>
        </Card>

        {/* Confirmed Passes */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Confirmed Active</p>
            <h3 className="text-2xl font-black text-emerald-600 leading-tight mt-0.5">{eventRegistrations.length}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Tickets issued</p>
          </div>
        </Card>

        {/* Waitlisted */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Waitlisted</p>
            <h3 className="text-2xl font-black text-amber-600 leading-tight mt-0.5">{waitlistedCount}</h3>
            <p className="text-[10px] text-secondary mt-0.5">Pending seat release</p>
          </div>
        </Card>

        {/* Cancelled */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Cancelled</p>
            <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{cancelledCount}</h3>
            <p className="text-[10px] text-secondary mt-0.5">Seats released</p>
          </div>
        </Card>
      </div>

      {/* 3. PARTICIPANT TABLE CONTROLS BAR */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-subtle space-y-4">
        
        {/* Search, Dept Filter, Status Filter, Export CSV */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="w-full lg:max-w-xs">
            <Input
              icon={Search}
              placeholder="Search by name, email, or Reg ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Department Filter & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed (Pending Gate)</option>
              <option value="checked_in">Checked In (At Venue)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-border text-main rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-600"
            >
              <option value="date-desc">Newest Registration</option>
              <option value="name-asc">Student Name (A - Z)</option>
              <option value="reg-id">Registration ID</option>
            </select>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              className="font-bold text-xs hover:border-purple-600 hover:text-purple-600 shadow-xs"
            >
              Export CSV {selectedRowIds.length > 0 && `(${selectedRowIds.length})`}
            </Button>

          </div>

        </div>

        {/* Selected rows indicator */}
        {selectedRowIds.length > 0 && (
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900 font-semibold">
            <span>{selectedRowIds.length} participant(s) selected</span>
            <button
              type="button"
              onClick={() => setSelectedRowIds([])}
              className="text-xs text-purple-700 underline"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* 4. PARTICIPANT DATA TABLE */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-border text-secondary font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedParticipants.length > 0 &&
                      paginatedParticipants.every((p) => selectedRowIds.includes(p.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-600"
                  />
                </th>
                <th className="px-4 py-3.5">Student Attendee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Registration ID</th>
                <th className="px-4 py-3.5">Reg. Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 bg-white">
              {paginatedParticipants.length > 0 ? (
                paginatedParticipants.map((p) => {
                  const isSelected = selectedRowIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(p.id)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-600"
                        />
                      </td>

                      {/* Avatar & Student Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                            alt={p.studentName}
                            className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-main truncate hover:text-purple-600 cursor-pointer" onClick={() => handleOpenProfile(p)}>
                              {p.studentName}
                            </p>
                            <p className="text-[11px] text-secondary truncate">{p.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-main">{p.department}</p>
                        <p className="text-[10px] text-secondary">{p.academicYear}</p>
                      </td>

                      {/* Registration ID & Ticket */}
                      <td className="px-4 py-3.5 font-mono">
                        <p className="font-bold text-primary">{p.registrationId}</p>
                        <p className="text-[10px] text-secondary">{p.ticketNumber}</p>
                      </td>

                      {/* Registration Date */}
                      <td className="px-4 py-3.5 text-secondary">
                        {new Date(p.registeredAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {p.checkedIn ? (
                          <Badge variant="success" size="sm" dot>
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="primary" size="sm" dot>
                            Confirmed
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleOpenProfile(p)}
                            className="p-1.5 text-secondary hover:text-main"
                            title="Inspect participant profile"
                          />

                          {/* Quick Toggle Check-in */}
                          <Button
                            variant={p.checkedIn ? 'outline' : 'success'}
                            size="sm"
                            onClick={() => handleToggleAttendance(p)}
                            className="text-[11px] py-1 px-2.5 font-semibold"
                          >
                            {p.checkedIn ? 'Revoke' : 'Check In'}
                          </Button>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleOpenDeleteConfirm(p)}
                            className="p-1.5 text-error hover:bg-rose-50"
                            title="Remove participant"
                          />
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-secondary">
                    <p className="font-semibold text-sm">No matching participant records found.</p>
                    <p className="text-xs mt-1">Try clearing your search query or department filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/80 text-xs text-secondary">
          <span>
            Showing page <strong className="text-main">{currentPage}</strong> of{' '}
            <strong className="text-main">{totalPages}</strong> ({filteredParticipants.length} total participants)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              icon={ChevronLeft}
              className="text-xs"
            >
              Previous
            </Button>

            <span className="font-semibold text-main px-2">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              icon={ChevronRight}
              iconPosition="right"
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>

      </div>

      {/* 5. PARTICIPANT PROFILE MODAL */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        size="md"
        title="Student Registration Profile"
        description="Verified participant credentials and event pass details."
      >
        {selectedParticipant && (
          <div className="space-y-5">
            
            {/* Student Identity Banner */}
            <div className="p-4 bg-slate-50 border border-border rounded-2xl flex items-center gap-4">
              <img
                src={selectedParticipant.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                alt={selectedParticipant.studentName}
                className="w-16 h-16 rounded-2xl object-cover border border-border shadow-xs shrink-0"
              />

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-main">{selectedParticipant.studentName}</h3>
                  <Badge variant={selectedParticipant.checkedIn ? 'success' : 'primary'} size="sm" dot>
                    {selectedParticipant.checkedIn ? 'Checked In' : 'Confirmed'}
                  </Badge>
                </div>
                <p className="text-xs text-secondary">{selectedParticipant.email}</p>
                <p className="text-xs font-semibold text-primary">{selectedParticipant.department}</p>
              </div>
            </div>

            {/* Registration Metadata Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-white space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Registration ID</span>
                <span className="font-mono font-bold text-primary">{selectedParticipant.registrationId}</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-white space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Ticket Code</span>
                <span className="font-mono font-bold text-main">{selectedParticipant.ticketNumber}</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-white space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Academic Year</span>
                <span className="font-medium text-main">{selectedParticipant.academicYear || '3rd Year'}</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-white space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Team / Track</span>
                <span className="font-medium text-main">{selectedParticipant.teamName || 'Solo'}</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-white col-span-2 space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Registration Date & Time</span>
                <span className="font-medium text-main">{new Date(selectedParticipant.registeredAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant={selectedParticipant.checkedIn ? 'outline' : 'success'}
                size="md"
                onClick={() => {
                  handleToggleAttendance(selectedParticipant);
                  setSelectedParticipant((prev) => ({ ...prev, checkedIn: !prev.checkedIn }));
                }}
              >
                {selectedParticipant.checkedIn ? 'Revoke Admission' : 'Mark Present (Check In)'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setProfileModalOpen(false)}
              >
                Close Profile
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* 6. REMOVE PARTICIPANT CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Remove Participant from Event?"
        description="Are you sure you want to cancel this student's admission pass?"
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Keep Participant
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Confirm Removal
            </Button>
          </div>
        }
      >
        <p className="text-xs text-secondary">
          Removing <strong className="text-main">&quot;{participantToDelete?.studentName}&quot;</strong> will decrement the event registration count and invalidate their ticket pass barcode.
        </p>
      </Modal>

    </div>
  );
};

export default ParticipantManagementPage;

