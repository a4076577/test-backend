// server/routes/testRoutes.ts
import { Router } from 'express';
import * as testController from '../controllers/testController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/tests - Dashboard
router.get('/', testController.getDashboard);

// GET /api/tests/attempt/:attemptId - Get Specific Attempt (NEW ROUTE)
router.get('/attempt/:attemptId', testController.getAttempt);

// GET /api/tests/:id - Take Test
router.get('/:id', testController.getTest);

// GET /api/tests/:id/analysis - Get Analysis (NEW ROUTE)
router.get('/:id/analysis', testController.getAnalysis);

// POST /api/tests - Create Test
router.post('/', testController.createTest);

// POST /api/tests/:id/submit - Submit
router.post('/:id/submit', testController.submitTest);

export default router;