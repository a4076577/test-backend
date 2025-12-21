import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// 1. Load all available keys into an array
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3
].filter(key => !!key && key.trim() !== "");

// Helper to get a fresh model instance for a specific key
const getModel = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 65000
    }
  });
};

function fixJSON(text: string) {
  let fixed = text;
  fixed = fixed.replace(/```json/g, "").replace(/```/g, "");
  fixed = fixed.replace(/[“”]/g, '"');
  fixed = fixed.replace(/[\u0000-\u001F]+/g, "");
  fixed = fixed.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
  return fixed.trim();
}

interface GenerateOptions {
  singleCount: number;
  multiCount: number;
  matchingCount: number;
  difficulty: string;
  subjects: string;
  remarks: string;
}

export const generateQuestions = async (options: GenerateOptions) => {
  const { singleCount, multiCount, difficulty, subjects, remarks } = options;
  const totalQuestions = singleCount + multiCount;
  
  if (totalQuestions <= 0) throw new Error("At least one question must be requested.");
  if (totalQuestions > 12) throw new Error("Cannot generate more than 12 questions at a time.");
  
  let difficultyLabel = difficulty;
  if (difficulty.toLowerCase() === 'hard') {
    difficultyLabel = 'Expert / Hard';
  }
  
  console.log("Generating", totalQuestions, "questions of", difficultyLabel, "level in subjects:", subjects);

  const prompt = `
    You are an expert exam setter for the **UPPSC (Uttar Pradesh Public Service Commission)** Pre/Mains. 
    Your task is to generate a JSON array of ${totalQuestions} high-quality questions in **HINDI (Devanagari Script)**.

    -------------------------
    🎯 **EXAM STANDARD: UPPSC (State PSC Level)**
    -------------------------
    - **LEVEL:** ${difficultyLabel} (State PSC Standard).
    - **STYLE:** Do NOT create simple one-liners. Focus on **Statement Based** and **Chronology** questions.
    - **TONE:** Formal, Academic Hindi.
    - **SUBJECTS:** ${subjects}
    - **CONTEXT:** "${remarks}"

    -------------------------
    🔥 **MANDATORY QUESTION TYPES**
    -------------------------
    1. **Statement Based (कथन-आधारित):** "Consider the following statements... Which are correct?" (Only 1, Only 2, Both, None).
    2. **Assertion-Reason (कथन-कारण):** "A: ..., R: ...". (A and R both correct and R explains A, etc.)
    3. **Chronology (कालानुक्रम):** "Arrange the following events in chronological order."
    4. **Match List (सुमेलित कीजिए):** Difficult matching questions.
    5. **UP Specific:** If the subject allows (History/Geo/Polity), include Uttar Pradesh specific facts.

    -------------------------
    🧩 **DISTRIBUTION**
    -------------------------
    - ${singleCount} × Single Correct (Make these statement based or assertion-reason where possible).
    - ${multiCount} × Multiple Selection (Select 1, 2, 3 etc).

    -------------------------
    📌 **STRICT JSON SCHEMA**
    -------------------------
    Output MUST be **ONLY** a JSON array "[]". No markdown. No extra text. Each question object must follow this schema:
    
    **TYPE: "single"** (For Statement/Assertion type, put options A,B,C,D as usual)
    {
      "id": "unique_string",
      "type": "single",
      "question": "<b>(Assertion-Reason / Statement Question Text in Hindi)</b>",
      "options": [
        { "id": "A", "text": "Option A" },
        { "id": "B", "text": "Option B" },
        { "id": "C", "text": "Option C" },
        { "id": "D", "text": "Option D" }
      ],
      "answer": ["A"],
      "hint": "Hint in Hindi.",
      "analysis": "Detailed explanation of why statement is correct/incorrect."
    }

    **TYPE: "multi"** (Checkbox style)
    {
      "id": "unique_string",
      "type": "multi",
      "question": "Which of the following are correct? (Hindi)",
      "options": [ ... ],
      "answer": ["A", "C"],
      "hint": "...",
      "analysis": "..."
    }
  `;

  // 2. Retry Logic: Loop through all available keys
  let lastError: any = null;

  if (apiKeys.length === 0) {
      throw new Error("No Gemini API keys found in .env file (GEMINI_API_KEY, GEMINI_API_KEY2, etc.)");
  }

  for (let i = 0; i < apiKeys.length; i++) {
    const currentKey = apiKeys[i];
    
    try {
      console.log(`[AI Service] Attempting generation with API Key #${i + 1} (ends in ...${currentKey?.slice(-4)})`);
      
      const model = getModel(currentKey!);
      const result = await model.generateContent(prompt);

      const raw = result.response.text();
      const clean = fixJSON(raw);
      const parsed = JSON.parse(clean);
      
      // If success, return immediately and exit function
      return Array.isArray(parsed) ? parsed : [];

    } catch (error: any) {
      console.error(`[AI Service] Error with API Key #${i + 1}:`, error.message);
      lastError = error;

      // 3. Detect Quota Error (429)
      const isQuotaError = error.status === 429 || 
                           (error.message && error.message.includes('429')) || 
                           (error.message && error.message.includes('Quota')) ||
                           (error.message && error.message.includes('Too Many Requests'));

      if (isQuotaError) {
        if (i < apiKeys.length - 1) {
             console.warn(`[AI Service] ⚠️ Quota exceeded for Key #${i + 1}. Switching to Key #${i + 2}...`);
             continue; // Continue to next iteration (next key)
        } else {
             console.error("[AI Service] ❌ All API keys have exceeded their quota.");
        }
      } else {
        // If it's NOT a quota error (e.g., Prompt Blocked, Server Error), do not rotate, just fail.
        // This prevents wasting keys on bad requests.
        throw error;
      }
    }
  }

  // If we exit the loop, it means all keys failed
  throw new Error(`AI Service Failed: All ${apiKeys.length} API keys exhausted or failed. Last error: ${lastError?.message}`);
};