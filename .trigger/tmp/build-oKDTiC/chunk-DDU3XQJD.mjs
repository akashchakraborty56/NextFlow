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

// src/trigger/extract-frame-task.ts
init_esm();
var import_fluent_ffmpeg = __toESM(require_fluent_ffmpeg());
var import_ffmpeg = __toESM(require_ffmpeg());
var import_ffprobe = __toESM(require_ffprobe());
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import_fluent_ffmpeg.default.setFfmpegPath(import_ffmpeg.default.path);
import_fluent_ffmpeg.default.setFfprobePath(import_ffprobe.default.path);
function getVideoDuration(inputPath) {
  return new Promise((resolve, reject) => {
    import_fluent_ffmpeg.default.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration ?? 0;
      resolve(duration);
    });
  });
}
__name(getVideoDuration, "getVideoDuration");
var extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 60,
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("Extract frame task started", { timestamp: payload.timestamp, mode: payload.timestampMode });
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `input-${Date.now()}.mp4`);
    const outputPath = path.join(tmpDir, `output-${Date.now()}.png`);
    try {
      let buffer;
      if (payload.videoUrl.startsWith("data:")) {
        const b642 = payload.videoUrl.split(",")[1];
        buffer = Buffer.from(b642, "base64");
      } else {
        const res = await fetch(payload.videoUrl);
        buffer = Buffer.from(await res.arrayBuffer());
      }
      await fs.writeFile(inputPath, buffer);
      let seekTime = payload.timestamp || 0;
      if (payload.timestampMode === "percentage") {
        const duration = await getVideoDuration(inputPath);
        seekTime = payload.timestamp / 100 * duration;
        logger.info("Converted percentage to seconds", { percentage: payload.timestamp, duration, seekTime });
      }
      await new Promise((resolve, reject) => {
        (0, import_fluent_ffmpeg.default)(inputPath).seekInput(seekTime).frames(1).outputOptions(["-f image2", "-vcodec mjpeg"]).output(outputPath).on("end", () => resolve()).on("error", (err) => reject(err)).run();
      });
      const outBuffer = await fs.readFile(outputPath);
      const b64 = outBuffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${b64}`;
      logger.info("Extract frame task completed");
      return { frameImageUrl: dataUrl };
    } finally {
      await fs.unlink(inputPath).catch(() => {
      });
      await fs.unlink(outputPath).catch(() => {
      });
    }
  }, "run")
});

export {
  extractFrameTask
};
//# sourceMappingURL=chunk-DDU3XQJD.mjs.map
