import {
  logger,
  task
} from "./chunk-WWEDK4O3.mjs";
import {
  __name,
  init_esm
} from "./chunk-GOSPV2DU.mjs";

// src/trigger/text-task.ts
init_esm();
var textTask = task({
  id: "text-process",
  maxDuration: 30,
  retry: { maxAttempts: 1 },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("Text task started", { textLength: payload.text.length });
    return { text: payload.text ?? "" };
  }, "run")
});

export {
  textTask
};
//# sourceMappingURL=chunk-2DX7LAHK.mjs.map
