// server/routes/testRoutes.ts
import { Router } from 'express';
import * as testController from '../controllers/testController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/tests - Dashboard
router.get('/', testController.getDashboardData);

// GET /api/tests/admin - All Tests for Manage Panel (Specific route before :id)
router.get('/admin/all', testController.getAdminTests);

// GET /api/tests/attempt/:attemptId - Get Specific Attempt
router.get('/attempt/:attemptId', testController.getAttempt);

// GET /api/tests/:id - Take Test
router.get('/:id', testController.getTest);

// GET /api/tests/:id/analysis - Get Analysis
router.get('/:id/analysis', testController.getAnalysis);

// POST /api/tests - Create Test
router.post('/', testController.createTest);

// POST /api/tests/:id/submit - Submit
router.post('/:id/submit', testController.submitTest);

// DELETE /api/tests/:id
router.delete('/:id', testController.deleteTest);

// PUT /api/tests/:id
router.put('/:id', testController.updateTest);

export default router;