import { task, logger } from "@trigger.dev/sdk/v3";

interface TextPayload {
  text: string;
}

export const textTask = task({
  id: "text-process",
  maxDuration: 30,
  retry: { maxAttempts: 1 },
  run: async (payload: TextPayload) => {
    logger.info("Text task started", { textLength: payload.text.length });
    return { text: payload.text ?? "" };
  },
});
