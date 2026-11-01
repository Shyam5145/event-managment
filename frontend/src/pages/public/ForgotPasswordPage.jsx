import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardContent } from '../../components/common/Card';

export const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid college email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
      toast.success('Password recovery instructions sent to your college inbox!', 'Reset Link Dispatched');
    } catch (err) {
      setError(err.message || 'Could not send recovery instructions. Try again.');
      toast.error(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 group mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:bg-primary-hover transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl text-main tracking-tight group-hover:text-primary transition-colors">
            CampusPulse
          </span>
        </Link>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-secondary">
          Enter your university credentials and we&apos;ll send a password recovery token.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 border-border shadow-elevated bg-white">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="College Email Address"
                type="email"
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                leftIcon={Mail}
                required
              />

              <div className="bg-primary-light/40 border border-primary/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-secondary">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Demo Mode: Any university email works. The reset instructions will be simulated on-screen.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={loading}
                icon={KeyRound}
              >
                Send Recovery Instructions
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-main">Check your college email</h3>
              <p className="text-xs text-secondary leading-relaxed">
                We sent a simulated recovery link to <strong className="text-main">{email}</strong>. Follow the instructions to reset your password.
              </p>
              <div className="pt-4 space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Return to Login
                </Button>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-secondary hover:text-main font-medium"
                >
                  Try a different email address
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

