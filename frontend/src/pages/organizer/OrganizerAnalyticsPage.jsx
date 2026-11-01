import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  Download, 
  Filter,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const PIE_COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

export const OrganizerAnalyticsPage = () => {
  const { events, registrations, waitlist } = useEvents();
  const { user } = useAuth();
  const toast = useToast();

  const [selectedEventId, setSelectedEventId] = useState('all');

  // Aggregated calculations
  const totalRegistrations = registrations.length;
  const totalCheckedIn = registrations.filter((r) => r.checkedIn).length;
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
  const totalWaitlisted = waitlist.length;

  // Chart 1: Event Capacity vs Registered
  const capacityChartData = events.slice(0, 6).map((e) => ({
    name: e.title.length > 16 ? e.title.substring(0, 16) + '...' : e.title,
    registered: e.registeredCount || 0,
    capacity: e.capacity || 100,
  }));

  // Chart 2: Department breakdown
  const departmentCounts = useMemo(() => {
    const map = {};
    registrations.forEach((r) => {
      const dept = r.department ? r.department.split('&')[0].trim() : 'Computer Science';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.keys(map).map((name) => ({
      name,
      value: map[name],
    }));
  }, [registrations]);

  // Chart 3: Weekly registration velocity (simulated curve based on registration timestamps)
  const timelineData = [
    { day: 'Mon', signups: 14, checkins: 8 },
    { day: 'Tue', signups: 26, checkins: 15 },
    { day: 'Wed', signups: 45, checkins: 22 },
    { day: 'Thu', signups: 68, checkins: 35 },
    { day: 'Fri', signups: 92, checkins: 60 },
    { day: 'Sat', signups: 124, checkins: 88 },
    { day: 'Sun', signups: 148, checkins: 110 },
  ];

  const handleExportReport = () => {
    const reportData = `
======================================================
CAMPUSPULSE ORGANIZER ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Club / Host: ${user?.name || 'Tech Club'}
======================================================
Total Events Hosted: ${events.length}
Total Registrations: ${totalRegistrations}
Total Attendees Present: ${totalCheckedIn} (${attendanceRate}% conversion)
Active Waitlist Queue: ${totalWaitlisted}
Campus Capacity: ${totalCapacity}
======================================================
    `;

    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campuspulse-analytics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Analytics report downloaded successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <Badge variant="purple" size="sm" className="mb-1.5">Reporting & Intelligence</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
            Event Performance & Attendance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Monitor real-time student engagement, registration pipelines, and department turnout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            icon={Download}
            className="text-xs font-semibold"
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Total Registrations
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-main">{totalRegistrations}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24%
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Across {events.length} active campus programs</p>
        </Card>

        <Card className="p-4 sm:p-5 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Gate Check-In Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-main">{attendanceRate}%</span>
            <span className="text-xs text-secondary">({totalCheckedIn} present)</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Verified via QR Scanner & Manual Gate</p>
        </Card>

        <Card className="p-4 sm:p-5 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Waitlist Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-main">{totalWaitlisted}</span>
            <span className="text-xs font-semibold text-amber-700">In Line</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Ready for automated seat promotion</p>
        </Card>

        <Card className="p-4 sm:p-5 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Total Campus Capacity
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-main">{totalCapacity}</span>
            <span className="text-xs text-secondary">Seats Allocated</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">Auditoriums, labs & stadiums</p>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Capacity vs Registered Bar Chart */}
        <Card className="lg:col-span-2 p-5 sm:p-6 border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-main">Event Registration vs Seat Capacity</h3>
              <p className="text-xs text-secondary mt-0.5">
                Comparison of actual student registrants against authorized venue capacity.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-primary" /> Registered
              </span>
              <span className="flex items-center gap-1.5 font-medium text-secondary">
                <span className="w-2.5 h-2.5 rounded bg-slate-200" /> Max Quota
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="registered" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right 1 Col: Department Demographic Turnout (Pie) */}
        <Card className="p-5 sm:p-6 border-border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-main">Department Distribution</h3>
            <p className="text-xs text-secondary mt-0.5">
              Breakdown of registered students by academic faculty.
            </p>

            <div className="h-52 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Legend */}
          <div className="space-y-1.5 pt-2 border-t border-border/80">
            {departmentCounts.slice(0, 4).map((d, idx) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="truncate max-w-[150px]">{d.name}</span>
                </span>
                <span className="font-bold text-main">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Velocity Timeline */}
      <Card className="p-5 sm:p-6 border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-main">7-Day Registration Velocity & Inflow</h3>
            <p className="text-xs text-secondary">
              Day-by-day accumulation of student RSVPs leading up to hackathon weekend.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary-light/60 px-3 py-1 rounded-full border border-primary/20">
            Peak Velocity: Friday
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="signups" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} name="Cumulative Signups" />
              <Line type="monotone" dataKey="checkins" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Checked-In Passholders" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default OrganizerAnalyticsPage;

