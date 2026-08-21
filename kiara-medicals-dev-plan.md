# Kiara Medicals — Multi-Branch Medical Store Management System
## Development Plan & File Structure

---

## 0. One Important Architecture Decision First

You asked for **separate folders for each shop (A, B, C) and for admin, not mixed together**. Here's the right way to do that so it's both what you want *and* maintainable:

- **Do NOT** create a literal `ShopA/`, `ShopB/`, `ShopC/` code folder for each store. If you do that, every bug fix or new feature has to be copy-pasted into 3 (and later 10, 20...) folders. It becomes unmaintainable fast and defeats the purpose of "one system, multiple branches."
- **Instead**, separate by **role/context**, not by individual shop name:
  - `store/` → the branch-level app/module (used by Shop A, B, or C — whichever branch the logged-in user belongs to. The system automatically shows only that branch's data based on login, not based on a different codebase).
  - `admin/` → the admin-only module, completely separate folder, separate routes, separate access.
- This gives you true separation between **Admin** and **Store staff**, which is what actually matters for security and clean code. Adding Shop D later needs **zero new code** — just a new branch record in the database.

This is explained more below in the folder structure.

---

## 1. PHASE-WISE DEVELOPMENT PLAN

### **Phase 1 — Planning & Architecture (Week 1)**
- Finalize exact GST invoice format with client
- Finalize user roles: Super Admin, Branch Admin/Manager, Cashier/Staff
- Design database schema (branches, users, medicines, batches, inventory, purchases, sales, bills, customers, suppliers)
- Define API structure (REST endpoints)
- Set up project repos, environments, coding standards

**Deliverable:** ER diagram + API route list + confirmed scope document

---

### **Phase 2 — Core Setup: Auth & Multi-Branch Foundation (Week 2–3)**
- Node.js + Express + Prisma + MySQL base setup
- JWT-based authentication, password hashing (bcrypt)
- Role-based access middleware (Staff vs Branch Manager vs Admin)
- Branch context middleware — every request from a store user is auto-scoped to their `branchId` at the **database query level**, not just UI level
- Login flow: user logs in → system detects branch → loads that branch's dashboard
- Separate Admin login/auth flow with elevated privilege check

**Deliverable:** Working login system where Shop A user only ever sees Shop A data (tested via API, not just hidden in UI)

---

### **Phase 3 — Inventory & Purchase Management (Week 4–5)**
- Medicine master + batch-wise inventory
- Purchase entry (supplier, batch, expiry, price)
- Auto stock increment on purchase
- Low-stock & near-expiry flags
- Purchase bill upload (OCR integration placeholder)

**Deliverable:** Full purchase-to-inventory flow working per branch

---

### **Phase 4 — Sales, Billing & GST Invoicing (Week 6–7)**
- Bill creation UI (medicine search, quantity, auto price calc)
- Auto stock deduction on sale
- GST invoice generation (PDF)
- Bill numbering per branch
- Sales history

**Deliverable:** End-to-end billing: Bill Generated → Inventory Updated → Invoice PDF

---

### **Phase 5 — Reports & Analytics (Week 8)**
- Daily/Weekly/Monthly sales reports (branch-level)
- Charts (Recharts) — sales trend, top/slow medicines
- Expiry & stock monitoring dashboard

**Deliverable:** Branch dashboard with live charts

---

### **Phase 6 — Admin Panel & Centralized Dashboard (Week 9–10)**
- Separate Admin login/module
- All Shops / Shop A / Shop B / Shop C toggle view
- Consolidated sales, inventory, purchase, expiry across branches
- Branch comparison reports
- Backend-level authorization checks (admin-only endpoints, verified server-side)

**Deliverable:** Fully working Admin Panel, isolated from branch app

---

### **Phase 7 — Responsive/Mobile + Polish (Week 11)**
- Mobile-responsive dashboards & reports
- Customer/Supplier management screens
- UI polish, error handling, validations

---

### **Phase 8 — Testing, Deployment & Handover (Week 12)**
- End-to-end testing (per branch + admin)
- VPS setup, Nginx, SSL, PM2
- Database backup automation
- Client training + documentation
- Bug fixing window

---

## 2. FOLDER / FILE STRUCTURE

### High-level monorepo layout

```
kiara-medicals/
├── client/                     # Frontend (React + Vite)
│   ├── admin/                  # ⭐ ADMIN-ONLY app section (fully separate)
│   ├── store/                  # ⭐ STORE/BRANCH app section (fully separate)
│   ├── shared/                 # shared UI components, hooks, utils
│   └── ...
├── server/                     # Backend (Node.js + Express)
│   ├── admin/                  # ⭐ ADMIN-ONLY routes/controllers
│   ├── store/                  # ⭐ STORE/BRANCH routes/controllers
│   ├── shared/                 # shared services, middleware, utils
│   └── ...
├── prisma/                     # DB schema & migrations
└── docs/
```

### Full Frontend (`client/`) structure

```
client/
├── src/
│   ├── admin/                              # ADMIN MODULE (isolated)
│   │   ├── pages/
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx          # All Shops / Shop A / B / C toggle
│   │   │   ├── BranchComparison.jsx
│   │   │   ├── ConsolidatedInventory.jsx
│   │   │   ├── ConsolidatedSales.jsx
│   │   │   ├── ExpiryOverview.jsx
│   │   │   └── AdminSettings.jsx
│   │   ├── components/
│   │   │   ├── BranchSwitcher.jsx
│   │   │   └── AdminCharts/
│   │   ├── routes/
│   │   │   └── adminRoutes.jsx
│   │   └── adminApi.js                     # calls only /api/admin/* endpoints
│   │
│   ├── store/                              # STORE/BRANCH MODULE (isolated)
│   │   ├── pages/
│   │   │   ├── StoreLogin.jsx
│   │   │   ├── StoreDashboard.jsx
│   │   │   ├── Inventory/
│   │   │   │   ├── InventoryList.jsx
│   │   │   │   ├── MedicineDetails.jsx
│   │   │   │   └── StockAdjustment.jsx
│   │   │   ├── Purchase/
│   │   │   │   ├── PurchaseEntry.jsx
│   │   │   │   └── PurchaseHistory.jsx
│   │   │   ├── Sales/
│   │   │   │   ├── NewBill.jsx
│   │   │   │   ├── BillHistory.jsx
│   │   │   │   └── InvoicePreview.jsx
│   │   │   ├── Customers/
│   │   │   ├── Suppliers/
│   │   │   └── Reports/
│   │   │       ├── DailyReport.jsx
│   │   │       ├── WeeklyReport.jsx
│   │   │       └── MonthlyReport.jsx
│   │   ├── components/
│   │   ├── routes/
│   │   │   └── storeRoutes.jsx
│   │   └── storeApi.js                     # calls only /api/store/* endpoints
│   │
│   ├── shared/                             # common to both
│   │   ├── components/ (Button, Table, Modal, Charts base, etc.)
│   │   ├── hooks/ (useAuth, useBranchContext)
│   │   ├── context/ (AuthContext.jsx)
│   │   └── utils/ (formatCurrency.js, dateUtils.js)
│   │
│   ├── App.jsx                             # top-level route split: /admin/* vs /store/*
│   └── main.jsx
├── index.html
└── package.json
```

### Full Backend (`server/`) structure

```
server/
├── src/
│   ├── admin/                              # ADMIN MODULE (isolated)
│   │   ├── routes/
│   │   │   └── admin.routes.js             # /api/admin/...
│   │   ├── controllers/
│   │   │   ├── adminDashboard.controller.js
│   │   │   ├── branchComparison.controller.js
│   │   │   └── adminAuth.controller.js
│   │   ├── services/
│   │   │   └── consolidatedReport.service.js
│   │   └── middleware/
│   │       └── requireAdmin.middleware.js  # verifies admin role server-side
│   │
│   ├── store/                              # STORE/BRANCH MODULE (isolated)
│   │   ├── routes/
│   │   │   ├── inventory.routes.js         # /api/store/inventory
│   │   │   ├── purchase.routes.js
│   │   │   ├── sales.routes.js
│   │   │   ├── customers.routes.js
│   │   │   ├── suppliers.routes.js
│   │   │   └── reports.routes.js
│   │   ├── controllers/
│   │   │   ├── inventory.controller.js
│   │   │   ├── purchase.controller.js
│   │   │   ├── sales.controller.js
│   │   │   └── reports.controller.js
│   │   ├── services/
│   │   │   ├── inventory.service.js
│   │   │   ├── billing.service.js          # bill → stock deduction logic
│   │   │   └── gstInvoice.service.js       # PDF generation
│   │   └── middleware/
│   │       └── requireBranchScope.middleware.js  # forces branchId filter on every query
│   │
│   ├── shared/
│   │   ├── auth/
│   │   │   ├── auth.controller.js          # login/signup (both admin & store use this)
│   │   │   ├── auth.middleware.js          # JWT verify
│   │   │   └── password.util.js
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── utils/
│   │   └── errors/
│   │
│   ├── app.js                              # mounts /api/admin and /api/store separately
│   └── server.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

### Why this satisfies your requirement
- **Admin code and Store code never mix** — different folders, different route prefixes (`/api/admin/*` vs `/api/store/*`), different frontend bundles/route groups.
- **Shop A/B/C don't need separate folders** because they share the *same* store module — the difference between them is only the `branchId` attached to the logged-in user's session, enforced at the database/middleware level (`requireBranchScope.middleware.js`). This is more secure than folder-separation because it's enforced in the backend, not just by which folder you opened.
- If you truly want a **visually distinct login portal per shop** (different subdomain like `shopA.kiaramedicals.com`), that's just a frontend routing/branding layer on top of this same shared `store/` module — I can add that in Phase 2 if needed.

---

## 3. CORE DATABASE TABLES (high-level)

```
Branch          (id, name, address, gstNumber)
User            (id, name, role[STAFF/MANAGER/ADMIN], branchId, passwordHash)
Medicine        (id, name, composition, hsnCode)
Batch           (id, medicineId, branchId, batchNo, expiryDate, purchasePrice, sellingPrice, quantity)
Supplier        (id, branchId, name, contact)
Purchase        (id, branchId, supplierId, invoiceNo, date)
PurchaseItem    (id, purchaseId, medicineId, batchId, qty, price)
Customer        (id, branchId, name, contact)
Sale            (id, branchId, customerId, billNo, date, gstAmount, totalAmount)
SaleItem        (id, saleId, medicineId, batchId, qty, price)
```
Every branch-scoped table carries `branchId` — this is what enforces isolation, not the folder structure.

---

## 4. NEXT STEPS TO START

1. Confirm GST invoice fields & sample bill format with client
2. Finalize role list (Staff / Manager / Admin) and what each can/can't do
3. I set up the monorepo skeleton above with Prisma schema
4. Build Phase 1 → Phase 2 (auth + branch isolation) first, since everything else depends on it being correct
