import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../../components/StoreNavbar';
import storeApi from '../../storeApi';

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Purchase Inward History</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical supplier bills, inward batch records, and payment reconciliation
            </p>
          </div>
          <Link
            to="/store/purchases/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>➕</span> New Inward Entry
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by invoice number or distributor..."
            className="w-full sm:w-96 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Purchase Invoices Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Inward Invoices ({purchases.length})
            </h3>
            <span className="text-xs text-slate-500">Sorted by newest purchase date</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading purchase invoices...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No purchase orders recorded yet. Click "New Inward Entry" to record an invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Invoice No</th>
                    <th className="px-6 py-3.5">Supplier / Distributor</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-center">Items Count</th>
                    <th className="px-6 py-3.5 text-right">Subtotal (₹)</th>
                    <th className="px-6 py-3.5 text-right">Tax (₹)</th>
                    <th className="px-6 py-3.5 text-right">Net Amount (₹)</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{p.supplier?.name}</div>
                        <div className="text-xs text-slate-400">{p.supplier?.agencyName}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(p.purchaseDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {p._count?.items || 0} batches
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono text-slate-500">
                        ₹{Number(p.subTotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono text-purple-700">
                        ₹{Number(p.taxAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                        ₹{Number(p.netAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            p.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(p.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
                        >
                          👁️ View Bill
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">
                  Purchase Invoice: <span className="font-mono text-emerald-700">{selectedPurchase.invoiceNumber}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Distributor: {selectedPurchase.supplier?.name} • Date:{' '}
                  {new Date(selectedPurchase.purchaseDate).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Itemized list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 uppercase font-semibold text-slate-600 border-b border-slate-200">
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
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">
                          {item.batchNumber}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                          +{item.freeQuantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ₹{Number(item.purchasePrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-800">
                          ₹{Number(item.mrp).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-purple-700">
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Recorded By:</span>{' '}
                  <span className="font-semibold">{selectedPurchase.createdBy?.name}</span>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <span className="text-slate-500 block">Subtotal</span>
                    <span className="font-mono font-semibold">₹{Number(selectedPurchase.subTotal).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tax</span>
                    <span className="font-mono font-semibold text-purple-700">₹{Number(selectedPurchase.taxAmount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Discount</span>
                    <span className="font-mono font-semibold text-slate-600">₹{Number(selectedPurchase.discountAmount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Net Paid / Due</span>
                    <span className="font-mono font-bold text-base text-emerald-700">₹{Number(selectedPurchase.netAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
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
