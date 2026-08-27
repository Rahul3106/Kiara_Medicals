import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../../components/StoreNavbar';
import StockAdjustmentModal from './StockAdjustmentModal';
import storeApi from '../../storeApi';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  ArrowDownToLine,
  Layers,
} from 'lucide-react';

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle size={11} className="text-red-700" />
          <span>Expired</span>
        </span>
      );
    }
    if (status === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={11} className="text-amber-700" />
          <span>{batch.daysToExpiry}d left (Critical)</span>
        </span>
      );
    }
    if (status === 'NEAR_EXPIRY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
          <Clock size={11} className="text-yellow-700" />
          <span>{batch.daysToExpiry}d left</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 size={11} className="text-emerald-700" />
        <span>Valid</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-display">
                Stock & Dispensary
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
              Batch Inventory & FEFO Stock Control
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live batch tracking, FEFO management, near-expiry alerts, and stock adjustments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/store/purchases/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <ArrowDownToLine size={14} />
              <span>Inward New Stock</span>
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={14} className="text-emerald-700" />
              <span>{toastMessage}</span>
            </span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="w-full md:w-80 relative">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine, salt, batch, rack..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Batches
            </button>
            <button
              onClick={() => setFilter('near-expiry')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'near-expiry'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Near Expiry (&le;90d)
            </button>
            <button
              onClick={() => setFilter('low-stock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'low-stock'
                  ? 'bg-red-700 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'expired'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Inventory Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              Matching Batches ({inventory.length})
            </h3>
            <span className="text-[11px] text-slate-500">Sorted by FEFO (Earliest Expiry First)</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">Loading branch inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No batches found matching current filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200 font-display">
                  <tr>
                    <th className="px-4 py-3">Medicine & Formulation</th>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Rack</th>
                    <th className="px-4 py-3 text-right">Cost (₹)</th>
                    <th className="px-4 py-3 text-right">MRP (₹)</th>
                    <th className="px-4 py-3 text-right">Available Qty</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{batch.medicine?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {batch.medicine?.composition || batch.medicine?.genericName} •{' '}
                          <span className="font-mono">{batch.medicine?.hsnCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {batch.batchNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-700">
                        {new Date(batch.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">{renderExpiryBadge(batch)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {batch.rackLocation || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                        ₹{Number(batch.purchasePrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        ₹{Number(batch.mrp).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={`font-bold text-xs ${
                            batch.quantity <= (batch.medicine?.minReorderLevel || 10)
                              ? 'text-red-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {batch.quantity}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400">{batch.medicine?.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await storeApi.post('/../labels/medicine', {
                                medicineName: batch.medicine?.name,
                                batchNumber: batch.batchNumber,
                                expiryDate: new Date(batch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }),
                                mrp: batch.mrp,
                                rackLocation: batch.rackLocation,
                                labelType: 'shelf'
                              }, { responseType: 'blob' });
                              
                              const blob = new Blob([res.data], { type: 'image/png' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            } catch (err) {
                              console.error(err);
                              alert('Failed to generate label');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 transition shadow-2xs"
                          title="Print Shelf Label"
                        >
                          <Package size={11} />
                          <span>Label</span>
                        </button>
                        <button
                          onClick={() => setSelectedBatchForAdjust(batch)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 transition shadow-2xs"
                        >
                          <SlidersHorizontal size={11} />
                          <span>Adjust</span>
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
