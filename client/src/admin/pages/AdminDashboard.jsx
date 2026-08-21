import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import BranchSwitcher from '../components/BranchSwitcher';
import adminApi from '../adminApi';

export const AdminDashboard = () => {
  const { user, logout, activeBranch } = useAuth();
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [activeBranch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const branchParam = activeBranch?.id ? `?branchId=${activeBranch.id}` : '';
      const [sumRes, compRes] = await Promise.all([
        adminApi.get(`/dashboard/summary${branchParam}`),
        adminApi.get('/dashboard/branch-comparison'),
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (compRes.data?.success) setComparison(compRes.data.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              KM
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Kiara Medicals Admin</h1>
              <p className="text-xs text-slate-400">Consolidated Headquarters</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BranchSwitcher />
            <div className="h-6 w-[1px] bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs font-semibold text-white">{user?.name}</div>
              <div className="text-[11px] text-blue-400">Super Administrator</div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 hover:text-red-300 border border-slate-700 rounded-lg text-xs font-medium transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scope Banner */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {activeBranch ? `Branch Analytics: ${activeBranch.name}` : 'Consolidated Enterprise Analytics'}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {activeBranch
                ? `Showing isolated data for branch code [${activeBranch.code}]`
                : 'Aggregated real-time metrics across all Kiara Medical retail stores'}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
          >
            🔄 Refresh Metrics
          </button>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading system metrics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {activeBranch ? 'Active Branch' : 'Total Branches'}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-white">
                    {activeBranch ? activeBranch.code : `${summary?.totalBranches || 0} Stores`}
                  </div>
                  <span className="text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Active
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Inventory Valuation (Cost)
                </div>
                <div className="mt-2 text-2xl font-extrabold text-blue-400">
                  ₹{(summary?.inventoryCostValue || 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Retail Value: ₹{(summary?.inventoryRetailValue || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Medicines Catalog
                </div>
                <div className="mt-2 text-2xl font-extrabold text-purple-400">
                  {summary?.totalMedicines || 0} Formulas
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {summary?.totalStockUnits || 0} units in stock
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Near-Expiry Batches (90d)
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-amber-400">
                    {summary?.nearExpiryBatchesCount || 0}
                  </div>
                  <span className="text-xs text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    Review Required
                  </span>
                </div>
              </div>
            </div>

            {/* Branch Comparison Table (Only shown in consolidated view) */}
            {!activeBranch && (
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl mb-8">
                <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Branch Performance & Stock Comparison</h3>
                    <p className="text-xs text-slate-400">Side-by-side branch comparison</p>
                  </div>
                  <span className="text-xs font-semibold bg-blue-900/60 text-blue-300 px-2.5 py-1 rounded-full border border-blue-700/50">
                    {comparison.length} Active Stores
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-3.5">Branch Name</th>
                        <th className="px-6 py-3.5">Code</th>
                        <th className="px-6 py-3.5">City</th>
                        <th className="px-6 py-3.5 text-center">Staff Count</th>
                        <th className="px-6 py-3.5 text-center">Active Batches</th>
                        <th className="px-6 py-3.5 text-right">Inventory Cost</th>
                        <th className="px-6 py-3.5 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {comparison.map((br) => (
                        <tr key={br.id} className="hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 font-semibold text-white">{br.name}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-slate-900 px-2 py-0.5 rounded text-blue-300 border border-slate-700">
                              {br.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{br.city}</td>
                          <td className="px-6 py-4 text-center">{br.userCount}</td>
                          <td className="px-6 py-4 text-center font-medium text-emerald-400">
                            {br.batchCount}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            ₹{br.inventoryValuation.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-white">
                            ₹{br.totalRevenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
