import React, { useState, useEffect } from 'react';
import storeApi from '../../storeApi';
import StoreNavbar from '../../components/StoreNavbar';
import InvoiceModal from './InvoiceModal';
import {
  Receipt,
  Search,
  Trash2,
  User,
  CreditCard,
  Printer,
  AlertCircle,
  X,
  Check,
  ShoppingBag,
  Clock,
  Plus,
} from 'lucide-react';

export const NewBill = () => {
  // Search & Auto-complete states
  const [medicineSearch, setMedicineSearch] = useState('');
  const [inventoryResults, setInventoryResults] = useState([]);
  const [isSearchingInventory, setIsSearchingInventory] = useState(false);

  // Customer states
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Cart & Pricing states
  const [cartItems, setCartItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [customDiscount, setCustomDiscount] = useState(0);

  // Modal & feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInvoice, setSuccessInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Search medicines whenever query changes
  useEffect(() => {
    const fetchMedicines = async () => {
      if (!medicineSearch.trim()) {
        setInventoryResults([]);
        return;
      }
      setIsSearchingInventory(true);
      try {
        const res = await storeApi.get(`/inventory?search=${encodeURIComponent(medicineSearch)}&limit=15`);
        if (res.data.success) {
          const activeBatches = res.data.data.batches.filter((b) => b.quantity > 0 && b.expiryStatus !== 'EXPIRED');
          setInventoryResults(activeBatches);
        }
      } catch (err) {
        console.error('Failed to search inventory', err);
      } finally {
        setIsSearchingInventory(false);
      }
    };

    const timeout = setTimeout(fetchMedicines, 250);
    return () => clearTimeout(timeout);
  }, [medicineSearch]);

  // Search customers whenever phone query changes
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!customerPhone.trim() || customerPhone.length < 3 || selectedCustomerId) {
        setCustomerSuggestions([]);
        return;
      }
      try {
        const res = await storeApi.get(`/customers/search?q=${encodeURIComponent(customerPhone)}`);
        if (res.data.success) {
          setCustomerSuggestions(res.data.data);
        }
      } catch (err) {
        console.error('Failed to search customers', err);
      }
    };

    const timeout = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timeout);
  }, [customerPhone, selectedCustomerId]);

  const handleSelectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    setDoctorName(c.doctorName || '');
    setDoctorRegNo(c.doctorRegNo || '');
    setCustomerAddress(c.address || '');
    setCustomerSuggestions([]);
  };

  const handleResetCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerPhone('');
    setCustomerName('');
    setDoctorName('');
    setDoctorRegNo('');
    setCustomerAddress('');
    setCustomerSuggestions([]);
  };

  // Add batch to cart
  const handleAddToCart = (batch) => {
    setError('');
    const existingIndex = cartItems.findIndex((item) => item.batchId === batch.id);

    if (existingIndex >= 0) {
      const existing = cartItems[existingIndex];
      if (existing.quantity + 1 > batch.quantity) {
        setError(`Cannot add more than available stock (${batch.quantity}) for batch ${batch.batchNumber}`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          batchId: batch.id,
          medicineId: batch.medicineId,
          medicineName: batch.medicine.name,
          composition: batch.medicine.composition,
          packSize: batch.medicine.packSize,
          hsnCode: batch.medicine.hsnCode || '3004',
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          expiryStatus: batch.expiryStatus,
          availableStock: batch.quantity,
          unitPrice: parseFloat(batch.sellingPrice || batch.mrp),
          mrp: parseFloat(batch.mrp),
          taxRate: parseFloat(batch.medicine.taxRate || 12.0),
          quantity: 1,
          discountPercent: 0,
        },
      ]);
    }
    setMedicineSearch('');
    setInventoryResults([]);
  };

  const handleUpdateQuantity = (index, qty) => {
    const val = parseInt(qty, 10);
    if (isNaN(val) || val <= 0) return;
    const item = cartItems[index];
    if (val > item.availableStock) {
      setError(`Only ${item.availableStock} units available for batch ${item.batchNumber}`);
      return;
    }
    setError('');
    const updated = [...cartItems];
    updated[index].quantity = val;
    setCartItems(updated);
  };

  const handleUpdateDiscount = (index, disc) => {
    const val = parseFloat(disc);
    const updated = [...cartItems];
    updated[index].discountPercent = isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Compute live cart totals
  const computeTotals = () => {
    let subTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let discountTotal = parseFloat(customDiscount) || 0;

    cartItems.forEach((item) => {
      const gross = item.quantity * item.unitPrice;
      const lineDisc = (gross * (item.discountPercent || 0)) / 100;
      const taxable = gross - lineDisc;
      const halfRate = item.taxRate / 2;
      const cgst = (taxable * halfRate) / 100;
      const sgst = (taxable * halfRate) / 100;

      subTotal += taxable;
      cgstTotal += cgst;
      sgstTotal += sgst;
      discountTotal += lineDisc;
    });

    const totalTax = cgstTotal + sgstTotal;
    const exactGrandTotal = subTotal + totalTax;
    const roundedGrandTotal = Math.round(exactGrandTotal);
    const roundOff = roundedGrandTotal - exactGrandTotal;

    return {
      subTotal: Math.round(subTotal * 100) / 100,
      cgstTotal: Math.round(cgstTotal * 100) / 100,
      sgstTotal: Math.round(sgstTotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      roundOff: Math.round(roundOff * 100) / 100,
      grandTotal: roundedGrandTotal,
    };
  };

  const totals = computeTotals();

  // Submit sale and generate GST bill
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      setError('Please add at least one medicine item to the bill.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerId: selectedCustomerId,
        customer: !selectedCustomerId && customerPhone
          ? {
              phone: customerPhone,
              name: customerName || 'Walk-in Customer',
              doctorName,
              doctorRegNo,
              address: customerAddress,
            }
          : undefined,
        paymentMode,
        notes,
        customDiscount: parseFloat(customDiscount) || 0,
        items: cartItems.map((item) => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
        })),
      };

      const res = await storeApi.post('/sales', payload);
      if (res.data.success) {
        const invoiceRes = await storeApi.get(`/sales/${res.data.data.id}`);
        setSuccessInvoice(invoiceRes.data.data);
        setShowInvoiceModal(true);

        // Reset cart for next customer
        setCartItems([]);
        handleResetCustomer();
        setNotes('');
        setCustomDiscount(0);
      }
    } catch (err) {
      console.error('Failed to generate sale bill', err);
      setError(err.response?.data?.message || 'Failed to complete sale. Please verify stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <StoreNavbar />

      <main className="flex-1 w-full w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                Point of Sale
              </span>
              <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.2 rounded">
                FEFO Live
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              New POS Dispensing & GST Bill
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Select available batches, register patient and doctor details, and generate sequential tax invoices
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold px-4 py-1.5.5 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-2xs">
              Keyboard: <span className="font-mono font-bold text-teal-800">[F2] Focus Search</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 font-medium">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-800">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLS: Search & Bill Items Table */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search Input */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative">
              <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-2 font-display">
                Search Medicines & FEFO Batches
              </label>
              <div className="relative">
                <Search size={20} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                  placeholder="Type medicine name, generic salt, or batch (e.g. Augmentin, Dolo, Pan 40)..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  autoFocus
                />
                {isSearchingInventory && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">
                    Searching...
                  </span>
                )}
              </div>

              {/* Live Search Results Dropdown */}
              {inventoryResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-30 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {inventoryResults.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleAddToCart(b)}
                      className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-sm">
                            {b.medicine.name}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.2 rounded font-mono border border-slate-200">
                            {b.medicine.packSize || '10 tabs'}
                          </span>
                          <span className="text-sm font-mono text-slate-600">
                            Batch: <strong className="text-slate-900">{b.batchNumber}</strong>
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {b.medicine.composition} • HSN: {b.medicine.hsnCode || '3004'} • Rack: {b.rackLocation || 'General'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-slate-900">₹{Number(b.mrp).toFixed(2)}</div>
                        <div className="flex items-center gap-3 mt-0.5 justify-end text-sm">
                          <span className="text-teal-800 font-semibold font-mono">
                            Stock: {b.quantity}
                          </span>
                          <span className="text-slate-500 font-mono">
                            Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                  Billed Items ({cartItems.length})
                </h2>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-sm text-red-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <ShoppingBag size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No items added to invoice</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Use the search bar above to select batches from live stock.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs font-display">
                      <tr>
                        <th className="py-3.5 px-4 text-center w-8">#</th>
                        <th className="py-3.5 px-4">Medicine & Batch</th>
                        <th className="py-3.5 px-4 text-center">Expiry</th>
                        <th className="py-3.5 px-4 text-right">Price (₹)</th>
                        <th className="py-3.5 px-4 text-center w-20">Qty</th>
                        <th className="py-3.5 px-4 text-center w-20">Disc%</th>
                        <th className="py-3.5 px-4 text-center">GST%</th>
                        <th className="py-3.5 px-4 text-right">Net (₹)</th>
                        <th className="py-3.5 px-4 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item, idx) => {
                        const lineGross = item.quantity * item.unitPrice;
                        const lineDisc = (lineGross * (item.discountPercent || 0)) / 100;
                        const lineTaxable = lineGross - lineDisc;
                        const lineTax = (lineTaxable * item.taxRate) / 100;
                        const lineNet = lineTaxable + lineTax;

                        return (
                          <tr key={item.batchId} className="hover:bg-slate-50/80">
                            <td className="py-4 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-900">{item.medicineName}</div>
                              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-mono mt-0.5">
                                <span>Batch: {item.batchNumber}</span>
                                <span>• Available: {item.availableStock}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-mono text-sm text-slate-600">
                              {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                                month: '2-digit',
                                year: '2-digit',
                              })}
                            </td>
                            <td className="py-4 px-4 text-right font-mono">
                              {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <input
                                type="number"
                                min="1"
                                max={item.availableStock}
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                                className="w-14 text-center py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:ring-1 focus:ring-teal-700"
                              />
                            </td>
                            <td className="py-4 px-4 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={(e) => handleUpdateDiscount(idx, e.target.value)}
                                className="w-12 text-center py-1.5 bg-white border border-slate-300 rounded font-mono text-sm focus:ring-1 focus:ring-teal-700"
                              />
                            </td>
                            <td className="py-4 px-4 text-center font-mono text-slate-600">
                              {item.taxRate}%
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                              {lineNet.toFixed(2)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-400 hover:text-red-700 p-1"
                                title="Remove line item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 4 COLS: Customer Details & Checkout Calculation */}
          <div className="lg:col-span-4 space-y-6">
            {/* Customer Information Panel */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs relative">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-display">
                  Patient / Customer
                </h3>
                {selectedCustomerId && (
                  <button
                    onClick={handleResetCustomer}
                    className="text-sm text-teal-700 hover:underline font-semibold"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Phone Lookup */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-display">
                    Mobile Number (Auto-Fill)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setSelectedCustomerId(null);
                    }}
                    placeholder="Enter 10-digit Phone..."
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />

                  {customerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-20 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {customerSuggestions.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <div className="text-xs text-slate-500 font-mono">{c.phone}</div>
                          </div>
                          {c.doctorName && (
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">Dr. {c.doctorName}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-display">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Patient"
                    className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                {/* Doctor Name & Reg */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-display">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Name"
                      className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-display">
                      Doc Reg #
                    </label>
                    <input
                      type="text"
                      value={doctorRegNo}
                      onChange={(e) => setDoctorRegNo(e.target.value)}
                      placeholder="Reg #"
                      className="w-full px-4 py-1.5.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Summary & Payment Box */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3.5 font-display">
                GST Tax & Payment Summary
              </h3>

              <div className="space-y-2 text-sm border-b border-slate-200 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono text-slate-900 font-semibold">₹{totals.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (Intra-state):</span>
                  <span className="font-mono text-slate-800 font-semibold">₹{totals.cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (Intra-state):</span>
                  <span className="font-mono text-slate-800 font-semibold">₹{totals.sgstTotal.toFixed(2)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-teal-800 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{totals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                {totals.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Round Off:</span>
                    <span className="font-mono">
                      {totals.roundOff > 0 ? `+₹${totals.roundOff.toFixed(2)}` : `-₹${Math.abs(totals.roundOff).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="py-4 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-base">Grand Total:</span>
                <span className="font-bold text-2xl text-slate-900 font-mono">
                  ₹{totals.grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Payment Mode Selector */}
              <div className="mt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-display">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['CASH', 'UPI', 'CARD', 'CREDIT', 'SPLIT'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5.5 px-1 rounded-lg text-sm font-semibold transition border ${
                        paymentMode === mode
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={loading || cartItems.length === 0}
                className="mt-5 w-full py-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg shadow-xs flex items-center justify-center gap-3 transition"
              >
                {loading ? (
                  <span>Generating Invoice...</span>
                ) : (
                  <>
                    <Printer size={20} />
                    <span>Complete Sale & Print Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <InvoiceModal
        invoice={successInvoice}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};

export default NewBill;
