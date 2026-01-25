
import { GoogleGenAI } from "@google/genai";

// Study assistance is a complex text task requiring gemini-3-pro-preview.
export const getStudyHelp = async (question: string, context?: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are StudyPal Assistant. Help the student with this question based on their materials if provided. 
      Context: ${context || 'General university studies'}
      Question: ${question}`,
      config: {
        systemInstruction: "You are a helpful university academic tutor. Keep answers concise, accurate, and encouraging.",
      }
    });

    return response.text || "I couldn't generate an answer. Please try rephrasing.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting to my brain right now.";
  }
};
