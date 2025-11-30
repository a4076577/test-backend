// server/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Define the shape of the User payload in the Token
interface UserPayload {
  _id: string;
  email: string;
  role: string;
}

// 2. Extend Express Request to include the user property
// This allows you to use req.user in controllers without type errors
export interface AuthRequest extends Request {
  user?: UserPayload;
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header (Format: "Bearer <token>")
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Verify Token
    const verified = jwt.verify(token, secret) as UserPayload;
    
    // Attach user to request object
    (req as AuthRequest).user = verified;
    
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

export default authMiddleware;