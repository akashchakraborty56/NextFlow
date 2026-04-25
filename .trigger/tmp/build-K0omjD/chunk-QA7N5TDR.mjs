import {
  require_ffmpeg,
  require_ffprobe,
  require_fluent_ffmpeg
} from "./chunk-BSAJI3GC.mjs";
import {
  logger,
  task
} from "./chunk-ZPSUHUO6.mjs";
import {
  __name,
  __toESM,
  init_esm
} from "./chunk-GWEPR3K4.mjs";

// src/trigger/extract-frame-task.ts
init_esm();
var import_fluent_ffmpeg = __toESM(require_fluent_ffmpeg());
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
if (process.platform === "win32") {
  try {
    const ffmpegInstaller = require_ffmpeg();
    const ffprobeInstaller = require_ffprobe();
    import_fluent_ffmpeg.default.setFfmpegPath(ffmpegInstaller.path);
    import_fluent_ffmpeg.default.setFfprobePath(ffprobeInstaller.path);
  } catch (e) {
    console.warn("Media installers not found, falling back to system ffmpeg");
  }
}
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
//# sourceMappingURL=chunk-QA7N5TDR.mjs.map
