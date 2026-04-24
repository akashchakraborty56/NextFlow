import { task, logger } from "@trigger.dev/sdk/v3";

interface UploadImagePayload {
  imageUrl: string;
}

export const uploadImageTask = task({
  id: "upload-image-process",
  maxDuration: 30,
  retry: { maxAttempts: 1 },
  run: async (payload: UploadImagePayload) => {
    logger.info("Upload image task started", { imageUrl: payload.imageUrl });
    return { imageUrl: payload.imageUrl ?? "" };
  },
});
