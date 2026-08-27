import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import adminApi from '../adminApi';
import { ChevronDown, Globe, Store, Check } from 'lucide-react';

export const BranchSwitcher = () => {
  const { activeBranch, switchBranch, isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
  }, [isAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/branches');
      if (res.data?.success) {
        setBranches(res.data.data.filter((b) => b.isActive));
      }
    } catch (err) {
      console.error('Failed to load branches in switcher', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  const handleSelect = (branch) => {
    switchBranch(branch);
    setOpen(false);
  };

  const isAllSelected = !activeBranch;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition shadow-2xs group min-w-[170px]"
      >
        {isAllSelected ? (
          <Globe className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
        ) : (
          <Store className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
        )}
        <span className="flex-1 text-left truncate text-xs">
          {isAllSelected ? 'All Branches (HQ)' : activeBranch.name}
        </span>
        {!isAllSelected && (
          <span className="font-mono text-[9px] bg-slate-200 text-slate-800 px-1 py-0.2 rounded border border-slate-300 flex-shrink-0">
            {activeBranch.code}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 flex-shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display">
              Reporting Scope
            </div>
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">
            {/* All Branches Option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                isAllSelected ? 'bg-blue-50/60 font-semibold' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isAllSelected
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Globe size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs ${isAllSelected ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                  All Branches (Consolidated)
                </div>
                <div className="text-[10px] text-slate-500">Enterprise aggregate view</div>
              </div>
              {isAllSelected && <Check size={14} className="text-blue-800 flex-shrink-0" />}
            </button>

            <div className="mx-3 my-1 h-px bg-slate-100" />

            {/* Branch Options */}
            {branches.map((b) => {
              const isSelected = activeBranch?.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelect(b)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-teal-50/60 font-semibold' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Store size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs truncate ${isSelected ? 'text-teal-900 font-bold' : 'text-slate-800'}`}>
                        {b.name}
                      </span>
                      <span className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 flex-shrink-0">
                        {b.code}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{b.city || b.address}</div>
                  </div>
                  {isSelected && <Check size={14} className="text-teal-800 flex-shrink-0" />}
                </button>
              );
            })}

            {branches.length === 0 && !loading && (
              <div className="px-3 py-3 text-center text-[11px] text-slate-400">
                No active branches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;
