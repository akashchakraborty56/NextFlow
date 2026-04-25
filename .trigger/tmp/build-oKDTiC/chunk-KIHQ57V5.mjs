import {
  logger,
  task
} from "./chunk-WWEDK4O3.mjs";
import {
  __name,
  init_esm
} from "./chunk-GOSPV2DU.mjs";

// src/trigger/upload-image-task.ts
init_esm();
var uploadImageTask = task({
  id: "upload-image-process",
  maxDuration: 30,
  retry: { maxAttempts: 1 },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("Upload image task started", { imageUrl: payload.imageUrl });
    return { imageUrl: payload.imageUrl ?? "" };
  }, "run")
});

export {
  uploadImageTask
};
//# sourceMappingURL=chunk-KIHQ57V5.mjs.map
