/**
 * Automated Verification Script for Phase 2:
 * 1. Admin Authentication & Consolidated Analytics
 * 2. Role-Based Access Control (403 Forbidden for staff accessing admin routes)
 * 3. Store Login with Automatic Branch Scoping
 * 4. Multi-Tenant Branch Isolation at Database/API Layer (Shop A vs Shop B data segregation)
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 2 MULTI-BRANCH & AUTH VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Admin Login
  console.log('🔹 Test 1: Super Admin Login');
  const adminLoginRes = await makeRequest('POST', '/api/auth/admin-login', {
    email: 'admin@kiaramedicals.com',
    password: 'admin123',
  });

  if (adminLoginRes.status === 200 && adminLoginRes.data.data?.accessToken) {
    console.log('   ✅ Super Admin authenticated successfully.');
    passed++;
  } else {
    console.error('   ❌ Admin login failed:', adminLoginRes);
    failed++;
  }

  const adminToken = adminLoginRes.data.data?.accessToken;

  // Test 2: Admin Access Consolidated Summary
  console.log('\n🔹 Test 2: Admin Accessing Consolidated Dashboard');
  const summaryRes = await makeRequest('GET', '/api/admin/dashboard/summary', null, {
    Authorization: `Bearer ${adminToken}`,
  });

  if (summaryRes.status === 200 && summaryRes.data.data?.totalBranches >= 3) {
    console.log(`   ✅ Consolidated metrics loaded. Total branches: ${summaryRes.data.data.totalBranches}`);
    passed++;
  } else {
    console.error('   ❌ Admin dashboard summary failed:', summaryRes);
    failed++;
  }

  // Test 3: Shop A Staff Login
  console.log('\n🔹 Test 3: Shop A Staff Login');
  const shopALoginRes = await makeRequest('POST', '/api/auth/store-login', {
    email: 'staff.a@kiaramedicals.com',
    password: 'shopA123',
  });

  if (shopALoginRes.status === 200 && shopALoginRes.data.data?.user?.branch?.code === 'BR-A') {
    console.log(`   ✅ Shop A staff logged in. Scoped Branch: ${shopALoginRes.data.data.user.branch.name}`);
    passed++;
  } else {
    console.error('   ❌ Shop A staff login failed:', shopALoginRes);
    failed++;
  }

  const shopAToken = shopALoginRes.data.data?.accessToken;

  // Test 4: Shop A RBAC Protection (Staff attempting to access Admin API)
  console.log('\n🔹 Test 4: RBAC Protection - Shop A Staff attempting Admin API access');
  const rbacRes = await makeRequest('GET', '/api/admin/branches', null, {
    Authorization: `Bearer ${shopAToken}`,
  });

  if (rbacRes.status === 403) {
    console.log('   ✅ Protected! Non-admin access correctly denied with HTTP 403 Forbidden.');
    passed++;
  } else {
    console.error('   ❌ RBAC failed. Expected 403, got:', rbacRes.status);
    failed++;
  }

  // Test 5: Shop A Inventory Scoping Isolation
  console.log('\n🔹 Test 5: Database Isolation - Query Shop A Inventory');
  const shopAInvRes = await makeRequest('GET', '/api/store/inventory', null, {
    Authorization: `Bearer ${shopAToken}`,
  });

  const shopAItems = shopAInvRes.data.data?.items || [];
  const shopABatchNumbers = shopAItems.map((b) => b.batchNumber);
  console.log(`   📦 Shop A Batches Found: [${shopABatchNumbers.join(', ')}]`);

  // Verify only Shop A batches (starting with DL-A, AG-A, PN-A) exist and no Shop B batches
  const hasOnlyShopA = shopABatchNumbers.length > 0 && shopABatchNumbers.every((b) => b.includes('-A'));
  if (hasOnlyShopA) {
    console.log('   ✅ Multi-tenant isolation verified: Shop A user only receives Shop A inventory.');
    passed++;
  } else {
    console.error('   ❌ Data leak detected! Shop A received non-Shop-A batches:', shopABatchNumbers);
    failed++;
  }

  // Test 6: Shop B Staff Login & Isolation
  console.log('\n🔹 Test 6: Shop B Staff Login & Inventory Isolation');
  const shopBLoginRes = await makeRequest('POST', '/api/auth/store-login', {
    email: 'staff.b@kiaramedicals.com',
    password: 'shopB123',
  });

  const shopBToken = shopBLoginRes.data.data?.accessToken;
  const shopBInvRes = await makeRequest('GET', '/api/store/inventory', null, {
    Authorization: `Bearer ${shopBToken}`,
  });

  const shopBItems = shopBInvRes.data.data?.items || [];
  const shopBBatchNumbers = shopBItems.map((b) => b.batchNumber);
  console.log(`   📦 Shop B Batches Found: [${shopBBatchNumbers.join(', ')}]`);

  const hasOnlyShopB = shopBBatchNumbers.length > 0 && shopBBatchNumbers.every((b) => b.includes('-B'));
  if (hasOnlyShopB) {
    console.log('   ✅ Multi-tenant isolation verified: Shop B user only receives Shop B inventory.');
    passed++;
  } else {
    console.error('   ❌ Data leak detected! Shop B received non-Shop-B batches:', shopBBatchNumbers);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: Passed ${passed}/${passed + failed}`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
