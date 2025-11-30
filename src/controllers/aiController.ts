import { Request, Response } from 'express';
import * as aiService from '../services/aiService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const generate = async (req: AuthRequest, res: Response) => {
  try {
    // Only Admins can generate (saves API costs)
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { singleCount, multiCount, matchingCount, difficulty, subjects, remarks } = req.body;

    const questions = await aiService.generateQuestions({
      singleCount: Number(singleCount) || 5,
      multiCount: Number(multiCount) || 0,
      matchingCount: Number(matchingCount) || 0,
      difficulty: difficulty || 'Medium',
      subjects: subjects || 'General',
      remarks: remarks || ''
    });

    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};