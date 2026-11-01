import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Mail, 
  Lock, 
  Calendar, 
  Users 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const LoginPage = () => {
  const { login, loginAsDemo, resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Forgot Password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'College email is required';
    } else if (!email.includes('@')) {
      errs.email = 'Please enter a valid email format';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email, password);
      const userRole = result?.role || 'student';
      const displayName = result?.user?.name || (userRole === 'organizer' ? 'Tech Club' : 'Student');

      toast.success(
        `Welcome back, ${displayName}!`,
        'Signed In Successfully'
      );
      navigate(userRole === 'organizer' ? '/organizer/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(
        err.message || 'Login failed. Please check your credentials.',
        'Authentication Failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (role) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const redirectPath = loginAsDemo(role);
      if (role === 'student') {
        toast.success('Logged in as Rahul Sharma (CSE Student)', 'Demo Student Mode');
      } else {
        toast.success('Logged in as Tech Club Organizer', 'Demo Organizer Mode');
      }
      navigate(redirectPath);
    }, 400);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast.error('Please enter a valid college email address');
      return;
    }

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      toast.success(`Password reset instructions sent to ${forgotEmail}`, 'Reset Link Sent');
      setForgotModalOpen(false);
      setForgotEmail('');
    } catch (err) {
      toast.error(err.message || 'Could not dispatch password reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      
      {/* LEFT SIDE: Split Screen Visual Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80"
            alt="Campus Event Celebration"
            className="w-full h-full object-cover opacity-35 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-indigo-950/50" />
        </div>

        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:bg-primary-hover transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight flex items-center gap-1.5">
                CampusPulse
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium -mt-1">
                College Event Management Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center Headline & Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-4 my-auto py-8">
          <Badge variant="primary" size="sm" className="bg-white/20 text-white border-white/20 backdrop-blur-md">
            Unified Campus Ecosystem
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Discover college events, RSVP passes, and never miss a beat.
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Join over 2,400+ students and 60+ university societies. From overnight hackathons to cultural festivals, manage all your campus engagements in one intuitive hub.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <Calendar className="w-5 h-5 text-indigo-300 mb-1" />
              <p className="text-xl font-bold text-white">120+</p>
              <p className="text-xs text-slate-300">Live Campus Events</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <Users className="w-5 h-5 text-emerald-300 mb-1" />
              <p className="text-xl font-bold text-white">2,400+</p>
              <p className="text-xs text-slate-300">Active Students</p>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial/Tagline */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} CampusPulse Platform</span>
          <span className="text-slate-300 font-medium">Built for Campus Innovators</span>
        </div>
      </div>

      {/* RIGHT SIDE: Split Screen Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="max-w-md w-full space-y-7">
          
          {/* Header Mobile Brand */}
          <div className="lg:hidden flex justify-between items-center pb-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-main">CampusPulse</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              Enter your college credentials or select a quick demo persona below.
            </p>
          </div>

          {/* DEMO MODE: Two prominent functional demo buttons */}
          <div className="p-4 rounded-2xl border border-primary/20 bg-primary-light/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>One-Click Hackathon Demo</span>
              </div>
              <Badge variant="primary" size="sm">Instant Access</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Student Demo Button */}
              <button
                type="button"
                onClick={() => handleDemoClick('student')}
                disabled={loading}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-white hover:border-primary hover:shadow-subtle transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-main group-hover:text-primary transition-colors">
                    Rahul Sharma
                  </p>
                  <p className="text-[11px] text-secondary truncate">CSE Student Demo</p>
                </div>
              </button>

              {/* Organizer Demo Button */}
              <button
                type="button"
                onClick={() => handleDemoClick('organizer')}
                disabled={loading}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-white hover:border-purple-500 hover:shadow-subtle transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-main group-hover:text-purple-700 transition-colors">
                    Tech Club
                  </p>
                  <p className="text-[11px] text-secondary truncate">Organizer Studio Demo</p>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-background px-3 text-[11px] font-semibold text-secondary uppercase tracking-wider relative">
              Or sign in with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* College Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-main">College Email *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="e.g. rahul.sharma@campus.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-sm text-main placeholder-secondary/60 transition outline-none ${
                    errors.email 
                      ? 'border-error focus:ring-2 focus:ring-error/20' 
                      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-error font-medium">{errors.email}</p>}
            </div>

            {/* Password with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-main">Password *</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2 text-sm text-main placeholder-secondary/60 transition outline-none ${
                    errors.password 
                      ? 'border-error focus:ring-2 focus:ring-error/20' 
                      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-secondary hover:text-main"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-error font-medium">{errors.password}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                />
                <span className="text-xs text-secondary font-medium">Remember me for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="mt-2 font-bold shadow-sm"
            >
              Sign In
            </Button>
          </form>

          {/* Links to Signup & Organizer Onboarding */}
          <div className="pt-4 border-t border-border/80 text-center space-y-2 text-xs text-secondary">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Create student account
              </Link>
            </p>
            <p>
              Are you a club lead?{' '}
              <Link to="/onboard-organizer" className="text-purple-600 font-bold hover:underline">
                Register club or society &rarr;
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password"
        description="Enter your campus .edu email to receive password reset instructions."
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setForgotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleForgotPasswordSubmit}>
              Send Reset Link
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="College Email"
            type="email"
            icon={Mail}
            placeholder="e.g. rahul.sharma@campus.edu"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </div>
      </Modal>

    </div>
  );
};

export default LoginPage;
