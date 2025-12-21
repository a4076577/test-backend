// server/models/types.ts
// Shared interfaces for the application

import { Document, Types } from 'mongoose';

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion {
  id: string;
  type: 'single' | 'multi' | 'matching';
  question: string;
  options: IOption[];
  list_a?: string[];
  list_b?: string[];
  answer: string[];
  hint?: string;
  analysis?: string;
}

export interface ITest extends Document {
  title: string;
  duration: number; // minutes
  subjects: string[];
  assignedTo: string;
  settings: {
    allowHints: boolean;
    showAnalysis: boolean;
    allowPause: boolean;
  };
  questions: IQuestion[];
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IAttempt extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  stats: {
    correct: number;
    incorrect: number;
    partial: number; // NEW
    unattempted: number;
  };
  answers: Record<string, string[]>;
  timeTaken: number;
  completedAt: Date;
}