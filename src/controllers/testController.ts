// server/src/controllers/testController.ts
import { Request, Response } from 'express';
import * as testService from '../services/testService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// 1. Create Test
export const createTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const test = await testService.createTest(req.body, userId);
    res.status(201).json(test);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Get Dashboard Data
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?._id;

    if (!userEmail || !userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const data = await testService.getDashboardData(userEmail, userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Get Test for Taking
export const getTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const test = await testService.getTestForTaking(req.params.id, userId);
    res.json(test);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Get Analysis (NEW)
export const getAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const test = await testService.getTestWithAnswers(req.params.id);
    res.json(test);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const attempt = await testService.getAttemptById(req.params.attemptId);
    
    // Security check: ensure user owns this attempt
    if (attempt.userId.toString() !== userId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    res.json(attempt);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Submit Test
export const submitTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { answers, timeTaken } = req.body;
    
    const result = await testService.submitTest(
      req.params.id, 
      userId, 
      answers, 
      timeTaken
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};