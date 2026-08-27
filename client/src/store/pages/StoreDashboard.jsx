import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import StoreNavbar from '../components/StoreNavbar';
import storeApi from '../storeApi';
import {
  Receipt,
  ArrowDownToLine,
  FileText,
  Package,
  BarChart3,
  Search,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  FileCheck2,
} from 'lucide-react';

export const StoreDashboard = () => {
  const { user, activeBranch } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [salesSummary, setSalesSummary] = useState({ totalRevenue: 0, totalBills: 0 });

  const branch = activeBranch || user?.branch;

  useEffect(() => {
    fetchDashboardData();
  }, [search]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [invRes, salesRes] = await Promise.all([
        storeApi.get(`/inventory?search=${encodeURIComponent(search)}&limit=15`),
        storeApi.get(`/sales?limit=1`),
      ]);

      if (invRes.data?.success) {
        setInventory(invRes.data.data.batches || invRes.data.data.items || []);
      }
      if (salesRes.data?.success) {
        setSalesSummary({
          totalRevenue: salesRes.data.data.totalRevenue || 0,
          totalBills: salesRes.data.data.total || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch store dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalStockUnits = inventory.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const totalInventoryValuation = inventory.reduce(
    (sum, b) => sum + (b.quantity || 0) * Number(b.mrp || b.sellingPrice || 0),
    0
  );

  const now = new Date();
  const ninetyDays = new Date();
  ninetyDays.setDate(now.getDate() + 90);

  const nearExpiryCount = inventory.filter((b) => {
    const exp = new Date(b.expiryDate);
    return exp <= ninetyDays && b.quantity > 0;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <StoreNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Top Context & Primary POS Action Strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Single-Source Branch Identity */}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                  Store Terminal
                </span>
                <span className="font-mono text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.2 rounded">
                  {branch?.code || 'BR-A'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                {branch?.name || 'Kiara Medicals'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400 font-sans">GSTIN:</span>
                  <strong className="text-slate-800">{branch?.gstNumber || '27AABCU9603R1ZM'}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400 font-sans">DL:</span>
                  <strong className="text-slate-800">{branch?.drugLicenseNo || 'MH-MZ3-12890'}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-slate-400 font-sans" />
                  <span className="text-slate-700 font-sans">{branch?.city || 'Pune'}</span>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                to="/store/sales/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg transition shadow-2xs"
              >
                <Receipt size={14} />
                <span>POS Quick Bill</span>
                <span className="text-[10px] font-mono bg-teal-800/80 px-1.5 py-0.2 rounded border border-teal-600/60 ml-0.5">
                  F2
                </span>
              </Link>
              <Link
                to="/store/purchases/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg text-xs font-semibold transition shadow-2xs"
              >
                <ArrowDownToLine size={14} />
                <span>Inward Stock</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-slate-500 ml-0.5">
                  F4
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Dense 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Revenue */}
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
              ₹{Number(salesSummary.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">
              From <span className="font-semibold text-slate-700">{salesSummary.totalBills}</span> completed bills
            </div>
          </div>

          {/* Card 2: Invoices Generated */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                GST Invoices
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <FileCheck2 size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              {salesSummary.totalBills}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">
              Sequential branch series
            </div>
          </div>

          {/* Card 3: Inventory Value */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Stock Value (MRP)
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <Package size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              ₹{Number(totalInventoryValuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">
              <span className="font-semibold text-slate-700 font-mono">{totalStockUnits}</span> units across {inventory.length} batches
            </div>
          </div>

          {/* Card 4: Near Expiry Alert */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Expiry Watch (90d)
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <Clock size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight mt-1.5 leading-none flex items-baseline gap-2">
              <span className={nearExpiryCount > 0 ? 'text-amber-700' : 'text-slate-900'}>
                {nearExpiryCount}
              </span>
              {nearExpiryCount > 0 && (
                <span className="text-[10px] font-sans font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                  Review
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">
              FEFO priority queue
            </div>
          </div>
        </div>

        {/* Live FEFO Stock Data Grid */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {/* Table Header Controls */}
          <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-slate-50/70">
            <div>
              <h2 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                Live Branch Inventory ({inventory.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                First-Expiry-First-Out (FEFO) dispensing order
              </p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine, salt, batch..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Table Data */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">
              Loading inventory stock...
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No inventory records found for branch {branch?.code}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                  <tr>
                    <th className="px-4 py-2.5">Medicine & Salt Formulation</th>
                    <th className="px-4 py-2.5 text-center">Batch</th>
                    <th className="px-4 py-2.5 text-center">Expiry</th>
                    <th className="px-4 py-2.5 text-center">Rack</th>
                    <th className="px-4 py-2.5 text-right">Available Qty</th>
                    <th className="px-4 py-2.5 text-right">MRP</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {inventory.map((b) => {
                    const exp = new Date(b.expiryDate);
                    const isNearExp = exp <= ninetyDays && b.quantity > 0;
                    const isExpired = exp <= now && b.quantity > 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-900 text-xs leading-snug">
                            {b.medicine?.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.medicine?.composition || b.medicine?.genericName || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {b.batchNumber}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-700 whitespace-nowrap">
                          {exp.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-slate-600 text-xs">
                          {b.rackLocation || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-xs">
                          {b.quantity} <span className="text-[10px] font-normal text-slate-400 font-sans">{b.medicine?.unit || 'Units'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-xs">
                          ₹{Number(b.mrp || b.sellingPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <AlertTriangle size={11} className="text-red-700" />
                              <span>Expired</span>
                            </span>
                          ) : isNearExp ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <Clock size={11} className="text-amber-700" />
                              <span>&lt;90d</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 size={11} className="text-emerald-700" />
                              <span>Valid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
