import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  QrCode, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  ArrowRight, 
  Sparkles,
  Share2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const RegistrationSuccessModal = ({ isOpen, onClose, registration, event }) => {
  const toast = useToast();
  const navigate = useNavigate();

  if (!isOpen || !event) return null;

  const handleDownloadTicket = () => {
    // Generate text/pass receipt
    const ticketDetails = `
========================================
CAMPUSPULSE OFFICIAL STUDENT PASS
========================================
Registration ID: ${registration?.registrationId || 'CP-REG-2026-DEMO'}
Ticket Number:   ${registration?.ticketNumber || 'CP-TKT-DEMO'}
Event:           ${event.title}
Date & Time:     ${event.date} | ${event.time}
Venue:           ${event.location}
Attendee:        ${registration?.studentName || 'Student'} (${registration?.email || ''})
Department:      ${registration?.department || ''}
Team:            ${registration?.teamName || 'Solo'} (Size: ${registration?.teamSize || 1})
Status:          Confirmed & Active
========================================
Scan this pass at the gate desk.
========================================
    `;

    const blob = new Blob([ticketDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CampusPulse-Pass-${event.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Digital ticket downloaded successfully!', 'Pass Saved');
  };

  const handleAddToCalendar = () => {
    // Simulated .ics calendar file generator
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CampusPulse//College Events//EN
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, ' ')}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Calendar invitation (.ics) created and downloaded!', 'Schedule Synced');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      showClose={true}
    >
      <div className="text-center space-y-5">
        
        {/* Success Animated Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <Badge variant="success" size="sm" dot>
            Pass Confirmed & Issued
          </Badge>

          <h2 className="text-2xl font-black text-main tracking-tight">
            You&apos;re Going to {event.title}!
          </h2>

          <p className="text-xs text-secondary max-w-sm mx-auto">
            Your registration is confirmed. We&apos;ve reserved your seat and generated your verified ticket pass below.
          </p>
        </div>

        {/* Digital Ticket Pass Card */}
        <div className="bg-gradient-to-b from-white to-slate-50 border-2 border-primary/20 rounded-2xl p-5 shadow-premium text-left space-y-4 relative overflow-hidden">
          
          {/* Top Ticket Header */}
          <div className="flex items-start justify-between border-b border-border/80 pb-3">
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Registration ID</span>
              <span className="font-mono text-sm font-extrabold text-primary">
                {registration?.registrationId || 'CP-REG-2026-8842'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Ticket Code</span>
              <span className="font-mono text-xs font-bold text-main bg-slate-100 px-2 py-0.5 rounded">
                {registration?.ticketNumber || 'CP-TKT-HACK-884'}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-main text-sm leading-snug">{event.title}</h4>

            <div className="grid grid-cols-2 gap-2 text-secondary pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{event.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{event.time}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/70 text-[11px] text-secondary flex items-center justify-between">
              <span>Attendee: <strong className="text-main">{registration?.studentName || 'Rahul Sharma'}</strong></span>
              <span>Team: <strong className="text-main">{registration?.teamName || 'Solo'}</strong></span>
            </div>
          </div>

          {/* QR Ticket Placeholder */}
          <div className="pt-3 border-t-2 border-dashed border-border/80 flex items-center justify-between gap-4">
            <div className="p-2.5 bg-white border border-border rounded-xl shadow-xs">
              <QrCode className="w-16 h-16 text-slate-900" />
            </div>

            <div className="flex-1 space-y-1 text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Gate Ready
              </span>
              <p className="text-[10px] text-secondary leading-tight">
                Show this barcode at the venue check-in desk for entry badge.
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth
              icon={Download}
              onClick={handleDownloadTicket}
              className="text-xs font-semibold"
            >
              Download Ticket
            </Button>

            <Button
              variant="outline"
              size="md"
              fullWidth
              icon={Calendar}
              onClick={handleAddToCalendar}
              className="text-xs font-semibold"
            >
              Add to Calendar
            </Button>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => {
              onClose();
              navigate('/student/registrations');
            }}
            className="font-bold shadow-xs"
          >
            View My Event Passes
          </Button>
        </div>

      </div>
    </Modal>
  );
};

export default RegistrationSuccessModal;

