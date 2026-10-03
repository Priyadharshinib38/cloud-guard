import { getDb } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';

export function getAllFindings(req, res, next) {
  try {
    const { severity, search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM findings WHERE 1=1';
    const params = [];

    if (severity && severity !== 'All') {
      query += ' AND LOWER(severity) = LOWER(?)';
      params.push(severity.trim());
    }

    if (search && search.trim()) {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(service) LIKE ? OR LOWER(description) LIKE ? OR LOWER(affectedResource) LIKE ?)';
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY createdAt DESC';

    const findings = db.prepare(query).all(...params);

    res.status(200).json({
      success: true,
      data: findings,
      totalCount: findings.length
    });
  } catch (err) {
    next(err);
  }
}

export function getFindingById(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Finding ID is required.', 400);
    }

    const db = getDb();
    const finding = db.prepare(`
      SELECT f.*, s.provider as scanProvider, s.startedAt as scanStartedAt
      FROM findings f
      LEFT JOIN scans s ON f.scanId = s.id
      WHERE f.id = ?
    `).get(id);

    if (!finding) {
      throw new AppError(`Finding with ID '${id}' not found.`, 404);
    }

    res.status(200).json({
      success: true,
      ...finding,
      data: finding
    });
  } catch (err) {
    next(err);
  }
}
