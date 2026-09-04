import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import BranchSwitcher from './BranchSwitcher';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Receipt,
  Clock,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Branches', path: '/admin/branches', icon: Building2 },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Stock', path: '/admin/inventory', icon: Package },
  { name: 'All Invoices', path: '/admin/sales', icon: Receipt },
  { name: 'Expiry', path: '/admin/expiry', icon: Clock },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
];

export const AdminNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const navClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3.5 py-1.5.5 text-sm font-semibold transition-all duration-150 whitespace-nowrap rounded-lg flex-shrink-0 ${
      isActive
        ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
    }`;

  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="h-14 flex items-center justify-between gap-3">
            {/* Left: Brand */}
            <div className="flex items-center gap-3.5 flex-shrink-0">
              <button
                type="button"
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setMobileOpen(true)}
                aria-label="Open mobile menu"
              >
                <Menu size={18} />
              </button>

              <Link to="/admin/dashboard" className="flex items-center gap-3 group flex-shrink-0">
                <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-2xs group-hover:bg-slate-800 transition">
                  KM
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900 text-base tracking-tight font-display whitespace-nowrap">
                    Kiara Medicals
                  </span>
                  <span className="font-mono text-xs font-bold bg-blue-50 text-blue-800 px-1 py-0.2 rounded border border-blue-200">
                    HQ
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2 overflow-x-auto py-1.5">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={navClass}>
                  <item.icon size={18} className="flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right: BranchSwitcher + Profile (Single-line row, no wrapping) */}
            <div className="flex items-center gap-3 flex-shrink-0 whitespace-nowrap">
              <BranchSwitcher />

              {/* Single-line user info */}
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200 flex-shrink-0">
                <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-sm text-slate-700 flex-shrink-0">
                  {initial}
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-xs text-blue-700 font-medium mt-0.5">
                    Super Admin
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition flex-shrink-0 whitespace-nowrap"
                title="Sign out of HQ"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                    KM
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Kiara Medicals</div>
                    <div className="text-xs text-blue-800 font-mono">HQ Admin</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={navClass}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-sm font-semibold text-slate-900 mb-0.5">{user?.name}</div>
              <div className="text-xs text-blue-700 font-medium mb-3">Super Admin</div>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
