import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// POST /api/ai/generate
router.post('/generate', aiController.generate);

export default router;