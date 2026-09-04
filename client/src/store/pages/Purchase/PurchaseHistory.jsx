import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../../components/StoreNavbar';
import storeApi from '../../storeApi';
import {
  ArrowDownToLine,
  Plus,
  Search,
  FileText,
  Eye,
  X,
  Building2,
} from 'lucide-react';

export const PurchaseHistory = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [search]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await storeApi.get(`/purchases?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setPurchases(res.data.data.purchases || []);
      }
    } catch (err) {
      console.error('Failed to fetch purchase history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setModalLoading(true);
      const res = await storeApi.get(`/purchases/${id}`);
      if (res.data?.success) {
        setSelectedPurchase(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load purchase details', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <StoreNavbar />

      <main className="w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                Inward Archive
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Purchase Inward & Supplier Bills
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Historical distributor invoices, inward batch entries, and payment reconciliation
            </p>
          </div>
          <Link
            to="/store/purchases/new"
            className="inline-flex items-center gap-3 px-4.5 py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-xs transition self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>New Inward Entry</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-6">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number or distributor..."
              className="w-full pl-8.5 pr-3 py-1.5.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
            />
          </div>
        </div>

        {/* Purchase Invoices Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-display">
              Inward Invoices ({purchases.length})
            </h3>
            <span className="text-sm text-slate-500">Sorted by newest purchase date</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm font-mono">Loading invoices...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No purchase orders recorded yet. Click "New Inward Entry" to record an invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 uppercase font-bold text-slate-600 border-b border-slate-200 font-display text-xs">
                  <tr>
                    <th className="px-4 py-4">Invoice No</th>
                    <th className="px-4 py-4">Supplier / Distributor</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4 text-center">Items</th>
                    <th className="px-4 py-4 text-right">Subtotal (₹)</th>
                    <th className="px-4 py-4 text-right">Tax (₹)</th>
                    <th className="px-4 py-4 text-right">Net Amount (₹)</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-4 font-mono font-bold text-slate-900">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">{p.supplier?.name}</div>
                        <div className="text-xs text-slate-500">{p.supplier?.agencyName}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-mono text-sm">
                        {new Date(p.purchaseDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-4 text-center font-mono">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.2 rounded text-sm font-medium border border-slate-200">
                          {p._count?.items || 0} batches
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">
                        ₹{Number(p.subTotal).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-slate-600">
                        ₹{Number(p.taxAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900 font-mono">
                        ₹{Number(p.netAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold uppercase rounded border ${
                            p.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(p.id)}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 transition shadow-2xs"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Invoice Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-5">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 font-display text-base">
                  Purchase Invoice: <span className="font-mono text-teal-800">{selectedPurchase.invoiceNumber}</span>
                </h3>
                <p className="text-sm text-slate-500">
                  Distributor: {selectedPurchase.supplier?.name} • Date:{' '}
                  {new Date(selectedPurchase.purchaseDate).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 uppercase font-bold text-slate-600 border-b border-slate-200 font-display text-xs">
                    <tr>
                      <th className="px-4 py-3">Medicine Formulation</th>
                      <th className="px-4 py-3">Batch No</th>
                      <th className="px-4 py-3">Expiry</th>
                      <th className="px-4 py-3 text-right">Billed Qty</th>
                      <th className="px-4 py-3 text-right">Free Qty</th>
                      <th className="px-4 py-3 text-right">Cost (₹)</th>
                      <th className="px-4 py-3 text-right">MRP (₹)</th>
                      <th className="px-4 py-3 text-right">Tax (₹)</th>
                      <th className="px-4 py-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchase.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.medicine?.name}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                          {item.batchNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-teal-800 font-semibold font-mono">
                          +{item.freeQuantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ₹{Number(item.purchasePrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          ₹{Number(item.mrp).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          ₹{Number(item.taxAmount).toFixed(2)} ({Number(item.taxRate)}%)
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(item.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex justify-between items-center text-sm">
                <div>
                  <span className="text-slate-500">Recorded By:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedPurchase.createdBy?.name || 'Staff User'}</span>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-display">Subtotal</span>
                    <span className="font-mono font-semibold">₹{Number(selectedPurchase.subTotal).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-display">Tax</span>
                    <span className="font-mono font-semibold text-slate-800">₹{Number(selectedPurchase.taxAmount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-display">Discount</span>
                    <span className="font-mono font-semibold text-slate-600">₹{Number(selectedPurchase.discountAmount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-display">Net Amount</span>
                    <span className="font-mono font-bold text-base text-slate-900">₹{Number(selectedPurchase.netAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4.5 py-1.5.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
