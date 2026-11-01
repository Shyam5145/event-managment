import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

// Route Guards
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleProtectedRoute from '../components/common/RoleProtectedRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import EventsPage from '../pages/public/EventsPage';
import EventDetailPage from '../pages/public/EventDetailPage';
import LoginPage from '../pages/public/LoginPage';
import SignupPage from '../pages/public/SignupPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import NotificationsPage from '../pages/public/NotificationsPage';
import ClubProfilePage from '../pages/public/ClubProfilePage';
import RecommendationsPage from '../pages/public/RecommendationsPage';
import HelpCenterPage from '../pages/public/HelpCenterPage';
import TicketVerificationPage from '../pages/public/TicketVerificationPage';

// Onboarding Pages
import InterestSelectionPage from '../pages/student/InterestSelectionPage';
import OrganizerOnboardingPage from '../pages/organizer/OrganizerOnboardingPage';

// Student Dashboard Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import MyRegistrationsPage from '../pages/student/MyRegistrationsPage';
import StudentSchedulePage from '../pages/student/StudentSchedulePage';
import BookmarksPage from '../pages/student/BookmarksPage';
import StudentCertificatesPage from '../pages/student/StudentCertificatesPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentSettingsPage from '../pages/student/StudentSettingsPage';

// Organizer Pages
import OrganizerDashboard from '../pages/organizer/OrganizerDashboard';
import CreateEventPage from '../pages/organizer/CreateEventPage';
import EditEventPage from '../pages/organizer/EditEventPage';
import ManageEventsPage from '../pages/organizer/ManageEventsPage';
import ParticipantManagementPage from '../pages/organizer/ParticipantManagementPage';
import AttendancePage from '../pages/organizer/AttendancePage';
import WaitlistPage from '../pages/organizer/WaitlistPage';
import OrganizerAnalyticsPage from '../pages/organizer/OrganizerAnalyticsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/clubs/:id" element={<ClubProfilePage />} />
      <Route path="/recommendations" element={<RecommendationsPage />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/verify/:ticketId" element={<TicketVerificationPage />} />
      <Route path="/verify" element={<TicketVerificationPage />} />

      {/* Onboarding Routes */}
      <Route
        path="/onboarding/interests"
        element={
          <ProtectedRoute>
            <InterestSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboard-organizer"
        element={
          <RoleProtectedRoute allowedRoles={['organizer', 'admin']}>
            <OrganizerOnboardingPage />
          </RoleProtectedRoute>
        }
      />

      {/* Student Portal Routes */}
      <Route
        path="/student"
        element={
          <RoleProtectedRoute allowedRoles={['student', 'admin']}>
            <DashboardLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="registrations" element={<MyRegistrationsPage />} />
        <Route path="saved" element={<BookmarksPage />} />
        <Route path="bookmarks" element={<Navigate to="/student/saved" replace />} />
        <Route path="calendar" element={<StudentSchedulePage />} />
        <Route path="schedule" element={<Navigate to="/student/calendar" replace />} />
        <Route path="certificates" element={<StudentCertificatesPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="settings" element={<StudentSettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Organizer Portal Routes */}
      <Route
        path="/organizer"
        element={
          <RoleProtectedRoute allowedRoles={['organizer', 'admin']}>
            <DashboardLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<OrganizerDashboard />} />
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="events" element={<ManageEventsPage />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="events/:id/edit" element={<EditEventPage />} />
        <Route path="participants" element={<ParticipantManagementPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="waitlist" element={<WaitlistPage />} />
        <Route path="roster" element={<ParticipantManagementPage />} />
        <Route path="analytics" element={<OrganizerAnalyticsPage />} />
        <Route path="club-profile" element={<ClubProfilePage />} />
        <Route path="profile" element={<Navigate to="/organizer/club-profile" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
