import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiGameTip = async (speed: number, rebirths: number, world: number): Promise<string> => {
  if (!process.env.API_KEY) {
      return "Gemini API Key is missing! I can't give you wisdom right now.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a wise Game Master for a Roblox-style speed simulator game.
      The player has the following stats:
      - Speed: ${speed}
      - Rebirths: ${rebirths}
      - Current World: ${world}

      Give them a short, funny, 1-sentence tip or motivation to keep clicking and running. 
      Mention specific mechanics like 'Rebirth to double your gain!' or 'Get to 100,000 speed for World 2!' if relevant.
      Be enthusiastic!
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Keep running fast!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Game Master is sleeping (Network Error). Just click faster!";
  }
};
