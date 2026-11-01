import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Upload, 
  ShieldCheck, 
  Building2, 
  Mail, 
  User, 
  FileText, 
  ArrowRight, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';

export const OrganizerOnboardingPage = () => {
  const { onboardOrganizer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizerName: 'Sarah Chen',
    clubName: 'Tech Club',
    email: 'techclub@campus.edu',
    category: 'Technical',
    description: 'Premier university technology and developer society coordinating collegiate hackathons, AI seminars, and open-source sprints.',
    logo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clubCategories = [
    'Technical',
    'Cultural',
    'Sports',
    'Workshops',
    'Music',
    'Gaming',
    'Photography',
    'Entrepreneurship',
  ];

  const presetLogos = [
    { label: 'Innovation / Code', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
    { label: 'Creative / Arts', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { label: 'Athletic / Shield', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  ];

  const validate = () => {
    const errs = {};
    if (!formData.organizerName.trim()) errs.organizerName = 'Lead organizer name is required';
    if (!formData.clubName.trim()) errs.clubName = 'Club or Society name is required';
    
    if (!formData.email.trim()) {
      errs.email = 'Club contact email is required';
    } else if (!formData.email.includes('@')) {
      errs.email = 'Please provide a valid email format';
    }

    if (!formData.category) errs.category = 'Please select a club category';
    if (!formData.description.trim()) errs.description = 'Provide a brief summary of the club missions';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
        toast.info('Club emblem image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onboardOrganizer(formData);
      toast.success(
        `Welcome ${formData.clubName}! Your Organizer Studio is live.`,
        'Club Onboarding Complete'
      );
      navigate('/organizer');
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-background">
      
      {/* Left split-screen visual banner */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80"
            alt="Event Organizer Planning"
            className="w-full h-full object-cover opacity-30 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-purple-950/60" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">CampusPulse</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4 my-auto py-8">
          <Badge variant="purple" size="sm" className="bg-white/20 text-white border-white/20">
            Organizer Studio Setup
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Host events with university-grade tools.
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Eliminate chaotic Google Sheets, lost tickets, and manual gate queues. Streamline RSVPs, automated capacity quotas, and instant QR check-ins.
          </p>

          <div className="space-y-2.5 pt-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Reach 2,400+ verified campus students instantly</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live gate scanner for digital student QR passes</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time occupancy and attendance charts with Recharts</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-white font-bold underline">
            Sign in to Studio
          </Link>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="max-w-lg w-full space-y-6">
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="purple" size="sm">Club Registration</Badge>
              <Link to="/login" className="text-xs text-purple-600 font-bold hover:underline">
                Sign in instead &rarr;
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight">
              Onboard your club or society
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              Set up your verified organizer profile to start publishing events on the campus calendar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Club Name & Organizer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Club Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Tech Club"
                    value={formData.clubName}
                    onChange={(e) => {
                      setFormData({ ...formData, clubName: e.target.value });
                      if (errors.clubName) setErrors({ ...errors, clubName: null });
                    }}
                    className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-xs text-main placeholder-secondary/60 outline-none transition ${
                      errors.clubName ? 'border-error' : 'border-border focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20'
                    }`}
                  />
                </div>
                {errors.clubName && <p className="text-[11px] text-error font-medium">{errors.clubName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Lead Organizer Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Chen"
                    value={formData.organizerName}
                    onChange={(e) => {
                      setFormData({ ...formData, organizerName: e.target.value });
                      if (errors.organizerName) setErrors({ ...errors, organizerName: null });
                    }}
                    className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-xs text-main placeholder-secondary/60 outline-none transition ${
                      errors.organizerName ? 'border-error' : 'border-border focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20'
                    }`}
                  />
                </div>
                {errors.organizerName && <p className="text-[11px] text-error font-medium">{errors.organizerName}</p>}
              </div>
            </div>

            {/* College Email & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">College Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. techclub@campus.edu"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-xs text-main placeholder-secondary/60 outline-none transition ${
                      errors.email ? 'border-error' : 'border-border focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-error font-medium">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-main">Club Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-main outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                >
                  {clubCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-main">Club Mission & Description *</label>
              <textarea
                rows={3}
                placeholder="What does your club organize? What should students expect?"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: null });
                }}
                className={`w-full rounded-xl border bg-white p-3 text-xs text-main placeholder-secondary/60 outline-none transition ${
                  errors.description ? 'border-error' : 'border-border focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20'
                }`}
              />
              {errors.description && <p className="text-xs text-error font-medium">{errors.description}</p>}
            </div>

            {/* Club Logo Upload */}
            <div className="space-y-2 p-4 rounded-xl border border-border bg-slate-50/70">
              <label className="block text-xs font-semibold text-main">Club Emblem / Logo Upload</label>
              
              <div className="flex items-center gap-4">
                <img
                  src={formData.logo}
                  alt="Club Logo Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-border bg-white shadow-xs shrink-0"
                />

                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-slate-50 text-main cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                    <span>Presets:</span>
                    {presetLogos.map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setFormData({ ...formData, logo: preset.url })}
                        className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded hover:bg-purple-100"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              className="mt-2 font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              Complete Organizer Registration
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-secondary">
            Are you a student looking for events?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Student Sign Up &rarr;
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default OrganizerOnboardingPage;

