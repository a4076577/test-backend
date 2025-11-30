// server/src/services/testService.ts
import Test from '../models/Test.js';
import Attempt from '../models/Attempt.js';
import { ITest } from '../models/types.js';

// 1. Create Test
export const createTest = async (testData: Partial<ITest>, userId: string) => {
  const test = new Test({
    ...testData,
    createdBy: userId
  });
  return await test.save();
};

// 2. Get Dashboard Data (Tests + User's Attempts joined)
export const getDashboardData = async (userEmail: string, userId: string) => {
  const tests = await Test.find({
    $or: [{ assignedTo: 'public' }, { assignedTo: userEmail }]
  }).select('-questions.answer -questions.analysis').lean();

  const attempts = await Attempt.find({ userId }).sort({ completedAt: -1 }).lean();

  const dashboardData = tests.map(test => {
    const testAttempts = attempts.filter(a => a.testId.toString() === test._id.toString());
    const scores = testAttempts.map(a => a.score || 0);
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      ...test,
      attempts: testAttempts,
      isAttempted: testAttempts.length > 0,
      lastAttemptDate: testAttempts.length > 0 ? testAttempts[0].completedAt : null,
      bestScore
    };
  });

  return dashboardData;
};

// 3. Get Test for Taking (Hides Answers)
export const getTestForTaking = async (testId: string, userId: string) => {
  const test = await Test.findById(testId).select('-questions.answer -questions.analysis').lean();
  if (!test) throw new Error('Test not found');

  const count = await Attempt.countDocuments({ testId, userId });
  
  return {
    ...test,
    currentAttemptNumber: count + 1
  };
};

// 4. Get Test for Analysis (Shows Answers)
// NEW FUNCTION ADDED HERE
export const getTestWithAnswers = async (testId: string) => {
  // We DO NOT exclude answers here so the frontend can show the analysis
  const test = await Test.findById(testId).lean();
  if (!test) throw new Error('Test not found');
  return test;
};

// NEW: Get specific attempt
export const getAttemptById = async (attemptId: string) => {
  const attempt = await Attempt.findById(attemptId).lean();
  if (!attempt) throw new Error('Attempt not found');
  return attempt;
};
// 5. Submit & Grade
export const submitTest = async (testId: string, userId: string, answers: Record<string, string[]>, timeTaken: number) => {
  const test = await Test.findById(testId);
  if (!test) throw new Error('Test not found');

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  test.questions.forEach(q => {
    const userAns = answers[q.id] || [];
    const correctAns = q.answer;

    if (userAns.length === 0) {
      unattempted++;
    } else {
      const isCorrect = userAns.length === correctAns.length && 
                        userAns.every((val: string) => correctAns.includes(val));
      if (isCorrect) correct++;
      else incorrect++;
    }
  });

  const prevAttempts = await Attempt.countDocuments({ testId, userId });

  const attempt = new Attempt({
    userId,
    testId,
    attemptNumber: prevAttempts + 1,
    score: correct,
    maxScore: test.questions.length,
    percentage: Math.round((correct / test.questions.length) * 100),
    stats: { correct, incorrect, unattempted },
    answers,
    timeTaken
  });

  return await attempt.save();
};