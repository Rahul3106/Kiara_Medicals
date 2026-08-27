import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Building2, Users, Package, Receipt, Clock,
  ShieldCheck, IndianRupee, Layers, AlertTriangle,
  RotateCw, ArrowUpRight, CheckCircle2,
} from 'lucide-react';

const CHART_COLORS = ['#0d9488', '#1e40af', '#d97706', '#7c3aed', '#db2777', '#0891b2'];

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtShort = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
      <p className="font-bold text-slate-900 mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-600 font-mono">
          {p.name}: <span className="font-bold text-slate-900">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
      <p className="font-semibold text-slate-800">{name}</p>
      <p className="font-bold text-teal-800 font-mono">{fmt(value)}</p>
    </div>
  );
};

const quickActions = [
  { title: 'Store Branches', desc: 'Onboard stores & GSTINs', path: '/admin/branches', icon: Building2 },
  { title: 'Staff & Users', desc: 'Role permissions & accounts', path: '/admin/users', icon: Users },
  { title: 'Enterprise Stock', desc: 'Cross-branch inventory matrix', path: '/admin/inventory', icon: Package },
  { title: 'All Invoices', desc: 'Consolidated sales records', path: '/admin/sales', icon: Receipt },
  { title: 'Expiry Watchlist', desc: 'Global batch surveillance', path: '/admin/expiry', icon: Clock },
  { title: 'Audit Logs', desc: 'Immutable compliance trail', path: '/admin/audit-logs', icon: ShieldCheck },
];

export const AdminDashboard = () => {
  const { activeBranch } = useAuth();
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

  const revenueChartData = comparison.map((b) => ({
    name: b.code,
    branch: b.name,
    revenue: b.totalRevenue,
    inventory: b.inventoryValuation,
  }));

  const pieData = comparison.map((b) => ({
    name: b.name,
    value: b.inventoryValuation,
  }));

  const totalPieValue = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Top Header & Scope Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Headquarters Command
              </span>
              <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded">
                {activeBranch ? activeBranch.code : 'CONSOLIDATED'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">
              {activeBranch ? `${activeBranch.name} Performance` : 'Enterprise Consolidated Overview'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeBranch
                ? `Filtered strictly to branch [${activeBranch.code}]`
                : 'Aggregated real-time metrics across all active Kiara Medical retail stores'}
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs self-start sm:self-auto"
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-mono">
            Loading enterprise metrics...
          </div>
        ) : (
          <>
            {/* Dense 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Revenue */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                    Total Enterprise Revenue
                  </span>
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <IndianRupee size={13} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
                  {fmt(summary?.totalRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Across <span className="font-semibold text-slate-700 font-mono">{summary?.totalSalesCount || 0}</span> invoices
                </div>
              </div>

              {/* Card 2: Inventory Valuation (Cost) */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                    Stock Valuation (Cost)
                  </span>
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Layers size={13} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
                  {fmtShort(summary?.inventoryCostValue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Retail: <span className="font-semibold text-slate-700 font-mono">{fmtShort(summary?.inventoryRetailValue)}</span>
                </div>
              </div>

              {/* Card 3: Formulations & Units */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                    Master Formulations
                  </span>
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Package size={13} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
                  {summary?.totalMedicines || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                  <span className="font-semibold text-slate-700 font-mono">{summary?.totalStockUnits || 0}</span> stock units
                </div>
              </div>

              {/* Card 4: Near Expiry */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                    Near Expiry Watch (90d)
                  </span>
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Clock size={13} />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight mt-1.5 leading-none flex items-baseline gap-2">
                  <span className={summary?.nearExpiryBatchesCount > 0 ? 'text-amber-700' : 'text-slate-900'}>
                    {summary?.nearExpiryBatchesCount || 0}
                  </span>
                  {summary?.nearExpiryBatchesCount > 0 && (
                    <span className="text-[10px] font-sans font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                      Action
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                  Batches nearing expiry
                </div>
              </div>
            </div>

            {/* Charts Row */}
            {!activeBranch && comparison.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                {/* Revenue Bar Chart */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                        Branch Revenue & Stock Cost
                      </h2>
                      <p className="text-[11px] text-slate-500">Comparative retail performance by store</p>
                    </div>
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {comparison.length} Stores
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueChartData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={600} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inventory" name="Inventory Cost" fill="#1e40af" radius={[4, 4, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stock Distribution Pie Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider mb-0.5">
                      Inventory Capital Share
                    </h2>
                    <p className="text-[11px] text-slate-500 mb-2">Locked stock capital per store</p>
                  </div>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center my-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Stock Capital: </span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{fmtShort(totalPieValue)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center border-t border-slate-100 pt-2">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[11px] font-medium">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Branch Performance Comparison Matrix */}
            {!activeBranch && comparison.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                    Branch Operational Matrix ({comparison.length})
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">Live store telemetry</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                      <tr>
                        <th className="px-4 py-2.5">Store Name</th>
                        <th className="px-4 py-2.5">Code</th>
                        <th className="px-4 py-2.5">City</th>
                        <th className="px-4 py-2.5 text-center">Staff</th>
                        <th className="px-4 py-2.5 text-center">Batches</th>
                        <th className="px-4 py-2.5 text-center">Bills</th>
                        <th className="px-4 py-2.5 text-right">Inventory Valuation</th>
                        <th className="px-4 py-2.5 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {comparison.map((br) => (
                        <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-slate-900 text-xs">{br.name}</td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {br.code}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 text-xs">{br.city}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{br.userCount}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-teal-800 font-bold text-xs">{br.batchCount}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{br.totalBills}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800 text-xs">
                            {fmtShort(br.inventoryValuation)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-sm">
                            {fmt(br.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Action Navigation Cards */}
            <div className="pt-1">
              <div className="mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                  Headquarters Modules
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {quickActions.map((action) => (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-3 flex items-center justify-between transition group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-blue-900 transition">
                        <action.icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition font-display">
                          {action.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{action.desc}</div>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-900 transition" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
