// server/models/Attempt.ts
import mongoose, { Schema } from 'mongoose';
import { IAttempt } from './types.js';

const AttemptSchema = new Schema<IAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  attemptNumber: { type: Number, required: true }, // 1, 2, 3...
  score: Number,
  maxScore: Number,
  percentage: Number,
  stats: {
    correct: Number,
    incorrect: Number,
    unattempted: Number
  },
  answers: Object,
  timeTaken: Number,
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAttempt>('Attempt', AttemptSchema);