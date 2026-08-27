import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  AlertTriangle, Clock, AlertCircle, ShieldAlert, Package, IndianRupee, Filter, RotateCw,
} from 'lucide-react';

const STATUS_COLORS = { EXPIRED: '#dc2626', CRITICAL: '#d97706', NEAR_EXPIRY: '#ca8a04', VALID: '#16a34a' };
const STATUS_LABELS = { EXPIRED: 'Expired', CRITICAL: 'Critical (<30d)', NEAR_EXPIRY: 'Near Expiry (<90d)', VALID: 'Valid' };
const STATUS_STYLES = {
  EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-amber-50 text-amber-800 border-amber-200',
  NEAR_EXPIRY: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  VALID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
      <p className="font-bold text-slate-900">{payload[0].name || payload[0].payload?.name}</p>
      <p className="font-mono text-slate-700">
        {typeof payload[0].value === 'number' && payload[0].value > 100 ? fmt(payload[0].value) : `${payload[0].value} batches`}
      </p>
    </div>
  );
};

export const ExpiryOverview = () => {
  const { activeBranch } = useAuth();
  const [batches, setBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAtRisk, setTotalAtRisk] = useState(0);
  const [branchFilter, setBranchFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState(90);

  useEffect(() => {
    if (activeBranch?.id) setBranchFilter(activeBranch.id);
    else setBranchFilter('');
  }, [activeBranch]);

  useEffect(() => {
    fetchData();
  }, [branchFilter, daysFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('days', daysFilter);
      if (branchFilter) params.set('branchId', branchFilter);

      const [expiryRes, branchesRes] = await Promise.all([
        adminApi.get(`/expiry/overview?${params}`),
        adminApi.get('/branches'),
      ]);

      if (expiryRes.data.success) {
        setBatches(expiryRes.data.data.batches);
        setTotalAtRisk(expiryRes.data.data.totalAtRiskValuation);
      }
      if (branchesRes.data.success) setBranches(branchesRes.data.data);
    } catch (err) {
      console.error('Failed to load expiry data', err);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = { EXPIRED: 0, CRITICAL: 0, NEAR_EXPIRY: 0 };
  batches.forEach((b) => {
    if (statusCounts[b.status] !== undefined) statusCounts[b.status]++;
  });

  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: STATUS_LABELS[name], value, key: name }));

  const branchRisk = {};
  batches.forEach((b) => {
    const code = b.branch?.code || 'Unknown';
    branchRisk[code] = (branchRisk[code] || 0) + b.atRiskValuation;
  });
  const branchBarData = Object.entries(branchRisk).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Risk & Expiry Surveillance
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Global Batch Expiry & Locked Capital
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Surveillance on near-expiry formulations across branches to prevent clinical expiration and capital loss
            </p>
          </div>
          <button onClick={fetchData} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs">
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> <span>Refresh Data</span>
          </button>
        </div>

        {/* Alert Strip: Compact padding with confident typography */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
              Total At-Risk Capital Valuation
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 leading-none">{fmt(totalAtRisk)}</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">{batches.length} batches flagged within {daysFilter} days</div>
          </div>
          <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-5">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`text-xl font-bold font-mono leading-none ${status === 'EXPIRED' ? 'text-red-700' : status === 'CRITICAL' ? 'text-amber-700' : 'text-slate-800'}`}>
                  {count}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-500 font-display mt-1">{STATUS_LABELS[status]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={13} className="text-slate-400 hidden sm:block" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none w-full sm:w-auto"
            >
              <option value="">All Branches</option>
              {branches.filter(b => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </div>
          <div className="flex gap-1 self-start sm:self-auto">
            {[30, 60, 90, 180].map((d) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${daysFilter === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        {!loading && batches.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {pieData.length > 0 && (
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider mb-0.5">
                    Expiry Severity Breakdown
                  </h2>
                  <p className="text-[11px] text-slate-500 mb-2">Batch counts by urgency tier</p>
                </div>
                <div className="h-32 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value" stroke="#ffffff" strokeWidth={1.5}>
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={STATUS_COLORS[d.key] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center border-t border-slate-100 pt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.key] }} />
                      <span className="text-[11px] font-medium">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {branchBarData.length > 0 && (
              <div className={`${pieData.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs`}>
                <div className="mb-2">
                  <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">At-Risk Capital by Store</h2>
                  <p className="text-[11px] text-slate-500">Financial exposure per retail branch</p>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={branchBarData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={600} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="At-Risk Value" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Expiry Table: Confident typography and dense layout */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              Flagged Batches Surveillance ({batches.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">Sorted by earliest expiry date</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">Scanning batches...</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">No batches expiring within {daysFilter} days.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                  <tr>
                    <th className="px-4 py-2.5">Medicine & Salt</th>
                    <th className="px-4 py-2.5">Batch No</th>
                    <th className="px-4 py-2.5">Branch</th>
                    <th className="px-4 py-2.5">Expiry Date</th>
                    <th className="px-4 py-2.5 text-center">Days Left</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">At-Risk Value (₹)</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {batches.map((b) => (
                    <tr key={b.id} className={`hover:bg-slate-50/80 transition-colors ${b.status === 'EXPIRED' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 text-xs leading-snug">{b.medicine?.name}</div>
                        <div className="text-[11px] text-slate-500">{b.medicine?.composition || b.medicine?.genericName}</div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-800">{b.batchNumber}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {b.branch?.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {new Date(b.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs">
                        <span className={`font-bold ${b.daysToExpiry <= 0 ? 'text-red-700' : b.daysToExpiry <= 30 ? 'text-amber-700' : 'text-slate-800'}`}>
                          {b.daysToExpiry <= 0 ? `${Math.abs(b.daysToExpiry)}d exp` : `${b.daysToExpiry}d`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-xs">{b.quantity}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-sm">{fmt(b.atRiskValuation)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLES[b.status]}`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
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

export default ExpiryOverview;
