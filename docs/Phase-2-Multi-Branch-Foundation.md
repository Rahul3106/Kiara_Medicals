# Kiara Medicals — Phase 2 Multi-Branch Foundation & Auth Report

## 1. Overview & Architecture Realization
Phase 2 establishes the core authentication, role-based access control (RBAC), and multi-tenant database-level data isolation for Kiara Medicals.

---

## 2. Key Implementations

### 2.1 Database Isolation Engine (`scopedPrisma.service.js`)
Rather than relying solely on UI-level hiding, tenant isolation is guaranteed at the **database query layer**:
- When a store request reaches the server, `requireBranchScope` middleware binds the authenticated user's `branchId` from the cryptographically signed JWT.
- A scoped query instance `req.scopedPrisma` is instantiated which automatically appends `where: { branchId: req.branchId }` to all Batch, Supplier, Purchase, Customer, and Sale queries.
- Malicious attempts to pass a different `branchId` in headers, URL params, or payloads by non-admin users are strictly rejected or stripped.

### 2.2 Role-Based Middleware
- `requireAdmin.middleware.js`: Restricts access exclusively to `SUPER_ADMIN`. Non-admin accounts receive `403 Forbidden`.
- `requireBranchScope.middleware.js`: Enforces branch attachment for store staff, preventing cross-branch access while allowing Super Admin to switch branch context for auditing.

### 2.3 Ready-to-Use Test Accounts & Seed Data

| Role | Email | Password | Branch Scope | Scope Type |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@kiaramedicals.com` | `admin123` | All Branches / Consolidated | Global Access |
| **Shop A Manager** | `manager.a@kiaramedicals.com` | `shopA123` | Shop A (Main Road) `[BR-A]` | Isolated Tenant |
| **Shop A Cashier** | `staff.a@kiaramedicals.com` | `shopA123` | Shop A (Main Road) `[BR-A]` | Isolated Tenant |
| **Shop B Manager** | `manager.b@kiaramedicals.com` | `shopB123` | Shop B (Station Road) `[BR-B]` | Isolated Tenant |
| **Shop B Cashier** | `staff.b@kiaramedicals.com` | `shopB123` | Shop B (Station Road) `[BR-B]` | Isolated Tenant |
| **Shop C Manager** | `manager.c@kiaramedicals.com` | `shopC123` | Shop C (City Center) `[BR-C]` | Isolated Tenant |

---

## 3. Automated Test Verification Script
Run the multi-branch verification test suite via:
```bash
node server/scripts/test-multi-branch-isolation.js
```
The test suite automatically executes:
1. Super Admin authentication & consolidated multi-store KPI aggregation.
2. Store login with automatic branch metadata extraction (`gstNumber`, `drugLicenseNo`, `code`).
3. RBAC security: Verification that store tokens are blocked (HTTP 403) from accessing admin routes.
4. Data isolation: Verification that querying `/api/store/inventory` from Shop A returns only Shop A batches (`DL-A*`, `AG-A*`, `PN-A*`) and zero batches from Shop B/C.
