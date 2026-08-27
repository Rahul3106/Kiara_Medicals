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

async function runPhase5Tests() {
  console.log('\n===============================================================');
  console.log('🚀 KIARA MEDICALS — PHASE 5 REPORTS & ANALYTICS TEST SUITE');
  console.log('===============================================================\n');

  try {
    // 1. Authenticate as Shop A Staff
    console.log('👉 1. Authenticating as Shop A Staff (staff.a@kiaramedicals.com)...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/store-login`, {
      email: 'staff.a@kiaramedicals.com',
      password: 'shopA123',
    });

    assert(loginRes.status === 200, 'Staff A login returned HTTP 200');
    assert(loginRes.data.success === true, 'Staff A login success flag is true');
    const tokenA = loginRes.data.data.accessToken;
    const branchCodeA = loginRes.data.data.user.branch.code;
    assert(branchCodeA === 'BR-A', 'Staff A attached to Branch BR-A');

    const authHeadersA = {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'x-branch-id': loginRes.data.data.user.branchId,
      },
    };

    // 2. Test Store Reports Overview
    console.log('\n👉 2. Querying Store Reports Overview (Last 14 Days)...');
    const overviewRes = await axios.get(`${BASE_URL}/api/store/reports/overview?days=14`, authHeadersA);
    assert(overviewRes.status === 200, 'Overview reports fetch returned HTTP 200');
    assert(overviewRes.data.success === true, 'Overview reports success flag is true');

    const data = overviewRes.data.data;
    assert(typeof data.today.revenue === 'number', "data.today.revenue is a number");
    assert(Array.isArray(data.dailyTrend), "data.dailyTrend is an array");
    assert(data.dailyTrend.length === 14, "data.dailyTrend contains 14 day records");
    assert(Array.isArray(data.paymentBreakup), "data.paymentBreakup is an array");
    assert(Array.isArray(data.fastMovingMedicines), "data.fastMovingMedicines is an array");
    console.log(`   Valuation (MRP): ₹${data.stockHealth.valuationMRP || data.stockHealth.valuation}`);
    console.log(`   Total Batches: ${data.stockHealth.totalBatches} | Units: ${data.stockHealth.totalUnits}`);

    // 3. Test GSTR-1 Slab-Wise GST Summary Report
    console.log('\n👉 3. Testing Slab-Wise GSTR-1 Tax Filing Summary...');
    const gstRes = await axios.get(`${BASE_URL}/api/store/reports/gst-summary`, authHeadersA);
    assert(gstRes.status === 200, 'GST summary fetch returned HTTP 200');
    assert(gstRes.data.success === true, 'GST summary success flag is true');

    const gstData = gstRes.data.data;
    assert(Array.isArray(gstData.slabs), 'gstData.slabs is an array of tax slabs');
    assert(gstData.slabs.length >= 5, 'Contains all major GST slabs (0%, 5%, 12%, 18%, 28%)');
    console.log(`   Total Taxable Value: ₹${gstData.totalTaxable} | Total Tax: ₹${gstData.totalTax}`);

    // 4. Test Stock Movement & Dead Stock Identification
    console.log('\n👉 4. Testing Stock Movement & Dead Stock Analyzer...');
    const stockMoveRes = await axios.get(`${BASE_URL}/api/store/reports/stock-movement`, authHeadersA);
    assert(stockMoveRes.status === 200, 'Stock movement fetch returned HTTP 200');
    assert(stockMoveRes.data.success === true, 'Stock movement success flag is true');

    const moveData = stockMoveRes.data.data;
    assert(typeof moveData.summary.totalActiveBatches === 'number', 'Summary contains totalActiveBatches');
    assert(typeof moveData.summary.deadStockValuation === 'number', 'Summary contains deadStockValuation');
    console.log(`   Fast Moving: ${moveData.summary.fastMovingCount} | Dead Stock: ${moveData.summary.deadStockCount}`);
    console.log(`   Dead Stock Locked Capital: ₹${moveData.summary.deadStockValuation}`);

    // 5. Test Multi-Branch Isolation on Reports
    console.log('\n👉 5. Testing Multi-Branch Isolation for Reports (Shop B)...');
    const loginB = await axios.post(`${BASE_URL}/api/auth/store-login`, {
      email: 'staff.b@kiaramedicals.com',
      password: 'shopB123',
    });
    const authHeadersB = {
      headers: {
        Authorization: `Bearer ${loginB.data.data.accessToken}`,
        'x-branch-id': loginB.data.data.user.branchId,
      },
    };

    const overviewB = await axios.get(`${BASE_URL}/api/store/reports/overview?days=14`, authHeadersB);
    assert(overviewB.status === 200, 'Shop B reports fetch returned HTTP 200');
    assert(overviewB.data.branchId === loginB.data.data.user.branchId, 'Shop B reports scoped to Shop B branchId');

    console.log('\n===============================================================');
    console.log('🎉 ALL PHASE 5 REPORTS & ANALYTICS TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPhase5Tests();
