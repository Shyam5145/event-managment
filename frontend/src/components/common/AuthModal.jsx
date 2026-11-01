import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Sparkles, ArrowRight, UserCheck, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login', initialRole = 'student' }) => {
  const { login, loginAsDemo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState(initialRole); // 'student' | 'organizer'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: selectedRole === 'student' ? 'Rahul Sharma' : 'Tech Club',
    email: selectedRole === 'student' ? 'rahul.sharma@campus.edu' : 'techclub@campus.edu',
    password: 'password123',
  });

  const handleDemoClick = (role) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const redirectPath = loginAsDemo(role);
      toast.success(
        role === 'student' ? 'Logged in as Rahul Sharma (CSE Student)' : 'Logged in as Tech Club Organizer',
        'Demo Mode Activated'
      );
      onClose();
      navigate(redirectPath);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(selectedRole, {
        name: formData.name,
        email: formData.email,
      });
      toast.success(
        `Welcome to CampusPulse, ${formData.name}! Signed in as ${selectedRole.toUpperCase()}.`,
        mode === 'login' ? 'Login Successful' : 'Account Created'
      );
      onClose();
      navigate(selectedRole === 'organizer' ? '/organizer/dashboard' : '/student/dashboard');
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={mode === 'login' ? 'Sign in to CampusPulse' : 'Create CampusPulse Account'}
      description="Connect to your university events, schedule, and digital passes."
    >
      <div className="space-y-4">
        {/* Quick Demo Access Buttons */}
        <div className="p-3 bg-primary-light/50 border border-primary/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-primary">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              One-Click Demo Mode
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-primary/20">No Password Required</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick('student')}
              className="p-2.5 rounded-lg border border-border bg-white hover:border-primary text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-main truncate">Rahul Sharma</p>
                  <p className="text-[10px] text-secondary truncate">CSE Student Demo</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('organizer')}
              className="p-2.5 rounded-lg border border-border bg-white hover:border-purple-600 text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-main truncate">Tech Club</p>
                  <p className="text-[10px] text-secondary truncate">Organizer Studio</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          )}

          <Input
            label="College Email (.edu)"
            type="email"
            icon={Mail}
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              {mode === 'login' ? 'Sign In with Email' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="pt-2 text-center text-xs text-secondary border-t border-border">
          {mode === 'login' ? (
            <p>
              Looking to register?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/signup');
                }}
                className="text-primary font-bold hover:underline"
              >
                Go to full signup form &rarr;
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary font-bold hover:underline"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;
