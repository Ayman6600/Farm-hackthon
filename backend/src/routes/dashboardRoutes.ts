import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticateUser, getDashboardSummary);

export default router;
