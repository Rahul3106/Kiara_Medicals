import React, { useState } from 'react';
import storeApi from '../../storeApi';
import { SlidersHorizontal, AlertCircle, X } from 'lucide-react';

export const StockAdjustmentModal = ({ batch, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('DAMAGE_OR_LOSS');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await storeApi.post('/inventory/adjust', {
        batchId: batch.id,
        adjustmentType,
        quantityChange: parseInt(quantityChange),
        reason,
      });

      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Failed to adjust stock. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm font-display">Adjust Stock Quantity</h3>
            <p className="text-xs text-slate-500">
              {batch.medicine?.name} — Batch: <span className="font-mono">{batch.batchNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Current Stock Level:</span>
            <span className="font-bold text-slate-900 font-mono">
              {batch.quantity} {batch.medicine?.unit || 'units'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-display">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            >
              <option value="DAMAGE_OR_LOSS">Damage / Breakage / Loss (-)</option>
              <option value="EXPIRY_DISPOSAL">Expired Stock Disposal (-)</option>
              <option value="AUDIT_ADD">Audit Found Stock (+)</option>
              <option value="CORRECTION_SET">Set Exact Physical Count</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-display">
              {adjustmentType === 'CORRECTION_SET'
                ? 'New Exact Physical Count'
                : 'Quantity to Deduct / Add'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-display">
              Audit Note (Required)
            </label>
            <textarea
              required
              rows="2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why stock is being adjusted..."
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Apply Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
