import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Code2, 
  Palette, 
  Trophy, 
  GraduationCap, 
  Music, 
  Gamepad2, 
  Camera, 
  Rocket, 
  Check, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const InterestSelectionPage = () => {
  const { user, updateStudentInterests } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const availableInterests = [
    {
      id: 'Technical',
      title: 'Technical',
      icon: Code2,
      desc: 'Hackathons, coding challenges, AI & open-source labs',
      color: 'border-indigo-500 bg-indigo-50/40 text-primary',
    },
    {
      id: 'Cultural',
      title: 'Cultural',
      icon: Palette,
      desc: 'Folk, dance fests, world music & stage dramatics',
      color: 'border-purple-500 bg-purple-50/40 text-purple-600',
    },
    {
      id: 'Sports',
      title: 'Sports',
      icon: Trophy,
      desc: 'Varsity leagues, soccer, badminton, esports cups',
      color: 'border-amber-500 bg-amber-50/40 text-amber-600',
    },
    {
      id: 'Workshops',
      title: 'Workshops',
      icon: GraduationCap,
      desc: 'Interactive skill bootcamps, masterclasses & certifications',
      color: 'border-blue-500 bg-blue-50/40 text-blue-600',
    },
    {
      id: 'Music',
      title: 'Music',
      icon: Music,
      desc: 'Live acoustic jams, orchestra concerts & battle of bands',
      color: 'border-pink-500 bg-pink-50/40 text-pink-600',
    },
    {
      id: 'Gaming',
      title: 'Gaming',
      icon: Gamepad2,
      desc: 'LAN showdowns, Valorant tourneys & competitive esports',
      color: 'border-emerald-500 bg-emerald-50/40 text-emerald-600',
    },
    {
      id: 'Photography',
      title: 'Photography',
      icon: Camera,
      desc: 'Golden hour photo walks, gallery expos & Lightroom labs',
      color: 'border-teal-500 bg-teal-50/40 text-teal-600',
    },
    {
      id: 'Entrepreneurship',
      title: 'Entrepreneurship',
      icon: Rocket,
      desc: 'Venture pitch days, incubator mixers & angel demo nights',
      color: 'border-rose-500 bg-rose-50/40 text-rose-600',
    },
  ];

  // Preload existing user interests or default to Technical & Workshops
  const [selectedInterests, setSelectedInterests] = useState(
    user?.interests && user.interests.length > 0
      ? user.interests
      : ['Technical', 'Workshops']
  );

  const [loading, setLoading] = useState(false);

  const toggleInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSaveAndContinue = () => {
    if (selectedInterests.length === 0) {
      toast.warning('Please pick at least one topic to personalize your event feed');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateStudentInterests(selectedInterests);
      toast.success(
        `Personalized feed ready with ${selectedInterests.length} interest topics!`,
        'Welcome to CampusPulse'
      );
      navigate('/student');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Top Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge variant="primary" size="sm">
            Step 2 of 2: Personalize Experience
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-black text-main tracking-tight">
            What campus events excite you most?
          </h1>

          <p className="text-xs sm:text-sm text-secondary">
            Select your preferred topics. We&apos;ll tailor your event feed and highlight matches on your campus calendar.
          </p>

          <div className="text-xs text-secondary font-medium">
            Selected: <strong className="text-primary font-bold">{selectedInterests.length}</strong> / {availableInterests.length} topics
          </div>
        </div>

        {/* Multi-select Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableInterests.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedInterests.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                className={`
                  p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between select-none
                  ${
                    isSelected
                      ? 'border-primary bg-primary-light/50 shadow-subtle ring-2 ring-primary/20 scale-[1.02]'
                      : 'border-border bg-surface hover:border-slate-300 hover:shadow-subtle'
                  }
                `}
              >
                {/* Checkbox indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-secondary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-primary text-white' : 'border border-border bg-white text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-main">{item.title}</h3>
                  <p className="text-[11px] text-secondary mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="text-xs font-semibold text-secondary hover:text-main"
          >
            Skip for now &rarr;
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={() => setSelectedInterests(availableInterests.map((i) => i.id))}
              className="text-xs font-semibold"
            >
              Select All
            </Button>

            <Button
              variant="primary"
              size="md"
              loading={loading}
              onClick={handleSaveAndContinue}
              icon={ArrowRight}
              iconPosition="right"
              className="font-bold min-w-[200px]"
            >
              Finish & Go to Dashboard
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InterestSelectionPage;

