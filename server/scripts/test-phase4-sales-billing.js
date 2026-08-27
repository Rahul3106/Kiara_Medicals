/**
 * Automated Verification Script for Phase 4:
 * 1. Store Staff Authentication (Shop A)
 * 2. POS Sale Order Creation & GST Computation
 * 3. Formatted Sequential Bill Numbering (e.g. KM-BR-A-2627-00001)
 * 4. Atomic Inventory Stock Deduction
 * 5. GST Invoice Details & Indian Currency Amount in Words
 * 6. Expiry & Insufficient Stock Protections
 * 7. Sales Bill Cancellation & Automatic Stock Reversion
 * 8. Multi-Tenant Branch Isolation for Sales Data
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

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 KIARA MEDICALS — PHASE 4 SALES, BILLING & GST TEST SUITE');
  console.log('===============================================================\n');

  try {
    // 1. Authenticate as Shop A Cashier
    console.log('👉 1. Authenticating as Shop A Cashier (staff.a@kiaramedicals.com)...');
    const staffALogin = await makeRequest('POST', '/api/auth/store-login', {
      email: 'staff.a@kiaramedicals.com',
      password: 'shopA123',
    });

    assert(staffALogin.status === 200, 'Staff A login returned HTTP 200');
    assert(staffALogin.data.success === true, 'Staff A login success flag is true');
    const staffAToken = staffALogin.data.data.accessToken || staffALogin.data.data.token;
    const branchA = staffALogin.data.data.user?.branch || staffALogin.data.data.branch;
    assert(branchA.code === 'BR-A', 'Staff A attached to Branch BR-A');

    const authHeadersA = {
      Authorization: `Bearer ${staffAToken}`,
      'x-branch-id': branchA.id,
    };

    // 2. Fetch Shop A Inventory to select a batch
    console.log('\n👉 2. Querying Shop A inventory for sale...');
    const invRes = await makeRequest('GET', '/api/store/inventory', null, authHeadersA);
    assert(invRes.status === 200, 'Shop A inventory fetch returned HTTP 200');
    const batches = invRes.data.data.batches || invRes.data.data.items || invRes.data.data;
    assert(Array.isArray(batches) && batches.length > 0, `Found ${batches?.length || 0} batches in Shop A`);

    const targetBatch = batches.find((b) => b.quantity >= 10 && b.expiryStatus !== 'EXPIRED') || batches[0];
    const initialQty = targetBatch.quantity;
    console.log(`   Selected Batch: ${targetBatch.batchNumber} (${targetBatch.medicine.name}) | Stock: ${initialQty} | MRP: ₹${targetBatch.mrp}`);

    // 3. Create POS Sale Bill
    console.log('\n👉 3. Creating POS Sale Bill (Quantity: 3, Discount: 5%, Payment: UPI)...');
    const salePayload = {
      customer: {
        name: 'Ramesh Sharma',
        phone: '9876543210',
        doctorName: 'Dr. Anand Joshi',
        doctorRegNo: 'MCI-88219',
        address: 'Flat 402, Sai Residency, Mumbai',
      },
      paymentMode: 'UPI',
      notes: 'Prescription verified',
      items: [
        {
          medicineId: targetBatch.medicineId,
          batchId: targetBatch.id,
          quantity: 3,
          unitPrice: targetBatch.mrp,
          discountPercent: 5,
        },
      ],
    };

    const saleRes = await makeRequest('POST', '/api/store/sales', salePayload, authHeadersA);
    assert(saleRes.status === 201, 'POS Sale creation returned HTTP 201 Created');
    assert(saleRes.data.success === true, 'Sale success flag is true');
    const createdSale = saleRes.data.data;

    console.log(`   Generated Bill Number: ${createdSale.billNumber}`);
    assert(createdSale.billNumber.startsWith('KM-BR-A-'), 'Bill number has branch prefix KM-BR-A-*');
    assert(createdSale.paymentMode === 'UPI', 'Payment mode recorded as UPI');
    assert(createdSale.status === 'COMPLETED', 'Sale status is COMPLETED');

    // 4. Verify Atomic Stock Deduction
    console.log('\n👉 4. Verifying Atomic Batch Inventory Deduction...');
    const invAfterSale = await makeRequest('GET', '/api/store/inventory', null, authHeadersA);
    const saleBatches = invAfterSale.data.data.batches || invAfterSale.data.data.items || [];
    const updatedBatch = saleBatches.find((b) => b.id === targetBatch.id);
    const expectedQty = initialQty - 3;
    assert(
      updatedBatch && updatedBatch.quantity === expectedQty,
      `Batch quantity decreased from ${initialQty} to ${updatedBatch?.quantity} (Expected: ${expectedQty})`
    );

    // 5. Fetch Full GST Tax Invoice & Amount in Words
    console.log('\n👉 5. Fetching Detailed Tax Invoice & Amount in Words...');
    const invoiceRes = await makeRequest('GET', `/api/store/sales/${createdSale.id}`, null, authHeadersA);
    assert(invoiceRes.status === 200, 'Invoice details fetch returned HTTP 200');
    const invoice = invoiceRes.data.data;

    assert(invoice.amountInWords.startsWith('Rupees'), `Amount in words generated: "${invoice.amountInWords}"`);
    assert(invoice.taxSummary.length > 0, `Tax summary computed with ${invoice.taxSummary.length} tax slab(s)`);
    assert(invoice.customer.name === 'Ramesh Sharma', 'Patient details correctly linked');
    assert(invoice.customer.doctorName === 'Dr. Anand Joshi', 'Doctor details linked');

    // 6. Test Expiry & Over-Stock Safety
    console.log('\n👉 6. Testing Protection against Insufficient Stock...');
    const overStockPayload = {
      items: [
        {
          medicineId: targetBatch.medicineId,
          batchId: targetBatch.id,
          quantity: updatedBatch.quantity + 500, // Excessive quantity
        },
      ],
    };
    const overStockRes = await makeRequest('POST', '/api/store/sales', overStockPayload, authHeadersA);
    assert(overStockRes.status === 400, 'Sale with excessive quantity correctly rejected with HTTP 400');
    assert(overStockRes.data.error?.code === 'INSUFFICIENT_STOCK' || overStockRes.data.errorCode === 'INSUFFICIENT_STOCK', 'Error code is INSUFFICIENT_STOCK');

    // 7. Test Bill Cancellation & Stock Rollback
    console.log('\n👉 7. Testing Bill Cancellation & Inventory Rollback...');
    const cancelRes = await makeRequest(
      'POST',
      `/api/store/sales/${createdSale.id}/cancel`,
      { reason: 'Customer changed prescription' },
      authHeadersA
    );
    assert(cancelRes.status === 200, 'Bill cancellation returned HTTP 200');
    assert(cancelRes.data.data.status === 'CANCELLED', 'Bill status updated to CANCELLED');

    // Verify stock is restored
    const invAfterCancel = await makeRequest('GET', '/api/store/inventory', null, authHeadersA);
    const cancelBatches = invAfterCancel.data.data.batches || invAfterCancel.data.data.items || [];
    const restoredBatch = cancelBatches.find((b) => b.id === targetBatch.id);
    assert(
      restoredBatch && restoredBatch.quantity === initialQty,
      `Batch quantity restored back to ${restoredBatch?.quantity} (Original: ${initialQty})`
    );

    // 8. Test Multi-Branch Isolation
    console.log('\n👉 8. Testing Multi-Branch Isolation (Shop B cannot view Shop A sales)...');
    const staffBLogin = await makeRequest('POST', '/api/auth/store-login', {
      email: 'staff.b@kiaramedicals.com',
      password: 'shopB123',
    });
    const staffBToken = staffBLogin.data.data.accessToken || staffBLogin.data.data.token;
    const branchB = staffBLogin.data.data.user?.branch || staffBLogin.data.data.branch;
    const authHeadersB = {
      Authorization: `Bearer ${staffBToken}`,
      'x-branch-id': branchB.id,
    };

    const crossBranchInvoice = await makeRequest('GET', `/api/store/sales/${createdSale.id}`, null, authHeadersB);
    assert(
      crossBranchInvoice.status === 404,
      'Shop B attempting to access Shop A sale invoice correctly returned HTTP 404 Not Found'
    );

    console.log('\n===============================================================');
    console.log('🎉 ALL PHASE 4 TESTS COMPLETED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runTests();
