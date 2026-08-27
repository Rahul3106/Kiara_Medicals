import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import adminApi from '../adminApi';
import AdminNavbar from '../components/AdminNavbar';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Receipt, Search, Filter, IndianRupee, FileText, Download,
  CheckCircle2, AlertCircle, RotateCcw, Calendar, TrendingUp,
} from 'lucide-react';

const PAYMENT_COLORS = { CASH: '#0d9488', UPI: '#1e40af', CARD: '#7c3aed', CREDIT: '#d97706', SPLIT: '#db2777' };
const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-amber-50 text-amber-800 border-amber-200',
};

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
      <p className="font-bold text-slate-900">{payload[0].name}</p>
      <p className="text-slate-600 font-mono font-semibold">{payload[0].value} bills</p>
    </div>
  );
};

export const ConsolidatedSales = () => {
  const { activeBranch } = useAuth();
  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [page, setPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeBranch?.id) setBranchFilter(activeBranch.id);
    else setBranchFilter('');
  }, [activeBranch]);

  useEffect(() => {
    fetchData();
  }, [page, branchFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '20');
      if (branchFilter) params.set('branchId', branchFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const [salesRes, branchesRes] = await Promise.all([
        adminApi.get(`/sales/consolidated?${params}`),
        adminApi.get('/branches'),
      ]);

      if (salesRes.data.success) {
        setSales(salesRes.data.data.sales);
        setTotal(salesRes.data.data.total);
        setTotalPages(salesRes.data.data.totalPages);
        setTotalRevenue(salesRes.data.data.totalRevenue);
        setTotalTax(salesRes.data.data.totalTax);
      }
      if (branchesRes.data.success) setBranches(branchesRes.data.data);
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const avgBill = total > 0 ? totalRevenue / total : 0;

  const paymentDist = {};
  sales.forEach((s) => {
    paymentDist[s.paymentMode] = (paymentDist[s.paymentMode] || 0) + 1;
  });
  const pieData = Object.entries(paymentDist).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Sales Ledger & Audit
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Enterprise Invoicing & Sales History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated GST sales receipts, payment breakdowns, and bill audits across retail stores
            </p>
          </div>
          <button className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs">
            <Download size={13} /> <span>Export CSV</span>
          </button>
        </div>

        {/* 4 KPI Cards: Compact padding, high data density, large bold numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Total Revenue
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <IndianRupee size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              {fmt(totalRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Completed sales volume</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                GST Collected
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <Receipt size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              {fmt(totalTax)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">CGST + SGST total</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Total Invoices
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <FileText size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              {total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Generated tax invoices</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Avg Invoice Value
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <TrendingUp size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              {fmt(avgBill)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Per-ticket basket size</div>
          </div>
        </div>

        {/* Compact Channels Donut & Dense Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Payment Channels (Compact, fills nicely with no wasted vertical padding) */}
          {pieData.length > 0 && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                  Payment Channels
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">{sales.length} sample</span>
              </div>
              <div className="h-28 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={PAYMENT_COLORS[d.name] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center border-t border-slate-100 pt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[d.name] || '#64748b' }} />
                    <span className="font-semibold text-[11px]">{d.name}:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters & Search: Snug single card sized to fit controls, no empty bottom area */}
          <div className={`${pieData.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400" />
                <span>Filters & Search</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Refine ledger records</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="">All Branches</option>
                {branches.filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <form onSubmit={handleSearch} className="flex gap-1.5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bill # or Patient name..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Search size={13} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Dense Invoices Table: High readability, confidently sized typography */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              Ledger Transactions ({total})
            </span>
            <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">Loading invoices...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">No invoices found matching current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                  <tr>
                    <th className="px-4 py-2.5">Invoice Number</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Branch</th>
                    <th className="px-4 py-2.5">Patient / Customer</th>
                    <th className="px-4 py-2.5 text-center">Items</th>
                    <th className="px-4 py-2.5 text-center">Payment</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-900">
                        {s.billNumber}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                        {new Date(s.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {s.branch?.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 text-xs leading-snug">{s.customer?.name || 'Walk-in Customer'}</div>
                        {s.customer?.phone && (
                          <div className="text-[11px] text-slate-500 font-mono leading-tight">{s.customer.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-700">
                        {s._count?.items || 0}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {s.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLES[s.status] || ''}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-sm">
                        {fmt(s.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Snug Pagination attached directly to the table footer */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50/70">
              <span className="text-slate-500 font-medium">
                Page {page} of {totalPages} · {total} records
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 disabled:opacity-40 font-semibold shadow-2xs hover:bg-slate-50 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 disabled:opacity-40 font-semibold shadow-2xs hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConsolidatedSales;
