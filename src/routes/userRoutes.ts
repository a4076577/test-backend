import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// GET /api/users
router.get('/', userController.getAllUsers);

// PUT /api/users/:userId/role
router.put('/:userId/role', userController.updateUserRole);

// PUT /api/users/:userId/approve
router.put('/:userId/approve', userController.approveUser);

// PUT /api/users/:userId/status - NEW
router.put('/:userId/status', userController.toggleUserStatus);

export default router;