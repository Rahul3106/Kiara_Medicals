# Kiara Medicals — GST Invoicing & Business Rules Specification

## 1. User Roles & Permission Matrix

| Feature / Action | Super Admin | Branch Manager | Staff / Cashier |
| :--- | :---: | :---: | :---: |
| **Branch Selection** | All / Switch Branch | Own Branch Only | Own Branch Only |
| **View Consolidated Reports (All Shops)** | ✅ Yes | ❌ No | ❌ No |
| **Branch Comparison & Analytics** | ✅ Yes | ❌ No | ❌ No |
| **Create / Update Branch Details** | ✅ Yes | ❌ No | ❌ No |
| **Create / Manage Users** | ✅ All Branches | ✅ Own Branch Only | ❌ No |
| **Master Medicine Catalog (CRUD)** | ✅ Yes | ✅ Request/Add | ❌ Read Only |
| **Manage Batch Inventory** | ✅ View / Audit | ✅ Add / Adjust / Edit | ❌ View Only |
| **Purchase Entry & Supplier Bills** | ✅ All Branches | ✅ Own Branch | ❌ No |
| **POS Billing / New Bill Generation** | ✅ (Testing) | ✅ Yes | ✅ Yes |
| **View Daily Sales History** | ✅ All Branches | ✅ Own Branch | ✅ Own Shift / Branch |
| **Apply Custom Discounts on Bills** | ✅ Up to 100% | ✅ Up to 20% | ✅ Up to 5% |
| **Cancel / Void Invoice** | ✅ Yes | ✅ Yes (Requires Reason) | ❌ No (Manager Approval) |
| **Customer Management (CRUD)** | ✅ Yes | ✅ Yes | ✅ Add / Search |
| **Supplier Management (CRUD)** | ✅ Yes | ✅ Yes | ❌ No |
| **Export Financial / GST Reports** | ✅ Yes | ✅ Own Branch | ❌ No |

---

## 2. Indian GST Invoicing Rules for Medical Retail

### 2.1 HSN Codes & GST Slabs for Pharmaceuticals
- **HSN 3004**: Medicaments consisting of mixed or unmixed products for therapeutic or prophylactic uses (Most common medicines): **12% GST** (6% CGST + 6% SGST) or **5% GST** for critical life-saving formulations.
- **HSN 3002**: Vaccines, toxins, cultures, diagnostic kits: **5% GST** or **12% GST**.
- **HSN 3005 / 3006**: Bandages, dressings, surgical sutures, dental prep: **12% GST**.
- **HSN 9018 / 9027**: Medical instruments, thermometer, glucometer: **12% / 18% GST**.
- **Baby food / Dietary supplements**: **18% GST**.

### 2.2 Intra-State vs. Inter-State Tax Calculation
1. **Intra-State Sale (Same state as Branch, e.g., Branch in MH -> Customer in MH)**:
   $$\text{CGST} = \frac{\text{Taxable Amount} \times (\text{GST Rate} / 2)}{100}$$
   $$\text{SGST} = \frac{\text{Taxable Amount} \times (\text{GST Rate} / 2)}{100}$$
   $$\text{IGST} = 0$$

2. **Inter-State Sale (Branch in MH -> Customer in KA/DL)**:
   $$\text{IGST} = \frac{\text{Taxable Amount} \times \text{GST Rate}}{100}$$
   $$\text{CGST} = 0, \quad \text{SGST} = 0$$

### 2.3 Tax Calculation Methodology (Inclusive vs Exclusive)
For retail POS billing, prices entered on medicines (MRP) are inclusive of GST.
- $\text{Taxable Value} = \frac{\text{MRP} \times 100}{100 + \text{GST Rate}}$
- $\text{Tax Amount} = \text{MRP} - \text{Taxable Value}$
- If line item discount $D\%$ is given:
  - $\text{Discounted MRP} = \text{MRP} \times (1 - D / 100)$
  - $\text{Net Taxable} = \frac{\text{Discounted MRP} \times 100}{100 + \text{GST Rate}}$
  - $\text{Net Tax} = \text{Discounted MRP} - \text{Net Taxable}$

### 2.4 Invoice Numbering Scheme
Each branch generates unique, sequential, non-repeating tax invoice numbers per financial year:
Format: `KM-[BRANCH_CODE]-[FY]-[SEQUENCE_NUMBER]`
- Example Shop A: `KM-A-2627-00001`
- Example Shop B: `KM-B-2627-00001`
- Example Shop C: `KM-C-2627-00001`

### 2.5 Mandatory GST Invoice Fields
1. Header: Branch Trade Name, Address, Phone, Email, GSTIN, Drug License Numbers (Form 20B/21B).
2. Bill metadata: Invoice No, Invoice Date, Time, Cashier/Staff Name, Payment Mode.
3. Patient/Doctor details: Customer Name, Mobile No, Prescribing Doctor Name & Reg No.
4. Itemized Table:
   - S.No
   - Item Name & Packing
   - HSN Code
   - Batch Number
   - Expiry Date (MM/YY)
   - Qty
   - MRP
   - Unit Rate
   - Disc %
   - GST %
   - Taxable Amount
   - Total (INR)
5. Tax Summary Table:
   - Tax Rate (e.g. 5%, 12%, 18%)
   - Taxable Amount
   - CGST Amount
   - SGST Amount
   - Total GST
6. Footer:
   - Net Amount in Figures & Words
   - Terms & Conditions (e.g., "Medicines without batch/bill cannot be returned. Refrigerated items non-returnable.")
   - Authorized Signatory placeholder.

---

## 3. Inventory & Batch Life Cycle Rules
1. **FIFO / FEFO (First-Expired, First-Out)**:
   - When billing a medicine, system automatically suggests the active batch with the **earliest expiry date** (`FEFO`) that has `quantity > 0`.
2. **Near Expiry Alerts**:
   - Batches expiring within 90 days are flagged as **Yellow (Near Expiry)**.
   - Batches expiring within 30 days are flagged as **Red (Critical Expiry)**.
   - Expired batches are blocked from new POS sales automatically.
3. **Atomic Stock Decrement**:
   - Stock deduction occurs within a database transaction during bill commit. If any item is out of stock, transaction aborts with a clear conflict message.
