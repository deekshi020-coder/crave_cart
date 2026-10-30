import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2, ShieldCheck, Bike, AlertCircle, Sparkles, Key } from 'lucide-react';
import { useAuth, DemoProfileKey } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, switchDemoRole } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'admin' | 'delivery_agent'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, password, phone, role });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (profileKey: DemoProfileKey) => {
    setIsLoading(true);
    setError(null);
    try {
      await switchDemoRole(profileKey);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-5">
          <h3 className="text-xl font-black text-stone-900">
            {mode === 'login' ? 'Sign In to CraveCart' : 'Create CraveCart Account'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {mode === 'login'
              ? 'Access saved addresses, loyalty discounts, and real-time live delivery tracking in Chennai.'
              : 'Join CraveCart to order delicious food with automatic loyalty rewards.'}
          </p>
        </div>

        {/* Demo Account Instructions & Quick Profiles */}
        <div className="mb-5 p-4 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Select a Demo Account to Sign In</span>
            </span>
            <span className="text-[10px] text-stone-400">One-click login</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Divya */}
            <div className="p-2.5 bg-white rounded-xl border border-rose-200/90 hover:border-rose-400 hover:shadow-xs transition-all flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-rose-600" />
                    Divya Sundaram
                  </span>
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    2 Orders
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 line-clamp-1">divya@cravecart.com</p>
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                  Next order unlocks 10% Gold tier!
                </p>
                <p className="text-[9px] font-mono text-stone-400 mt-1">Pass: Divya@123</p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('divya')}
                  className="flex-1 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  title="Prefill form credentials"
                  onClick={() => handlePrefill('divya@cravecart.com', 'Divya@123')}
                  className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px]"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Aarav */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-stone-700" />
                    Aarav Sharma
                  </span>
                  <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                    20% Platinum
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 line-clamp-1">aarav@example.com</p>
                <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                  6 orders · Top loyalty tier
                </p>
                <p className="text-[9px] font-mono text-stone-400 mt-1">Pass: Customer@123</p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('aarav')}
                  className="flex-1 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  title="Prefill form credentials"
                  onClick={() => handlePrefill('aarav@example.com', 'Customer@123')}
                  className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px]"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Admin */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    Admin
                  </span>
                  <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                    Analytics
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 line-clamp-1">admin@cravecart.com</p>
                <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                  Full BI &amp; catalog controls
                </p>
                <p className="text-[9px] font-mono text-stone-400 mt-1">Pass: Admin@123</p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="flex-1 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  title="Prefill form credentials"
                  onClick={() => handlePrefill('admin@cravecart.com', 'Admin@123')}
                  className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px]"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Delivery Partner */}
            <div className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-blue-600" />
                    Vikram Rider
                  </span>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    Fleet Ops
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 line-clamp-1">vikram@cravecart.com</p>
                <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                  Route dispatch &amp; cash collection
                </p>
                <p className="text-[9px] font-mono text-stone-400 mt-1">Pass: Agent@123</p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('delivery_agent')}
                  className="flex-1 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  title="Prefill form credentials"
                  onClick={() => handlePrefill('vikram@cravecart.com', 'Agent@123')}
                  className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px]"
                >
                  Fill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-stone-100 mb-4 text-xs font-bold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
              mode === 'login' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-400'
            }`}
          >
            Sign In with Password
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
              mode === 'register' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-400'
            }`}
          >
            Create New Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Divya Sundaram"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="+91 98400 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@cravecart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <span>Sign In to CraveCart</span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
