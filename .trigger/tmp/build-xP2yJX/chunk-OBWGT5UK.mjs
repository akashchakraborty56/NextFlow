import {
  logger,
  task
} from "./chunk-ZPSUHUO6.mjs";
import {
  __name,
  init_esm
} from "./chunk-GWEPR3K4.mjs";

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
//# sourceMappingURL=chunk-OBWGT5UK.mjs.map
