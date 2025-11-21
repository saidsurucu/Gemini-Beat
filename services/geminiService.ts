import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIResponseSchema, InstrumentType } from "../types";

// Initialize Gemini API
// Assuming process.env.API_KEY is available via Vite/CreateReactApp or similar env handling
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generatePattern = async (userPrompt: string): Promise<AIResponseSchema | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("Missing API Key");
  }

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      bpm: { type: Type.INTEGER, description: "The tempo of the beat between 60 and 180" },
      tracks: {
        type: Type.ARRAY,
        description: "List of 6 tracks (KICK, SNARE, HIHAT, CLAP, BASS, SYNTH)",
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Must be one of: KICK, SNARE, HIHAT, CLAP, BASS, SYNTH" },
            steps: { 
              type: Type.ARRAY, 
              description: "Array of exactly 16 integers, where 1 is active and 0 is silent",
              items: { type: Type.INTEGER } 
            }
          },
          required: ["type", "steps"]
        }
      }
    },
    required: ["bpm", "tracks"]
  };

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a 16-step electronic music drum pattern based on this description: "${userPrompt}". 
      Ensure there are exactly 6 tracks corresponding to KICK, SNARE, HIHAT, CLAP, BASS, SYNTH. 
      The steps array must have exactly 16 items (0 or 1).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    if (result.text) {
      return JSON.parse(result.text) as AIResponseSchema;
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
