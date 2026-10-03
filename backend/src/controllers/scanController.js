import { getDb } from '../db/database.js';
import { executeScan } from '../services/scannerService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createScan(req, res, next) {
  try {
    const { provider = 'AWS' } = req.body || {};

    const validProviders = ['AWS', 'AZURE', 'GCP'];
    if (!validProviders.includes(provider.toUpperCase())) {
      throw new AppError(`Invalid cloud provider '${provider}'. Supported: AWS, Azure, GCP.`, 400);
    }

    const scanId = `SCAN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const db = getDb();

    // 1. Record the initiated scan
    db.prepare(`
      INSERT INTO scans (id, provider, status, startedAt, completedAt, totalScanned)
      VALUES (?, ?, ?, ?, NULL, 0)
    `).run(scanId, provider.toUpperCase(), 'running', now);

    // 2. Execute scanner
    await executeScan(scanId, provider.toUpperCase());

    const result = {
      scanId,
      status: 'completed',
      provider: provider.toUpperCase(),
      startedAt: now
    };

    res.status(201).json({
      success: true,
      scanId,
      status: 'completed',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export function getScanStatusById(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Scan ID is required.', 400);
    }

    const db = getDb();
    const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(id);

    if (!scan) {
      throw new AppError(`Scan with ID '${id}' not found.`, 404);
    }

    res.status(200).json({
      success: true,
      scanId: scan.id,
      status: scan.status,
      data: {
        scanId: scan.id,
        status: scan.status,
        provider: scan.provider,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        totalScanned: scan.totalScanned
      }
    });
  } catch (err) {
    next(err);
  }
}
