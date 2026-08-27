import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreNavbar from '../../components/StoreNavbar';
import storeApi from '../../storeApi';
import {
  ArrowDownToLine,
  Plus,
  Trash2,
  Building2,
  FileText,
  Scan,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export const PurchaseEntry = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState([
    {
      medicineId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 10,
      freeQuantity: 0,
      purchasePrice: 0,
      mrp: 0,
      taxRate: 12.0,
      rackLocation: '',
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supRes, medRes] = await Promise.all([
        storeApi.get('/suppliers'),
        storeApi.get('/inventory/medicines-catalog'),
      ]);
      if (supRes.data?.success) {
        setSuppliers(supRes.data.data);
        if (supRes.data.data.length > 0) {
          setSupplierId(supRes.data.data[0].id);
        }
      }
      if (medRes.data?.success) {
        setMedicines(medRes.data.data);
        if (medRes.data.data.length > 0) {
          setItems([
            {
              medicineId: medRes.data.data[0].id,
              batchNumber: `DL-${Math.floor(100 + Math.random() * 900)}`,
              expiryDate: '2027-12-31',
              quantity: 50,
              freeQuantity: 5,
              purchasePrice: 24.0,
              mrp: 33.6,
              taxRate: 12.0,
              rackLocation: 'Rack A-1',
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load purchase prerequisites', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'medicineId') {
      const med = medicines.find((m) => m.id === value);
      if (med) {
        updated[index].taxRate = Number(med.gstRate) || 12.0;
      }
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        medicineId: medicines[0]?.id || '',
        batchNumber: `BT-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: '2027-12-31',
        quantity: 10,
        freeQuantity: 0,
        purchasePrice: 50.0,
        mrp: 75.0,
        taxRate: 12.0,
        rackLocation: '',
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // OCR Invoice Simulator
  const handleOcrSimulate = async () => {
    try {
      setLoading(true);
      const res = await storeApi.post('/purchases/ocr-scan');
      if (res.data?.success && res.data.extractedData) {
        const { extractedData } = res.data;
        setInvoiceNumber(extractedData.invoiceNumber);
        setPurchaseDate(extractedData.invoiceDate);

        const mappedItems = extractedData.items.map((ocrItem) => {
          const matchedMed =
            medicines.find((m) =>
              m.name.toLowerCase().includes(ocrItem.suggestedMedicineName.toLowerCase())
            ) || medicines[0];

          return {
            medicineId: matchedMed?.id || '',
            batchNumber: ocrItem.batchNumber,
            expiryDate: ocrItem.expiryDate,
            quantity: ocrItem.quantity,
            freeQuantity: ocrItem.freeQuantity,
            purchasePrice: ocrItem.purchasePrice,
            mrp: ocrItem.mrp,
            taxRate: ocrItem.taxRate,
            rackLocation: 'Auto-Inward',
          };
        });

        setItems(mappedItems);
        setSuccessMsg('OCR bill parsed and line items auto-filled.');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('OCR Simulation failed', err);
    } finally {
      setLoading(false);
    }
  };

  const subTotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.purchasePrice) || 0),
    0
  );

  const taxAmount = items.reduce((sum, item) => {
    const itemSub = (parseFloat(item.quantity) || 0) * (parseFloat(item.purchasePrice) || 0);
    const itemTax = (itemSub * (parseFloat(item.taxRate) || 0)) / 100;
    return sum + itemTax;
  }, 0);

  const netAmount = Math.max(0, subTotal + taxAmount - (parseFloat(discountAmount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        supplierId,
        invoiceNumber,
        purchaseDate,
        paymentStatus,
        discountAmount: parseFloat(discountAmount) || 0,
        notes,
        items: items.map((it) => ({
          medicineId: it.medicineId,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          quantity: parseInt(it.quantity),
          freeQuantity: parseInt(it.freeQuantity) || 0,
          purchasePrice: parseFloat(it.purchasePrice),
          mrp: parseFloat(it.mrp),
          taxRate: parseFloat(it.taxRate),
          rackLocation: it.rackLocation,
        })),
      };

      const res = await storeApi.post('/purchases', payload);
      if (res.data?.success) {
        navigate('/store/purchases');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to record purchase entry. Check for duplicate invoice number or invalid fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          {/* Header & OCR Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-display">
                  Inward Logistics
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
                New Purchase Order & Stock Inward
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record distributor bills, create batch entries, and increment branch stock
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOcrSimulate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
              >
                <Scan size={14} />
                <span>Simulate Bill Scan</span>
              </button>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-700" />
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={15} className="text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Header Details */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3.5 font-display">
              1. Supplier & Invoice Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">
                  Distributor / Supplier *
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.agencyName ? `(${sup.agencyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-9081"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 font-display">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PENDING">Credit / Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                2. Inward Line Items ({items.length})
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                <Plus size={13} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-bold text-slate-600 border-b border-slate-200 font-display text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5 min-w-[180px]">Medicine / Salt</th>
                    <th className="px-3 py-2.5 min-w-[120px]">Batch No</th>
                    <th className="px-3 py-2.5 min-w-[130px]">Expiry</th>
                    <th className="px-3 py-2.5 w-16 text-right">Qty</th>
                    <th className="px-3 py-2.5 w-16 text-right">Free</th>
                    <th className="px-3 py-2.5 w-20 text-right">Cost (₹)</th>
                    <th className="px-3 py-2.5 w-20 text-right">MRP (₹)</th>
                    <th className="px-3 py-2.5 w-16 text-center">GST%</th>
                    <th className="px-3 py-2.5 min-w-[100px]">Rack</th>
                    <th className="px-3 py-2.5 text-right">Net (₹)</th>
                    <th className="px-3 py-2.5 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const itemSub =
                      (parseFloat(item.quantity) || 0) * (parseFloat(item.purchasePrice) || 0);
                    const itemTotal =
                      itemSub + (itemSub * (parseFloat(item.taxRate) || 0)) / 100;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2">
                          <select
                            required
                            value={item.medicineId}
                            onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          >
                            {medicines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.composition || m.genericName})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            required
                            placeholder="e.g. DL-101"
                            value={item.batchNumber}
                            onChange={(e) =>
                              handleItemChange(idx, 'batchNumber', e.target.value.toUpperCase())
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            required
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-1.5 py-1 text-right bg-white border border-slate-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.freeQuantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'freeQuantity', e.target.value)
                            }
                            className="w-full px-1.5 py-1 text-right bg-white border border-slate-300 rounded text-xs font-mono text-teal-800 font-semibold focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.purchasePrice}
                            onChange={(e) =>
                              handleItemChange(idx, 'purchasePrice', e.target.value)
                            }
                            className="w-full px-1.5 py-1 text-right bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.mrp}
                            onChange={(e) => handleItemChange(idx, 'mrp', e.target.value)}
                            className="w-full px-1.5 py-1 text-right bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                            className="w-full px-1 py-1 bg-white border border-slate-300 rounded text-xs text-center focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Rack A-1"
                            value={item.rackLocation}
                            onChange={(e) =>
                              handleItemChange(idx, 'rackLocation', e.target.value)
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                          ₹{itemTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => removeItemRow(idx)}
                            className="text-slate-400 hover:text-red-700 disabled:opacity-20 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary & Submission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-display">
                Receiving Notes / Remarks
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add supplier delivery or batch condition remarks..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              ></textarea>
            </div>

            {/* Calculations Box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 font-display">
                Financial Summary
              </h3>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Taxable Items Subtotal:</span>
                <span className="font-mono font-medium">₹{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Total GST (Input Tax Credit):</span>
                <span className="font-mono font-medium text-slate-800">₹{taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Distributor Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900 font-display">Net Invoice Amount:</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  ₹{netAmount.toFixed(2)}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ArrowDownToLine size={14} />
                  <span>{submitting ? 'Recording Inward Entry...' : 'Save Purchase & Inward Stock'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PurchaseEntry;
