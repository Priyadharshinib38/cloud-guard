import { Router } from 'express';
import { getAllReports, downloadReportPdf } from '../controllers/reportsController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/reports', optionalAuth, getAllReports);
router.get('/reports/:id/pdf', requireAuth, downloadReportPdf);
router.get('/reports/:id/download', requireAuth, downloadReportPdf);

export default router;
