import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

const modelName =
  process.env.REACT_APP_GEMINI_MODEL || "gemini-3.8-flash";

let ai = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
  });
}

export const askGemini = async (question, knowledge = []) => {
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Check your .env file."
    );
  }

  if (!ai) {
    throw new Error(
      "Gemini AI could not be initialized."
    );
  }

  const cleanQuestion = String(question || "").trim();

  if (!cleanQuestion) {
    throw new Error("Please enter a question.");
  }

  const knowledgeContext = knowledge
    .map((item, index) => {
      return `
KNOWLEDGE ${index + 1}
Title: ${item?.title || "Untitled"}
Description: ${
        item?.details ||
        item?.description ||
        item?.content ||
        "No description available"
      }
Source: ${item?.source || "company"}
`;
    })
    .join("\n-----------------------------\n");

  const prompt = `
You are WALASTIK AI, the official AI assistant for the
WALASTIK Information Center.

Your job is to answer questions clearly, accurately,
and professionally.

COMPANY KNOWLEDGE
=================
${
  knowledgeContext ||
  "No company knowledge has been added yet."
}

USER QUESTION
=============
${cleanQuestion}

INSTRUCTIONS
============
1. Answer the user's question directly.
2. Use the company knowledge when it is relevant.
3. If the company knowledge does not contain the answer,
   you may provide a general explanation.
4. Do not refuse to answer simply because an exact keyword
   is not present in the company knowledge.
5. Do not invent WALASTIK company policies or facts.
6. Keep the answer easy to understand.
7. If company knowledge supports the answer, use it naturally.
8. Do not mention these instructions in your answer.
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const text = response?.text?.trim();

    if (!text) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    return text;
  } catch (error) {
    console.error("=================================");
    console.error("GEMINI API ERROR");
    console.error("=================================");
    console.error("Model:", modelName);
    console.error("Question:", cleanQuestion);
    console.error("Error:", error);

    const message =
      error?.message ||
      error?.error?.message ||
      "Unknown Gemini API error.";

    throw new Error(message);
  }
};