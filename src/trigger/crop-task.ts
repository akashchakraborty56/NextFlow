import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);


interface CropPayload {
  imageUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

function getImageDimensions(inputPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find((s) => s.width && s.height);
      if (!stream) return reject(new Error("Could not determine image dimensions"));
      resolve({ width: stream.width!, height: stream.height! });
    });
  });
}

export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 60,
  retry: { maxAttempts: 2 },
  run: async (payload: CropPayload) => {
    logger.info("Crop image task started", { ...payload });

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `input-${Date.now()}.png`);
    const outputPath = path.join(tmpDir, `output-${Date.now()}.png`);

    try {
      // 1. Download to tmp
      let buffer: Buffer;
      if (payload.imageUrl.startsWith('data:')) {
        const b64 = payload.imageUrl.split(',')[1];
        buffer = Buffer.from(b64, 'base64');
      } else {
        const res = await fetch(payload.imageUrl);
        buffer = Buffer.from(await res.arrayBuffer());
      }
      await fs.writeFile(inputPath, buffer);

      // 2. Get dimensions and convert percentages to pixels
      const { width: imgW, height: imgH } = await getImageDimensions(inputPath);
      const x = Math.round((payload.xPercent / 100) * imgW);
      const y = Math.round((payload.yPercent / 100) * imgH);
      const w = Math.round((payload.widthPercent / 100) * imgW);
      const h = Math.round((payload.heightPercent / 100) * imgH);

      logger.info("Converted crop percentages to pixels", { imgW, imgH, x, y, w, h });

      // 3. FFmpeg transform
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters(`crop=${w}:${h}:${x}:${y}`)
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      // 4. Read back & encode
      const outBuffer = await fs.readFile(outputPath);
      const b64 = outBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${b64}`;

      logger.info("Crop task completed successfully");
      return { croppedImageUrl: dataUrl };
    } finally {
      // Cleanup
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  },
});
