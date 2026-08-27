import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, ShieldCheck, ArrowRight, Receipt, Package, Users, BarChart3, Clock, Check } from 'lucide-react';

export const LandingHub = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white text-sm tracking-tight">
              KM
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Kiara Medicals
                <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Retail Pharmacy POS & Multi-Branch Inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600">
                  Signed in: <strong className="text-slate-900">{user?.name}</strong>
                </span>
                <Link
                  to={user?.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/store/dashboard'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/store/login"
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition"
                >
                  Store Login
                </Link>
                <Link
                  to="/admin/login"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
                >
                  HQ Admin Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Selector */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2 font-display">
            Pharmacy Operating System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Select Management Portal
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Multi-branch medical store system. Counter staff access isolated store terminals with GST billing and FEFO dispensing; headquarters manages consolidated analytics and master catalog.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Store Terminal */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-teal-600 transition flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center text-teal-700">
                  <Store size={20} />
                </div>
                <span className="text-[11px] font-mono font-semibold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Branch Scoped
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                Store POS & Branch Operations
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Counter terminal for retail branches (Shop A, Shop B, Shop C). Quick POS billing, batch FEFO stock reduction, patient records, and distributor inward entries.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-teal-600 flex-shrink-0" />
                  <span>Rapid POS Billing & Sequential GST Invoicing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-teal-600 flex-shrink-0" />
                  <span>FEFO Inventory & Batch Expiry Surveillance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-teal-600 flex-shrink-0" />
                  <span>Patient Prescription & Doctor Registry</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/store/login"
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>Enter Store Terminal</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 2: Super Admin Portal */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-700 transition flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-blue-800">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[11px] font-mono font-semibold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Enterprise HQ
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-800 transition">
                Headquarters Command Center
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Centralized management for owners and general administrators. Consolidated revenue across all retail shops, master catalog management, and branch performance comparison.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-blue-800 flex-shrink-0" />
                  <span>Consolidated Enterprise Revenue & Valuation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-blue-800 flex-shrink-0" />
                  <span>Central Master Medicine Catalog & Matrix Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-800 flex-shrink-0" />
                  <span>Global Expiry Surveillance & Risk Capital Alerts</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/admin/login"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>Enter HQ Command Center</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Accounts Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Quick Test Accounts
              </h3>
              <p className="text-xs text-slate-500">
                Pre-configured multi-branch accounts to verify database-level branch isolation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-blue-900">Super Admin (HQ)</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">admin@kiaramedicals.com</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Password: admin123</div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">Scope: Enterprise (All)</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-teal-800">Shop A Cashier</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">staff.a@kiaramedicals.com</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Password: shopA123</div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">Scope: BR-A (Main Road)</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-teal-800">Shop B Cashier</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">staff.b@kiaramedicals.com</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Password: shopB123</div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">Scope: BR-B (Station Road)</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-teal-800">Shop C Manager</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">manager.c@kiaramedicals.com</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Password: shopC123</div>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">Scope: BR-C (City Center)</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Kiara Medicals — Multi-Branch Pharmacy Management System
      </footer>
    </div>
  );
};

export default LandingHub;
