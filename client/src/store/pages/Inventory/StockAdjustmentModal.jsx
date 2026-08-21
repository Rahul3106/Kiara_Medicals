import React, { useState } from 'react';
import storeApi from '../../storeApi';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900">Adjust Stock Quantity</h3>
            <p className="text-xs text-slate-500">
              {batch.medicine?.name} — Batch: <span className="font-mono">{batch.batchNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Current Stock Level:</span>
            <span className="font-bold text-slate-900 text-sm">
              {batch.quantity} {batch.medicine?.unit || 'units'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Adjustment Reason Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="DAMAGE_OR_LOSS">🔻 Damage / Breakage / Loss (-)</option>
              <option value="EXPIRY_DISPOSAL">🔻 Expired Stock Disposal (-)</option>
              <option value="AUDIT_ADD">➕ Audit Found Stock (+)</option>
              <option value="CORRECTION_SET">🔄 Set Exact Physical Count</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Remarks / Audit Note (Required)
            </label>
            <textarea
              required
              rows="2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why stock is being adjusted..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm disabled:opacity-50"
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
