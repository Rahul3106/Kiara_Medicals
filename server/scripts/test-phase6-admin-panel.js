import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
  } else {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase6Tests() {
  console.log('\n===============================================================');
  console.log('🚀 KIARA MEDICALS — PHASE 6 ADMIN PANEL & CENTRALIZED CONTROL');
  console.log('===============================================================\n');

  try {
    // 1. Authenticate as Super Admin
    console.log('👉 1. Authenticating as Super Admin (admin@kiaramedicals.com)...');
    const adminLoginRes = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
      email: 'admin@kiaramedicals.com',
      password: 'admin123',
    });

    assert(adminLoginRes.status === 200, 'Admin login returned HTTP 200');
    assert(adminLoginRes.data.success === true, 'Admin login success is true');
    const adminToken = adminLoginRes.data.data.accessToken;
    const adminRole = adminLoginRes.data.data.user.role;
    assert(adminRole === 'SUPER_ADMIN', 'Authenticated user role is SUPER_ADMIN');

    const adminHeaders = {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    };

    // 2. Verify RBAC Security (Non-Admin Rejected with 403)
    console.log('\n👉 2. Verifying Server-Side RBAC Protection for Non-Admin Staff...');
    const staffLogin = await axios.post(`${BASE_URL}/api/auth/store-login`, {
      email: 'staff.a@kiaramedicals.com',
      password: 'shopA123',
    });
    const staffToken = staffLogin.data.data.accessToken;

    try {
      await axios.get(`${BASE_URL}/api/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      assert(false, 'Staff should NOT be allowed to access admin routes');
    } catch (err) {
      assert(err.response?.status === 403, 'Staff access to /api/admin/* returned HTTP 403 Forbidden');
    }

    // 3. Test Consolidated Admin Dashboard Summary
    console.log('\n👉 3. Testing Consolidated Dashboard Summary & Valuation...');
    const summaryRes = await axios.get(`${BASE_URL}/api/admin/dashboard/summary`, adminHeaders);
    assert(summaryRes.status === 200, 'Dashboard summary returned HTTP 200');
    assert(summaryRes.data.success === true, 'Dashboard summary success is true');

    const summary = summaryRes.data.data;
    assert(typeof summary.totalBranches === 'number' && summary.totalBranches >= 1, 'Total branches count is valid');
    assert(typeof summary.totalMedicines === 'number', 'Total medicines count is valid');
    assert(typeof summary.inventoryCostValue === 'number', 'Inventory cost valuation computed');
    assert(typeof summary.totalRevenue === 'number', 'Enterprise revenue aggregated');
    console.log(`   Branches: ${summary.totalBranches} | Users: ${summary.totalUsers} | Formulas: ${summary.totalMedicines}`);
    console.log(`   Inventory Cost: ₹${summary.inventoryCostValue} | Total Revenue: ₹${summary.totalRevenue}`);

    // 4. Test Branch Comparison Matrix
    console.log('\n👉 4. Testing Branch Performance Comparison Matrix...');
    const compRes = await axios.get(`${BASE_URL}/api/admin/dashboard/branch-comparison`, adminHeaders);
    assert(compRes.status === 200, 'Branch comparison returned HTTP 200');
    assert(Array.isArray(compRes.data.data), 'Branch comparison data is an array');
    assert(compRes.data.data.length >= 1, 'Contains records for active retail branches');

    compRes.data.data.forEach((b) => {
      console.log(`   [${b.code}] ${b.name}: ₹${b.totalRevenue} Rev | ₹${b.inventoryValuation} Stock | ${b.userCount} Staff`);
    });

    // 5. Test Branch Listing & Retrieval
    console.log('\n👉 5. Testing Branch Network Registry...');
    const branchRes = await axios.get(`${BASE_URL}/api/admin/branches`, adminHeaders);
    assert(branchRes.status === 200, 'Branch list returned HTTP 200');
    assert(Array.isArray(branchRes.data.data), 'Branch list is an array');

    // 6. Test User Management (Listing & Role verification)
    console.log('\n👉 6. Testing Enterprise Staff & User Registry...');
    const usersRes = await axios.get(`${BASE_URL}/api/admin/users`, adminHeaders);
    assert(usersRes.status === 200, 'Users list returned HTTP 200');
    assert(Array.isArray(usersRes.data.data), 'Users list is an array');
    console.log(`   Total System Accounts: ${usersRes.data.data.length}`);

    // 7. Test Consolidated Inventory Matrix
    console.log('\n👉 7. Testing Consolidated Multi-Branch Inventory Matrix...');
    const invRes = await axios.get(`${BASE_URL}/api/admin/inventory/consolidated`, adminHeaders);
    assert(invRes.status === 200, 'Consolidated inventory returned HTTP 200');
    assert(Array.isArray(invRes.data.data.medicines), 'Medicines matrix is an array');
    assert(Array.isArray(invRes.data.data.branches), 'Branch columns list is an array');
    console.log(`   Master Catalog Items: ${invRes.data.data.medicines.length}`);

    // 8. Test Master Catalog Medicine Creation
    console.log('\n👉 8. Testing Master Catalog Medicine Creation...');
    const testMedName = `Amoxiclav Test-${Date.now()}`;
    const createMedRes = await axios.post(
      `${BASE_URL}/api/admin/inventory/master`,
      {
        name: testMedName,
        genericName: 'Amoxicillin + Clavulanate',
        composition: '500mg + 125mg',
        manufacturer: 'Cipla Laboratories',
        category: 'Antibiotics',
        hsnCode: '3004',
        unit: 'STRIP',
        gstRate: 12.0,
        minReorderLevel: 15,
        prescriptionRequired: true,
      },
      adminHeaders
    );
    assert(createMedRes.status === 201, 'Master medicine created with HTTP 201');
    assert(createMedRes.data.data.name === testMedName, 'Medicine brand name matches payload');

    // 9. Test Consolidated Sales Invoicing History
    console.log('\n👉 9. Testing Enterprise Consolidated Sales Invoicing...');
    const salesRes = await axios.get(`${BASE_URL}/api/admin/sales/consolidated?limit=10`, adminHeaders);
    assert(salesRes.status === 200, 'Consolidated sales returned HTTP 200');
    assert(Array.isArray(salesRes.data.data.sales), 'Sales records array present');
    console.log(`   Total Invoices Recorded: ${salesRes.data.data.total}`);

    // 10. Test Global Expiry Overview & At-Risk Capital
    console.log('\n👉 10. Testing Global Expiry & Risk Capital Surveillance...');
    const expiryRes = await axios.get(`${BASE_URL}/api/admin/expiry/overview?days=180`, adminHeaders);
    assert(expiryRes.status === 200, 'Expiry surveillance returned HTTP 200');
    assert(typeof expiryRes.data.data.totalAtRiskValuation === 'number', 'Total at-risk valuation computed');
    console.log(`   At-Risk Batches: ${expiryRes.data.data.count} | Capital: ₹${expiryRes.data.data.totalAtRiskValuation}`);

    // 11. Test Immutable Audit Logs
    console.log('\n👉 11. Testing Compliance & Immutable System Audit Trail...');
    const auditRes = await axios.get(`${BASE_URL}/api/admin/audit-logs?limit=10`, adminHeaders);
    assert(auditRes.status === 200, 'Audit logs fetch returned HTTP 200');
    assert(Array.isArray(auditRes.data.data.logs), 'Audit logs array present');
    console.log(`   Total System Audit Events: ${auditRes.data.data.total}`);

    console.log('\n===============================================================');
    console.log('🎉 ALL PHASE 6 SUPER ADMIN PANEL & MULTI-BRANCH TESTS PASSED!');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPhase6Tests();
