import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Bookmark,
  PlusCircle,
  FolderKanban,
  Users,
  Compass,
  ArrowLeftRight,
  LogOut,
  Sparkles,
  Award,
  User,
  Settings as SettingsIcon,
  QrCode,
  Clock3,
  BarChart3,
  Building2,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../common/Badge';

export const Sidebar = ({ onCloseMobile }) => {
  const { user, role, switchRole, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const studentNavItems = [
    { label: 'Overview', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Discover Events', to: '/events', icon: Compass },
    { label: 'My Registrations', to: '/student/registrations', icon: CalendarCheck },
    { label: 'Saved Events', to: '/student/saved', icon: Bookmark },
    { label: 'Calendar', to: '/student/calendar', icon: Calendar },
    { label: 'Certificates', to: '/student/certificates', icon: Award },
    { label: 'Notifications', to: '/student/notifications', icon: Bell },
    { label: 'Profile', to: '/student/profile', icon: User },
    { label: 'Settings', to: '/student/settings', icon: SettingsIcon },
  ];

  const organizerNavItems = [
    { label: 'Overview', to: '/organizer/dashboard', icon: LayoutDashboard },
    { label: 'Manage Events', to: '/organizer/events', icon: FolderKanban },
    { label: 'Create New Event', to: '/organizer/events/create', icon: PlusCircle },
    { label: 'Participant Management', to: '/organizer/participants', icon: Users },
    { label: 'Gate Attendance & Scanner', to: '/organizer/attendance', icon: QrCode },
    { label: 'Waitlist Queue', to: '/organizer/waitlist', icon: Clock3 },
    { label: 'Event Analytics', to: '/organizer/analytics', icon: BarChart3 },
    { label: 'Club Public Profile', to: '/organizer/club-profile', icon: Building2 },
    { label: 'Browse Campus Events', to: '/events', icon: Compass },
  ];

  const navItems = role === 'organizer' ? organizerNavItems : studentNavItems;

  const handleRoleToggle = () => {
    const nextRole = role === 'student' ? 'organizer' : 'student';
    switchRole(nextRole);
    toast.info(`Switched view to ${nextRole.charAt(0).toUpperCase() + nextRole.slice(1)} Mode`);
    if (nextRole === 'organizer') {
      navigate('/organizer/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out of student session');
    navigate('/login');
  };

  return (
    <aside className="w-64 flex flex-col flex-shrink-0 border-r border-border bg-surface h-full min-h-[calc(100vh-4rem)]">
      {/* Role / Context Banner */}
      <div className="p-4 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            {role === 'organizer' ? 'Organizer Studio' : 'Student Portal'}
          </span>
        </div>
        <Badge variant={role === 'organizer' ? 'purple' : 'primary'} size="sm" className="capitalize">
          {role}
        </Badge>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold text-secondary uppercase tracking-wider">
          Student Portal
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-secondary hover:text-main hover:bg-slate-100/70'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Info, Quick Role Switch & Logout Footer */}
      <div className="p-3 border-t border-border/80 space-y-2 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white border border-border/80 shadow-xs">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={user?.name || 'User'}
            className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-main truncate">{user?.name || 'Rahul Sharma'}</p>
            <p className="text-[11px] text-secondary truncate">{user?.email || 'rahul.sharma@campus.edu'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRoleToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-main bg-white hover:bg-slate-100 border border-border rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
          <span>Switch to {role === 'student' ? 'Organizer' : 'Student'}</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-error hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
