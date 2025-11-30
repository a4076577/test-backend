import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'tester' | 'admin' | 'superadmin';
  isApproved: boolean; // NEW: Track approval status
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['tester', 'admin', 'superadmin'], 
    default: 'tester' 
  },
  isApproved: { type: Boolean, default: false }, // NEW: Default to false
  createdAt: { type: Date, default: Date.now }
});

// Password Hash Middleware
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

export default mongoose.model<IUser>('User', UserSchema);