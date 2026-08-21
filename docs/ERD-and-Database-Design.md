# Kiara Medicals — Database Architecture & ER Design

## 1. Overview
Kiara Medicals is a multi-branch medical store management system. The database architecture is built around **strict branch-level isolation** using a shared schema with tenant discriminator (`branchId`) on all operational tables, while centralizing master catalogs (Medicines) and high-level management for Super Admins.

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    BRANCH ||--o{ USER : "has staff/managers"
    BRANCH ||--o{ BATCH : "holds batch stock"
    BRANCH ||--o{ SUPPLIER : "manages branch suppliers"
    BRANCH ||--o{ CUSTOMER : "records branch customers"
    BRANCH ||--o{ PURCHASE : "creates purchase orders"
    BRANCH ||--o{ SALE : "issues sales bills"
    BRANCH ||--o{ STOCK_AUDIT : "performs stock audits"

    USER ||--o{ PURCHASE : "created by"
    USER ||--o{ SALE : "billed by"
    USER ||--o{ AUDIT_LOG : "triggers"

    MEDICINE ||--o{ BATCH : "has batches"
    MEDICINE ||--o{ PURCHASE_ITEM : "ordered in"
    MEDICINE ||--o{ SALE_ITEM : "sold in"

    SUPPLIER ||--o{ PURCHASE : "supplies"
    PURCHASE ||--o{ PURCHASE_ITEM : "contains"
    
    BATCH ||--o{ PURCHASE_ITEM : "received as"
    BATCH ||--o{ SALE_ITEM : "deducted in"
    
    CUSTOMER ||--o{ SALE : "buys in"
    SALE ||--o{ SALE_ITEM : "contains items"

    BRANCH {
        string id PK
        string name
        string code "e.g. BR-01"
        string address
        string city
        string state
        string pincode
        string phone
        string email
        string gstNumber
        string drugLicenseNo
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string branchId FK "null for SUPER_ADMIN"
        string name
        string email UK
        string phone
        string passwordHash
        enum role "SUPER_ADMIN, BRANCH_MANAGER, STAFF"
        boolean isActive
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    MEDICINE {
        string id PK
        string name
        string genericName
        string composition
        string manufacturer
        string category
        string hsnCode "e.g. 3004"
        string unit "TABLET, STRIP, BOTTLE, BOX, VIAL"
        float gstRate "e.g. 5, 12, 18"
        int minReorderLevel
        boolean prescriptionRequired
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    BATCH {
        string id PK
        string medicineId FK
        string branchId FK
        string batchNumber
        date expiryDate
        date mfgDate
        decimal purchasePrice "Base purchase cost per unit"
        decimal mrp "Maximum Retail Price"
        decimal sellingPrice "Actual selling price"
        int quantity "Available stock units"
        string rackLocation "e.g. Rack A-3"
        boolean isArchived
        datetime createdAt
        datetime updatedAt
    }

    SUPPLIER {
        string id PK
        string branchId FK "null if global supplier"
        string name
        string agencyName
        string contactPerson
        string phone
        string email
        string address
        string gstNumber
        string drugLicenseNo
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    PURCHASE {
        string id PK
        string branchId FK
        string supplierId FK
        string createdById FK
        string invoiceNumber "Supplier's invoice no"
        date purchaseDate
        decimal subTotal
        decimal taxAmount
        decimal discountAmount
        decimal netAmount
        string paymentStatus "PAID, PARTIAL, PENDING"
        string invoiceScanUrl "Uploaded bill scan/PDF"
        string notes
        datetime createdAt
        datetime updatedAt
    }

    PURCHASE_ITEM {
        string id PK
        string purchaseId FK
        string medicineId FK
        string batchId FK
        string batchNumber
        date expiryDate
        int quantity
        int freeQuantity
        decimal purchasePrice
        decimal mrp
        decimal taxRate
        decimal taxAmount
        decimal totalAmount
    }

    CUSTOMER {
        string id PK
        string branchId FK
        string name
        string phone
        string email
        string address
        string doctorName
        string doctorRegNo
        datetime createdAt
        datetime updatedAt
    }

    SALE {
        string id PK
        string branchId FK
        string customerId FK
        string billedById FK
        string billNumber "Branch formatted invoice e.g. KM-BR1-2026-0001"
        datetime saleDate
        decimal subTotal
        decimal cgstAmount
        decimal sgstAmount
        decimal igstAmount
        decimal totalTaxAmount
        decimal discountAmount
        decimal roundOff
        decimal grandTotal
        enum paymentMode "CASH, CARD, UPI, CREDIT, SPLIT"
        string paymentStatus "COMPLETED, REFUNDED, CANCELLED"
        string prescriptionUrl
        string notes
        datetime createdAt
        datetime updatedAt
    }

    SALE_ITEM {
        string id PK
        string saleId FK
        string medicineId FK
        string batchId FK
        string batchNumber
        date expiryDate
        int quantity
        decimal unitPrice
        decimal mrp
        decimal discountPercent
        decimal discountAmount
        decimal taxRate
        decimal cgstAmount
        decimal sgstAmount
        decimal igstAmount
        decimal netAmount
    }

    AUDIT_LOG {
        string id PK
        string branchId FK
        string userId FK
        string action "e.g. STOCK_ADJUSTMENT, MANUAL_OVERRIDE"
        string entityType "BATCH, SALE, PURCHASE"
        string entityId
        json oldValues
        json newValues
        string ipAddress
        datetime createdAt
    }
```

---

## 3. Key Multi-Tenancy & Data Isolation Rules

1. **Strict Branch Isolation**:
   - `Batch`, `Supplier`, `Purchase`, `PurchaseItem`, `Customer`, `Sale`, and `SaleItem` include `branchId`.
   - Any query executing from `/api/store/*` is intercepted by `requireBranchScope` middleware to inject `where: { branchId: req.user.branchId }`.
   - Branch users CANNOT override or pass `branchId` from request parameters/body to access another store's records.

2. **Shared Master Catalog**:
   - `Medicine` acts as a centralized master table (brand names, composition, HSN codes, default GST rates) to avoid catalog duplication across shops.
   - However, **pricing, batch, and inventory quantities are strictly branch-scoped** via the `Batch` table.

3. **Composite Unique Constraints**:
   - Unique Batch per Branch: `@@unique([branchId, medicineId, batchNumber])`
   - Unique Bill Number per Branch: `@@unique([branchId, billNumber])`
   - Unique Supplier Invoice per Branch: `@@unique([branchId, supplierId, invoiceNumber])`

4. **Indexes for High-Performance POS Queries**:
   - Fast medicine search: `CREATE INDEX idx_medicine_name ON Medicine(name, genericName)`
   - Fast batch lookup during checkout: `CREATE INDEX idx_batch_branch_med ON Batch(branchId, medicineId, expiryDate)`
   - Expiry alert monitoring: `CREATE INDEX idx_batch_expiry ON Batch(branchId, expiryDate)`
   - Daily/weekly sales reporting: `CREATE INDEX idx_sale_branch_date ON Sale(branchId, saleDate)`
