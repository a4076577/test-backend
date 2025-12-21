// server/src/services/aiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// PRO MODEL
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 65000
  }
});

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
  const { singleCount, multiCount, matchingCount, difficulty, subjects, remarks } = options;
  const totalQuestions = singleCount + multiCount + matchingCount;
  if (totalQuestions <= 0) throw new Error("At least one question must be requested.");
  if( totalQuestions > 50 ) throw new Error("Cannot generate more than 50 questions at a time.");
  let difficultyLabel = difficulty;
  if (difficulty.toLowerCase() === 'hard') {
         difficultyLabel = 'Expert / Hard';
  }
  console.log("Generating", totalQuestions, "questions of", difficultyLabel, "level in subjects:", subjects);
  // return;
  // UPPSC SPECIFIC PROMPT
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
    - ${matchingCount} × Match List Type.

    -------------------------
    📌 **STRICT JSON SCHEMA**
    -------------------------
    Output MUST be **ONLY** a JSON array "[]". No markdown.

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

    **TYPE: "matching"**
    {
      "id": "unique_string",
      "type": "matching",
      "question": "Match List I with List II (Hindi)",
      "list_a": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "list_b": ["1. ...", "2. ...", "3. ...", "4. ..."],
      "options": [
        { "id": "A", "text": "A-1, B-2, C-3, D-4" }, ...
      ],
      "answer": ["A"],
      "hint": "...",
      "analysis": "..."
    }
  `;

  try {
    const result = await model.generateContent(
      JSON.stringify({ instruction: prompt })
    );

    const raw = result.response.text();
    const clean = fixJSON(raw);
    const parsed = JSON.parse(clean);
    
    // Safety check to ensure it's an array
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("AI returned invalid JSON. Please try again.");
  }
};