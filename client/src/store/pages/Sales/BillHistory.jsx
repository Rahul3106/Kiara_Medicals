import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import storeApi from '../../storeApi';
import StoreNavbar from '../../components/StoreNavbar';
import InvoiceModal from './InvoiceModal';
import {
  FileText,
  Plus,
  IndianRupee,
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';

export const BillHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalSale, setCancelModalSale] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = `/sales?page=${page}&limit=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await storeApi.get(url);
      if (res.data.success) {
        setSales(res.data.data.sales);
        setTotalCount(res.data.data.total);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRevenue(res.data.data.totalRevenue || 0);
      }
    } catch (err) {
      console.error('Failed to fetch sales history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSales();
  };

  const handleViewInvoice = async (saleId) => {
    try {
      const res = await storeApi.get(`/sales/${saleId}`);
      if (res.data.success) {
        setSelectedInvoice(res.data.data);
        setShowModal(true);
      }
    } catch (err) {
      alert('Failed to load invoice details.');
    }
  };

  const handleCancelSale = async () => {
    if (!cancelModalSale) return;
    setActionLoading(true);
    try {
      const res = await storeApi.post(`/sales/${cancelModalSale.id}/cancel`, {
        reason: cancelReason || 'Customer return / bill voided',
      });
      if (res.data.success) {
        setCancelModalSale(null);
        setCancelReason('');
        fetchSales();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel bill');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <StoreNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Billing Registry
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Sales Invoices & Billing Archive
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review dispensed receipts, reprint official GST tax invoices, and process patient returns with automatic stock restoration
            </p>
          </div>

          <Link
            to="/store/sales/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg transition shadow-2xs self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>New POS Bill</span>
          </Link>
        </div>

        {/* 3 Dense KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Total Billed Revenue
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <IndianRupee size={13} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1.5 leading-none">
              ₹{Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Gross store billing</div>
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
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">Recorded branch sales</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Compliance Standard
              </span>
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <CheckCircle2 size={13} />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 font-display mt-1.5 leading-none">
              100% Tax Compliant
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">GSTR-1 compatible invoices</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Bill # (e.g. KM-BR-A-2627-00001), Patient name, or phone..."
                className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-slate-900"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled / Returned</option>
            </select>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              Dispensed Invoices ({totalCount})
            </span>
            <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">
              Loading sales bills...
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No sales bills found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px] font-display">
                  <tr>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4 text-center">Items</th>
                    <th className="py-2.5 px-4 text-center">Payment</th>
                    <th className="py-2.5 px-4 text-right">Tax (₹)</th>
                    <th className="py-2.5 px-4 text-right">Total (₹)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-4 font-mono font-bold text-xs text-slate-900">
                        {sale.billNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                        {new Date(sale.saleDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs leading-snug">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </div>
                        {sale.customer?.phone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {sale.customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-xs">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[11px] font-medium border border-slate-200">
                          {sale._count?.items || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600 text-xs">
                        ₹{Number(sale.totalTaxAmount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{Number(sale.grandTotal).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {sale.status === 'COMPLETED' ? (
                          <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded border border-red-200">
                            CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewInvoice(sale.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 transition shadow-2xs"
                            title="View / Print Tax Invoice"
                          >
                            <Printer size={12} />
                            <span>View</span>
                          </button>
                          {sale.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setCancelModalSale(sale);
                                setCancelReason('');
                              }}
                              className="px-2 py-1 bg-white hover:bg-red-50 hover:text-red-700 border border-slate-300 hover:border-red-200 rounded text-xs font-medium text-slate-600 transition"
                              title="Void Bill & Restore Inventory"
                            >
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs bg-slate-50/70">
              <span className="text-slate-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 disabled:opacity-40 font-semibold shadow-2xs hover:bg-slate-50 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 disabled:opacity-40 font-semibold shadow-2xs hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Invoice Viewer / Print Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      {/* Cancel Bill Confirmation Modal */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
              <AlertCircle size={16} className="text-red-600" />
              <span>Cancel Bill & Restore Inventory</span>
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to void Invoice <strong>#{cancelModalSale.billNumber}</strong>?
              All medicines will be automatically returned to batch inventory.
            </p>

            <div className="mt-3">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">
                Reason for Return:
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer returned unopened strips, incorrect item billed..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="mt-3.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalSale(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                Keep Bill
              </button>
              <button
                type="button"
                onClick={handleCancelSale}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                {actionLoading ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillHistory;
