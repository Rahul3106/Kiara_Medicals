# Kiara Medicals — Phase 4 Sales, Billing & GST Invoicing Report

## 1. Executive Summary
Phase 4 implements the complete **Point-of-Sale (POS) Billing Engine**, **Sequential GST Tax Invoicing**, **Atomic Inventory Stock Deduction**, and **Patient/Customer Registry** scoped strictly per branch.

---

## 2. Key Backend Features & Implementations

### 2.1 Sequential Bill Numbering (`billing.service.js`)
- Follows Indian Financial Year (April 1 to March 31) standard.
- Formatted structure: `KM-[BRANCH_CODE]-[FY_CODE]-[SEQUENCE_5_DIGITS]`
- Examples: `KM-BR-A-2627-00001`, `KM-BR-B-2627-00001`.
- Guarantees sequential invoice numbers per branch within a database transaction.

### 2.2 Atomic POS Stock Deduction & Expiry Safety
- Verifies batch expiry before dispensing: expired medicines are immediately rejected (`MEDICINE_EXPIRED`).
- Verifies stock levels: requests exceeding batch quantity are rejected (`INSUFFICIENT_STOCK`).
- Atomically decrements batch quantity upon successful bill generation.
- Full audit log recorded for every bill generated (`SALE_BILL_CREATED`).

### 2.3 Comprehensive GST Calculations & Indian Words
- **Intra-State GST**: 50-50 split between CGST & SGST based on medicine tax rate (e.g. 12% = 6% CGST + 6% SGST).
- **Taxable Subtotal & Discounts**: Computes line-item and bill-level discounts.
- **Round Off**: Mathematical standard 2-decimal round off.
- **Number to Words**: Indian currency converter (`numberToWords.util.js`) prints exact words (e.g., *"Rupees Four Hundred Sixty-Three Only"*).
- **Slab-wise Tax Breakdown**: Groups taxes by tax rate (5%, 12%, 18%) for official GST compliance.

### 2.4 Bill Cancellation & Stock Rollback
- Reverses sold medicine quantities back to their respective batch inventories.
- Updates status to `CANCELLED` with audit trail justification.

---

## 3. Frontend Store Portal Pages Built

| Page / Component | Route | Key Capabilities |
| :--- | :--- | :--- |
| **New POS Bill** | [`/store/sales/new`](file:///home/rahul/Desktop/Softee/client/src/store/pages/Sales/NewBill.jsx) | Live FEFO medicine & batch search, patient phone auto-complete, live GST computation, payment mode selection (Cash, UPI, Card, Split), instant bill generation. |
| **GST Tax Invoice Modal** | [`InvoiceModal.jsx`](file:///home/rahul/Desktop/Softee/client/src/store/pages/Sales/InvoiceModal.jsx) | Official printable A4 / POS receipt with branch GSTIN, DL numbers, HSN codes, batch expiry dates, slab-wise tax breakdown, amount in words, and browser print trigger. |
| **Sales History** | [`/store/sales`](file:///home/rahul/Desktop/Softee/client/src/store/pages/Sales/BillHistory.jsx) | Revenue KPIs, past bills table with search & filter, instant invoice reprint, and bill voiding with stock restoration. |
| **Patient Directory** | [`/store/customers`](file:///home/rahul/Desktop/Softee/client/src/store/pages/Customers/CustomerList.jsx) | Registered customers, phone search, doctor details, and past prescription order history. |

---

## 4. Automated Verification Test Suite
Run the Phase 4 test suite via:
```bash
node server/scripts/test-phase4-sales-billing.js
```
The test suite validates:
1. Shop A Cashier authentication & branch binding (`BR-A`).
2. Live inventory lookup for FEFO batch selection.
3. POS bill generation with customer details, discount %, and UPI payment.
4. Sequential bill format validation (`KM-BR-A-2627-00001`).
5. Atomic batch stock reduction (60 $\rightarrow$ 57).
6. Tax invoice retrieval with amount in words and slab-wise GST breakdown.
7. Rejection of excessive stock requests (400 `INSUFFICIENT_STOCK`).
8. Bill cancellation with automatic batch stock restoration (54 $\rightarrow$ 57).
9. Multi-tenant isolation verification (Shop B cannot access or cancel Shop A invoices).

---

## 5. Ready for Phase 5
Next Phase: **Phase 5 — Reports & Analytics**
- Daily / Weekly / Monthly sales reports per branch.
- Recharts visualizations (Sales trends, top selling medicines, slow moving stock).
- Branch-level expiry & stock monitoring dashboards.
