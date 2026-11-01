import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Compass, 
  Grid, 
  Info, 
  Menu, 
  X, 
  UserCheck, 
  LogOut, 
  LayoutDashboard, 
  PlusCircle, 
  ChevronDown,
  BookmarkCheck,
  Calendar,
  Bell,
  Search,
  CheckCheck,
  Trash2,
  ExternalLink,
  Flame,
  HelpCircle,
  Building2,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import AuthModal from '../common/AuthModal';
import GlobalSearchModal from '../common/GlobalSearchModal';

export const Navbar = () => {
  const { user, role, isAuthenticated, switchRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const roleRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRoleChange = (newRole) => {
    switchRole(newRole);
    setRoleDropdownOpen(false);
    toast.info(`Switched view to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} Mode`);
    if (newRole === 'organizer') {
      navigate('/organizer/dashboard');
    } else if (newRole === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleNavScroll = (hashId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${hashId}`);
    } else {
      const element = document.getElementById(hashId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setNotifDropdownOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-6 lg:gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:bg-primary-hover transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-main tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                    CampusPulse
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                  <span className="text-[10px] text-secondary -mt-1 font-medium">College Event Hub</span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/events"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/events')
                      ? 'text-primary bg-primary-light/60 font-semibold'
                      : 'text-secondary hover:text-main hover:bg-slate-100/80'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Discover
                </Link>

                <button
                  type="button"
                  onClick={() => handleNavScroll('categories')}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-secondary hover:text-main hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
                >
                  <Grid className="w-4 h-4" />
                  Categories
                </button>

                <Link
                  to="/recommendations"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/recommendations')
                      ? 'text-primary bg-primary-light/60 font-semibold'
                      : 'text-secondary hover:text-main hover:bg-slate-100/80'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  Picks
                </Link>

                <Link
                  to="/help"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/help')
                      ? 'text-primary bg-primary-light/60 font-semibold'
                      : 'text-secondary hover:text-main hover:bg-slate-100/80'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Help
                </Link>
              </nav>
            </div>

            {/* Middle Quick Search Pill (Desktop) */}
            <div className="hidden lg:flex items-center">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-secondary bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/90 rounded-full transition-all group w-52 xl:w-64"
              >
                <Search className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-colors" />
                <span className="flex-1 text-left truncate">Search events, clubs...</span>
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Section Actions & Profile */}
            <div className="hidden md:flex items-center gap-2.5">
              
              {/* Search button for medium screens */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="lg:hidden p-2 text-secondary hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                title="Search (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 text-secondary hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-2xl border border-border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-main">Notifications</span>
                        {unreadCount > 0 && (
                          <Badge variant="primary" size="sm">
                            {unreadCount} new
                          </Badge>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllAsRead();
                            toast.success('All marked as read');
                          }}
                          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                              !n.read ? 'bg-primary-light/20' : ''
                            }`}
                          >
                            <div className="pt-0.5">
                              {!n.read ? (
                                <span className="w-2 h-2 rounded-full bg-primary block" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 block" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className={`text-xs truncate ${!n.read ? 'font-bold text-main' : 'font-medium text-slate-700'}`}>
                                  {n.title}
                                </h5>
                                <span className="text-[10px] text-secondary shrink-0">{n.timestamp}</span>
                              </div>
                              <p className="text-xs text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                                  {n.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-secondary text-xs">
                          No notifications yet.
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-border bg-slate-50/60 flex items-center justify-between px-4">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View all notifications →
                      </Link>
                      <span className="text-[11px] text-secondary">
                        CampusPulse Live
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Role Switcher Pill - Demo Persona Switcher */}
              <div className="relative" ref={roleRef}>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-border bg-slate-50 hover:bg-slate-100 text-main transition-colors shadow-2xs"
                >
                  <span className="text-secondary">Role:</span>
                  <span className="capitalize text-primary font-bold">{role}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-secondary" />
                </button>

                {roleDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-surface rounded-xl border border-border shadow-elevated py-1.5 z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-secondary uppercase tracking-wider border-b border-border/50">
                      Switch Demo Persona
                    </div>
                    <button
                      onClick={() => handleRoleChange('student')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        role === 'student' ? 'text-primary font-semibold bg-primary-light/40' : 'text-main'
                      }`}
                    >
                      <span>Student (Rahul Sharma)</span>
                      {role === 'student' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                    <button
                      onClick={() => handleRoleChange('organizer')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        role === 'organizer' ? 'text-primary font-semibold bg-primary-light/40' : 'text-main'
                      }`}
                    >
                      <span>Organizer (Tech Club)</span>
                      {role === 'organizer' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                    <button
                      onClick={() => handleRoleChange('guest')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        role === 'guest' ? 'text-primary font-semibold bg-primary-light/40' : 'text-main'
                      }`}
                    >
                      <span>Public / Guest View</span>
                      {role === 'guest' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  </div>
                )}
              </div>

              {/* If Authenticated: Link to Dashboard + Avatar */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard'}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-main transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                    Dashboard
                  </Link>

                  <div className="relative" ref={userRef}>
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                    >
                      <img
                        src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={user?.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                    </button>

                    {userDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-surface rounded-xl border border-border shadow-elevated py-1.5 z-50 animate-in fade-in zoom-in-95"
                      >
                        <div className="px-4 py-2.5 border-b border-border/60">
                          <p className="text-sm font-semibold text-main truncate">{user?.name}</p>
                          <p className="text-xs text-secondary truncate">{user?.email}</p>
                          <Badge variant="primary" size="sm" className="mt-1.5 capitalize">
                            {role}
                          </Badge>
                        </div>
                        
                        <Link
                          to={role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard'}
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-main hover:bg-slate-50 flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-secondary" />
                          Dashboard
                        </Link>

                        {role === 'student' && (
                          <>
                            <Link
                              to="/student/registrations"
                              onClick={() => setUserDropdownOpen(false)}
                              className="w-full text-left px-4 py-2 text-xs text-main hover:bg-slate-50 flex items-center gap-2"
                            >
                              <BookmarkCheck className="w-4 h-4 text-secondary" />
                              My Registrations
                            </Link>
                            <Link
                              to="/student/certificates"
                              onClick={() => setUserDropdownOpen(false)}
                              className="w-full text-left px-4 py-2 text-xs text-main hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Award className="w-4 h-4 text-secondary" />
                              Certificates
                            </Link>
                          </>
                        )}

                        {role === 'organizer' && (
                          <Link
                            to="/organizer/club-profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="w-full text-left px-4 py-2 text-xs text-main hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Building2 className="w-4 h-4 text-secondary" />
                            Club Public Profile
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                            toast.info('Signed out of demo account');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-error hover:bg-red-50 flex items-center gap-2 border-t border-border/40 mt-1"
                        >
                          <LogOut className="w-4 h-4 text-error" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenAuth('login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenAuth('signup')}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu & Search Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2 text-secondary hover:text-primary rounded-lg"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-secondary hover:text-primary rounded-lg"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-secondary hover:text-main hover:bg-slate-100 transition-colors"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-surface px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-1">
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-main hover:bg-slate-100"
              >
                Discover Events
              </Link>
              <Link
                to="/recommendations"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-main hover:bg-slate-100 flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-500" />
                Campus Picks
              </Link>
              <button
                type="button"
                onClick={() => handleNavScroll('categories')}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg text-main hover:bg-slate-100"
              >
                Categories
              </button>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-main hover:bg-slate-100 flex items-center justify-between"
              >
                <span>Notifications</span>
                {unreadCount > 0 && <Badge variant="primary" size="sm">{unreadCount} unread</Badge>}
              </Link>
              <Link
                to="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-main hover:bg-slate-100"
              >
                Help & FAQs
              </Link>
              {isAuthenticated && (
                <Link
                  to={role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-primary bg-primary-light/50 font-semibold"
                >
                  Go to {role === 'organizer' ? 'Organizer' : 'Student'} Dashboard
                </Link>
              )}
            </nav>

            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenAuth('login')}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAuth('signup')}
                >
                  Get Started
                </Button>
              </div>
            )}

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <span className="text-xs font-semibold text-secondary uppercase">Quick Switch Persona</span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={role === 'student' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleRoleChange('student');
                    setMobileMenuOpen(false);
                  }}
                >
                  Student
                </Button>
                <Button
                  variant={role === 'organizer' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleRoleChange('organizer');
                    setMobileMenuOpen(false);
                  }}
                >
                  Organizer
                </Button>
                <Button
                  variant={role === 'guest' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleRoleChange('guest');
                    setMobileMenuOpen(false);
                  }}
                >
                  Guest
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Overlay Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Auth Modal for Login and Get Started */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Navbar;
