import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', optionalAuth, getDashboardMetrics);

export default router;
