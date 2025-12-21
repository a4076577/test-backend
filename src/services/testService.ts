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
  let query: any = {
    $or: [{ assignedTo: 'public' }, { assignedTo: userEmail }]
  };

  // SUPERUSER OVERRIDE: abc@abc.in sees ALL tests
  if (userEmail === 'abc@abc.in') {
    query = {}; // No filter, return everything
  }

  const tests = await Test.find(query)
    .select('-questions.answer -questions.analysis')
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name')
    .lean();

  const attempts = await Attempt.find({ userId }).sort({ completedAt: -1 }).lean();

  const dashboardData = tests.map(test => {
    const testAttempts = attempts.filter(a => a.testId.toString() === test._id.toString());
    const scores = testAttempts.map(a => a.score || 0);
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    
    const creatorName = (test.createdBy as any)?.name || 'Unknown';

    return {
      ...test,
      creatorName,
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
export const getTestWithAnswers = async (testId: string) => {
  const test = await Test.findById(testId).lean();
  if (!test) throw new Error('Test not found');
  return test;
};

export const getAttemptById = async (attemptId: string) => {
  const attempt = await Attempt.findById(attemptId).lean();
  if (!attempt) throw new Error('Attempt not found');
  return attempt;
};

// 5. Submit & Grade
export const submitTest = async (testId: string, userId: string, answers: Record<string, string[]>, timeTaken: number) => {
  const test = await Test.findById(testId);
  if (!test) throw new Error('Test not found');

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let partialCount = 0;
  let unattemptedCount = 0;

  const maxPossibleScore = test.questions.length * 2;

  test.questions.forEach(q => {
    const userAns = answers[q.id] || [];
    const correctAns = q.answer;

    if (userAns.length === 0) {
      unattemptedCount++;
    } else {
      if (q.type === 'multi') {
        const hasWrongSelection = userAns.some(ans => !correctAns.includes(ans));
        if (hasWrongSelection) {
          totalScore -= 0.25;
          incorrectCount++;
        } else {
          const allCorrectSelected = correctAns.length === userAns.length && 
                                     correctAns.every(ans => userAns.includes(ans));
          if (allCorrectSelected) {
            totalScore += 2;
            correctCount++;
          } else {
            totalScore += 1;
            partialCount++;
          }
        }
      } else {
        const isCorrect = userAns.length === correctAns.length && 
                          userAns.every(ans => correctAns.includes(ans));
        if (isCorrect) {
          totalScore += 2;
          correctCount++;
        } else {
          totalScore -= 0.5;
          incorrectCount++;
        }
      }
    }
  });

  const prevAttempts = await Attempt.countDocuments({ testId, userId });

  const attempt = new Attempt({
    userId,
    testId,
    attemptNumber: prevAttempts + 1,
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: Math.max(0, Math.round((totalScore / maxPossibleScore) * 100)),
    stats: { 
      correct: correctCount, 
      incorrect: incorrectCount, 
      partial: partialCount, 
      unattempted: unattemptedCount 
    },
    answers,
    timeTaken
  });

  return await attempt.save();
};

export const deleteTest = async (testId: string) => {
  await Attempt.deleteMany({ testId });
  return await Test.findByIdAndDelete(testId);
};

export const updateTest = async (testId: string, updateData: any) => {
  return await Test.findByIdAndUpdate(testId, updateData, { new: true });
};

export const getAllTestsAdmin = async () => {
  return await Test.find()
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

// NEW: Get All Attempts for Reports (Superuser)
export const getAllAttemptsAdmin = async () => {
  return await Attempt.find()
    .populate('userId', 'name email')
    .populate('testId', 'title')
    .sort({ completedAt: -1 })
    .lean();
};