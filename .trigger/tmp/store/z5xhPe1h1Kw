import {
  logger,
  task
} from "./chunk-WWEDK4O3.mjs";
import {
  __name,
  init_esm
} from "./chunk-GOSPV2DU.mjs";

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
//# sourceMappingURL=chunk-DYZCZO4I.mjs.map
