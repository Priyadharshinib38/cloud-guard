import { getDb } from '../db/database.js';
import { generatePdfReport } from '../services/pdfReportService.js';
import { AppError } from '../middleware/errorHandler.js';

export function getAllReports(req, res, next) {
  try {
    const db = getDb();
    const reports = db.prepare('SELECT * FROM reports ORDER BY createdAt DESC').all();

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (err) {
    next(err);
  }
}

export function downloadReportPdf(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Report ID is required.', 400);
    }

    const db = getDb();
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);

    if (!report) {
      throw new AppError(`Report with ID '${id}' not found.`, 404);
    }

    // Fetch scan associated with report
    let scan = null;
    if (report.scanId) {
      scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(report.scanId);
    }

    // Fetch findings for this report/scan
    let findings = [];
    if (report.scanId) {
      findings = db.prepare(`
        SELECT * FROM findings
        WHERE scanId = ?
        ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END
      `).all(report.scanId);
    }

    // If no findings are specifically mapped to this scanId, fallback to current findings catalog
    if (findings.length === 0) {
      findings = db.prepare(`
        SELECT * FROM findings
        ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END
        LIMIT 10
      `).all();
    }

    // Sanitize filename
    const safeName = (report.name || `CloudGuard-Report-${id}`)
      .replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${safeName}.pdf`;

    // Set PDF attachment headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream generated PDF
    generatePdfReport(report, scan, findings, res);
  } catch (err) {
    next(err);
  }
}
