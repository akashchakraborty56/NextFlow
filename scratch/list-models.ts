import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function listModels() {
  try {
    const pager = await genai.models.list();
    console.log("Available models:");
    for await (const model of pager) {
      console.log(`  - ${model.name} (${model.displayName})`);
    }
  } catch (e: any) {
    console.error("Failed to list models:", e.message);
  }
}

listModels();
