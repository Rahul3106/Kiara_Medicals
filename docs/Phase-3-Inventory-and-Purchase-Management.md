# Kiara Medicals — Phase 3 Inventory & Purchase Management Report

## 1. Executive Summary
Phase 3 delivers an end-to-end **Inventory & Purchase Inward Workflow** strictly scoped per branch. Inward purchase orders automatically increment batch stock or create new batch records atomically, guaranteeing that inventory counts reflect real distributor shipments.

---

## 2. Key Modules & Implementations

### 2.1 Atomic Purchase Inward Engine (`purchase.service.js`)
When a branch enters a supplier invoice:
1. **Supplier Verification**: Confirms supplier is registered to the branch or global.
2. **Duplicate Invoice Prevention**: Checks `@@unique([branchId, supplierId, invoiceNumber])` to avoid duplicate bill entries.
3. **Database Transaction**:
   - Computes line tax amounts (`CGST`, `SGST`) per item.
   - For each medicine line item, checks if `(branchId, medicineId, batchNumber)` exists:
     - If exists: Atomically increments `quantity` by `(quantity + freeQuantity)` and updates purchase price/MRP.
     - If new: Creates a new `Batch` record in this branch with initial stock `(quantity + freeQuantity)`.
   - Creates `Purchase` and itemized `PurchaseItem` records.
   - Automatically writes an immutable audit record to `AuditLog`.

### 2.2 FEFO & Expiry Intelligence (`inventory.service.js`)
- Batches are queried using **FEFO (First-Expired, First-Out)** order so staff sell older stock first.
- **Dynamic Status Flags**:
  - `EXPIRED`: Days $\le 0$ (Blocked from POS sales).
  - `CRITICAL`: Days $\le 30$.
  - `NEAR_EXPIRY`: Days $\le 90$.
  - `VALID`: Healthy shelf-life.
- **Low Stock Filter**: Detects when batch quantities drop below `medicine.minReorderLevel`.

### 2.3 Stock Adjustments & Compliance (`inventory.controller.js` & `StockAdjustmentModal.jsx`)
- Supports **Damage/Breakage/Loss**, **Expired Disposal**, **Audit Found (+)**, and **Exact Physical Count Set**.
- Records previous count, new count, userId, and mandatory justification note into `AuditLog`.

### 2.4 OCR Bill Scan Simulator (`ocrPlaceholder.service.js`)
- Provides a simulated OCR extraction workflow that maps distributor bills to internal medicine master catalogs with a single click.

---

## 3. Frontend Store Portal Pages Built

| Page / Component | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Store Navbar** | Global Header | Active branch badge, GSTIN, and direct tab navigation. |
| **Inventory List** | `/store/inventory` | FEFO table, Near-Expiry/Low-Stock filters, search, and adjustment modal. |
| **New Purchase Entry** | `/store/purchases/new` | Multi-line dynamic batch rows, free quantity support, live tax calculation, OCR scan simulator. |
| **Purchase History** | `/store/purchases` | Past invoices list with itemized modal bill viewer. |
| **Supplier Directory** | `/store/suppliers` | Distributor contact, GSTIN, and Drug License registry. |

---

## 4. Automated Verification Test
Run the automated test suite:
```bash
node server/scripts/test-phase3-inventory-purchase.js
```
The test verifies:
- Authenticating as Shop A Cashier.
- Creating distributor "Apex Pharma Distributors".
- Submitting a purchase order with Dolo 650 (Batch `DL-P3-*`, 100 billed + 10 free qty).
- Automatic batch creation with quantity `110`.
- Stock adjustment deducting 5 damaged units, verifying stock drops to `105` with audit logging.
- Verifying Shop B inventory remains completely isolated and cannot see Shop A's newly inward batch.
