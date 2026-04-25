import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';


interface ExtractFramePayload {
  videoUrl: string;
  timestamp: number;
  timestampMode?: 'seconds' | 'percentage';
}

function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration ?? 0;
      resolve(duration);
    });
  });
}

export const extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 60,
  retry: { maxAttempts: 2 },
  run: async (payload: ExtractFramePayload) => {
    logger.info("Extract frame task started", { timestamp: payload.timestamp, mode: payload.timestampMode });

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `input-${Date.now()}.mp4`);
    const outputPath = path.join(tmpDir, `output-${Date.now()}.png`);

    try {
      // 1. Download to tmp
      let buffer: Buffer;
      if (payload.videoUrl.startsWith('data:')) {
        const b64 = payload.videoUrl.split(',')[1];
        buffer = Buffer.from(b64, 'base64');
      } else {
        const res = await fetch(payload.videoUrl);
        buffer = Buffer.from(await res.arrayBuffer());
      }
      await fs.writeFile(inputPath, buffer);

      // 2. Resolve timestamp (percentage -> seconds)
      let seekTime = payload.timestamp || 0;
      if (payload.timestampMode === 'percentage') {
        const duration = await getVideoDuration(inputPath);
        seekTime = (payload.timestamp / 100) * duration;
        logger.info("Converted percentage to seconds", { percentage: payload.timestamp, duration, seekTime });
      }

      // 3. FFmpeg transform (extract frame)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(seekTime)
          .frames(1)
          .outputOptions(['-f image2', '-vcodec mjpeg'])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      // 4. Read back & encode
      const outBuffer = await fs.readFile(outputPath);
      const b64 = outBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${b64}`;

      logger.info("Extract frame task completed");
      return { frameImageUrl: dataUrl };
    } finally {
      // Cleanup
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  },
});
