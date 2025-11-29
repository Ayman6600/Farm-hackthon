import { Router } from 'express';
import { compareCrops, getSwitchSuggestion } from '../controllers/cropController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/crops/compare', authenticateUser, compareCrops);
router.get('/crops/switch-suggestion', authenticateUser, getSwitchSuggestion);

export default router;
