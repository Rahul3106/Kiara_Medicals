# Kiara Medicals — Phase 5 Reports & Analytics Report

## 1. Executive Summary
Phase 5 introduces **Branch-Level Analytics**, **Recharts Interactive Data Visualizations**, **Official GSTR-1 Slab-Wise Tax Filing Reports**, and **Dead Stock / Capital Velocity Detection**.

---

## 2. Key Deliverables & Features Built

### 2.1 Branch Sales Analytics & Revenue Trends
* **Time Range Selector**: Toggle between 7, 14, 30, and 60 days.
* **Recharts AreaChart**: Smooth gradient curves showing daily sales revenue performance.
* **Profit Estimation Engine**: Evaluates item-level sales margin (Selling Price vs Purchase Price) and estimates gross branch margin percentage.
* **Top Fast-Moving Medicines**: Identifies high-velocity formulations and ranking.

### 2.2 Official GSTR-1 Slab-Wise Tax Report
* **Slab Breakdown**: Standard Indian GST rate categories (0%, 5%, 12%, 18%, 28%).
* **Tax Splits**: Itemizes Intra-state 50-50 splits (CGST + SGST) alongside total taxable amounts.
* **Export to CSV**: Instant export formatted for chartered accountants and GSTR-1 portals.
* **Print Tax Sheet**: Clean physical invoice summary trigger.

### 2.3 Stock Velocity & Dead Stock Identifier
* **Classification Algorithm**:
  * **Fast Moving**: $>10$ units sold within 30 days.
  * **Slow Moving**: $1 - 9$ units sold within 30 days.
  * **Dead / Stagnant Stock**: $0$ units sold in the last 30+ days.
* **Locked Capital Calculation**: Computes dead stock valuation in INR, alerting pharmacists to return batches to distributors or apply promotional discounts before expiry.

### 2.4 Multi-Branch Tenancy Isolation
* Store reports dynamically filter by branch ID (`req.branchId`). Shop A staff cannot access Shop B's analytics.

---

## 3. Frontend Reporting Page

| Page / Component | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Store Reports** | [`/store/reports`](file:///home/rahul/Desktop/Softee/client/src/store/pages/Reports/StoreReports.jsx) | Tabbed dashboard with Sales Trends (Recharts Area + Donut), GSTR-1 Tax Summary (Table + CSV export), and Dead Stock Warning Matrix. |

---

## 4. Automated Verification Test Suite
Run the Phase 5 test suite via:
```bash
node server/scripts/test-phase5-reports-analytics.js
```
**Test Results (5/5 Passed)**:
1. ✅ Shop A Staff authentication & branch binding (`BR-A`)
2. ✅ Overview metrics retrieval (Today's revenue, Month-to-date, Daily trend array, Payment breakdown, Fast moving items)
3. ✅ GSTR-1 slab-wise GST summary (0%, 5%, 12%, 18%, 28% validation)
4. ✅ Stock movement velocity & dead stock capital calculation
5. ✅ Multi-branch tenant isolation (Shop B reports strictly scoped to Shop B)

---

## 5. Next Steps
Next Phase: **Phase 6 — Admin Panel & Centralized Multi-Branch Control**
* Global branch switcher (`All Shops`, `Shop A`, `Shop B`, `Shop C`).
* Cross-branch comparison matrix and consolidated reporting.
* Server-side Super Admin role-based access control (RBAC).
