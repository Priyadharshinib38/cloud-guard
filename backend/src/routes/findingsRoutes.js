import { Router } from 'express';
import { getAllFindings, getFindingById } from '../controllers/findingsController.js';
import { explainFinding } from '../controllers/geminiController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/findings', optionalAuth, getAllFindings);
router.get('/findings/:id', optionalAuth, getFindingById);
router.post('/findings/:id/explanation', optionalAuth, explainFinding);
router.get('/findings/:id/ai-explanation', optionalAuth, explainFinding);

export default router;
