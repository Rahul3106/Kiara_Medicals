import fs from 'fs';
import path from 'path';
import http from 'http';

const BASE_URL = 'http://localhost:5000';

const makeRequest = (method, endpoint, body = null, headers = {}, isBuffer = false) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
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
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (isBuffer) {
          resolve({ status: res.statusCode, data: buffer, headers: res.headers });
        } else {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(buffer.toString()), headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, data: buffer.toString(), headers: res.headers });
          }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runDemo() {
  console.log('======================================================');
  console.log('🧪 KIARA MEDICALS - PHASE 3 FEATURE DEMO');
  console.log('======================================================\n');

  const outDir = path.resolve(process.cwd(), 'phase3_demo_output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  try {
    // 1. Login to get token
    console.log('🔑 Authenticating as Shop A Cashier...');
    const loginRes = await makeRequest('POST', '/api/auth/store-login', {
      email: 'staff.a@kiaramedicals.com',
      password: 'shopA123',
    });
    
    if (loginRes.status !== 200) throw new Error('Login failed. Make sure the server is running (npm run dev)');
    const token = loginRes.data.data.accessToken;
    console.log('✅ Logged in successfully.\n');

    // 2. Test Barcode Generation
    console.log('🔣 Generating 1D Barcode (Batch: BATCH-8899)...');
    const barcodeRes = await makeRequest('POST', '/api/labels/barcode', {
      value: 'BATCH-8899',
      text: 'Paracetamol | BATCH-8899'
    }, { Authorization: `Bearer ${token}` }, true);
    
    const barcodePath = path.join(outDir, 'barcode.png');
    fs.writeFileSync(barcodePath, barcodeRes.data);
    console.log(`✅ Saved to: ${barcodePath}\n`);

    // 3. Test QR Code Generation
    console.log('🔲 Generating QR Code (JSON Data)...');
    const qrRes = await makeRequest('POST', '/api/labels/qrcode', {
      data: { medicine: 'Amoxicillin', batch: 'AMX-2024', exp: '12/2025' }
    }, { Authorization: `Bearer ${token}` }, true);
    
    const qrPath = path.join(outDir, 'qrcode.png');
    fs.writeFileSync(qrPath, qrRes.data);
    console.log(`✅ Saved to: ${qrPath}\n`);

    // 4. Test Composite Medicine Label
    console.log('🏷️ Generating Pharmacy Shelf Label...');
    const labelRes = await makeRequest('POST', '/api/labels/medicine', {
      medicineName: 'Azithromycin 500mg',
      batchNumber: 'AZ-500-X1',
      expiryDate: '10/2026',
      mrp: 125.50,
      rackLocation: 'RACK-B4',
      labelType: 'shelf'
    }, { Authorization: `Bearer ${token}` }, true);
    
    const labelPath = path.join(outDir, 'medicine_label.png');
    fs.writeFileSync(labelPath, labelRes.data);
    console.log(`✅ Saved to: ${labelPath}\n`);

    // 5. Test Thermal Receipt Generation
    console.log('🧾 Fetching a recent sale and generating ESC/POS Thermal Receipt...');
    const salesRes = await makeRequest('GET', '/api/store/sales', null, { Authorization: `Bearer ${token}` });
    const saleId = salesRes.data?.data?.sales?.[0]?.id;

    if (saleId) {
      const receiptRes = await makeRequest('GET', `/api/store/sales/${saleId}/thermal-receipt?width=80`, null, { Authorization: `Bearer ${token}` }, true);
      const receiptPath = path.join(outDir, 'thermal_receipt.bin');
      fs.writeFileSync(receiptPath, receiptRes.data);
      console.log(`✅ Saved raw ESC/POS binary to: ${receiptPath}`);
      console.log(`   (You can send this .bin file directly to a thermal printer via USB/Network)\n`);
    } else {
      console.log('⚠️ No sales found in the database to generate a receipt for.\n');
    }

    console.log('======================================================');
    console.log('🎉 DEMO COMPLETE! Check the "phase3_demo_output" folder.');
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Demo failed:', err.message);
    console.log('Make sure your development server is running in another terminal window!');
  }
}

runDemo();
