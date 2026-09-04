import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import axios from 'axios';
import { Store, Mail, Key, ArrowRight, Lock, ShieldCheck } from 'lucide-react';

export const StoreLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('staff.a@kiaramedicals.com');
  const [password, setPassword] = useState('shopA123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(
        '/api/auth/store-login',
        { email, password },
        { withCredentials: true } // Receives HttpOnly cookie
      );
      if (res.data?.success) {
        const { user } = res.data.data;
        login(user, user.branch);
        navigate('/store/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to sign in. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link
            to="/"
            className="w-12 h-12 bg-teal-700 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-xs"
          >
            KM
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 font-display">
          Store POS Terminal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          Kiara Medicals Counter & Dispensary Login
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-8">
          {/* Quick Demo Switch */}
          <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">
              Quick Test Switch:
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-sm">
              <button
                type="button"
                onClick={() => handleQuickFill('staff.a@kiaramedicals.com', 'shopA123')}
                className="py-1.5.5 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold text-center truncate transition shadow-2xs"
                title="Shop A Staff"
              >
                Shop A
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff.b@kiaramedicals.com', 'shopB123')}
                className="py-1.5.5 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold text-center truncate transition shadow-2xs"
                title="Shop B Staff"
              >
                Shop B
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager.c@kiaramedicals.com', 'shopC123')}
                className="py-1.5.5 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold text-center truncate transition shadow-2xs"
                title="Shop C Manager"
              >
                Shop C
              </button>
            </div>
          </div>

          <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-3">
                <Lock size={18} className="text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-1 font-display">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail size={20} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 text-sm font-mono"
                  placeholder="staff@kiaramedicals.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-1 font-display">
                Password
              </label>
              <div className="relative">
                <Key size={20} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-lg transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-500 flex items-center justify-center gap-3">
            <span>Headquarters Admin?</span>
            <Link to="/admin/login" className="text-blue-800 font-semibold hover:underline">
              HQ Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLogin;
