import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import adminApi from '../adminApi';

export const BranchSwitcher = () => {
  const { activeBranch, switchBranch, isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
  }, [isAdmin]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/branches');
      if (res.data?.success) {
        setBranches(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load branches in switcher', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-700">
      <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Scope:</span>
      <select
        value={activeBranch?.id || 'ALL'}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'ALL') {
            switchBranch(null);
          } else {
            const selected = branches.find((b) => b.id === val);
            switchBranch(selected);
          }
        }}
        className="bg-slate-900 text-white font-medium border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        disabled={loading}
      >
        <option value="ALL">🌐 All Branches (Consolidated)</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            🏪 {b.name} ({b.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default BranchSwitcher;
