import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenAI } from "@google/genai";

interface LLMPayload {
  system_prompt?: string;
  user_message: string;
  images?: string[];
  model: string;
  temperature: number;
}

export const llmTask = task({
  id: "llm-generate",
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 15000,
  },
  run: async (payload: LLMPayload) => {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Models available for this API key (verified via list-models.ts)
    // NOTE: gemini-1.5-flash/pro are NOT available — use 2.0/2.5 series instead
    const modelsToTry = [
      payload.model?.startsWith("models/") ? payload.model : `models/${payload.model}`,
      "models/gemini-2.0-flash",
      "models/gemini-2.5-flash",
      "models/gemini-flash-latest",
      "models/gemini-2.0-flash-001",
    ].filter((m, i, arr) => arr.indexOf(m) === i); // dedupe

    let lastError: any;

    for (const modelName of modelsToTry) {
      logger.info("Trying Gemini model", { model: modelName });

      const parts: any[] = [];
      let fullPrompt = payload.user_message;
      if (payload.system_prompt) {
        fullPrompt = `System: ${payload.system_prompt}\n\nUser: ${fullPrompt}`;
      }
      parts.push({ text: fullPrompt });

      // Add images if provided
      if (payload.images && payload.images.length > 0) {
        for (const img of payload.images) {
          if (!img) continue;
          if (img.startsWith('data:')) {
            const [meta, data] = img.split(',');
            const mimeType = meta.split(':')[1].split(';')[0];
            parts.push({ inlineData: { mimeType, data } });
          } else {
            try {
              const response = await fetch(img);
              if (!response.ok) continue;
              const buffer = await response.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              const mimeType = response.headers.get('content-type') ?? 'image/png';
              parts.push({ inlineData: { mimeType, data: base64 } });
            } catch (e: any) {
              continue;
            }
          }
        }
      }

      try {
        const response = await genai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config: {
            temperature: payload.temperature,
            maxOutputTokens: 4096,
          },
        });

        const text = response.text ?? '';
        logger.info("LLM task completed", { model: modelName, outputLength: text.length });
        return { generatedText: text };
      } catch (e: any) {
        lastError = e;
        const errMsg = e?.message || String(e);
        logger.warn(`Model ${modelName} failed`, { error: errMsg.substring(0, 300) });
        // Continue to next model
      }
    }

    // All models failed
    logger.error("All Gemini models failed", { error: lastError?.message });
    throw lastError || new Error("All Gemini models failed");
  },
});
