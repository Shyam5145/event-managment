import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  GraduationCap, 
  CheckCircle2, 
  Building2,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatAuthError } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

export const SignupPage = () => {
  const { signupStudent, loginAsDemo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Science & Engineering',
    academicYear: '3rd Year (Class of 2026)',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const departmentsList = [
    'Computer Science & Engineering',
    'Information Technology & Software',
    'Electrical & Electronics Engineering',
    'Mechanical & Aerospace Engineering',
    'Business Administration & MBA',
    'Biotechnology & Life Sciences',
    'Design, Media & Architecture',
    'Applied Sciences & Humanities',
  ];

  const academicYearsList = [
    '1st Year (Freshman / Class of 2028)',
    '2nd Year (Sophomore / Class of 2027)',
    '3rd Year (Junior / Class of 2026)',
    '4th Year (Senior / Class of 2025)',
    'Graduate / Master’s Program',
    'PhD & Research Scholar',
  ];

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    
    if (!formData.email.trim()) {
      errs.email = 'College email is required';
    } else if (!formData.email.includes('@')) {
      errs.email = 'Please provide a valid college email format';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.department) errs.department = 'Please select your department';
    if (!formData.academicYear) errs.academicYear = 'Please select your academic year';

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must agree to campus platform guidelines';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await signupStudent({
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        department: formData.department,
        academicYear: formData.academicYear,
        year: formData.academicYear,
      });

      toast.success(
        `Account created for ${formData.fullName}! Now choose your event interests.`,
        'Welcome to CampusPulse'
      );
      // Navigate to interest selection onboarding screen!
      navigate('/onboarding/interests');
    } catch (err) {
      const errorMsg = formatAuthError(err);
      setServerError(errorMsg);
      toast.error(
        errorMsg,
        'Account Creation Failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      
      {/* Left split-screen visual banner */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"
            alt="University Campus Life"
            className="w-full h-full object-cover opacity-30 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-indigo-950/60" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">CampusPulse</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4 my-auto py-8">
          <Badge variant="primary" size="sm" className="bg-white/20 text-white border-white/20">
            Student Onboarding
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Your university journey starts with real moments.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Reserve passes with one click, get notified of upcoming hackathons and cultural nights, and build memories with classmates.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant digital ticket passes with QR codes</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Personalized event recommendations based on interests</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct access to 60+ verified university societies</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-bold underline">
            Sign In here
          </Link>
        </div>
      </div>

      {/* Right form section */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="max-w-lg w-full space-y-6">
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="primary" size="sm">Student Registration</Badge>
              <Link to="/login" className="text-xs text-primary font-bold hover:underline">
                Sign in instead &rarr;
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight">
              Create your student profile
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              Fill in your academic details to reserve event tickets and access campus fests.
            </p>
          </div>

          {serverError && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950">Setup Action Required</p>
                <p className="leading-relaxed font-medium">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-main">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: null });
                  }}
                  className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-sm text-main placeholder-secondary/60 outline-none transition ${
                    errors.fullName ? 'border-error focus:ring-2 focus:ring-error/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-xs text-error font-medium">{errors.fullName}</p>}
            </div>

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
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-sm text-main placeholder-secondary/60 outline-none transition ${
                    errors.email ? 'border-error focus:ring-2 focus:ring-error/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-error font-medium">{errors.email}</p>}
            </div>

            {/* Department & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Department *</label>
                <div className="relative">
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                {errors.department && <p className="text-xs text-error">{errors.department}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Academic Year *</label>
                <div className="relative">
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {academicYearsList.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
                {errors.academicYear && <p className="text-xs text-error">{errors.academicYear}</p>}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 pr-9 text-xs text-main placeholder-secondary/60 outline-none transition ${
                      errors.password ? 'border-error' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-secondary hover:text-main"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-error font-medium">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 pr-9 text-xs text-main placeholder-secondary/60 outline-none transition ${
                      errors.confirmPassword ? 'border-error' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-secondary hover:text-main"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-error font-medium">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, agreeTerms: e.target.checked });
                    if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: null });
                  }}
                  className="w-4 h-4 rounded text-primary border-border focus:ring-primary mt-0.5"
                />
                <span className="text-xs text-secondary leading-relaxed">
                  I agree to the <strong className="text-main">University Event Guidelines</strong> and confirm that I am an actively enrolled collegiate student.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-error font-medium mt-1">{errors.agreeTerms}</p>}
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
              Continue to Select Interests
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-secondary">
            Are you organizing an event?{' '}
            <Link to="/onboard-organizer" className="text-purple-600 font-bold hover:underline">
              Club Lead Onboarding &rarr;
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SignupPage;

