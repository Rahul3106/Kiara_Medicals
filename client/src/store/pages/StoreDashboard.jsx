import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import BranchBadge from '../../shared/components/BranchBadge';
import storeApi from '../storeApi';

export const StoreDashboard = () => {
  const { user, activeBranch, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBranchInventory();
  }, [search]);

  const fetchBranchInventory = async () => {
    try {
      setLoading(true);
      const res = await storeApi.get(`/inventory?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setInventory(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch branch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const branch = activeBranch || user?.branch;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
              KM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">{branch?.name || 'Kiara Medicals'}</h1>
                <BranchBadge branch={branch} />
              </div>
              <p className="text-xs text-slate-500">{branch?.address}, {branch?.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {user?.role === 'BRANCH_MANAGER' ? '🏪 Branch Manager' : '💳 Cashier / Staff'}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compliance & Branch Meta Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Branch Overview & Live Inventory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-Tenant Isolation: Queries are strictly filtered by Branch ID [
                <span className="font-mono text-emerald-700 font-semibold">{branch?.code}</span>]
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">GSTIN:</span>
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                {branch?.gstNumber || 'N/A'}
              </span>
              <span className="text-xs font-medium text-slate-500 ml-2">DL No:</span>
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                {branch?.drugLicenseNo || 'N/A'}
              </span>
            </div>
          </div>

          {/* Quick Actions / Search */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="w-full sm:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search medicines, salt, or batch..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBranchInventory}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                🔄 Refresh Stock
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Current Branch Stock ({inventory.length} Batches)
            </h3>
            <span className="text-xs text-slate-500">Isolated to {branch?.name}</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading branch stock data...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No inventory records found for this branch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Medicine Name</th>
                    <th className="px-6 py-3.5">Composition / Salt</th>
                    <th className="px-6 py-3.5">Batch No</th>
                    <th className="px-6 py-3.5">Expiry Date</th>
                    <th className="px-6 py-3.5">Rack</th>
                    <th className="px-6 py-3.5 text-right">Available Qty</th>
                    <th className="px-6 py-3.5 text-right">MRP (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {b.medicine?.name}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {b.medicine?.composition || b.medicine?.genericName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                          {b.batchNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(b.expiryDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {b.rackLocation || '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {b.quantity}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          {b.medicine?.unit || 'units'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">
                        ₹{Number(b.mrp).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StoreDashboard;
