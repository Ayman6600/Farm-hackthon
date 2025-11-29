import { Router } from 'express';
import { getMonthlyReport, generateReport } from '../controllers/reportController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/reports', authenticateUser, getMonthlyReport);
router.post('/reports/generate', authenticateUser, generateReport);

export default router;
