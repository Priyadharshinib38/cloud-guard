import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

let dbInstance = null;

export function getDatabasePath() {
  const dbEnv = process.env.DATABASE_PATH || './data/cloudguard.db';
  return path.resolve(process.cwd(), dbEnv);
}

export function initDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      totalScanned INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      scanId TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      service TEXT NOT NULL,
      description TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      affectedResource TEXT NOT NULL,
      ruleId TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (scanId) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      scanId TEXT,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (scanId) REFERENCES scans(id) ON DELETE SET NULL
    );
  `);

  // Seed default data if empty
  seedDatabaseIfEmpty(dbInstance);

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function seedDatabaseIfEmpty(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('🌱 Seeding initial CloudGuard database records...');

  const passwordHash = bcrypt.hashSync('password', 10);
  const now = new Date().toISOString();

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('usr-admin-01', 'Admin', 'admin@cloudguard.com', passwordHash, now);
  insertUser.run('usr-alex-02', 'Alex Vance', 'alex.vance@cloudguard.io', passwordHash, now);

  // 2. Seed Initial Scan
  const insertScan = db.prepare(`
    INSERT INTO scans (id, provider, status, startedAt, completedAt, totalScanned)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const initialScanId = 'SCAN-2026-094';
  insertScan.run(
    initialScanId,
    'AWS',
    'completed',
    new Date(Date.now() - 3600000).toISOString(),
    now,
    48
  );

  // 3. Seed Findings
  const insertFinding = db.prepare(`
    INSERT INTO findings (id, scanId, title, severity, service, description, recommendation, affectedResource, ruleId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialFindings = [
    {
      id: 'FIND-001',
      title: 'Public S3 Bucket',
      severity: 'Critical',
      service: 'Amazon S3',
      description: 'A storage bucket is publicly accessible and may expose sensitive data.',
      recommendation: 'Enable S3 Block Public Access at the bucket and account level. Restrict bucket ACL and policy permissions.',
      affectedResource: 'arn:aws:s3:::prod-customer-data-backup',
      ruleId: 'CIS-AWS-2.1.5'
    },
    {
      id: 'FIND-002',
      title: 'Open Security Group Port',
      severity: 'High',
      service: 'EC2',
      description: 'Port 22 (SSH) is open to the public internet (0.0.0.0/0) and may allow unauthorized remote access.',
      recommendation: 'Restrict SSH ingress to specific corporate VPN CIDR blocks or migrate to AWS Systems Manager Session Manager.',
      affectedResource: 'sg-0a81b9921c (prod-bastion-sg)',
      ruleId: 'CIS-AWS-4.1'
    },
    {
      id: 'FIND-003',
      title: 'Missing Encryption',
      severity: 'Medium',
      service: 'RDS',
      description: 'Database encryption is not enabled for the affected relational database instance at rest.',
      recommendation: 'Enable AWS KMS encryption for RDS storage volumes and ensure snapshots are encrypted.',
      affectedResource: 'rds:prod-postgres-main',
      ruleId: 'CIS-AWS-2.3.1'
    },
    {
      id: 'FIND-004',
      title: 'Unused IAM Permission',
      severity: 'Low',
      service: 'IAM',
      description: 'An IAM role contains wildcards or administrative permissions that have not been exercised in the last 90 days.',
      recommendation: 'Apply principle of least privilege by pruning unused Actions from the IAM policy.',
      affectedResource: 'arn:aws:iam::892138947192:role/DataPipelineWorkerRole',
      ruleId: 'CIS-AWS-1.16'
    }
  ];

  for (const f of initialFindings) {
    insertFinding.run(
      f.id,
      initialScanId,
      f.title,
      f.severity,
      f.service,
      f.description,
      f.recommendation,
      f.affectedResource,
      f.ruleId,
      now
    );
  }

  // 4. Seed Reports
  const insertReport = db.prepare(`
    INSERT INTO reports (id, scanId, name, status, date, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReport.run(
    'REP-2026-001',
    initialScanId,
    'CloudGuard Security Report',
    'Ready',
    '03 Oct 2026',
    now
  );

  insertReport.run(
    'REP-2026-002',
    initialScanId,
    'AWS Infrastructure Scan',
    'Ready',
    '01 Oct 2026',
    new Date(Date.now() - 172800000).toISOString()
  );

  console.log('✅ Database initialized and seeded successfully.');
}
