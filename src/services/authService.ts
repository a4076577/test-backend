import User, { IUser } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export const registerUser = async (name: string, email: string, password: string, role: string): Promise<IUser> => {
  const emailExist = await User.findOne({ email });
  if (emailExist) {
    throw new Error('Email already exists');
  }

  // FORCE LOGIC: Public registration always creates an unapproved 'tester'
  // Only the seed script can create admins or approved users directly
  const user = new User({
    name,
    email,
    password,
    role: 'tester',    // Force role
    isApproved: false  // Force approval required
  });

  return await user.save();
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Email not found');
  }

  // NEW: Check Approval
  if (!user.isApproved) {
    throw new Error('Account pending approval. Please contact Admin.');
  }

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    throw new Error('Invalid password');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const token = jwt.sign(
    { _id: user._id, role: user.role, email: user.email },
    secret,
    { expiresIn: '7d' }
  );

  return { 
    token, 
    user: { 
      id: user._id as unknown as string, 
      name: user.name, 
      role: user.role 
    } 
  };
};