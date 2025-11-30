// server/src/services/aiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// PRO MODEL → BEST FOR LARGE JSON, HINDI MCQ, UPPSC
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 65000
  }
});

// ================================
// JSON REPAIR FUNCTION
// ================================
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

  // 🔥 FULL UPPSC PROMPT INCLUDED HERE
  const prompt = `
    You are an expert exam setter for the **UPPSC (Uttar Pradesh Public Service Commission)**. 
    Your task is to generate a JSON array of ${totalQuestions} high-quality questions in **HINDI (Devanagari Script)**.

    -------------------------
    🎯 **REQUIREMENTS**
    -------------------------
    1. **Target Audience:** UPPSC Aspirants (Hindi Medium). Use formal, exam-standard Hindi.
    2. **Subjects:** ${subjects}
    3. **Difficulty Level:** ${difficulty}
    4. **Context/Source Material:** "${remarks}"
         ➤ If the remarks mention **NCERT**, textbook chapters, videos, etc., then questions must strictly follow those topics.

    -------------------------
    🧩 **QUESTION DISTRIBUTION**
    -------------------------
    - ${singleCount} × Single Correct MCQs ("single")
    - ${multiCount} × Multiple Correct MCQs ("multi")
    - ${matchingCount} × Match List Type Questions ("matching")

    -------------------------
    📌 **STRICT JSON INSTRUCTIONS**
    -------------------------
    - Output MUST be **ONLY** a JSON array "[]"
    - NO explanation text outside JSON
    - NO markdown like \`\`\`
    - NO headings or comments

    -------------------------
    📘 **SCHEMA: Single / Multi**
    -------------------------
    {
      "id": "unique_string",
      "type": "single" | "multi",
      "question": "Hindi question text using <b>bold tags</b> where appropriate.",
      "options": [
        { "id": "A", "text": "Option A (Hindi)" },
        { "id": "B", "text": "Option B (Hindi)" },
        { "id": "C", "text": "Option C (Hindi)" },
        { "id": "D", "text": "Option D (Hindi)" }
      ],
      "answer": ["A"],     // For multi: ["A", "C"]
      "hint": "Hint in Hindi.",
      "analysis": "Full explanation in Hindi."
    }

    -------------------------
    📗 **SCHEMA: Matching Type**
    -------------------------
    {
      "id": "unique_string",
      "type": "matching",
      "question": "Match List I and List II (Hindi).",
      "list_a": ["A. Item 1", "B. Item 2", "C. Item 3", "D. Item 4"],
      "list_b": ["1. Match 1", "2. Match 2", "3. Match 3", "4. Match 4"],
      "options": [
        { "id": "A", "text": "A-1, B-2, C-3, D-4" },
        { "id": "B", "text": "A-2, B-1, C-4, D-3" },
        { "id": "C", "text": "..." },
        { "id": "D", "text": "..." }
      ],
      "answer": ["A"],
      "hint": "Hint in Hindi.",
      "analysis": "Explanation in Hindi."
    }

    -------------------------
    🛑 Output ONLY valid JSON array.
    -------------------------
  `;

  try {
    // JSON MODE REQUIRES SENDING AS JSON OBJECT
    const result = await model.generateContent(
      JSON.stringify({ instruction: prompt })
    );

    const raw = result.response.text();
    const clean = fixJSON(raw);

    return JSON.parse(clean);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("AI returned invalid JSON. Reduce question count and try again.");
  }
};
