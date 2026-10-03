import { getDb } from '../db/database.js';

export function getDashboardMetrics(req, res, next) {
  try {
    const db = getDb();

    // 1. Total Scans
    const scanCountRow = db.prepare('SELECT COUNT(*) as count FROM scans').get();
    const totalScans = scanCountRow ? scanCountRow.count : 0;

    // 2. Count findings by severity
    const findingsRows = db.prepare('SELECT severity, COUNT(*) as count FROM findings GROUP BY severity').all();

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const row of findingsRows) {
      const sev = (row.severity || '').toLowerCase();
      if (sev === 'critical') critical = row.count;
      else if (sev === 'high') high = row.count;
      else if (sev === 'medium') medium = row.count;
      else if (sev === 'low') low = row.count;
    }

    // 3. Compute dynamic security score (0 - 100)
    // Starting at 100, heavily penalizing critical and high vulnerabilities
    let computedScore = 100 - (critical * 12 + high * 6 + medium * 3 + low * 1);
    if (computedScore < 10) computedScore = 10;
    if (computedScore > 100) computedScore = 100;
    const securityScore = totalScans === 0 ? 100 : computedScore;

    // 4. Fetch recent findings
    const recentFindings = db.prepare('SELECT * FROM findings ORDER BY createdAt DESC LIMIT 5').all();

    // Format response to support both flat and nested property access
    const metrics = {
      totalScans,
      critical,
      high,
      medium,
      low,
      securityScore,
      recentFindings
    };

    res.status(200).json({
      success: true,
      ...metrics,
      data: metrics
    });
  } catch (err) {
    next(err);
  }
}
