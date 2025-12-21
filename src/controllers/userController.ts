import { Request, Response } from 'express';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// Get all users (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: "Access Denied" });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update User Role (Admin only)
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['tester', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { role }, 
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Approve User (Admin only)
export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { isApproved: true }, 
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// NEW: Toggle User Status (Activate/Deactivate)
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { userId } = req.params;
    const { isApproved } = req.body; // Pass the desired state

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { isApproved }, 
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};