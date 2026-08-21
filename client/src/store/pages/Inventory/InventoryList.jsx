import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../../components/StoreNavbar';
import StockAdjustmentModal from './StockAdjustmentModal';
import storeApi from '../../storeApi';

export const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, near-expiry, low-stock, expired
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, [search, filter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      let url = `/inventory?search=${encodeURIComponent(search)}`;
      if (filter === 'near-expiry' || filter === 'expired') {
        url += `&filter=${filter}`;
      }
      const res = await storeApi.get(url);
      if (res.data?.success) {
        let items = res.data.data.items || [];
        if (filter === 'low-stock') {
          items = items.filter((b) => b.quantity <= (b.medicine?.minReorderLevel || 10));
        }
        setInventory(items);
      }
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSuccess = (result) => {
    setToastMessage(
      `Adjusted ${result.batch?.medicine?.name} (Batch ${result.batch?.batchNumber}): ${result.previousQuantity} → ${result.newQuantity}`
    );
    fetchInventory();
    setTimeout(() => setToastMessage(null), 5000);
  };

  const renderExpiryBadge = (batch) => {
    const status = batch.expiryStatus;
    if (status === 'EXPIRED') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-800 border border-red-200">
          Expired
        </span>
      );
    }
    if (status === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-orange-100 text-orange-800 border border-orange-200">
          {batch.daysToExpiry}d left (Critical)
        </span>
      );
    }
    if (status === 'NEAR_EXPIRY') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-200">
          {batch.daysToExpiry}d left (Near)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
        Valid
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Batch Inventory & Stock Control</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live batch tracking, FEFO management, near-expiry alerts, and stock adjustments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/store/purchases/new"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>➕</span> Inward New Purchase
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between shadow-xs">
            <span>✅ {toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search medicine, salt, batch, rack..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Batches
            </button>
            <button
              onClick={() => setFilter('near-expiry')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'near-expiry'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              ⏳ Near Expiry (&lt;=90d)
            </button>
            <button
              onClick={() => setFilter('low-stock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'low-stock'
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              ⚠️ Low Stock
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'expired'
                  ? 'bg-slate-700 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🚫 Expired
            </button>
          </div>
        </div>

        {/* Inventory Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Matching Batches ({inventory.length})
            </h3>
            <span className="text-xs text-slate-500">Sorted by FEFO (Earliest Expiry First)</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading branch inventory records...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No batches found matching current filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Medicine & Generic Formulation</th>
                    <th className="px-6 py-3.5">Batch Number</th>
                    <th className="px-6 py-3.5">Expiry Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Rack Location</th>
                    <th className="px-6 py-3.5 text-right">Cost (₹)</th>
                    <th className="px-6 py-3.5 text-right">MRP (₹)</th>
                    <th className="px-6 py-3.5 text-right">Available Qty</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{batch.medicine?.name}</div>
                        <div className="text-xs text-slate-500">
                          {batch.medicine?.composition || batch.medicine?.genericName} •{' '}
                          <span className="font-mono">{batch.medicine?.hsnCode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
                          {batch.batchNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {new Date(batch.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">{renderExpiryBadge(batch)}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {batch.rackLocation || '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono text-slate-500">
                        ₹{Number(batch.purchasePrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">
                        ₹{Number(batch.mrp).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold text-sm ${
                            batch.quantity <= (batch.medicine?.minReorderLevel || 10)
                              ? 'text-red-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {batch.quantity}
                        </span>{' '}
                        <span className="text-xs text-slate-400">{batch.medicine?.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedBatchForAdjust(batch)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
                        >
                          ⚙️ Adjust
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

      {/* Stock Adjustment Modal */}
      {selectedBatchForAdjust && (
        <StockAdjustmentModal
          batch={selectedBatchForAdjust}
          onClose={() => setSelectedBatchForAdjust(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
};

export default InventoryList;
