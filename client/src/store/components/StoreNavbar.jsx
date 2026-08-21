import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import BranchBadge from '../../shared/components/BranchBadge';

export const StoreNavbar = () => {
  const { user, activeBranch, logout } = useAuth();
  const branch = activeBranch || user?.branch;

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Brand & Branch */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
              KM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{branch?.name || 'Kiara Medicals'}</span>
                <BranchBadge branch={branch} />
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                GSTIN: {branch?.gstNumber || 'N/A'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink to="/store/dashboard" className={navLinkClass}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/store/inventory" className={navLinkClass}>
              📦 Inventory & Stock
            </NavLink>
            <NavLink to="/store/purchases/new" className={navLinkClass}>
              ➕ New Purchase Entry
            </NavLink>
            <NavLink to="/store/purchases" end className={navLinkClass}>
              📑 Purchase Invoices
            </NavLink>
            <NavLink to="/store/suppliers" className={navLinkClass}>
              🏢 Suppliers
            </NavLink>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
              <div className="text-[10px] text-emerald-600 font-medium">
                {user?.role === 'BRANCH_MANAGER' ? 'Branch Manager' : 'Cashier / Staff'}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
            <button
              onClick={logout}
              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StoreNavbar;
