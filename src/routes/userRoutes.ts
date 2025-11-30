import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// GET /api/users
router.get('/', userController.getAllUsers);

// PUT /api/users/:userId/role
router.put('/:userId/role', userController.updateUserRole);

// PUT /api/users/:userId/approve - NEW ROUTE
router.put('/:userId/approve', userController.approveUser);

export default router;