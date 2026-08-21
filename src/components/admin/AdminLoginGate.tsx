import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, X,
} from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Admin Login Gate — password-protects the /admin route.
 *
 * If the current user is not an authenticated admin (role is customer or guest),
 * this screen is shown instead of the admin dashboard. The user must log in
 * with admin credentials (admin@playbeat.digital / playbeat1122) to proceed.
 */
export const AdminLoginGate: React.FC = () => {
  const { setCurrentUser, addToast, setActiveView } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        // Check if the user has an admin role
        const adminRoles = ['super_admin', 'admin', 'product_manager', 'order_manager', 'finance_manager', 'support_agent', 'content_manager', 'marketing_manager', 'read_only'];
        if (!adminRoles.includes(data.user.role)) {
          setError('This account does not have admin access. Please use an admin account.');
          setLoading(false);
          return;
        }

        // Set the user in both stores
        setCurrentUser(data.user);
        useAuthStore.setState({
          currentUser: data.user,
          token: data.token,
          isAuthenticated: true,
        });
        addToast('success', 'Admin Access Granted', `Welcome, ${data.user.name}!`);
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleBackToStore = () => {
    setActiveView('store');
    window.history.pushState({ view: 'store' }, '', '/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-playbeat-mesh opacity-30" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md"
      >
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 border-2 border-white/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">PlayBeat Admin</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">Restricted Access — Authorized Personnel Only</p>
        </div>

        {/* Login card */}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold font-display shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Access Admin Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              This area is restricted to authorized admin staff only. All access attempts are logged.
              Default admin: <span className="font-mono text-blue-300">admin@playbeat.digital</span>
            </p>
          </div>
        </div>

        {/* Back to store */}
        <div className="text-center mt-6">
          <button
            onClick={handleBackToStore}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            ← Back to Storefront
          </button>
        </div>
      </motion.div>
    </div>
  );
};
