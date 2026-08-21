import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreNavbar from '../../components/StoreNavbar';
import storeApi from '../../storeApi';

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

    // If medicine changed, auto-suggest default GST rate and MRP if available
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

        // Map extracted items to available catalog
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
        setSuccessMsg('✨ OCR bill scan parsed and auto-filled successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('OCR Simulation failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Computed Totals
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Header & OCR Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">New Purchase Order & Inward Entry</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record supplier invoices, create new batches, and increment branch stock atomically
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOcrSimulate}
                disabled={loading}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>⚡</span> Scan Bill (OCR Simulator)
              </button>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {successMsg && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 text-purple-800 text-xs rounded-xl">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Invoice Header Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
              1. Supplier & Invoice Metadata
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Distributor / Supplier *
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.agencyName ? `(${sup.agencyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Invoice No *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-9081"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PENDING">Credit / Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Inward Medicine Batches ({items.length} Line Items)
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                ➕ Add Item Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 min-w-[200px]">Medicine / Formula</th>
                    <th className="px-4 py-3 min-w-[130px]">Batch No</th>
                    <th className="px-4 py-3 min-w-[140px]">Expiry (Date)</th>
                    <th className="px-4 py-3 w-20 text-right">Billed Qty</th>
                    <th className="px-4 py-3 w-20 text-right">Free Qty</th>
                    <th className="px-4 py-3 w-24 text-right">Cost Rate (₹)</th>
                    <th className="px-4 py-3 w-24 text-right">MRP (₹)</th>
                    <th className="px-4 py-3 w-20 text-center">GST %</th>
                    <th className="px-4 py-3 min-w-[100px]">Rack Location</th>
                    <th className="px-4 py-3 text-right">Line Total (₹)</th>
                    <th className="px-4 py-3 w-10 text-center"></th>
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
                        <td className="px-4 py-2.5">
                          <select
                            required
                            value={item.medicineId}
                            onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          >
                            {medicines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.composition || m.genericName})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            required
                            placeholder="e.g. DL-101"
                            value={item.batchNumber}
                            onChange={(e) =>
                              handleItemChange(idx, 'batchNumber', e.target.value.toUpperCase())
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="date"
                            required
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 text-right bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="0"
                            value={item.freeQuantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'freeQuantity', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-right bg-white border border-slate-300 rounded-lg text-xs text-emerald-700 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.purchasePrice}
                            onChange={(e) =>
                              handleItemChange(idx, 'purchasePrice', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-right bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.mrp}
                            onChange={(e) => handleItemChange(idx, 'mrp', e.target.value)}
                            className="w-full px-2 py-1.5 text-right bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                            className="w-full px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            placeholder="Rack A-1"
                            value={item.rackLocation}
                            onChange={(e) =>
                              handleItemChange(idx, 'rackLocation', e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 font-mono">
                          ₹{itemTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => removeItemRow(idx)}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-20 text-base font-bold"
                          >
                            ×
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Order Notes / Receiving Remarks
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add supplier delivery or batch condition remarks..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              ></textarea>
            </div>

            {/* Calculations Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Financial Summary
              </h3>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Items Subtotal (Taxable):</span>
                <span className="font-mono font-medium">₹{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Total GST (CGST + SGST):</span>
                <span className="font-mono font-medium text-purple-700">₹{taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Distributor Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-24 px-2 py-1 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900">Net Invoice Amount:</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono">
                  ₹{netAmount.toFixed(2)}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Recording Purchase & Updating Stock...' : '💾 Save Purchase & Inward Stock'}
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
