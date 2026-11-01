import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  GraduationCap, 
  Sparkles, 
  Camera, 
  CheckCircle2, 
  Save, 
  ShieldCheck,
  Lock,
  IdCard,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateStudentProfile } from '../../services/userService.js';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

export const StudentProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const allInterests = [
    'Technical', 'Cultural', 'Sports', 'Workshops',
    'Music', 'Gaming', 'Photography', 'Entrepreneurship'
  ];

  const avatarPresets = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ];

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    academicYear: user?.year || '',
    studentId: user?.studentId || `CS-${(user?.uid || user?.id || '1001').slice(0, 4)}`,
    bio: user?.bio || '',
    avatar: user?.photoURL || user?.avatar || avatarPresets[0],
    interests: user?.interests || ['Technical', 'Workshops'],
  });

  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomAvatar, setShowCustomAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        academicYear: user.year || '',
        studentId: user.studentId || `CS-${(user.uid || user.id || '1001').slice(0, 4)}`,
        bio: user.bio || '',
        avatar: user.photoURL || user.avatar || avatarPresets[0],
        interests: user.interests || ['Technical', 'Workshops'],
      });
    }
  }, [user]);

  const toggleInterest = (topic) => {
    if (formData.interests.includes(topic)) {
      setFormData((prev) => ({
        ...prev,
        interests: prev.interests.filter((i) => i !== topic),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, topic],
      }));
    }
  };

  const handleAvatarPreset = (url) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const handleApplyCustomAvatar = () => {
    if (!customAvatarUrl.trim()) return;
    try {
      new URL(customAvatarUrl.trim());
      setFormData((prev) => ({ ...prev, avatar: customAvatarUrl.trim() }));
      setCustomAvatarUrl('');
      setShowCustomAvatar(false);
      toast.success('Custom avatar preview updated!');
    } catch {
      toast.error('Please enter a valid image URL');
    }
  };

  const validate = () => {
    const { valid, errors: valErrors } = validateStudentProfile({
      name: formData.name,
      department: formData.department,
      year: formData.academicYear,
      photoURL: formData.avatar,
    });
    setErrors(valErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted form errors.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        department: formData.department.trim(),
        year: formData.academicYear.trim(),
        bio: formData.bio.trim(),
        photoURL: formData.avatar,
        avatar: formData.avatar,
        interests: formData.interests,
      });

      toast.success('Your student profile has been updated!', 'Profile Saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Badge variant="primary" size="sm" className="mb-2">Account Settings</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Manage your collegiate identity, verified credentials, and event interest preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Card & Avatar */}
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-border">
            <div className="relative">
              <img
                src={formData.avatar}
                alt={formData.name || 'Student avatar'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-subtle bg-slate-100"
                onError={(e) => {
                  e.target.src = avatarPresets[0];
                }}
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-primary text-white shadow-xs">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-main">{formData.name || 'Student Name'}</h3>
                <span className="text-[11px] font-semibold text-primary bg-primary-light/50 px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary" /> Verified Student
                </span>
              </div>
              <p className="text-xs text-secondary">{formData.department || 'Department'} &bull; {formData.academicYear || 'Academic Year'}</p>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="text-secondary font-medium">Presets:</span>
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAvatarPreset(preset)}
                    className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
                      formData.avatar === preset ? 'ring-2 ring-primary border-primary' : 'border-border hover:ring-1 hover:ring-primary'
                    }`}
                  >
                    <img src={preset} alt={`preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomAvatar(!showCustomAvatar)}
                  className="text-xs font-semibold text-primary hover:underline ml-2"
                >
                  {showCustomAvatar ? 'Cancel' : 'Custom URL...'}
                </button>
              </div>

              {showCustomAvatar && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 max-w-md">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCustomAvatar}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields: Name, Email, Department, Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Student Name"
              icon={User}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />

            {/* Read-Only College Email with Lock Icon */}
            <div>
              <label className="block text-xs font-semibold text-main mb-1.5">College Email</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-secondary pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-border bg-slate-100 text-secondary cursor-not-allowed select-none"
                />
                <div className="absolute right-3 text-secondary" title="Email is tied to your university account identity and cannot be changed here.">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-[11px] text-secondary mt-1">Managed via institutional Firebase Authentication</p>
            </div>

            <Input
              label="Department"
              icon={Building2}
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              error={errors.department}
            />

            <Input
              label="Academic Year"
              icon={GraduationCap}
              required
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              error={errors.year}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-main">Personal Student Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full rounded-xl border border-border bg-white p-3 text-xs text-main outline-none focus:border-primary"
              placeholder="Tell other students and event organizers about your academic passions and campus projects..."
            />
          </div>

          {/* Interests Multi-Select Pills */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-main">Selected Interests</label>
              <span className="text-[11px] text-secondary">Tailors recommendations</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 text-secondary hover:text-main hover:bg-slate-200'
                    }`}
                  >
                    {interest} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Information Section */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-main">
              <IdCard className="w-4 h-4 text-primary" />
              <span>Institutional Account Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-border/70 text-xs">
              <div>
                <p className="text-[11px] text-secondary">System Role</p>
                <div className="flex items-center gap-1.5 font-bold text-main mt-0.5">
                  <Badge variant="primary" size="sm">student</Badge>
                  <span title="Role assignment is controlled by the university administration. Users cannot self-elevate roles." className="cursor-help">
                    <Info className="w-3.5 h-3.5 text-secondary" />
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-secondary">Student ID</p>
                <p className="font-semibold text-main mt-0.5">{formData.studentId}</p>
              </div>

              <div>
                <p className="text-[11px] text-secondary">User UID</p>
                <p className="font-mono text-[11px] text-secondary truncate mt-0.5" title={user?.uid || user?.id}>
                  {(user?.uid || user?.id || 'usr_demo').slice(0, 16)}...
                </p>
              </div>
            </div>

            <p className="text-[11px] text-secondary flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-secondary" />
              Role and credential integrity is enforced by Cloud Firestore security rules.
            </p>
          </div>

        </Card>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            icon={Save}
            className="font-bold shadow-xs"
          >
            Save Profile Changes
          </Button>
        </div>

      </form>
    </div>
  );
};

export default StudentProfilePage;
