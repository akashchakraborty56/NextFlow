import {
  logger,
  task
} from "./chunk-ZPSUHUO6.mjs";
import {
  __name,
  init_esm
} from "./chunk-GWEPR3K4.mjs";

// src/trigger/upload-video-task.ts
init_esm();
var uploadVideoTask = task({
  id: "upload-video-process",
  maxDuration: 30,
  retry: { maxAttempts: 1 },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("Upload video task started", { videoUrl: payload.videoUrl });
    return { videoUrl: payload.videoUrl ?? "" };
  }, "run")
});

export {
  uploadVideoTask
};
//# sourceMappingURL=chunk-KLM55JOO.mjs.map
