import { Router } from 'express';
import { createScan, getScanStatusById } from '../controllers/scanController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/scans', optionalAuth, createScan);
router.get('/scans/:id/status', optionalAuth, getScanStatusById);

export default router;
