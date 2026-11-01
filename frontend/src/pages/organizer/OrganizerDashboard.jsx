import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  PlusCircle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  BarChart3,
  Edit3,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { isFirebaseConfigured } from '../../services/firebase.js';
import { getEventsByOrganizer } from '../../services/eventService.js';
import { getEventParticipants } from '../../services/registrationService.js';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const { events, registrations } = useEvents();

  const [loading, setLoading] = useState(false);
  const [remoteEvents, setRemoteEvents] = useState(null);
  const [recentAttendees, setRecentAttendees] = useState([]);

  // Fetch organizer-isolated events from Cloud Firestore
  useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid) return;

    let isMounted = true;
    setLoading(true);

    getEventsByOrganizer(user.uid)
      .then(async (fetchedEvents) => {
        if (!isMounted) return;
        setRemoteEvents(fetchedEvents);

        // Fetch recent participants for their primary active event
        if (fetchedEvents && fetchedEvents.length > 0) {
          try {
            const firstEvent = fetchedEvents[0];
            const participants = await getEventParticipants(firstEvent.id, user.uid);
            if (isMounted) {
              setRecentAttendees(participants.slice(0, 5));
            }
          } catch (pErr) {
            console.debug('Could not load recent participants:', pErr);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch organizer events from Firestore:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Isolate events to current organizer
  // (Admins can view all events; Organizers only see their own)
  const organizerEvents = (remoteEvents !== null
    ? remoteEvents
    : events.filter((e) =>
        !user?.uid ||
        user?.role === 'admin' ||
        e.organizerId === user.uid ||
        e.organizer === user.name ||
        e.organizer?.name === user.name
      )
  );

  // Key Performance Indicators (strictly scoped to this organizer)
  const totalRegistrations = organizerEvents.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalCapacity = organizerEvents.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
  const publishedCount = organizerEvents.filter((e) => e.status === 'published' || !e.status).length;
  const draftCount = organizerEvents.filter((e) => e.status === 'draft').length;

  // Chart data for organizer's events
  const chartData = organizerEvents.slice(0, 5).map((e) => ({
    name: e.title.length > 18 ? e.title.substring(0, 18) + '...' : e.title,
    registered: e.registeredCount || 0,
    capacity: e.capacity || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-subtle">
        <div>
          <Badge variant="purple" size="sm" className="mb-1.5">Organizer Studio</Badge>
          <h1 className="text-2xl font-black text-main tracking-tight">
            {user?.clubName || user?.name || 'Tech Club'}&apos;s Command Center
          </h1>
          <p className="text-xs text-secondary mt-1">
            {user?.organization || user?.clubName || 'Campus Events Host'} &bull; Real-time event analytics & management
          </p>
        </div>

        <Link to="/organizer/events/create">
          <Button variant="primary" size="md" icon={PlusCircle}>
            Create New Event
          </Button>
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Total RSVPs</span>
            <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-main mt-2">{totalRegistrations}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Across your portfolio</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Published Events</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-main mt-2">{publishedCount}</p>
          <p className="text-[11px] text-secondary mt-1">{draftCount} drafts saved</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Seat Occupancy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-main mt-2">{overallOccupancy}%</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Campus fill rate</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Attendance Desk</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">Ready</p>
          <Link to="/organizer/attendance" className="text-[11px] text-primary font-semibold hover:underline mt-1 block">
            Launch QR check-in &rarr;
          </Link>
        </Card>
      </div>

      {/* Analytics Chart & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Chart (2 cols) */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-main">Registration Fill Rates</h3>
              <p className="text-xs text-secondary mt-0.5">Attendee registrations vs seat capacity by event</p>
            </div>
            <Badge variant="primary" size="sm">
              {isFirebaseConfigured ? 'Live Cloud Firestore' : 'Portfolio Metrics'}
            </Badge>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)'
                    }} 
                  />
                  <Bar dataKey="registered" name="Registered" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="capacity" name="Total Capacity" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl">
              <BarChart3 className="w-10 h-10 text-secondary opacity-40 mb-2" />
              <p className="text-xs font-semibold text-main">No Events In Portfolio</p>
              <p className="text-[11px] text-secondary mt-1">Create an event to view capacity and registration charts.</p>
            </div>
          )}
        </Card>

        {/* Quick Tools & Shortcuts (1 col) */}
        <Card className="p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-main">Quick Actions</h3>
            <p className="text-xs text-secondary mt-0.5">Streamlined organizer utilities</p>

            <div className="mt-5 space-y-3">
              <Link to="/organizer/events/create" className="block">
                <Button variant="outline" fullWidth size="md" className="justify-start text-xs font-semibold" icon={PlusCircle}>
                  Publish New Event
                </Button>
              </Link>

              <Link to="/organizer/participants" className="block">
                <Button variant="outline" fullWidth size="md" className="justify-start text-xs font-semibold" icon={Users}>
                  Participant Rosters & CSV
                </Button>
              </Link>

              <Link to="/organizer/attendance" className="block">
                <Button variant="outline" fullWidth size="md" className="justify-start text-xs font-semibold" icon={CheckCircle2}>
                  Gate QR Scanner & Attendance
                </Button>
              </Link>

              <Link to="/organizer/events" className="block">
                <Button variant="outline" fullWidth size="md" className="justify-start text-xs font-semibold" icon={Edit3}>
                  Manage Event Portfolio
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-border text-xs text-secondary space-y-1">
              <p className="font-semibold text-main">Organizer Protection Active:</p>
              <p>You are viewing only events created under your organizer UID. Other clubs cannot alter your listings.</p>
            </div>
          </div>
        </Card>

      </div>

      {/* Events Table (Published, Drafts, and Capacity) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-main">Your Event Portfolio</h3>
          <Link to="/organizer/events" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            Manage All ({organizerEvents.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {organizerEvents.length > 0 ? (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-border text-secondary font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Event Name</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Registrations</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {organizerEvents.slice(0, 6).map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-semibold text-main max-w-xs truncate">
                        <Link to={`/events/${evt.id}`} className="hover:text-primary">
                          {evt.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="primary" size="sm" className="capitalize">{evt.category}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={evt.status === 'published' ? 'success' : evt.status === 'draft' ? 'default' : 'danger'}
                          size="sm"
                          className="capitalize"
                        >
                          {evt.status || 'published'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-secondary">{evt.date}</td>
                      <td className="px-4 py-4 font-medium text-main">
                        <span className="font-bold">{evt.registeredCount || 0}</span> / {evt.capacity}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/organizer/events/${evt.id}/edit`}>
                            <Button variant="outline" size="sm" icon={Edit3} className="text-xs py-1">
                              Edit
                            </Button>
                          </Link>
                          <Link to={`/events/${evt.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs py-1">
                              Preview
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Card className="p-10 text-center border-dashed space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-main">No Events In Your Portfolio</h4>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                Create your club&apos;s first event to start accepting registrations, tracking seat occupancy, and managing attendee check-ins.
              </p>
            </div>
            <Link to="/organizer/events/create" className="inline-block pt-1">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Create Your First Event
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
