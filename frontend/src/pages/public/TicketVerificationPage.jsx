import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Ticket, 
  User, 
  Search,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const TicketVerificationPage = () => {
  const { ticketId: paramTicketId } = useParams();
  const { verifyTicket } = useEvents();

  const [inputTicketId, setInputTicketId] = useState(paramTicketId || '');
  const [loading, setLoading] = useState(Boolean(paramTicketId));
  const [result, setResult] = useState(null);

  const performVerification = async (ticketCode) => {
    if (!ticketCode || !ticketCode.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const data = await verifyTicket(ticketCode.trim());
      setResult(data);
    } catch (err) {
      setResult({
        isValid: false,
        status: 'invalid',
        statusLabel: 'Verification Error',
        message: err.message || 'Could not verify ticket against Cloud Firestore.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramTicketId) {
      performVerification(paramTicketId);
    }
  }, [paramTicketId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTicketId.trim()) {
      performVerification(inputTicketId);
    }
  };

  const getStatusDisplay = () => {
    if (!result) return null;

    switch (result.status) {
      case 'valid':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 border-emerald-200',
          badgeVariant: 'success',
          badgeText: 'Valid Registration',
          title: 'Official Pass Verified',
          desc: result.message || 'Ticket is genuine, confirmed, and authorized for venue admission.',
        };
      case 'already_checked_in':
        return {
          icon: Clock,
          color: 'text-amber-500',
          bg: 'bg-amber-50 border-amber-200',
          badgeVariant: 'warning',
          badgeText: 'Already Checked In',
          title: 'Gate Pass Already Used',
          desc: result.message || 'This student has already been checked in at the admission gate.',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-rose-500',
          bg: 'bg-rose-50 border-rose-200',
          badgeVariant: 'error',
          badgeText: 'Registration Cancelled',
          title: 'Admission Pass Cancelled',
          desc: result.message || 'This registration was cancelled and is no longer valid for venue entry.',
        };
      case 'not_found':
        return {
          icon: ShieldAlert,
          color: 'text-rose-500',
          bg: 'bg-rose-50 border-rose-200',
          badgeVariant: 'error',
          badgeText: 'Ticket Not Found',
          title: 'Unrecognized Ticket Barcode',
          desc: result.message || 'No active or completed ticket pass matching this ID was found in the database.',
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-rose-500',
          bg: 'bg-rose-50 border-rose-200',
          badgeVariant: 'error',
          badgeText: 'Invalid Ticket',
          title: 'Ticket Invalid',
          desc: result.message || 'This ticket could not be validated against Cloud Firestore records.',
        };
    }
  };

  const statusConfig = getStatusDisplay();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      
      {/* Branding Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl text-main tracking-tight">CampusPulse</span>
        </Link>
        <p className="text-xs text-secondary font-medium uppercase tracking-wider">
          Gate Pass Verification Portal
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-lg space-y-4">
        <Card className="p-6 sm:p-8 shadow-elevated border-slate-200 bg-white">
          
          {/* Lookup Input form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <label className="block text-xs font-bold text-main mb-1.5">
              Enter or Scan Ticket ID
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. CP-TKT-HACK-884 or REG-ID..."
                value={inputTicketId}
                onChange={(e) => setInputTicketId(e.target.value)}
                className="flex-1"
                icon={Ticket}
              />
              <Button type="submit" variant="primary" loading={loading} icon={Search}>
                Verify
              </Button>
            </div>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-secondary">
                Verifying ticket signature with Cloud Firestore...
              </p>
            </div>
          )}

          {/* Result Presentation */}
          {!loading && result && statusConfig && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Status Header Box */}
              <div className={`p-5 rounded-2xl border text-center ${statusConfig.bg}`}>
                <statusConfig.icon className={`w-12 h-12 mx-auto mb-2 ${statusConfig.color}`} />
                <Badge variant={statusConfig.badgeVariant} size="sm" className="mb-2">
                  {statusConfig.badgeText}
                </Badge>
                <h2 className="text-lg font-black text-main">{statusConfig.title}</h2>
                <p className="text-xs text-secondary mt-1 leading-relaxed max-w-sm mx-auto">
                  {statusConfig.desc}
                </p>
              </div>

              {/* Event & Sanitized Attendee Details (Privacy-Safe) */}
              {result.event && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Event</span>
                    <h3 className="text-sm font-bold text-main mt-0.5">{result.event.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-secondary mt-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {result.event.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {result.event.location || result.event.venue || 'Campus Venue'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Attendee</span>
                      <p className="font-semibold text-main mt-0.5">
                        {result.sanitizedAttendee?.name || 'Student Attendee'}
                      </p>
                      <p className="text-[10px] text-secondary">
                        {result.sanitizedAttendee?.department || 'University'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Ticket Number</span>
                      <p className="font-mono font-bold text-main mt-0.5">
                        {result.registration?.ticketNumber || inputTicketId}
                      </p>
                      <p className="text-[10px] text-secondary">
                        Ref: {(result.registration?.id || '').slice(0, 16)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Watermark */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-secondary">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cryptographically verified against Cloud Firestore records</span>
              </div>

            </div>
          )}

          {/* Empty Prompt State */}
          {!loading && !result && (
            <div className="py-8 text-center text-secondary space-y-2">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-main">Ready for barcode verification</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Scan attendee QR code with your camera or enter the ticket number to verify event admission status.
              </p>
            </div>
          )}

        </Card>

        {/* Action Link Footer */}
        <div className="text-center text-xs text-secondary flex items-center justify-center gap-4">
          <Link to="/events" className="hover:text-primary transition">
            Browse Campus Events
          </Link>
          <span>&bull;</span>
          <Link to="/login" className="hover:text-primary transition">
            Student / Organizer Login
          </Link>
        </div>

      </div>

    </div>
  );
};

export default TicketVerificationPage;

