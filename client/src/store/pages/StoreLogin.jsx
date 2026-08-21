import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import axios from 'axios';

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
      const res = await axios.post('/api/auth/store-login', { email, password });
      if (res.data?.success) {
        const { user, accessToken } = res.data.data;
        login(user, accessToken, user.branch);
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white font-bold text-2xl">
            KM
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Kiara Medicals
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Branch POS & Store Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-200 sm:rounded-2xl sm:px-10">
          {/* Quick Fill Helpers for Testing */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              ⚡ Quick Demo Switch:
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('staff.a@kiaramedicals.com', 'shopA123')}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium text-center truncate"
                title="Shop A Staff"
              >
                🏪 Shop A
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff.b@kiaramedicals.com', 'shopB123')}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium text-center truncate"
                title="Shop B Staff"
              >
                🏪 Shop B
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager.c@kiaramedicals.com', 'shopC123')}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium text-center truncate"
                title="Shop C Manager"
              >
                🏪 Shop C
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Store Email Address
              </label>
              <div className="mt-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm shadow-sm"
                  placeholder="staff@kiaramedicals.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Store'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <a
              href="/admin/login"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              🔒 Super Admin Portal Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLogin;
