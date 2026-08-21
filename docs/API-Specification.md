# Kiara Medicals — REST API Specifications

## 1. Authentication & Common Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user (Admin or Store Staff), return JWT + branch profile |
| `POST` | `/api/auth/refresh` | Public | Refresh expired access token using refresh token |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user details and active branch context |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session / refresh token |

---

## 2. Store / Branch Scoped Endpoints (`/api/store`)
> **Note:** All `/api/store/*` routes require `requireBranchScope` middleware. Queries are automatically filtered by `req.user.branchId`.

### 2.1 Inventory & Batches (`/api/store/inventory`)
| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/store/inventory` | Manager, Staff | List branch batches & stock levels (supports search, sort, filters) |
| `GET` | `/api/store/inventory/medicine-search` | Manager, Staff | Quick search for POS (with batch FEFO suggestions) |
| `GET` | `/api/store/inventory/:batchId` | Manager, Staff | Get specific batch details |
| `POST` | `/api/store/inventory/adjust` | Manager | Stock adjustment (damaged, lost, audit correction) |
| `GET` | `/api/store/inventory/low-stock` | Manager, Staff | Get medicines below minimum reorder level |
| `GET` | `/api/store/inventory/near-expiry` | Manager, Staff | Get batches expiring in <= 90 days |

### 2.2 Purchase Management (`/api/store/purchases`)
| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/store/purchases` | Manager | List purchase entries for current branch |
| `POST` | `/api/store/purchases` | Manager | Create purchase entry (adds batch stock automatically) |
| `GET` | `/api/store/purchases/:id` | Manager | Get purchase invoice details & line items |
| `POST` | `/api/store/purchases/upload-scan` | Manager | Upload supplier bill scan/PDF (OCR placeholder) |

### 2.3 POS Billing & Sales (`/api/store/sales`)
| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/store/sales` | Manager, Staff | Generate new sales bill (atomic stock deduction + GST calc) |
| `GET` | `/api/store/sales` | Manager, Staff | List branch sales history (filter by date, customer, billNo) |
| `GET` | `/api/store/sales/:id` | Manager, Staff | Get detailed sale record |
| `GET` | `/api/store/sales/:id/invoice-pdf` | Manager, Staff | Generate & download GST Invoice PDF |
| `POST` | `/api/store/sales/:id/cancel` | Manager | Cancel/void invoice & restore batch stock |

### 2.4 Customers & Suppliers (`/api/store/customers`, `/api/store/suppliers`)
| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/store/customers` | Manager, Staff | Search / list branch customers |
| `POST` | `/api/store/customers` | Manager, Staff | Create / update customer |
| `GET` | `/api/store/suppliers` | Manager | List branch suppliers |
| `POST` | `/api/store/suppliers` | Manager | Create / update supplier |

### 2.5 Branch Reports (`/api/store/reports`)
| Method | Endpoint | Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/store/reports/daily` | Manager, Staff | Daily sales summary, payment mode breakdown, tax total |
| `GET` | `/api/store/reports/weekly` | Manager | Weekly sales & profit trends |
| `GET` | `/api/store/reports/monthly` | Manager | Monthly GST summary (GSTR-1 format summary) |
| `GET` | `/api/store/reports/fast-moving` | Manager | Top 20 selling medicines |

---

## 3. Centralized Admin Endpoints (`/api/admin`)
> **Note:** All `/api/admin/*` routes require `requireAdmin` middleware. Verifies `req.user.role === 'SUPER_ADMIN'`.

### 3.1 Admin Dashboard & Consolidated Analytics (`/api/admin/dashboard`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/summary` | Consolidated KPIs: Total Sales, Inventory Valuation, Low Stock across all shops or filtered by branch |
| `GET` | `/api/admin/dashboard/branch-comparison` | Side-by-side revenue, profit margin, bill counts for Shop A vs B vs C |
| `GET` | `/api/admin/dashboard/sales-trend` | Consolidated sales timeline charts (Daily/Monthly) |
| `GET` | `/api/admin/dashboard/expiry-overview` | All near-expiry batches aggregated across all branches |

### 3.2 Global Inventory & Catalog (`/api/admin/inventory`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/medicines` | Master medicine catalog search & list |
| `POST` | `/api/admin/medicines` | Add new medicine to master catalog |
| `PUT` | `/api/admin/medicines/:id` | Update master medicine information (HSN, GST %, Category) |
| `GET` | `/api/admin/inventory/consolidated` | Multi-branch stock comparison for any medicine |

### 3.3 Branch & User Administration (`/api/admin/branches`, `/api/admin/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/branches` | List all active/inactive branches |
| `POST` | `/api/admin/branches` | Onboard a new branch (e.g. Shop D) |
| `PUT` | `/api/admin/branches/:id` | Update branch GSTIN, Drug License, Address |
| `GET` | `/api/admin/users` | List all users across all branches |
| `POST` | `/api/admin/users` | Create user (assign role and branch) |
| `PUT` | `/api/admin/users/:id/status` | Activate / Deactivate user account |
| `POST` | `/api/admin/users/:id/reset-password` | Reset password for any branch staff/manager |
| `GET` | `/api/admin/audit-logs` | View system-wide security & stock override audit trails |

---

## 4. Standard Response & Error Format

### 4.1 Success Response Schema
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 4.2 Error Response Schema
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested 10 units of Paracetamol 650mg, but only 4 units available in Batch #PCM-2024",
    "details": []
  }
}
```
