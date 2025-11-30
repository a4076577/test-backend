// server/models/Test.ts
import mongoose, { Schema } from 'mongoose';
import { ITest } from './types.js';

const OptionSchema = new Schema({
  id: String,
  text: String
});

const QuestionSchema = new Schema({
  id: String,
  type: { type: String, enum: ['single', 'multi', 'matching'], required: true },
  question: { type: String, required: true },
  options: [OptionSchema],
  list_a: [String],
  list_b: [String],
  answer: [String], 
  hint: String,
  analysis: String
});

const TestSchema = new Schema<ITest>({
  title: { type: String, required: true },
  duration: { type: Number, default: 60 },
  subjects: { type: [String], default: ['General'] }, // New Subject Field
  assignedTo: { type: String, default: 'public' },
  settings: {
    allowHints: { type: Boolean, default: true },
    showAnalysis: { type: Boolean, default: true },
    allowPause: { type: Boolean, default: false }
  },
  questions: [QuestionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITest>('Test', TestSchema);