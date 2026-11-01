import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu, X, Bell, ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { role, user } = useAuth();
  const location = useLocation();

  // Create simple readable breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentTitle = pathParts[pathParts.length - 1] || 'Dashboard';
  const formattedTitle = currentTitle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface shadow-xl z-10 animate-in slide-in-from-left">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <span className="font-bold text-main">Navigation Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-secondary hover:text-main"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Dashboard Workspace Content Area */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top Dashboard Header Sub-bar */}
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 bg-surface border-b border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-border text-secondary hover:text-main"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-secondary">
                <Link to="/" className="hover:text-main flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="capitalize">{role}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-main">{formattedTitle}</span>
              </div>
            </div>

            <div className="text-xs text-secondary hidden sm:flex items-center gap-2">
              <span>Logged in as:</span>
              <span className="font-medium text-main">{user?.name}</span>
            </div>
          </div>

          {/* Main nested route page */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

