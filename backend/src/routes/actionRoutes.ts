import { Router } from 'express';
import { logAction, getWeedRisk } from '../controllers/actionController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/actions', authenticateUser, logAction);
router.get('/weed-risk', authenticateUser, getWeedRisk);

export default router;
