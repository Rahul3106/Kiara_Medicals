import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateBillNumber(branchCode, index) {
  return `KM-${branchCode}-2627-${String(index).padStart(5, '0')}`;
}

function generateInvoiceNumber() {
  return `INV-${Math.floor(Math.random() * 90000) + 10000}`;
}

function generateBatchNumber(medicinePrefix) {
  return `${medicinePrefix}-${Math.floor(Math.random() * 9000) + 1000}`;
}

async function main() {
  console.log('🌱 Starting Advanced Kiara Medicals database seed...');

  // 0. Clear Existing Data
  console.log('Cleaning up existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 1. Create Branches
  console.log('Creating Branches...');
  const branchesData = [
    { code: 'BR-A', name: 'Kiara Medicals — Mansarovar Branch', address: 'Shop 4, Mansarovar Plaza', city: 'Jaipur', state: 'Rajasthan', pincode: '302020', phone: '+91 98290 11111', gstNumber: '08AABCK1234A1Z5', drugLicenseNo: 'RJ-JP-20B-100234', email: 'mansarovar@kiaramedicals.com' },
    { code: 'BR-B', name: 'Kiara Medicals — Sardarpura Branch', address: 'Ground Floor, C Road, Sardarpura', city: 'Jodhpur', state: 'Rajasthan', pincode: '342003', phone: '+91 98290 22222', gstNumber: '08AABCK1234B1Z6', drugLicenseNo: 'RJ-JD-20B-200345', email: 'sardarpura@kiaramedicals.com' },
    { code: 'BR-C', name: 'Kiara Medicals — Fatehpura', address: 'Unit 12, Fatehpura Circle', city: 'Udaipur', state: 'Rajasthan', pincode: '313001', phone: '+91 98290 33333', gstNumber: '08AABCK1234C1Z7', drugLicenseNo: 'RJ-UD-20B-300456', email: 'fatehpura@kiaramedicals.com' }
  ];

  const branches = [];
  for (const b of branchesData) {
    branches.push(await prisma.branch.create({ data: b }));
  }

  // 2. Create Users
  console.log('Creating Admin & Branch Staff users...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const shopAPasswordHash = await bcrypt.hash('shopA123', 10);
  const shopBPasswordHash = await bcrypt.hash('shopB123', 10);
  const shopCPasswordHash = await bcrypt.hash('shopC123', 10);

  const superAdmin = await prisma.user.create({
    data: { name: 'Dr. Kiara Rathore (Super Admin)', email: 'admin@kiaramedicals.com', passwordHash, role: 'SUPER_ADMIN', phone: '+91 98290 00000' }
  });

  const staffData = {
    'BR-A': { manager: 'Vikram Shekhawat', cashier: 'Neha Jain' },
    'BR-B': { manager: 'Rajendra Singh', cashier: 'Pooja Bishnoi' },
    'BR-C': { manager: 'Amit Meena', cashier: 'Sneha Sharma' }
  };

  const staff = {};
  for (const branch of branches) {
    const pw = branch.code === 'BR-A' ? shopAPasswordHash : branch.code === 'BR-B' ? shopBPasswordHash : shopCPasswordHash;
    const sfx = branch.code.split('-')[1].toLowerCase();
    const branchStaff = staffData[branch.code];
    
    await prisma.user.create({
      data: { name: branchStaff.manager, email: `manager.${sfx}@kiaramedicals.com`, passwordHash: pw, role: 'BRANCH_MANAGER', branchId: branch.id, phone: `+91 98230 00${sfx}` }
    });
    
    staff[branch.code] = await prisma.user.create({
      data: { name: branchStaff.cashier, email: `staff.${sfx}@kiaramedicals.com`, passwordHash: pw, role: 'STAFF', branchId: branch.id, phone: `+91 98230 11${sfx}` }
    });
  }

  // 3. Create Suppliers
  console.log('Creating Suppliers...');
  const suppliers = [
    { name: 'Marwar Distributors', agencyName: 'Marwar Pharma Corp', phone: '9000000001', gstNumber: '08AABCA0001A1Z1' },
    { name: 'Jaipur MedPlus Wholesale', agencyName: 'MedPlus Raj', phone: '9000000002', gstNumber: '08AABCA0002A1Z2' },
    { name: 'Mewar PharmaLink Traders', agencyName: 'Mewar PharmaLink', phone: '9000000003', gstNumber: '08AABCA0003A1Z3' }
  ];

  const dbSuppliers = [];
  for (const s of suppliers) {
    dbSuppliers.push(await prisma.supplier.create({ data: s }));
  }

  // 4. Create Medicines
  console.log('Creating Medicines...');
  const medicineData = [
    { name: 'Dolo 650', genericName: 'Paracetamol', composition: 'Paracetamol 650mg', category: 'Analgesics', minReorderLevel: 50, mrpBase: 30, purchaseBase: 20 },
    { name: 'Augmentin 625 Duo', genericName: 'Amoxicillin + Clavulanic Acid', composition: 'Amoxicillin 500mg', category: 'Antibiotics', minReorderLevel: 20, mrpBase: 200, purchaseBase: 140 },
    { name: 'Pan 40', genericName: 'Pantoprazole', composition: 'Pantoprazole 40mg', category: 'Antacids', minReorderLevel: 40, mrpBase: 145, purchaseBase: 85 },
    { name: 'Cetzip 10', genericName: 'Cetirizine', composition: 'Cetirizine 10mg', category: 'Antihistamines', minReorderLevel: 30, mrpBase: 28, purchaseBase: 15 },
    { name: 'Shelcal 500', genericName: 'Calcium + Vitamin D3', composition: 'Calcium 500mg', category: 'Supplements', minReorderLevel: 20, mrpBase: 110, purchaseBase: 70 },
    { name: 'Glycomet 500', genericName: 'Metformin', composition: 'Metformin 500mg', category: 'Anti-Diabetic', minReorderLevel: 30, mrpBase: 45, purchaseBase: 30 },
    { name: 'Telma 40', genericName: 'Telmisartan', composition: 'Telmisartan 40mg', category: 'Anti-Hypertensive', minReorderLevel: 25, mrpBase: 115, purchaseBase: 80 },
    { name: 'Ecosprin 75', genericName: 'Aspirin', composition: 'Aspirin 75mg', category: 'Blood Thinners', minReorderLevel: 50, mrpBase: 15, purchaseBase: 8 },
    { name: 'Thyronorm 50', genericName: 'Thyroxine', composition: 'Thyroxine 50mcg', category: 'Hormones', minReorderLevel: 15, mrpBase: 160, purchaseBase: 110 },
    { name: 'Allegra 120', genericName: 'Fexofenadine', composition: 'Fexofenadine 120mg', category: 'Antihistamines', minReorderLevel: 20, mrpBase: 180, purchaseBase: 120 },
    { name: 'Corex DX', genericName: 'Chlorpheniramine + Dextromethorphan', composition: 'Syrup 100ml', category: 'Cough Syrups', minReorderLevel: 15, mrpBase: 120, purchaseBase: 80, unit: 'BOTTLE' },
    { name: 'Betadine 5%', genericName: 'Povidone Iodine', composition: 'Ointment 15g', category: 'Antiseptics', minReorderLevel: 10, mrpBase: 90, purchaseBase: 60, unit: 'TUBE' },
    { name: 'Azithral 500', genericName: 'Azithromycin', composition: 'Azithromycin 500mg', category: 'Antibiotics', minReorderLevel: 20, mrpBase: 120, purchaseBase: 80 },
    { name: 'Neurobion Forte', genericName: 'Vitamin B Complex', composition: 'Multivitamins', category: 'Supplements', minReorderLevel: 40, mrpBase: 35, purchaseBase: 22 },
    { name: 'Liv 52', genericName: 'Ayurvedic Liver Tonic', composition: 'Syrup 200ml', category: 'Ayurvedic', minReorderLevel: 15, mrpBase: 140, purchaseBase: 90, unit: 'BOTTLE' }
  ];

  const medicines = [];
  for (const m of medicineData) {
    medicines.push(await prisma.medicine.create({
      data: {
        name: m.name,
        genericName: m.genericName,
        composition: m.composition,
        manufacturer: 'Various',
        category: m.category,
        hsnCode: '3004',
        unit: m.unit || 'STRIP',
        gstRate: 12.0,
        minReorderLevel: m.minReorderLevel,
      }
    }));
  }

  // 5. Create Customers
  console.log('Creating Customers...');
  
  const customerNames = [
    'Rahul Rathore', 'Priya Sharma', 'Aditya Jain', 'Sneha Bishnoi', 'Amit Meena',
    'Rohan Shekhawat', 'Pooja Choudhary', 'Anil Singh', 'Kavita Rajpurohit', 'Manoj Agarwal',
    'Sunita Maheshwari', 'Vikas Gehlot', 'Nisha Bhati', 'Suresh Gurjar', 'Geeta Kumawat'
  ];
  const doctorNames = [
    'Dr. Suresh Jain (MBBS, MD)', 'Dr. Anita Sharma (Pediatrician)', 'Dr. Ramesh Rathore (Orthopedic)',
    'Dr. Megha Singh (Gynecologist)', 'Dr. Anil Agarwal (General Physician)', 'Dr. Sunita Choudhary (Dermatologist)'
  ];

  let nameIndex = 0;
  const customers = {};
  for (const branch of branches) {
    customers[branch.id] = [];
    for (let i = 1; i <= 5; i++) {
      const cName = customerNames[nameIndex % customerNames.length];
      const dName = doctorNames[Math.floor(Math.random() * doctorNames.length)];
      
      customers[branch.id].push(await prisma.customer.create({
        data: {
          branchId: branch.id,
          name: cName,
          phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          doctorName: dName
        }
      }));
      nameIndex++;
    }
  }

  // 6. Inventories & Purchases
  console.log('Creating Batches and Purchases (Historical)...');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (const branch of branches) {
    let billIndex = 1;
    let purchaseIndex = 1;

    for (let p = 0; p < 5; p++) {
      const supplier = dbSuppliers[p % dbSuppliers.length];
      const purchaseDate = randomDate(thirtyDaysAgo, now);
      
      const purchaseItems = [];
      let subTotal = 0;
      let taxAmount = 0;

      // Select 5 random medicines for this purchase
      const selectedMeds = [...medicines].sort(() => 0.5 - Math.random()).slice(0, 5);

      for (const med of selectedMeds) {
        const base = medicineData.find(md => md.name === med.name);
        const qty = Math.floor(Math.random() * 50) + 20; // 20 to 70 units
        
        // Random expiry between 1 month and 2 years from now
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + Math.floor(Math.random() * 700) + 30);
        
        const b = await prisma.batch.create({
          data: {
            medicineId: med.id,
            branchId: branch.id,
            batchNumber: generateBatchNumber(med.name.substring(0, 3).toUpperCase()),
            expiryDate: expDate,
            purchasePrice: base.purchaseBase,
            mrp: base.mrpBase,
            sellingPrice: base.mrpBase,
            quantity: qty,
            rackLocation: `Rack ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 10)}`
          }
        });

        const itemTotal = qty * base.purchaseBase;
        const itemTax = itemTotal * 0.12;
        
        purchaseItems.push({
          medicineId: med.id,
          batchId: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          quantity: qty,
          purchasePrice: base.purchaseBase,
          mrp: base.mrpBase,
          taxRate: 12.0,
          taxAmount: itemTax,
          totalAmount: itemTotal + itemTax
        });

        subTotal += itemTotal;
        taxAmount += itemTax;
      }

      await prisma.purchase.create({
        data: {
          branchId: branch.id,
          supplierId: supplier.id,
          createdById: superAdmin.id,
          invoiceNumber: generateInvoiceNumber(),
          purchaseDate: purchaseDate,
          subTotal,
          taxAmount,
          netAmount: subTotal + taxAmount,
          paymentStatus: 'PAID',
          items: {
            create: purchaseItems
          }
        }
      });
    }

    // 7. Sales Transactions
    console.log(`Creating Sales for ${branch.code}...`);
    const allBranchBatches = await prisma.batch.findMany({ where: { branchId: branch.id } });
    
    // Sort chronologically so older sales get older dates
    const salesDates = Array.from({length: 25}, () => randomDate(thirtyDaysAgo, now)).sort((a,b) => a - b);

    for (let s = 0; s < 25; s++) {
      const saleDate = salesDates[s];
      const customer = customers[branch.id][s % customers[branch.id].length];
      
      const saleItems = [];
      let saleSubTotal = 0;
      let totalTaxAmount = 0;

      // Sell 1-3 random items
      const itemsToSell = Math.floor(Math.random() * 3) + 1;
      const selectedBatches = [...allBranchBatches].sort(() => 0.5 - Math.random()).slice(0, itemsToSell);

      for (const batch of selectedBatches) {
        if (batch.quantity < 2) continue; // Skip empty batches
        
        const qty = Math.floor(Math.random() * Math.min(5, batch.quantity)) + 1;
        
        // Deduct from batch
        await prisma.batch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - qty }
        });
        batch.quantity -= qty; // local update

        const unitPrice = parseFloat(batch.sellingPrice);
        const netAmtBeforeTax = unitPrice * qty;
        
        // Approx tax calculation for demo (backward calculation)
        const taxRate = 12.0;
        const taxFraction = taxRate / (100 + taxRate);
        const itemTax = netAmtBeforeTax * taxFraction;
        const cgstAmount = itemTax / 2;
        const sgstAmount = itemTax / 2;

        saleItems.push({
          medicineId: batch.medicineId,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: qty,
          unitPrice: unitPrice,
          mrp: batch.mrp,
          taxRate,
          cgstAmount,
          sgstAmount,
          netAmount: netAmtBeforeTax
        });

        saleSubTotal += (netAmtBeforeTax - itemTax);
        totalTaxAmount += itemTax;
      }

      if (saleItems.length > 0) {
        const grandTotal = saleSubTotal + totalTaxAmount;
        
        await prisma.sale.create({
          data: {
            branchId: branch.id,
            customerId: customer.id,
            billedById: staff[branch.code].id,
            billNumber: generateBillNumber(branch.code, billIndex++),
            saleDate,
            subTotal: saleSubTotal,
            cgstAmount: totalTaxAmount / 2,
            sgstAmount: totalTaxAmount / 2,
            totalTaxAmount: totalTaxAmount,
            grandTotal: Math.round(grandTotal), // Rounded
            roundOff: Math.round(grandTotal) - grandTotal,
            paymentMode: Math.random() > 0.3 ? 'UPI' : 'CASH',
            status: 'COMPLETED',
            items: {
              create: saleItems
            }
          }
        });
      }
    }
  }

  console.log('✅ Advanced Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
