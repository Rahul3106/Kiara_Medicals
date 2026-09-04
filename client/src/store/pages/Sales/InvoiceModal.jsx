import React from 'react';
import { Printer, X, FileText } from 'lucide-react';

export const InvoiceModal = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const branch = invoice.branch || {};
  const customer = invoice.customer || {};
  const billedBy = invoice.billedBy || {};
  const items = invoice.items || [];
  const taxSummary = invoice.taxSummary || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-5">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-teal-400" />
            <span className="font-bold text-sm uppercase tracking-wider font-display">GST Tax Invoice Preview</span>
            <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded font-mono">
              {invoice.billNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2.5 px-4.5 py-1.5.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-xs transition"
            >
              <Printer size={18} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Close invoice"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible text-slate-900 text-sm font-sans">
          <div className="border border-slate-300 p-6 rounded-lg print:border-none print:p-0">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-300">
              <span className="text-xs font-bold tracking-widest uppercase bg-slate-100 px-3 py-1 rounded border border-slate-200 font-display">
                GST TAX INVOICE
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight font-display">
                {branch.name || 'KIARA MEDICALS'}
              </h1>
              <p className="text-sm text-slate-600">{branch.address}, {branch.city} - {branch.pincode} ({branch.state})</p>
              <div className="flex justify-center gap-4 text-sm font-mono text-slate-700 mt-1">
                <span><strong>GSTIN:</strong> {branch.gstNumber || 'N/A'}</span>
                <span><strong>DL No:</strong> {branch.drugLicenseNo || 'N/A'}</span>
                <span><strong>Phone:</strong> {branch.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Bill & Patient Meta Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-sm">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="text-slate-500 font-medium py-1 w-24">Invoice No:</td>
                      <td className="font-bold text-slate-900 font-mono">{invoice.billNumber}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 font-medium py-1">Date & Time:</td>
                      <td className="text-slate-800 font-medium">{formatDate(invoice.saleDate)}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 font-medium py-1">Payment Mode:</td>
                      <td>
                        <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.2 rounded text-xs border border-slate-200">
                          {invoice.paymentMode}
                        </span>
                        {invoice.status === 'CANCELLED' && (
                          <span className="ml-2 font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded text-xs">
                            VOID / CANCELLED
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 font-medium py-1">Billed By:</td>
                      <td className="text-slate-700">{billedBy.name || 'Staff Cashier'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="text-slate-500 font-medium py-1 w-24">Patient Name:</td>
                      <td className="font-bold text-slate-900">{customer.name || 'Walk-in Customer'}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 font-medium py-1">Phone:</td>
                      <td className="text-slate-800 font-mono">{customer.phone || '—'}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500 font-medium py-1">Doctor:</td>
                      <td className="text-slate-700">{customer.doctorName ? `Dr. ${customer.doctorName}` : 'Self / Over-the-counter'}</td>
                    </tr>
                    {customer.doctorRegNo && (
                      <tr>
                        <td className="text-slate-500 font-medium py-1">Doc Reg No:</td>
                        <td className="text-slate-700 font-mono">{customer.doctorRegNo}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-xs uppercase border-y border-slate-300 font-display">
                    <th className="py-1.5.5 px-3 text-center w-8">#</th>
                    <th className="py-1.5.5 px-3">Item Description</th>
                    <th className="py-1.5.5 px-3 text-center">HSN</th>
                    <th className="py-1.5.5 px-3 text-center">Batch</th>
                    <th className="py-1.5.5 px-3 text-center">Exp</th>
                    <th className="py-1.5.5 px-3 text-center">Qty</th>
                    <th className="py-1.5.5 px-3 text-right">MRP (₹)</th>
                    <th className="py-1.5.5 px-3 text-center">Disc%</th>
                    <th className="py-1.5.5 px-3 text-center">GST%</th>
                    <th className="py-1.5.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-1.5.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-1.5.5 px-3">
                        <div className="font-bold text-slate-900">{item.medicine?.name || item.medicineName || 'Medicine'}</div>
                        <div className="text-xs text-slate-500">{item.medicine?.composition || item.medicine?.packSize}</div>
                      </td>
                      <td className="py-1.5.5 px-3 text-center font-mono text-slate-600">{item.medicine?.hsnCode || '3004'}</td>
                      <td className="py-1.5.5 px-3 text-center font-mono text-slate-800 font-semibold">{item.batchNumber}</td>
                      <td className="py-1.5.5 px-3 text-center font-mono text-slate-600">{formatMonthYear(item.expiryDate)}</td>
                      <td className="py-1.5.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-1.5.5 px-3 text-right font-mono">{Number(item.mrp || item.unitPrice).toFixed(2)}</td>
                      <td className="py-1.5.5 px-3 text-center font-mono text-slate-600">
                        {Number(item.discountPercent || 0) > 0 ? `${item.discountPercent}%` : '—'}
                      </td>
                      <td className="py-1.5.5 px-3 text-center font-mono text-slate-600">{item.taxRate}%</td>
                      <td className="py-1.5.5 px-3 text-right font-mono font-bold text-slate-900">
                        {Number(item.netAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & GST Breakup */}
            <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-12 gap-4">
              {/* Left: Slab-wise Tax Summary & Amount In Words */}
              <div className="col-span-7">
                {taxSummary && taxSummary.length > 0 && (
                  <div className="border border-slate-200 rounded p-2 bg-slate-50/50 mb-3">
                    <div className="text-xs font-bold uppercase text-slate-600 mb-1 font-display">GST Tax Breakdown (Intra-State)</div>
                    <table className="w-full text-xs border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-1">Rate</th>
                          <th className="py-1 text-right">Taxable (₹)</th>
                          <th className="py-1 text-right">CGST (₹)</th>
                          <th className="py-1 text-right">SGST (₹)</th>
                          <th className="py-1 text-right">Total Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxSummary.map((ts, i) => (
                          <tr key={i} className="font-mono">
                            <td className="py-1 font-bold text-slate-700">{ts.taxRate}%</td>
                            <td className="py-1 text-right">{ts.taxableAmount.toFixed(2)}</td>
                            <td className="py-1 text-right">{ts.cgstAmount.toFixed(2)}</td>
                            <td className="py-1 text-right">{ts.sgstAmount.toFixed(2)}</td>
                            <td className="py-1 text-right font-semibold">{ts.totalTax.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-xs font-bold uppercase text-slate-700 block font-display">Amount in Words:</span>
                  <p className="text-sm font-semibold text-slate-900 italic">
                    {invoice.amountInWords || 'Rupees Zero Only'}
                  </p>
                </div>
              </div>

              {/* Right: Bill Totals */}
              <div className="col-span-5">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1.5 text-slate-600">Taxable Subtotal:</td>
                      <td className="py-1.5 text-right font-mono font-medium">₹{Number(invoice.subTotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-600">CGST Total:</td>
                      <td className="py-1.5 text-right font-mono text-slate-700">₹{Number(invoice.cgstAmount || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-600">SGST Total:</td>
                      <td className="py-1.5 text-right font-mono text-slate-700">₹{Number(invoice.sgstAmount || 0).toFixed(2)}</td>
                    </tr>
                    {Number(invoice.discountAmount || 0) > 0 && (
                      <tr>
                        <td className="py-1.5 text-teal-800 font-medium">Total Discount:</td>
                        <td className="py-1.5 text-right font-mono font-medium text-teal-800">
                          -₹{Number(invoice.discountAmount).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {Number(invoice.roundOff || 0) !== 0 && (
                      <tr>
                        <td className="py-1.5 text-slate-500 text-xs">Round Off:</td>
                        <td className="py-1.5 text-right font-mono text-xs text-slate-500">
                          {Number(invoice.roundOff) > 0 ? `+₹${Number(invoice.roundOff).toFixed(2)}` : `-₹${Math.abs(Number(invoice.roundOff)).toFixed(2)}`}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-900 font-bold text-base text-slate-900">
                      <td className="py-3">Grand Total:</td>
                      <td className="py-3 text-right font-mono text-lg text-slate-900 font-bold">
                        ₹{Number(invoice.grandTotal).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Terms / Pharmacist Sign */}
            <div className="mt-6 pt-4 border-t border-slate-300 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="font-bold uppercase text-slate-700 font-display">Terms & Conditions:</p>
                <p>1. Goods once sold will not be taken back without valid cash memo.</p>
                <p>2. Please check expiry date and seal before leaving the counter.</p>
                <p>3. Store medicines below 25°C in a dry place.</p>
              </div>

              <div className="text-center w-48">
                <div className="h-12 border-b border-dashed border-slate-400"></div>
                <p className="mt-1 font-bold text-slate-800 font-display">For {branch.name || 'KIARA MEDICALS'}</p>
                <p className="text-[9px] text-slate-500">Authorized Pharmacist Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
