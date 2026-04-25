import {
  require_ffmpeg,
  require_ffprobe,
  require_fluent_ffmpeg
} from "./chunk-HW2RY4CK.mjs";
import {
  logger,
  task
} from "./chunk-WWEDK4O3.mjs";
import {
  __name,
  __toESM,
  init_esm
} from "./chunk-GOSPV2DU.mjs";

// src/trigger/crop-task.ts
init_esm();
var import_fluent_ffmpeg = __toESM(require_fluent_ffmpeg());
var import_ffmpeg = __toESM(require_ffmpeg());
var import_ffprobe = __toESM(require_ffprobe());
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import_fluent_ffmpeg.default.setFfmpegPath(import_ffmpeg.default.path);
import_fluent_ffmpeg.default.setFfprobePath(import_ffprobe.default.path);
function getImageDimensions(inputPath) {
  return new Promise((resolve, reject) => {
    import_fluent_ffmpeg.default.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find((s) => s.width && s.height);
      if (!stream) return reject(new Error("Could not determine image dimensions"));
      resolve({ width: stream.width, height: stream.height });
    });
  });
}
__name(getImageDimensions, "getImageDimensions");
var cropImageTask = task({
  id: "crop-image",
  maxDuration: 60,
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("Crop image task started", { ...payload });
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `input-${Date.now()}.png`);
    const outputPath = path.join(tmpDir, `output-${Date.now()}.png`);
    try {
      let buffer;
      if (payload.imageUrl.startsWith("data:")) {
        const b642 = payload.imageUrl.split(",")[1];
        buffer = Buffer.from(b642, "base64");
      } else {
        const res = await fetch(payload.imageUrl);
        buffer = Buffer.from(await res.arrayBuffer());
      }
      await fs.writeFile(inputPath, buffer);
      const { width: imgW, height: imgH } = await getImageDimensions(inputPath);
      const x = Math.round(payload.xPercent / 100 * imgW);
      const y = Math.round(payload.yPercent / 100 * imgH);
      const w = Math.round(payload.widthPercent / 100 * imgW);
      const h = Math.round(payload.heightPercent / 100 * imgH);
      logger.info("Converted crop percentages to pixels", { imgW, imgH, x, y, w, h });
      await new Promise((resolve, reject) => {
        (0, import_fluent_ffmpeg.default)(inputPath).videoFilters(`crop=${w}:${h}:${x}:${y}`).output(outputPath).on("end", () => resolve()).on("error", (err) => reject(err)).run();
      });
      const outBuffer = await fs.readFile(outputPath);
      const b64 = outBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${b64}`;
      logger.info("Crop task completed successfully");
      return { croppedImageUrl: dataUrl };
    } finally {
      await fs.unlink(inputPath).catch(() => {
      });
      await fs.unlink(outputPath).catch(() => {
      });
    }
  }, "run")
});

export {
  cropImageTask
};
//# sourceMappingURL=chunk-OICVP55N.mjs.map
