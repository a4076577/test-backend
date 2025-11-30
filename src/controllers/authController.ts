// server/controllers/authController.ts
import { Request, Response } from 'express';
import * as authService from '../services/authService.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    // Assuming registerUser returns a Mongoose document or object with _id
    const user = await authService.registerUser(name, email, password, role);
    res.status(201).json({ user: user._id, message: "Registered Successfully" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    
    // Set header and return result (token + user info)
    res.header('Authorization', result.token).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};