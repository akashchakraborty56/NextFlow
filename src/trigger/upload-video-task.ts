import { task, logger } from "@trigger.dev/sdk/v3";

interface UploadVideoPayload {
  videoUrl: string;
}

export const uploadVideoTask = task({
  id: "upload-video-process",
  maxDuration: 30,
  retry: { maxAttempts: 1 },
  run: async (payload: UploadVideoPayload) => {
    logger.info("Upload video task started", { videoUrl: payload.videoUrl });
    return { videoUrl: payload.videoUrl ?? "" };
  },
});
