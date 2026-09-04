import React, { useState, useEffect } from 'react';
import storeApi from '../../storeApi';
import StoreNavbar from '../../components/StoreNavbar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Package,
  Download,
  Printer,
  RotateCw,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Percent,
} from 'lucide-react';

const PAYMENT_COLORS = {
  CASH: '#0d9488',
  UPI: '#1e40af',
  CARD: '#7c3aed',
  CREDIT: '#d97706',
  SPLIT: '#db2777',
};

export const StoreReports = () => {
  const [activeTab, setActiveTab] = useState('SALES'); // 'SALES', 'GST', 'STOCK_MOVEMENT'
  const [overviewData, setOverviewData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [stockMoveData, setStockMoveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await storeApi.get(`/reports/overview?days=${days}`);
      if (res.data.success) {
        setOverviewData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load overview reports', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGstSummary = async () => {
    setLoading(true);
    try {
      const res = await storeApi.get('/reports/gst-summary');
      if (res.data.success) {
        setGstData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load GST summary', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovement = async () => {
    setLoading(true);
    try {
      const res = await storeApi.get('/reports/stock-movement');
      if (res.data.success) {
        setStockMoveData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stock movement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'SALES') {
      fetchOverview();
    } else if (activeTab === 'GST') {
      fetchGstSummary();
    } else if (activeTab === 'STOCK_MOVEMENT') {
      fetchStockMovement();
    }
  }, [activeTab, days]);

  const handleExportGstCsv = () => {
    if (!gstData?.slabs) return;
    const headers = 'Tax Slab,Taxable Value (INR),CGST (INR),SGST (INR),Total Tax (INR),Total Invoice Value (INR),Units Sold\n';
    const rows = gstData.slabs
      .map(
        (s) =>
          `"${s.rateLabel}",${s.taxableValue},${s.cgst},${s.sgst},${s.totalTax},${s.totalValue},${s.itemCount}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GSTR1_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <StoreNavbar />

      <main className="flex-1 w-full w-full mx-auto px-6 sm:px-8 lg:px-12 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                Analytics & Filings
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Store Analytics & Financial Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Live retail branch sales trends, GSTR-1 tax filings, and dead stock optimization
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('SALES')}
              className={`px-4 py-1.5.5 rounded-md text-sm font-semibold transition flex items-center gap-2.5 ${
                activeTab === 'SALES'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp size={18} />
              <span>Sales Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('GST')}
              className={`px-4 py-1.5.5 rounded-md text-sm font-semibold transition flex items-center gap-2.5 ${
                activeTab === 'GST'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt size={18} />
              <span>GSTR-1 Tax</span>
            </button>

            <button
              onClick={() => setActiveTab('STOCK_MOVEMENT')}
              className={`px-4 py-1.5.5 rounded-md text-sm font-semibold transition flex items-center gap-2.5 ${
                activeTab === 'STOCK_MOVEMENT'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package size={18} />
              <span>Stock Velocity</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SALES & REVENUE ANALYTICS */}
        {activeTab === 'SALES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-500 uppercase font-display">Time Range:</span>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-2xs focus:ring-1 focus:ring-slate-900"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={60}>Last 60 Days</option>
                </select>
              </div>

              <button
                onClick={fetchOverview}
                className="inline-flex items-center gap-2.5 px-4 py-1.5.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-2xs"
              >
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm font-mono">
                Calculating sales metrics...
              </div>
            ) : !overviewData ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                No analytics data available for this branch.
              </div>
            ) : (
              <>
                {/* 4 Dense KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                        Today's Revenue
                      </span>
                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <IndianRupee size={18} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
                      ₹{Number(overviewData.today.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 leading-tight">
                      {overviewData.today.billsCount} bills today
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                        Month-to-Date
                      </span>
                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Calendar size={18} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
                      ₹{Number(overviewData.monthToDate.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 leading-tight">
                      {overviewData.monthToDate.billsCount} bills in month
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                        Gross Margin
                      </span>
                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Percent size={18} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-teal-800 font-mono tracking-tight mt-1.5 leading-none">
                      {overviewData.profitMetrics?.marginPercentage || 24}%
                    </div>
                    <div className="text-sm text-slate-500 mt-1 leading-tight">
                      ₹{Number(overviewData.profitMetrics?.totalGrossProfit || 0).toLocaleString('en-IN')} margin
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                        Stock Valuation (MRP)
                      </span>
                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Package size={18} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
                      ₹{Number(overviewData.stockHealth?.valuationMRP || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 leading-tight">
                      {overviewData.stockHealth?.totalUnits} units across batches
                    </div>
                  </div>
                </div>

                {/* Sales AreaChart & Payment Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left 8 Cols: Recharts Area Chart */}
                  <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                          Daily Sales Revenue Trend
                        </h3>
                        <p className="text-sm text-slate-500">Historical branch billing curve</p>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overviewData.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `₹${val}`}
                          />
                          <Tooltip
                            formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                            contentStyle={{
                              borderRadius: '0.5rem',
                              border: '1px solid #e2e8f0',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#0d9488"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRev)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right 4 Cols: Payment Breakdown Pie Chart */}
                  <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider mb-0.5">
                        Payment Methods
                      </h3>
                      <p className="text-sm text-slate-500 mb-2">Cash, UPI, and Card distribution</p>

                      <div className="h-36 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={overviewData.paymentBreakup.filter((p) => p.value > 0)}
                              innerRadius={32}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {overviewData.paymentBreakup.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [`₹${value}`, name]}
                              contentStyle={{ borderRadius: '0.5rem', fontSize: '11px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-100 text-sm">
                      {overviewData.paymentBreakup.map((p) => (
                        <div key={p.name} className="flex items-center gap-2.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: PAYMENT_COLORS[p.name] || '#94a3b8' }}
                          ></span>
                          <span className="font-semibold text-slate-700 text-sm">{p.name}:</span>
                          <span className="font-mono text-slate-900 text-sm font-bold">₹{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fast-Moving Medicines Grid */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
                  <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider mb-3">
                    Top Dispensed Formulations (This Branch)
                  </h3>

                  {overviewData.fastMovingMedicines.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No sales recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {overviewData.fastMovingMedicines.map((med, idx) => (
                        <div key={med.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-slate-900 text-white rounded text-xs font-bold flex items-center justify-center font-mono">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-sm text-slate-900">{med.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[170px]">
                              {med.composition || 'Standard Formulation'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-teal-800 font-mono">
                              {med.totalQuantitySold} units
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              ₹{med.totalRevenue.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: GSTR-1 TAX FILING REPORT */}
        {activeTab === 'GST' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Official GSTR-1 Tax Summary
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Standardized intra-state CGST & SGST breakdowns for monthly tax compliance
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportGstCsv}
                  disabled={!gstData}
                  className="inline-flex items-center gap-2.5 px-4.5 py-1.5.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-lg shadow-2xs transition disabled:opacity-50"
                >
                  <Download size={18} />
                  <span>Export GSTR-1 CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2.5 px-4 py-1.5.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg shadow-2xs transition"
                >
                  <Printer size={18} />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm font-mono">
                Aggregating GST tax slabs...
              </div>
            ) : !gstData ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                No GST tax records found for this branch.
              </div>
            ) : (
              <div className="space-y-4">
                {/* GST KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Total Invoices</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">
                      {gstData.totalInvoices} Bills
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Taxable Value</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">
                      ₹{gstData.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Total GST Collected</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">
                      ₹{gstData.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* GST Slab Breakdown Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-display">
                      Slab-Wise Tax Breakdown (0%, 5%, 12%, 18%, 28%)
                    </h3>
                    <span className="text-sm font-bold text-slate-700 font-mono">
                      Grand Total: ₹{gstData.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-sm uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                        <tr>
                          <th className="px-4 py-3.5">GST Tax Slab</th>
                          <th className="px-4 py-3.5 text-center">Items Sold</th>
                          <th className="px-4 py-3.5 text-right">Taxable Value (₹)</th>
                          <th className="px-4 py-3.5 text-right">CGST (₹)</th>
                          <th className="px-4 py-3.5 text-right">SGST (₹)</th>
                          <th className="px-4 py-3.5 text-right">Total Tax (₹)</th>
                          <th className="px-4 py-3.5 text-right">Total Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-base">
                        {gstData.slabs.map((slab) => (
                          <tr key={slab.rate} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3.5 font-semibold text-slate-900 font-sans text-sm">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-sm">
                                {slab.rateLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-800 text-sm">
                              {slab.itemCount}
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-slate-900 text-sm">
                              ₹{slab.taxableValue.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-600 text-sm">
                              ₹{slab.cgst.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-600 text-sm">
                              ₹{slab.sgst.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-sm">
                              ₹{slab.totalTax.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-base">
                              ₹{slab.totalValue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STOCK MOVEMENT & DEAD STOCK */}
        {activeTab === 'STOCK_MOVEMENT' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Stock Velocity & Dead Stock Identification
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Analyze high-rotation inventory vs stagnant stock to optimize counter working capital
                </p>
              </div>

              <button
                onClick={fetchStockMovement}
                className="inline-flex items-center gap-2.5 px-4 py-1.5.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-2xs"
              >
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Status</span>
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm font-mono">
                Analyzing inventory rotation rates...
              </div>
            ) : !stockMoveData ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                No inventory velocity data available.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Fast Moving</div>
                    <div className="text-2xl font-bold text-teal-800 font-mono mt-1.5 leading-none">
                      {stockMoveData.summary?.fastMovingCount || 0} Batches
                    </div>
                    <div className="text-sm text-slate-500 mt-1 leading-tight">&gt;10 units in 30d</div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Slow Moving</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono mt-1.5 leading-none">
                      {stockMoveData.summary?.slowMovingCount || 0} Batches
                    </div>
                    <div className="text-sm text-slate-500 mt-1 leading-tight">1-9 units in 30d</div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-2xs">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Dead / Stagnant Stock</div>
                    <div className="text-2xl font-bold text-red-700 font-mono mt-1.5 leading-none">
                      {stockMoveData.summary?.deadStockCount || 0} Batches
                    </div>
                    <div className="text-sm text-red-700 font-semibold mt-1 leading-tight">
                      ₹{Number(stockMoveData.summary?.deadStockValuation || 0).toLocaleString('en-IN')} locked
                    </div>
                  </div>
                </div>

                {/* Dead Stock Watchlist Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-display">
                      Dead Stock Warning List (0 Sales in Last 30 Days)
                    </h3>
                    <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-0.2 rounded">
                      Action: Return or Discount
                    </span>
                  </div>

                  {stockMoveData.deadStock.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">No dead stock detected in this branch.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-50 text-sm uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                          <tr>
                            <th className="px-4 py-3.5">Medicine Name</th>
                            <th className="px-4 py-3.5 text-center">Batch No</th>
                            <th className="px-4 py-3.5 text-center">Expiry Date</th>
                            <th className="px-4 py-3.5 text-right">Stuck Qty</th>
                            <th className="px-4 py-3.5 text-right">MRP (₹)</th>
                            <th className="px-4 py-3.5 text-right">Locked Capital (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-base">
                          {stockMoveData.deadStock.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3.5 font-semibold text-slate-900 text-sm">{b.medicineName}</td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-800 text-sm">
                                <span className="bg-slate-100 px-3 py-1 rounded border border-slate-200">
                                  {b.batchNumber}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-slate-600 text-sm whitespace-nowrap">
                                {new Date(b.expiryDate).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono text-sm">
                                {b.quantity}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-slate-500 text-sm">
                                ₹{b.mrp.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-right font-bold text-red-700 font-mono text-base">
                                ₹{b.valuation.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StoreReports;
