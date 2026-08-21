import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Kiara Medicals database seed...');

  // 1. Create Branches
  console.log('Creating Branches (Shop A, Shop B, Shop C)...');
  const branchA = await prisma.branch.upsert({
    where: { code: 'BR-A' },
    update: {},
    create: {
      name: 'Kiara Medicals — Shop A (Main Road)',
      code: 'BR-A',
      address: 'Shop 1-2, Sai Arcade, MG Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      phone: '+91 98230 11111',
      email: 'shopA@kiaramedicals.com',
      gstNumber: '27AABCK1234A1Z5',
      drugLicenseNo: 'MH-PZ1-20B-100234, MH-PZ1-21B-100235',
    },
  });

  const branchB = await prisma.branch.upsert({
    where: { code: 'BR-B' },
    update: {},
    create: {
      name: 'Kiara Medicals — Shop B (Station Road)',
      code: 'BR-B',
      address: 'Plot 45, Railway Station Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      phone: '+91 98230 22222',
      email: 'shopB@kiaramedicals.com',
      gstNumber: '27AABCK1234B1Z6',
      drugLicenseNo: 'MH-PZ2-20B-200345, MH-PZ2-21B-200346',
    },
  });

  const branchC = await prisma.branch.upsert({
    where: { code: 'BR-C' },
    update: {},
    create: {
      name: 'Kiara Medicals — Shop C (City Center)',
      code: 'BR-C',
      address: 'Unit 12, Phoenix Square, Viman Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411014',
      phone: '+91 98230 33333',
      email: 'shopC@kiaramedicals.com',
      gstNumber: '27AABCK1234C1Z7',
      drugLicenseNo: 'MH-PZ3-20B-300456, MH-PZ3-21B-300457',
    },
  });

  // 2. Create Users
  console.log('Creating Admin & Branch Staff users...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const shopAPasswordHash = await bcrypt.hash('shopA123', 10);
  const shopBPasswordHash = await bcrypt.hash('shopB123', 10);
  const shopCPasswordHash = await bcrypt.hash('shopC123', 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@kiaramedicals.com' },
    update: {},
    create: {
      name: 'Dr. Kiara Mehta (Super Admin)',
      email: 'admin@kiaramedicals.com',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      phone: '+91 98900 00000',
    },
  });

  // Shop A Users
  await prisma.user.upsert({
    where: { email: 'manager.a@kiaramedicals.com' },
    update: {},
    create: {
      name: 'Ramesh Sharma (Manager Shop A)',
      email: 'manager.a@kiaramedicals.com',
      passwordHash: shopAPasswordHash,
      role: 'BRANCH_MANAGER',
      branchId: branchA.id,
      phone: '+91 98230 11001',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.a@kiaramedicals.com' },
    update: {},
    create: {
      name: 'Pooja Verma (Cashier Shop A)',
      email: 'staff.a@kiaramedicals.com',
      passwordHash: shopAPasswordHash,
      role: 'STAFF',
      branchId: branchA.id,
      phone: '+91 98230 11002',
    },
  });

  // Shop B Users
  await prisma.user.upsert({
    where: { email: 'manager.b@kiaramedicals.com' },
    update: {},
    create: {
      name: 'Anil Patil (Manager Shop B)',
      email: 'manager.b@kiaramedicals.com',
      passwordHash: shopBPasswordHash,
      role: 'BRANCH_MANAGER',
      branchId: branchB.id,
      phone: '+91 98230 22001',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.b@kiaramedicals.com' },
    update: {},
    create: {
      name: 'Sunil Kadam (Cashier Shop B)',
      email: 'staff.b@kiaramedicals.com',
      passwordHash: shopBPasswordHash,
      role: 'STAFF',
      branchId: branchB.id,
      phone: '+91 98230 22002',
    },
  });

  // Shop C Users
  await prisma.user.upsert({
    where: { email: 'manager.c@kiaramedicals.com' },
    update: {},
    create: {
      name: 'Vikas Deshmukh (Manager Shop C)',
      email: 'manager.c@kiaramedicals.com',
      passwordHash: shopCPasswordHash,
      role: 'BRANCH_MANAGER',
      branchId: branchC.id,
      phone: '+91 98230 33001',
    },
  });

  // 3. Create Master Medicines
  console.log('Creating Central Master Medicine Catalog...');
  const dolo = await prisma.medicine.create({
    data: {
      name: 'Dolo 650',
      genericName: 'Paracetamol',
      composition: 'Paracetamol 650mg',
      manufacturer: 'Micro Labs Ltd',
      category: 'Analgesics / Antipyretics',
      hsnCode: '3004',
      unit: 'STRIP',
      gstRate: 12.0,
      minReorderLevel: 20,
    },
  });

  const augmentin = await prisma.medicine.create({
    data: {
      name: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      composition: 'Amoxicillin 500mg + Potassium Clavulanate 125mg',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      category: 'Antibiotics',
      hsnCode: '3004',
      unit: 'STRIP',
      gstRate: 12.0,
      minReorderLevel: 15,
      prescriptionRequired: true,
    },
  });

  const pan40 = await prisma.medicine.create({
    data: {
      name: 'Pan 40',
      genericName: 'Pantoprazole',
      composition: 'Pantoprazole Sodium 40mg',
      manufacturer: 'Alkem Laboratories Ltd',
      category: 'Antacids / Anti-ulcerants',
      hsnCode: '3004',
      unit: 'STRIP',
      gstRate: 12.0,
      minReorderLevel: 25,
    },
  });

  const cetzip = await prisma.medicine.create({
    data: {
      name: 'Cetzip 10',
      genericName: 'Cetirizine',
      composition: 'Cetirizine Hydrochloride 10mg',
      manufacturer: 'Cipla Ltd',
      category: 'Antihistamines',
      hsnCode: '3004',
      unit: 'STRIP',
      gstRate: 12.0,
      minReorderLevel: 10,
    },
  });

  // 4. Create Batches Isolated per Branch
  console.log('Creating Branch-Isolated Batches...');
  const futureDate2027 = new Date('2027-12-31');
  const futureDate2026 = new Date('2026-10-15');
  const nearExpiryDate = new Date();
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 45); // 45 days from now

  // Shop A Batches
  await prisma.batch.createMany({
    data: [
      {
        medicineId: dolo.id,
        branchId: branchA.id,
        batchNumber: 'DL-A101',
        expiryDate: futureDate2027,
        purchasePrice: 24.5,
        mrp: 33.6,
        sellingPrice: 33.6,
        quantity: 150,
        rackLocation: 'Rack A-1',
      },
      {
        medicineId: augmentin.id,
        branchId: branchA.id,
        batchNumber: 'AG-A202',
        expiryDate: futureDate2026,
        purchasePrice: 140.0,
        mrp: 201.5,
        sellingPrice: 201.5,
        quantity: 45,
        rackLocation: 'Rack B-2',
      },
      {
        medicineId: pan40.id,
        branchId: branchA.id,
        batchNumber: 'PN-A303',
        expiryDate: nearExpiryDate, // Near expiry in Shop A
        purchasePrice: 85.0,
        mrp: 145.0,
        sellingPrice: 145.0,
        quantity: 60,
        rackLocation: 'Rack A-4',
      },
    ],
  });

  // Shop B Batches
  await prisma.batch.createMany({
    data: [
      {
        medicineId: dolo.id,
        branchId: branchB.id,
        batchNumber: 'DL-B801',
        expiryDate: futureDate2027,
        purchasePrice: 24.0,
        mrp: 33.6,
        sellingPrice: 33.6,
        quantity: 80,
        rackLocation: 'Shelf 1',
      },
      {
        medicineId: cetzip.id,
        branchId: branchB.id,
        batchNumber: 'CT-B902',
        expiryDate: futureDate2026,
        purchasePrice: 15.0,
        mrp: 28.0,
        sellingPrice: 28.0,
        quantity: 120,
        rackLocation: 'Shelf 3',
      },
    ],
  });

  // Shop C Batches
  await prisma.batch.createMany({
    data: [
      {
        medicineId: dolo.id,
        branchId: branchC.id,
        batchNumber: 'DL-C501',
        expiryDate: futureDate2027,
        purchasePrice: 25.0,
        mrp: 33.6,
        sellingPrice: 33.6,
        quantity: 200,
        rackLocation: 'Rack C-1',
      },
      {
        medicineId: augmentin.id,
        branchId: branchC.id,
        batchNumber: 'AG-C602',
        expiryDate: futureDate2026,
        purchasePrice: 142.0,
        mrp: 201.5,
        sellingPrice: 201.5,
        quantity: 30,
        rackLocation: 'Rack C-2',
      },
    ],
  });

  // 5. Create Sample Customers
  console.log('Creating Customers per Branch...');
  await prisma.customer.createMany({
    data: [
      {
        branchId: branchA.id,
        name: 'Amit Patel',
        phone: '9876543210',
        doctorName: 'Dr. S. K. Joshi',
      },
      {
        branchId: branchB.id,
        name: 'Sneha Kulkarni',
        phone: '9876543222',
        doctorName: 'Dr. V. N. Rao',
      },
    ],
  });

  console.log('✅ Kiara Medicals database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
