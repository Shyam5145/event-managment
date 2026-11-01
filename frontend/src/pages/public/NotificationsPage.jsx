import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Ticket, 
  Calendar, 
  Award, 
  Sparkles, 
  AlertCircle, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card, { CardContent } from '../../components/common/Card';

export const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    addNotification 
  } = useNotifications();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'Passes', label: 'Passes & Tickets', count: notifications.filter((n) => n.category === 'Passes').length },
    { id: 'Events', label: 'Events & Updates', count: notifications.filter((n) => n.category === 'Events').length },
    { id: 'Certificates', label: 'Certificates', count: notifications.filter((n) => n.category === 'Certificates').length },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'pass':
        return <Ticket className="w-5 h-5 text-primary" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'certificate':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'event':
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
      case 'cancel':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-secondary" />;
    }
  };

  const handleSimulateTestAlert = () => {
    addNotification({
      title: 'Workshop Seat Confirmed',
      message: 'You have been admitted from the waitlist into UI/UX Design Sprint Masterclass!',
      type: 'pass',
      category: 'Passes',
      link: '/student/registrations',
    });
    toast.success('Simulated incoming campus notification');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-main tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-xs text-secondary">
              Real-time campus updates, registration confirmations, and certificate releases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateTestAlert}
              className="text-xs font-semibold"
            >
              + Simulate Alert
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  markAllAsRead();
                  toast.success('All notifications marked as read');
                }}
                icon={CheckCheck}
                className="text-xs font-semibold"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-4 border-b border-border/60 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-main hover:bg-slate-100 bg-surface'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="mt-6 space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  !notif.read
                    ? 'bg-white border-primary/30 shadow-xs ring-1 ring-primary/10'
                    : 'bg-surface border-border hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                    {getIconForType(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm tracking-tight ${!notif.read ? 'font-bold text-main' : 'font-semibold text-slate-800'}`}>
                            {notif.title}
                          </h3>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mt-0.5">
                          {notif.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3 text-secondary" />
                          {notif.timestamp}
                        </span>

                        <button
                          onClick={() => {
                            deleteNotification(notif.id);
                            toast.info('Notification dismissed');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      {notif.link && (
                        <button
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(notif.link);
                          }}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-secondary hover:text-main font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="py-16 text-center bg-surface border border-dashed border-border rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-secondary">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-main mb-1">
                No notifications in this folder
              </h3>
              <p className="text-xs text-secondary max-w-sm mx-auto mb-5">
                {activeFilter === 'unread'
                  ? 'All caught up! You have read all recent alerts.'
                  : 'You have no notifications in this category right now.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                Show All Notifications
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;

