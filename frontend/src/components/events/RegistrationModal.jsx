import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  User, 
  Building2, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';

export const RegistrationModal = ({ isOpen, onClose, event, onSuccess }) => {
  const { user, isAuthenticated, switchRole } = useAuth();
  const { registerForEvent } = useEvents();
  const toast = useToast();

  const [formData, setFormData] = useState({
    studentName: user?.name || 'Rahul Sharma',
    email: user?.email || 'rahul.sharma@campus.edu',
    department: user?.department || 'Computer Science & Engineering',
    academicYear: user?.year || '3rd Year (Class of 2026)',
    teamName: '',
    teamSize: 1,
    agreeTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        studentName: user.name || prev.studentName,
        email: user.email || prev.email,
        department: user.department || prev.department,
        academicYear: user.year || prev.academicYear,
      }));
    }
  }, [user]);

  if (!event) return null;

  const validate = () => {
    const errs = {};
    if (!formData.studentName.trim()) errs.studentName = 'Full student name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Valid college email is required';
    }
    if (!formData.department.trim()) errs.department = 'Department is required';
    if (!formData.academicYear.trim()) errs.academicYear = 'Academic year is required';
    if (!formData.agreeTerms) errs.agreeTerms = 'You must accept the collegiate event guidelines';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      if (!isAuthenticated) {
        switchRole('student');
      }

      const registration = await registerForEvent(event.id, {
        uid: user?.uid,
        studentName: formData.studentName,
        email: formData.email,
        department: formData.department,
        academicYear: formData.academicYear,
        teamName: formData.teamName || (formData.teamSize > 1 ? `Team ${formData.studentName.split(' ')[0]}` : 'Solo'),
        teamSize: Number(formData.teamSize),
      });

      toast.success(
        `Pass confirmed for ${event.title}! Your digital ticket has been issued.`,
        'Registration Confirmed'
      );

      onClose();
      if (onSuccess) {
        onSuccess(registration);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const errMsg = err?.message || 'Could not complete event registration.';
      setSubmitError(errMsg);
      toast.error(errMsg, 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Register for ${event.title}`}
      description="Reserve your student admission pass. Verification details will be linked to your collegiate ID."
    >
      <form onSubmit={handleConfirm} className="space-y-5">
        
        {/* Error Banner */}
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <div className="flex-1 font-medium leading-relaxed">
              {submitError}
            </div>
          </div>
        )}

        {/* Event Quick Summary Banner */}
        <div className="p-3.5 bg-slate-50 border border-border rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <Badge variant="primary" size="sm" className="capitalize">{event.category}</Badge>
            <p className="font-bold text-main">{event.title}</p>
            <p className="text-secondary">{event.date} &bull; {event.location}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-secondary font-semibold uppercase block">Admission</span>
            <span className="text-sm font-black text-emerald-600">{event.price || 'Free Pass'}</span>
          </div>
        </div>

        {/* Student Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Student Name"
            icon={User}
            required
            value={formData.studentName}
            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
            error={errors.studentName}
          />

          <Input
            label="College Email (.edu)"
            icon={Mail}
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
        </div>

        {/* Department & Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-main">Department *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-xs text-main outline-none ${
                  errors.department ? 'border-error' : 'border-border focus:border-primary'
                }`}
              />
            </div>
            {errors.department && <p className="text-[11px] text-error">{errors.department}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-main">Academic Year *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                <GraduationCap className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="e.g. 3rd Year (Class of 2026)"
                className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2 text-xs text-main outline-none ${
                  errors.academicYear ? 'border-error' : 'border-border focus:border-primary'
                }`}
              />
            </div>
            {errors.academicYear && <p className="text-[11px] text-error">{errors.academicYear}</p>}
          </div>
        </div>

        {/* Team Name & Team Size (Crucial for Hackathons & Team Events) */}
        <div className="p-3.5 bg-primary-light/40 border border-primary/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary">Team Details (Optional)</span>
            </div>
            <span className="text-[11px] text-secondary">Solo hackers welcome</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-semibold text-main">Team Name</label>
              <input
                type="text"
                placeholder="e.g. ByteForce AI (Leave blank if Solo)"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-main outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-main">Team Size</label>
              <select
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-main outline-none focus:border-primary"
              >
                <option value={1}>1 (Individual / Solo)</option>
                <option value={2}>2 Members</option>
                <option value={3}>3 Members</option>
                <option value={4}>4 Members (Max)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="space-y-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
              className="w-4 h-4 rounded text-primary border-border focus:ring-primary mt-0.5"
            />
            <span className="text-xs text-secondary leading-relaxed">
              I agree to the <strong className="text-main">University Event Code of Conduct</strong>, safety guidelines, and verify that my attendance information is accurate.
            </span>
          </label>
          {errors.agreeTerms && <p className="text-xs text-error font-medium">{errors.agreeTerms}</p>}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            icon={CheckCircle2}
          >
            Confirm Pass Reservation
          </Button>
        </div>

      </form>
    </Modal>
  );
};

export default RegistrationModal;

