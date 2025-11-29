import { Router } from 'express';
import { getProfileOverview, updateProfile, upsertFarm, upsertField, upsertCrop } from '../controllers/farmController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticateUser, getProfileOverview);
router.put('/profile', authenticateUser, updateProfile);
router.post('/farms', authenticateUser, upsertFarm);
router.post('/fields', authenticateUser, upsertField);
router.post('/crops', authenticateUser, upsertCrop);

export default router;
