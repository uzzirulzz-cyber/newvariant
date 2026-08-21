import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuthStore } from '../../store/useAuthStore';
import { User } from '../../types';
import {
  Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

// Hardcoded admin credentials — used as fallback when MongoDB is cold-starting
// or unreachable. The real auth still goes through /api/auth/login (bcrypt),
// but if that fails due to network/cold-start, we validate locally so the
// admin can still get into the panel.
const HARDCODED_ADMIN = {
  email: 'admin@playbeat.digital',
  password: 'playbeat1122',
  user: {
    id: 'usr-admin-default',
    name: 'PlayBeat Super Admin',
    email: 'admin@playbeat.digital',
    role: 'super_admin' as const,
    avatarUrl: undefined,
    phone: undefined,
    country: undefined,
    twoFactorEnabled: false,
    addresses: [],
    totalSpent: 0,
    ordersCount: 0,
    wishlist: [],
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  } as User,
};

/**
 * Admin Login Gate — password-protects the /admin route.
 *
 * Tries API login first. If API fails (cold start, network error),
 * falls back to hardcoded admin credentials so the panel is always
 * accessible.
 */
export const AdminLoginGate: React.FC = () => {
  const { setCurrentUser, addToast, setActiveView } = useStore();

  const [email, setEmail] = useState('admin@playbeat.digital');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    const adminRoles = ['super_admin', 'admin', 'product_manager', 'order_manager', 'finance_manager', 'support_agent', 'content_manager', 'marketing_manager', 'read_only'];

    try {
      // Try API login first
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success && adminRoles.includes(data.user.role)) {
        // API login succeeded — use the real user
        setCurrentUser(data.user);
        useAuthStore.setState({ currentUser: data.user, token: data.token, isAuthenticated: true });
        addToast('success', 'Admin Access Granted', `Welcome, ${data.user.name}!`);
        setLoading(false);
        return;
      }

      // API login failed — check hardcoded credentials as fallback
      if (email.trim().toLowerCase() === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
        setCurrentUser(HARDCODED_ADMIN.user);
        useAuthStore.setState({ currentUser: HARDCODED_ADMIN.user, token: `pb_hardcoded_${Date.now()}`, isAuthenticated: true });
        addToast('success', 'Admin Access Granted', `Welcome, ${HARDCODED_ADMIN.user.name}! (offline mode)`);
        setLoading(false);
        return;
      }

      // Both failed
      if (data.success && !adminRoles.includes(data.user.role)) {
        setError('This account does not have admin access. Please use an admin account.');
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch {
      // Network error — try hardcoded fallback
      if (email.trim().toLowerCase() === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
        setCurrentUser(HARDCODED_ADMIN.user);
        useAuthStore.setState({ currentUser: HARDCODED_ADMIN.user, token: `pb_hardcoded_${Date.now()}`, isAuthenticated: true });
        addToast('success', 'Admin Access Granted', `Welcome, ${HARDCODED_ADMIN.user.name}! (offline mode)`);
        setLoading(false);
        return;
      }
      setError('Network error and hardcoded credentials did not match.');
    }
    setLoading(false);
  };

  const handleBackToStore = () => {
    setActiveView('store');
    window.history.pushState({ view: 'store' }, '', '/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-playbeat-mesh opacity-30" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 border-2 border-white/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">PlayBeat Admin</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">Restricted Access — Authorized Personnel Only</p>
        </div>

        <div className="bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1.5 font-mono uppercase tracking-wider">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@playbeat.digital"
                  className="input-sharp w-full pl-10 pr-3 py-3 text-sm text-white placeholder-gray-600"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1.5 font-mono uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="input-sharp w-full pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 font-mono"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-glossy btn-glossy-blue w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" style={{ padding: '0.75rem 1.5rem' }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Authenticating...</span></>
              ) : (
                <><span>Access Admin Panel</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Default admin: <span className="font-mono text-blue-300">admin@playbeat.digital</span> / <span className="font-mono text-blue-300">playbeat1122</span>
              <br />Works even if MongoDB is cold-starting (offline fallback mode).
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button onClick={handleBackToStore} className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Back to Storefront
          </button>
        </div>
      </motion.div>
    </div>
  );
};
