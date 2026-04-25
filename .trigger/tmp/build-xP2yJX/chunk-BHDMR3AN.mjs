import {
  logger,
  task
} from "./chunk-ZPSUHUO6.mjs";
import {
  __name,
  init_esm
} from "./chunk-GWEPR3K4.mjs";

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
//# sourceMappingURL=chunk-BHDMR3AN.mjs.map
