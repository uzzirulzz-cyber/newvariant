import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, Role } from '../../types';
import {
  X,
  Shield,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, setCurrentUser, switchUserRole, addToast } = useStore();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableRoles: { role: Role; label: string; desc: string }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Full platform access, G2G Sourcing, Inventory Vault, Settings' },
    { role: 'product_manager', label: 'Product Manager', desc: 'Catalog, pricing, variation protection & import queues' },
    { role: 'order_manager', label: 'Order Manager', desc: 'Order fulfillment, digital keys dispatch & DHL tracking' },
    { role: 'customer', label: 'Customer', desc: 'Storefront shopper with instant digital key locker' }
  ];

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!isLoginMode && !name.trim()) {
      next.name = 'Please enter your full name.';
    }

    if (!email.trim()) {
      next.email = 'Email address is required.';
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Please enter a valid email address.';
    }

    if (!password) {
      next.password = 'Password is required.';
    } else if (!isLoginMode && password.length < 8) {
      next.password = 'Password must be at least 8 characters long.';
    }

    if (!isLoginMode && password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulated async auth round-trip (no real credentials are stored client-side).
    await new Promise((r) => setTimeout(r, 700));

    const isAdm = email.toLowerCase().includes('admin');
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      role: isAdm ? 'super_admin' : 'customer',
      twoFactorEnabled: false,
      addresses: [],
      totalSpent: 0,
      ordersCount: 0,
      wishlist: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(newUser);
    addToast('success', isLoginMode ? 'Logged In' : 'Account Created', `Welcome, ${newUser.name}!`);
    setIsSubmitting(false);
    setIsAuthModalOpen(false);
    resetForm();
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsAuthModalOpen(false);
    resetForm();
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl bg-[#0F111A] border border-white/10 shadow-2xl p-6 z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="auth-modal-title" className="text-base font-bold text-white font-display">
                    {isLoginMode ? 'Sign in to PlayBeat' : 'Create your PlayBeat account'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {isLoginMode ? 'Access your locker, orders & wishlist' : 'Join 25,000+ verified shoppers'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Demo Switcher */}
            <div className="mt-4 space-y-3">
              <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Instant Demo Role Switcher</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {availableRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUserRole(r.role);
                      setIsAuthModalOpen(false);
                    }}
                    disabled={isSubmitting}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentUser.role === r.role
                        ? 'bg-red-500/15 border-red-500/40 text-white shadow-sm shadow-red-950/40'
                        : 'bg-[#141622] border-white/5 hover:bg-white/5 text-neutral-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${currentUser.role === r.role ? 'bg-red-600 text-white' : 'bg-white/5 text-neutral-400'}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold font-display flex items-center justify-between">
                        <span>{r.label}</span>
                        {currentUser.role === r.role && (
                          <span className="text-[10px] text-red-400 font-mono flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              <div className="flex-1 h-px bg-white/10" />
              <span>or sign in with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email + password form */}
            <form onSubmit={handleCustomLogin} className="space-y-3" noValidate>
              {!isLoginMode && (
                <div>
                  <label htmlFor="auth-name" className="block text-[11px] text-neutral-400 mb-1 font-mono">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      disabled={isSubmitting}
                      className={`input-sharp w-full pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 disabled:opacity-60 ${
                        errors.name ? 'input-error' : ''
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-[11px] text-neutral-400 mb-1 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className={`input-sharp w-full pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 disabled:opacity-60 ${
                      errors.email ? 'input-error' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-[11px] text-neutral-400 mb-1 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isLoginMode ? 'Enter your password' : 'Minimum 8 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                    required
                    disabled={isSubmitting}
                    className={`input-sharp w-full pl-9 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 disabled:opacity-60 ${
                      errors.password ? 'input-error' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>

              {!isLoginMode && (
                <div>
                  <label htmlFor="auth-confirm-password" className="block text-[11px] text-neutral-400 mb-1 font-mono">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                      className={`input-sharp w-full pl-9 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 disabled:opacity-60 ${
                        errors.confirmPassword ? 'input-error' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {isLoginMode && (
                <div className="flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer select-none">
                    <input type="checkbox" className="accent-red-500 w-3 h-3 rounded" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addToast('info', 'Password Reset', 'Password reset link sent to your email if an account exists.')}
                    className="text-neutral-400 hover:text-red-400 underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold font-display shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isLoginMode ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode switcher */}
            <div className="mt-4 text-center text-[11px] text-neutral-400">
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={switchMode}
                disabled={isSubmitting}
                className="text-red-400 hover:text-red-300 font-bold transition-colors underline disabled:opacity-60"
              >
                {isLoginMode ? 'Register' : 'Sign In'}
              </button>
            </div>

            {/* Security note */}
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2 text-[10px] text-neutral-400 leading-snug">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your credentials are transmitted over an encrypted (TLS) channel. We never display or store admin passwords in client-side code.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
