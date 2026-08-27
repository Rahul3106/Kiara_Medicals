import http from 'http';

const BASE_URL = 'http://localhost:5000';

const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 2 MULTI-BRANCH & AUTH VERIFICATION');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  // Test 1: Super Admin Login
  console.log('\n🔹 Test 1: Super Admin Login');
  const adminLoginRes = await makeRequest('POST', '/api/auth/admin-login', {
    email: 'admin@kiaramedicals.com',
    password: 'admin123',
  });

  if (adminLoginRes.status === 200 && adminLoginRes.data.data?.user?.role === 'SUPER_ADMIN') {
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

  // Verify no Shop B batches exist in Shop A inventory
  const hasNoShopB = shopABatchNumbers.length > 0 && !shopABatchNumbers.some((b) => b.includes('-B'));
  if (hasNoShopB) {
    console.log('   ✅ Multi-tenant isolation verified: Shop A user only receives Shop A inventory.');
    passed++;
  } else {
    console.error('   ❌ Data leak detected! Shop A received Shop B batches:', shopABatchNumbers);
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

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
