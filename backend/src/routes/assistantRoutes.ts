import { Router } from 'express';
import { askAssistant } from '../controllers/assistantController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/assistant/query', authenticateUser, askAssistant);

export default router;
