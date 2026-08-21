import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Admin Login Gate — password-protects the /admin route.
 *
 * SECURITY (per operator policy, Aug 2026):
 *   - Email and password fields are BLANK on every page load. The user must
 *     type both fields manually each time.
 *   - autoComplete="off" plus non-standard field names to suppress browser
 *     password managers from saving or pre-filling admin credentials.
 *   - No hardcoded credential fallback in the browser. Every login attempt
 *     goes through POST /api/auth/login. The server still has a hardcoded
 *     admin fallback for cold-start resilience, but the browser never sees
 *     or stores the password.
 *   - No credential hint is rendered anywhere in the UI.
 */
export const AdminLoginGate: React.FC = () => {
  const { setCurrentUser, addToast, setActiveView } = useStore();

  // Both fields start empty — no prefilled email, no saved password.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Force a remount of the password input on every submit attempt — this
  // reliably clears the value across all browsers (Chrome/Firefox/Safari)
  // and also defeats the browser's autofill cache that lingers even when
  // autoComplete="off" is set.
  const [pwKey, setPwKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
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
      // ONLY the API can authenticate — no client-side hardcoded fallback.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success && adminRoles.includes(data.user.role)) {
        setCurrentUser(data.user);
        useAuthStore.setState({ currentUser: data.user, token: data.token, isAuthenticated: true });
        addToast('success', 'Admin Access Granted', `Welcome, ${data.user.name}!`);
        // Clear the password field immediately on success as well, so a
        // future visitor on the same browser tab cannot reuse it.
        setPassword('');
        setPwKey((k) => k + 1);
        setLoading(false);
        return;
      }

      // Auth failed — clear both fields and force the user to retype.
      if (data.success && !adminRoles.includes(data.user.role)) {
        setError('This account does not have admin access. Please use an admin account.');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Network error — unable to reach the authentication server. Please retry.');
    }
    // Clear the password and force a remount so the browser does not retain
    // the value in its autofill cache.
    setPassword('');
    setPwKey((k) => k + 1);
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

          <form ref={formRef} onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1.5 font-mono uppercase tracking-wider">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="input-sharp w-full pl-10 pr-3 py-3 text-sm text-white placeholder-gray-600"
                  // Suppress browser password managers from auto-filling the email.
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  // Random-ish name so the browser does not match it against
                  // a saved "email" or "username" credential entry.
                  name="pb-admin-identity"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1.5 font-mono uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  key={`pw-${pwKey}`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-sharp w-full pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 font-mono"
                  // "new-password" tells most browsers: do NOT offer a saved password here.
                  autoComplete="new-password"
                  name="pb-admin-secret"
                  data-lpignore="true"
                  data-1p-ignore="true"
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
              Enter your admin email and password to continue. Credentials are never saved or pre-filled on this device — re-enter them every time you visit.
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
