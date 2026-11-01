import React, { useState } from 'react';
import { 
  Bell, 
  Shield, 
  RotateCcw, 
  Moon, 
  Sun, 
  Check, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const StudentSettingsPage = () => {
  const { resetAllData } = useEvents();
  const toast = useToast();

  const [settings, setSettings] = useState({
    emailPasses: true,
    reminderAlerts: true,
    waitlistNotifs: true,
    marketingClubNews: false,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preference updated');
  };

  const handleResetData = () => {
    resetAllData();
    toast.info('Demo state restored to original factory mock data', 'Data Reset');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Badge variant="primary" size="sm" className="mb-2">Platform Preferences</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Settings & Notifications
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Customize your email alerts, reminders, and manage hackathon demo data.
        </p>
      </div>

      <div className="space-y-5">
        
        {/* Notification Settings */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-border/80 pb-3">
            <h3 className="text-base font-bold text-main">Notification Preferences</h3>
            <p className="text-xs text-secondary mt-0.5">Control what updates you receive about your event passes</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border/70">
              <div>
                <p className="text-xs font-bold text-main">Digital Ticket Confirmations</p>
                <p className="text-[11px] text-secondary">Receive ticket pass and QR receipt immediately upon registration</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailPasses}
                onChange={() => toggleSetting('emailPasses')}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border/70">
              <div>
                <p className="text-xs font-bold text-main">Event Kickoff Reminders</p>
                <p className="text-[11px] text-secondary">Get 24-hour and 2-hour reminders before your scheduled events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.reminderAlerts}
                onChange={() => toggleSetting('reminderAlerts')}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border/70">
              <div>
                <p className="text-xs font-bold text-main">Waitlist Queue Alerts</p>
                <p className="text-[11px] text-secondary">Notify me instantly if a seat opens up for an event I am waitlisted for</p>
              </div>
              <input
                type="checkbox"
                checked={settings.waitlistNotifs}
                onChange={() => toggleSetting('waitlistNotifs')}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
            </div>
          </div>
        </Card>

        {/* Demo Data Management */}
        <Card className="p-6 space-y-4 border-error/20">
          <div className="border-b border-border/80 pb-3">
            <h3 className="text-base font-bold text-main">Demo State Reset</h3>
            <p className="text-xs text-secondary mt-0.5">Restore all events, registrations, and bookmarks to initial demo factory state</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-secondary max-w-md">
              Clears changes saved in browser <code className="text-main font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code> and resets sample registrations.
            </p>

            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetData}
              className="text-error hover:bg-rose-50 hover:border-error text-xs font-semibold"
            >
              Reset Demo Data
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default StudentSettingsPage;

