import React from 'react';
import { Sparkles, Heart, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-main tracking-tight">CampusPulse</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              The unified event platform empowering collegiate clubs, organizers, and students to discover and host world-class campus experiences.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-main uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link to="/events" className="hover:text-primary">Discover Events</Link></li>
              <li><Link to="/recommendations" className="hover:text-primary">Curated Picks</Link></li>
              <li><Link to="/notifications" className="hover:text-primary">Notifications</Link></li>
              <li><Link to="/help" className="hover:text-primary">Help & FAQs</Link></li>
              <li><Link to="/student" className="hover:text-primary">Student Schedule</Link></li>
              <li><Link to="/organizer" className="hover:text-primary">Host an Event</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-main uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><span className="hover:text-primary cursor-pointer">Tech & Hackathons</span></li>
              <li><span className="hover:text-primary cursor-pointer">Workshops & Seminars</span></li>
              <li><span className="hover:text-primary cursor-pointer">Cultural & Arts</span></li>
              <li><span className="hover:text-primary cursor-pointer">Career & Networking</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-main uppercase tracking-wider mb-3">Hackathon Demo</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Built with React, Vite, Tailwind CSS, Lucide Icons & Recharts. Local state with localStorage persistence.
            </p>
            <div className="mt-3 flex items-center gap-3 text-secondary">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Frontend Only &bull; Ready to Demo
              </span>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <p>&copy; {new Date().getFullYear()} CampusPulse. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for campus innovation with modern UI/UX
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

