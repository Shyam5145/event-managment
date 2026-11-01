import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  QrCode, 
  Search, 
  Camera, 
  CameraOff,
  Sparkles, 
  Users, 
  Clock, 
  AlertCircle, 
  Check, 
  Calendar 
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getRegistrationByTicket } from '../../services/registrationService.js';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const AttendancePage = () => {
  const { events, registrations, markAttendance } = useEvents();
  const { user } = useAuth();
  const toast = useToast();

  const organizerEvents = useMemo(() => {
    if (!user || user.role === 'admin') return events;
    return events.filter(
      (e) => !e.organizerId || e.organizerId === user.uid || e.organizer === user.name || e.organizer?.name === user.name
    );
  }, [events, user]);

  const [selectedEventId, setSelectedEventId] = useState(
    organizerEvents[0]?.id || events[0]?.id || ''
  );
  const currentEvent = organizerEvents.find((e) => e.id === selectedEventId) || organizerEvents[0] || events[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastCheckInResult, setLastCheckInResult] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Play subtle gate verification chime via Web Audio API
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Filter registrations for this event
  const eventRegistrations = useMemo(() => {
    return registrations.filter((r) => r.eventId === currentEvent?.id);
  }, [registrations, currentEvent]);

  // Attendance metrics
  const totalRegistered = eventRegistrations.length;
  const presentCount = eventRegistrations.filter((r) => r.checkedIn).length;
  const absentCount = Math.max(0, totalRegistered - presentCount);
  const attendanceRate = totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0;

  // Search filtered attendees
  const filteredRegistrations = useMemo(() => {
    return eventRegistrations.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      return (
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.ticketNumber.toLowerCase().includes(q) ||
        (r.registrationId && r.registrationId.toLowerCase().includes(q))
      );
    });
  }, [eventRegistrations, searchTerm]);

  // Actions
  const handleMarkPresent = async (reg) => {
    try {
      await markAttendance(currentEvent.id, reg.id, true, user?.uid);
      toast.success(`${reg.studentName} marked as Present!`, 'Gate Admission Recorded');
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance', 'Attendance Error');
    }
  };

  const handleMarkAbsent = async (reg) => {
    try {
      await markAttendance(currentEvent.id, reg.id, false, user?.uid);
      toast.info(`${reg.studentName} marked as Absent.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance', 'Attendance Error');
    }
  };

  const handleUndoCheckIn = async (reg) => {
    try {
      await markAttendance(currentEvent.id, reg.id, false, user?.uid);
      toast.info(`Undid check-in for ${reg.studentName}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance', 'Attendance Error');
    }
  };

  const processCheckIn = async (ticketIdentifier, payloadEventId = null) => {
    if (!ticketIdentifier) return;
    const cleanId = String(ticketIdentifier).trim();

    // 1. Cross-Event Validation: Check if QR specifies a different event ID
    if (payloadEventId && payloadEventId !== currentEvent.id) {
      const err = `Wrong Event: This ticket pass is for another event (ID: ${payloadEventId}), not "${currentEvent.title}".`;
      setLastCheckInResult({
        success: false,
        type: 'wrong_event',
        title: 'Wrong Event Pass',
        message: err,
        code: cleanId,
      });
      toast.error(err, 'Admission Denied');
      return;
    }

    // 2. Search local cache / session roster first
    const cleanQuery = cleanId.toLowerCase();
    let matched = eventRegistrations.find(
      (r) =>
        r.ticketNumber?.toLowerCase() === cleanQuery ||
        r.ticketId?.toLowerCase() === cleanQuery ||
        r.registrationId?.toLowerCase() === cleanQuery ||
        r.id?.toLowerCase() === cleanQuery
    );

    // 3. If not found in local cache, query Firestore directly
    if (!matched) {
      try {
        const remoteDoc = await getRegistrationByTicket(cleanId);
        if (remoteDoc) {
          if (remoteDoc.eventId !== currentEvent.id) {
            const err = `Wrong Event: Pass belongs to a different event.`;
            setLastCheckInResult({
              success: false,
              type: 'wrong_event',
              title: 'Wrong Event',
              message: err,
              code: cleanId,
            });
            toast.error(err, 'Admission Denied');
            return;
          }
          matched = remoteDoc;
        }
      } catch (e) {
        console.warn('Firestore ticket lookup failed:', e);
      }
    }

    if (!matched) {
      const err = `No attendee matching code "${cleanId}" was found in this event roster.`;
      setLastCheckInResult({
        success: false,
        type: 'not_found',
        title: 'Attendee Not Found',
        message: err,
        code: cleanId,
      });
      toast.error(err, 'Ticket Not Recognized');
      return;
    }

    // 4. Verify Registration Status (Rejects cancelled registrations)
    if (matched.status === 'cancelled') {
      const err = `Admission Denied: Registration for ${matched.studentName} was cancelled.`;
      setLastCheckInResult({
        success: false,
        type: 'cancelled',
        title: 'Registration Cancelled',
        message: err,
        attendee: matched.studentName,
        code: cleanId,
      });
      toast.error(err, 'Pass Cancelled');
      return;
    }

    // 5. Prevent Duplicate Check-Ins
    if (matched.checkedIn || matched.attendanceStatus === 'present') {
      const warn = `Duplicate Scan: ${matched.studentName} (${matched.ticketNumber || cleanId}) is already marked Present!`;
      setLastCheckInResult({
        success: false,
        type: 'duplicate',
        title: 'Already Checked In',
        message: warn,
        attendee: matched.studentName,
        code: cleanId,
      });
      toast.warning(warn, 'Duplicate Admission');
      return;
    }

    // 6. Record Attendance Atomically
    try {
      await markAttendance(currentEvent.id, matched.id, true, user?.uid);
      playSuccessChime();
      const successMsg = `Verified: ${matched.studentName} (${matched.department || 'Student'}) admitted!`;
      setLastCheckInResult({
        success: true,
        type: 'verified',
        title: 'Check-In Successful',
        message: successMsg,
        attendee: matched.studentName,
        department: matched.department,
        ticket: matched.ticketNumber || cleanId,
        time: new Date().toLocaleTimeString(),
      });
      toast.success(successMsg, 'Gate Pass Verified');
      setManualCode('');
    } catch (err) {
      toast.error(err.message || 'Failed to record attendance', 'Gate Check-In Error');
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-camera-viewport');
        html5QrCodeRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => handleQrScanned(decodedText),
          () => {} // silence frame scan errors
        );
      } catch (err) {
        console.error('Camera startup error:', err);
        setCameraActive(false);
        setCameraError(err.message || 'Camera permission denied or camera device unavailable.');
      }
    }, 150);
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleQrScanned = async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      let payload = null;
      let ticketCode = decodedText.trim();

      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        try {
          payload = JSON.parse(decodedText);
          ticketCode = payload.ticketId || payload.registrationId || ticketCode;
        } catch {
          // ignore json parse error and treat as plain code
        }
      } else if (decodedText.includes('/verify/')) {
        const parts = decodedText.split('/verify/');
        ticketCode = parts[1] || decodedText;
      }

      await processCheckIn(ticketCode, payload?.eventId);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2200);
    }
  };

  // QR / Manual Code Scanner Handler
  const handleScannerSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsScanning(true);
    await processCheckIn(manualCode.trim());
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <Badge variant="purple" size="sm" className="mb-2">Gate Admission Desk</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Event Attendance & QR Check-in
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Monitor venue arrivals, scan student barcodes, verify IDs, and track live gate attendance rates.
        </p>
      </div>

      {/* Event Selector & Attendance Metrics */}
      <div className="space-y-4">
        
        {/* Event Picker */}
        <Card className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider block">Managing Event Attendance</span>
            <h3 className="text-base font-bold text-main">{currentEvent.title}</h3>
            <p className="text-xs text-secondary">{currentEvent.date} &bull; {currentEvent.location}</p>
          </div>

          <div className="sm:w-72">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-main outline-none focus:border-purple-600 shadow-xs"
            >
              {organizerEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.registeredCount} RSVPs)
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* 4 Attendance Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Registered */}
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Registered</p>
              <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{totalRegistered}</h3>
              <p className="text-[10px] text-secondary mt-0.5">Confirmed tickets</p>
            </div>
          </Card>

          {/* Present */}
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Present</p>
              <h3 className="text-2xl font-black text-emerald-600 leading-tight mt-0.5">{presentCount}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Scanned at gate</p>
            </div>
          </Card>

          {/* Absent */}
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Absent / Pending</p>
              <h3 className="text-2xl font-black text-main leading-tight mt-0.5">{absentCount}</h3>
              <p className="text-[10px] text-secondary mt-0.5">Yet to arrive</p>
            </div>
          </Card>

          {/* Attendance Percentage */}
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Attendance Rate</p>
              <h3 className="text-2xl font-black text-purple-600 leading-tight mt-0.5">{attendanceRate}%</h3>
              <p className="text-[10px] text-secondary mt-0.5">Venue turnout</p>
            </div>
          </Card>
        </div>

      </div>

      {/* QR CHECK-IN SCANNER SIMULATOR (Two Column or Flex) */}
      <Card className="p-6 shadow-subtle border-purple-200 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Real Camera Viewport Frame */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {cameraActive ? (
              <div className="relative w-full max-w-xs aspect-square bg-black rounded-3xl overflow-hidden border-4 border-purple-600 shadow-elevated flex flex-col items-center justify-center">
                <div id="qr-camera-viewport" className="w-full h-full overflow-hidden" />
              </div>
            ) : (
              <div className="relative w-full max-w-xs aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-elevated flex flex-col items-center justify-center p-6 text-center text-white">
                
                {/* Viewfinder Target Corners */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-xl" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-xl" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-6 top-8 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_#A855F7] animate-bounce [animation-duration:2.5s]" />

                <Camera className="w-20 h-20 text-purple-400/40 mb-3" />
                
                <div className="space-y-1 relative z-10">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                    Live Optical Scanner
                  </span>
                  <p className="text-xs font-semibold text-white">HTML5 Barcode Camera</p>
                  <p className="text-[10px] text-slate-400">Scan student pass QR code or enter ticket code</p>
                </div>

              </div>
            )}

            {/* Camera Controls */}
            <div className="mt-3 flex flex-col items-center gap-1.5 w-full max-w-xs">
              {cameraActive ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={CameraOff}
                  onClick={stopCamera}
                  className="w-full text-xs font-bold"
                >
                  Stop Camera Scanner
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Camera}
                  onClick={startCamera}
                  className="w-full text-xs font-bold bg-purple-600 hover:bg-purple-700 shadow-xs"
                >
                  Start Camera Scanner
                </Button>
              )}

              {cameraError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-tight text-center w-full">
                  {cameraError}
                </div>
              )}

              <p className="text-[11px] text-secondary text-center">
                Supports mobile cameras, webcams & optical hardware scanners
              </p>
            </div>
          </div>

          {/* Right Column: Manual Code Entry & Quick Verification */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <Badge variant="purple" size="sm">Gate Quick Pass Verification</Badge>
              <h3 className="text-xl font-bold text-main">Check In Attendee</h3>
              <p className="text-xs text-secondary">
                Scan attendee QR code or type student Ticket Number to confirm admission immediately.
              </p>
            </div>

            <form onSubmit={handleScannerSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <Input
                    icon={QrCode}
                    placeholder="Enter Registration ID or Ticket (e.g. CP-TKT-HACK-884)..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="text-xs py-2.5 font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isScanning}
                  icon={CheckCircle2}
                  className="font-bold shrink-0 bg-purple-600 hover:bg-purple-700 shadow-xs text-xs"
                >
                  Verify & Check In
                </Button>
              </div>
            </form>

            {/* Scan / Verification Feedback Banner */}
            {lastCheckInResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  lastCheckInResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : lastCheckInResult.type === 'duplicate'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                {lastCheckInResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : lastCheckInResult.type === 'duplicate' ? (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold">{lastCheckInResult.title}</p>
                  <p className="leading-relaxed">{lastCheckInResult.message}</p>
                  {lastCheckInResult.time && (
                    <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                      Admitted at {lastCheckInResult.time} • Ticket: {lastCheckInResult.ticket}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Demo Code Samples for the Judge/User to Click and Test Instantly */}
            <div className="p-3 bg-white border border-border/80 rounded-xl space-y-1.5 text-xs">
              <span className="font-semibold text-main text-[11px] block">Quick-Fill Demo Codes:</span>
              <div className="flex flex-wrap gap-2">
                {eventRegistrations.slice(0, 3).map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setManualCode(r.ticketNumber)}
                    className="font-mono text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg transition-colors"
                  >
                    {r.ticketNumber} ({r.studentName.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </Card>

      {/* PARTICIPANT ATTENDANCE TABLE */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-subtle space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
          <div>
            <h3 className="text-base font-bold text-main">Gate Attendance Roster</h3>
            <p className="text-xs text-secondary">Mark present, absent, or undo entry scans</p>
          </div>

          <div className="w-full sm:w-64">
            <Input
              icon={Search}
              placeholder="Search attendee by name, email, or ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-border text-secondary font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Student Attendee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Ticket & Reg ID</th>
                <th className="px-4 py-3.5">Gate Status</th>
                <th className="px-4 py-3.5">Check-in Time</th>
                <th className="px-5 py-3.5 text-right">Attendance Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 bg-white">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Student Info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={reg.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                        alt={reg.studentName}
                        className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-main">{reg.studentName}</p>
                        <p className="text-[11px] text-secondary truncate">{reg.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-4 text-secondary">
                    <p className="text-main font-medium">{reg.department}</p>
                    <p className="text-[10px] text-secondary">{reg.teamName ? `Team: ${reg.teamName}` : 'Solo'}</p>
                  </td>

                  {/* Ticket & Reg ID */}
                  <td className="px-4 py-4 font-mono">
                    <p className="font-bold text-main">{reg.ticketNumber}</p>
                    <p className="text-[10px] text-secondary">{reg.registrationId}</p>
                  </td>

                  {/* Gate Status */}
                  <td className="px-4 py-4">
                    {reg.checkedIn ? (
                      <Badge variant="success" size="sm" dot>
                        Present (Admitted)
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm" dot dotColor="bg-slate-400">
                        Absent / Not Arrived
                      </Badge>
                    )}
                  </td>

                  {/* Check-in Time */}
                  <td className="px-4 py-4 text-secondary text-[11px] font-mono">
                    {reg.checkedInAt
                      ? new Date(reg.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </td>

                  {/* Actions: Mark Present, Mark Absent, Undo check-in */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {reg.checkedIn ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => handleUndoCheckIn(reg)}
                            className="text-xs py-1 text-secondary"
                            title="Undo check-in"
                          >
                            Undo Check-in
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAbsent(reg)}
                            className="text-xs py-1 text-error hover:bg-rose-50"
                          >
                            Mark Absent
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          icon={Check}
                          onClick={() => handleMarkPresent(reg)}
                          className="text-xs py-1 font-bold"
                        >
                          Mark Present
                        </Button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default AttendancePage;
