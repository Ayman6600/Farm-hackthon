import { Router } from 'express';
import { getAlerts, triggerRiskAnalysis } from '../controllers/alertController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/alerts', authenticateUser, getAlerts);
router.post('/alerts/analyze', authenticateUser, triggerRiskAnalysis);

export default router;
