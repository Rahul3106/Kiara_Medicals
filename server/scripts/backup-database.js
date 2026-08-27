import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { prisma } from '../src/shared/config/db.js';

dotenv.config();

const execAsync = promisify(exec);

const BACKUP_DIR = path.resolve(process.cwd(), process.env.BACKUP_DIR || './backups');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS) || 30;

// Ensure backup destination exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
};

const calculateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

const updateManifest = (backupMeta) => {
  const manifestPath = path.join(BACKUP_DIR, 'backup-manifest.json');
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      manifest = [];
    }
  }

  manifest.unshift(backupMeta);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
};

const pruneOldBackups = () => {
  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(BACKUP_DIR);
  for (const file of files) {
    if (file === 'backup-manifest.json') continue;
    const filePath = path.join(BACKUP_DIR, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`[Backup Retention] Pruned expired backup file: ${file}`);
      }
    } catch (e) {
      console.error(`[Backup Retention] Error checking file ${file}:`, e.message);
    }
  }
};

/**
 * Main Backup Orchestrator
 */
export const runDatabaseBackup = async () => {
  const timestamp = getTimestamp();
  const dbUrl = process.env.DATABASE_URL || '';
  console.log(`\n======================================================`);
  console.log(`📦 STARTING KIARA MEDICALS AUDIT COMPLIANCE BACKUP`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`📁 Destination: ${BACKUP_DIR}`);
  console.log(`======================================================`);

  let backupFile = '';
  let backupType = '';

  try {
    // 1. PostgreSQL Strategy (using pg_dump if URL is PostgreSQL)
    if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
      backupFile = path.join(BACKUP_DIR, `pg_backup_${timestamp}.sql`);
      backupType = 'PostgreSQL pg_dump';
      console.log(`[PostgreSQL] Attempting pg_dump export...`);

      try {
        await execAsync(`pg_dump "${dbUrl}" --clean --if-exists -F p -f "${backupFile}"`);
        console.log(`✅ [PostgreSQL] pg_dump completed successfully.`);
      } catch (pgError) {
        console.warn(`⚠️  pg_dump utility not found or failed (${pgError.message}). Falling back to Prisma data snapshot...`);
        // Fallback: Export complete relational state via Prisma
        backupFile = await exportPrismaSnapshot(timestamp);
        backupType = 'PostgreSQL Prisma JSON Snapshot';
      }
    }
    // 2. SQLite / Local File Strategy
    else if (dbUrl.startsWith('file:') || dbUrl.includes('.db')) {
      const sqlitePath = dbUrl.replace('file:', '').trim();
      const resolvedSqlite = path.resolve(process.cwd(), sqlitePath.startsWith('./') ? sqlitePath : `./prisma/${sqlitePath}`);
      backupFile = path.join(BACKUP_DIR, `sqlite_backup_${timestamp}.db`);
      backupType = 'SQLite Binary Snapshot';

      if (fs.existsSync(resolvedSqlite)) {
        fs.copyFileSync(resolvedSqlite, backupFile);
        console.log(`✅ [SQLite] Database file snapshotted to ${backupFile}`);
      } else {
        backupFile = await exportPrismaSnapshot(timestamp);
        backupType = 'Prisma JSON Snapshot';
      }
    } else {
      backupFile = await exportPrismaSnapshot(timestamp);
      backupType = 'Prisma JSON Snapshot';
    }

    // 3. Compute SHA256 Checksum for Regulatory Compliance (Schedule H/H1 audit trail)
    const sha256 = calculateFileHash(backupFile);
    const stats = fs.statSync(backupFile);

    const meta = {
      backupFile: path.basename(backupFile),
      type: backupType,
      sizeBytes: stats.size,
      sha256Checksum: sha256,
      createdAt: new Date().toISOString(),
      compliance: 'Indian Drugs and Cosmetics Rules — Schedule H/H1 Billing & Audit Trail',
    };

    updateManifest(meta);
    pruneOldBackups();

    console.log(`\n🎉 BACKUP SUCCESSFUL!`);
    console.log(`📄 File: ${meta.backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);
    console.log(`🔒 SHA256 Checksum: ${sha256}`);
    console.log(`======================================================\n`);

    return meta;
  } catch (err) {
    console.error(`❌ BACKUP FAILED:`, err.message);
    throw err;
  }
};

/**
 * Fallback snapshot generator across all relational models
 */
const exportPrismaSnapshot = async (timestamp) => {
  const snapshotFile = path.join(BACKUP_DIR, `data_snapshot_${timestamp}.json`);
  console.log(`[Snapshot] Exporting all relational tables via Prisma...`);

  const [branches, users, medicines, batches, suppliers, purchases, purchaseItems, sales, saleItems, auditLogs] =
    await Promise.all([
      prisma.branch.findMany(),
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true, createdAt: true } }),
      prisma.medicine.findMany(),
      prisma.batch.findMany(),
      prisma.supplier.findMany(),
      prisma.purchase.findMany(),
      prisma.purchaseItem.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.auditLog.findMany(),
    ]);

  const fullData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
    tables: {
      branches,
      users,
      medicines,
      batches,
      suppliers,
      purchases,
      purchaseItems,
      sales,
      saleItems,
      auditLogs,
    },
  };

  fs.writeFileSync(snapshotFile, JSON.stringify(fullData, null, 2));
  console.log(`✅ [Snapshot] Exported ${Object.keys(fullData.tables).length} tables to ${snapshotFile}`);
  return snapshotFile;
};

// If run directly from CLI: node server/scripts/backup-database.js
if (process.argv[1]?.endsWith('backup-database.js')) {
  runDatabaseBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
