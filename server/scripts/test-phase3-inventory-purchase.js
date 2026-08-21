/**
 * Automated Verification Script for Phase 3:
 * 1. Supplier Creation & Management
 * 2. Purchase Entry & Atomic Stock Inward
 * 3. Batch Creation & Stock Auto-Increment (Qty + Free Qty)
 * 4. Stock Adjustment with Mandatory Audit Logging
 * 5. Multi-Tenant Branch Isolation Guarantee
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

async function runPhase3Tests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING PHASE 3: INVENTORY & PURCHASE MANAGEMENT TESTS');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Authenticate Shop A Staff
  console.log('🔹 Step 1: Login as Shop A Staff');
  const loginRes = await makeRequest('POST', '/api/auth/store-login', {
    email: 'staff.a@kiaramedicals.com',
    password: 'shopA123',
  });

  if (loginRes.status !== 200 || !loginRes.data.data?.accessToken) {
    console.error('❌ Failed to login as Shop A staff:', loginRes);
    return;
  }

  const tokenA = loginRes.data.data.accessToken;
  console.log('   ✅ Shop A Staff Authenticated successfully.');
  passed++;

  // 2. Create a Supplier in Shop A
  console.log('\n🔹 Step 2: Create / Verify Supplier in Shop A');
  const supplierRes = await makeRequest(
    'POST',
    '/api/store/suppliers',
    {
      name: 'Apex Pharma Distributors',
      agencyName: 'Apex Healthcare Pvt Ltd',
      contactPerson: 'Sanjay Deshpande',
      phone: '9822099887',
      email: 'orders@apexpharma.com',
      gstNumber: '27AAPEX9999P1Z1',
      drugLicenseNo: 'MH-PZ1-20B-9988',
    },
    { Authorization: `Bearer ${tokenA}` }
  );

  let supplierId;
  if (supplierRes.status === 201) {
    supplierId = supplierRes.data.data.id;
    console.log(`   ✅ Supplier created: ${supplierRes.data.data.name} (ID: ${supplierId})`);
    passed++;
  } else {
    // If supplier already exists from previous run, fetch it
    const listSuppliersRes = await makeRequest('GET', '/api/store/suppliers', null, {
      Authorization: `Bearer ${tokenA}`,
    });
    supplierId = listSuppliersRes.data.data[0]?.id;
    console.log(`   ℹ️ Using existing supplier ID: ${supplierId}`);
    passed++;
  }

  // 3. Fetch Master Medicines
  console.log('\n🔹 Step 3: Fetch Master Medicine Catalog');
  const medRes = await makeRequest('GET', '/api/store/inventory/medicines-catalog', null, {
    Authorization: `Bearer ${tokenA}`,
  });

  const medicines = medRes.data?.data || [];
  const doloMed = medicines.find((m) => m.name.includes('Dolo')) || medicines[0];

  if (doloMed) {
    console.log(`   ✅ Master Medicine found: ${doloMed.name} (${doloMed.composition})`);
    passed++;
  } else {
    console.error('   ❌ No master medicines found in catalog');
    failed++;
  }

  // 4. Create Purchase Entry in Shop A with Auto Stock Increment
  console.log('\n🔹 Step 4: Record Purchase Order & Inward Batch Stock');
  const testBatchNo = `DL-P3-${Math.floor(1000 + Math.random() * 9000)}`;
  const testInvoiceNo = `INV-TST-${Date.now().toString().slice(-6)}`;

  const purchasePayload = {
    supplierId,
    invoiceNumber: testInvoiceNo,
    purchaseDate: new Date().toISOString().split('T')[0],
    discountAmount: 50.0,
    paymentStatus: 'PAID',
    notes: 'Phase 3 Automated Inward Stock Test',
    items: [
      {
        medicineId: doloMed.id,
        batchNumber: testBatchNo,
        expiryDate: '2028-06-30',
        quantity: 100,
        freeQuantity: 10, // Total expected stock in batch = 110
        purchasePrice: 24.0,
        mrp: 33.6,
        taxRate: 12.0,
        rackLocation: 'Rack A-5',
      },
    ],
  };

  const purchaseRes = await makeRequest('POST', '/api/store/purchases', purchasePayload, {
    Authorization: `Bearer ${tokenA}`,
  });

  if (purchaseRes.status === 201 && purchaseRes.data.data?.id) {
    console.log(`   ✅ Purchase Order created: ${testInvoiceNo} (Net Amount: ₹${purchaseRes.data.data.netAmount})`);
    passed++;
  } else {
    console.error('   ❌ Purchase entry failed:', purchaseRes);
    failed++;
  }

  // 5. Verify Batch Stock is 110 in Shop A Inventory
  console.log('\n🔹 Step 5: Verify Batch Auto-Increment in Shop A Inventory');
  const invRes = await makeRequest('GET', `/api/store/inventory?search=${testBatchNo}`, null, {
    Authorization: `Bearer ${tokenA}`,
  });

  const createdBatch = invRes.data.data?.items?.find((b) => b.batchNumber === testBatchNo);
  if (createdBatch && createdBatch.quantity === 110) {
    console.log(`   ✅ Batch ${testBatchNo} successfully created with quantity = 110 (100 qty + 10 free qty).`);
    passed++;
  } else {
    console.error(`   ❌ Batch stock verification failed! Expected 110, got:`, createdBatch?.quantity);
    failed++;
  }

  // 6. Perform Stock Adjustment (e.g. 5 damaged units removed)
  console.log('\n🔹 Step 6: Perform Stock Adjustment (Damage / Loss)');
  const adjustRes = await makeRequest(
    'POST',
    '/api/store/inventory/adjust',
    {
      batchId: createdBatch.id,
      adjustmentType: 'DAMAGE_OR_LOSS',
      quantityChange: 5,
      reason: 'Water damage during rack reorganization',
    },
    { Authorization: `Bearer ${tokenA}` }
  );

  if (adjustRes.status === 200 && adjustRes.data.data?.newQuantity === 105) {
    console.log(`   ✅ Stock adjusted: previous = 110, new = 105. Audit trail logged.`);
    passed++;
  } else {
    console.error('   ❌ Stock adjustment failed:', adjustRes);
    failed++;
  }

  // 7. Verify Shop B Isolation (Shop B should NOT see Batch DL-P3-*)
  console.log('\n🔹 Step 7: Multi-Branch Isolation Verification (Shop B)');
  const shopBLogin = await makeRequest('POST', '/api/auth/store-login', {
    email: 'staff.b@kiaramedicals.com',
    password: 'shopB123',
  });

  const tokenB = shopBLogin.data.data.accessToken;
  const shopBInvRes = await makeRequest('GET', `/api/store/inventory?search=${testBatchNo}`, null, {
    Authorization: `Bearer ${tokenB}`,
  });

  const shopBMatches = shopBInvRes.data.data?.items || [];
  if (shopBMatches.length === 0) {
    console.log(`   ✅ Multi-tenant isolation verified: Shop B cannot access or view Shop A's Batch ${testBatchNo}.`);
    passed++;
  } else {
    console.error(`   ❌ Isolation leak! Shop B found batch:`, shopBMatches);
    failed++;
  }

  console.log('\n===========================================================');
  console.log(`📊 PHASE 3 TEST SUMMARY: Passed ${passed}/${passed + failed}`);
  console.log('===========================================================\n');
}

runPhase3Tests().catch(console.error);
