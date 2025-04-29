// import ffmpeg from 'fluent-ffmpeg';
// import path from 'path';
// import fs from 'fs';
// import { v4 as uuidv4 } from 'uuid';

// export async function processVideo(inputPath: string): Promise<string> {
//   const id = uuidv4();
//   const baseName = path.basename(inputPath, path.extname(inputPath));

//   const normalizedPath = path.resolve(`output/${baseName}_normalized.mp4`);
//   const screenshotPath = path.resolve(`screenshots/${baseName}_thumb.jpg`);
//   const bannerPath = path.resolve(`output/${baseName}_banner.mp4`);
//   const finalPath = path.resolve(`output/${baseName}_final.mp4`);

//   await ensureDirectories();

//   await generateScreenshot(inputPath, screenshotPath);
//   await normalizeVideo(inputPath, normalizedPath);
//   await generateBanner(normalizedPath, bannerPath);
//   await concatenateVideos([normalizedPath, bannerPath], finalPath);

//   return finalPath;
// }

// async function ensureDirectories() {
//   const dirs = ['output', 'screenshots'];
//   for (const dir of dirs) {
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir);
//   }
// }

// function generateScreenshot(inputPath: string, outputPath: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .on('end', () => resolve())
//       .on('error', reject)
//       .screenshots({
//         count: 1,
//         timestamps: ['50%'],
//         filename: path.basename(outputPath),
//         folder: path.dirname(outputPath),
//         size: '320x240',
//       });
//   });
// }

// function normalizeVideo(inputPath: string, outputPath: string): Promise<void> {
//   return runFFmpeg(
//     ffmpeg(inputPath)
//       .videoCodec('libx264')
//       .audioCodec('aac')
//       .audioBitrate('128k')
//       .videoBitrate('1500k')
//       .outputOptions('-preset veryfast')
//       .save(outputPath)
//   );
// }

// function generateBanner(inputPath: string, outputPath: string): Promise<void> {
//   const logo = path.resolve('assets/logo.png');
//   const overlayText = path.resolve('assets/overlay_text.png');

//   return runFFmpeg(
//     ffmpeg(inputPath)
//       .complexFilter([
//         `[0:v][1:v] overlay=10:10 [tmp]; [tmp][2:v] overlay=W-w-10:H-h-10`,
//       ])
//       .input(logo)
//       .input(overlayText)
//       .videoCodec('libx264')
//       .outputOptions('-t 3') // only take 3 seconds for the banner
//       .save(outputPath)
//   );
// }

// function concatenateVideos(inputs: string[], outputPath: string): Promise<void> {
//   const listPath = path.resolve('output/concat_list.txt');
//   const listContent = inputs.map(file => `file '${path.resolve(file)}'`).join('\n');
//   fs.writeFileSync(listPath, listContent);

//   return runFFmpeg(
//     ffmpeg()
//       .input(listPath)
//       .inputOptions(['-f', 'concat', '-safe', '0'])
//       .outputOptions(['-c', 'copy'])
//       .save(outputPath)
//   );
// }

// function runFFmpeg(command: ffmpeg.FfmpegCommand): Promise<void> {
//   return new Promise((resolve, reject) => {
//     command
//       .on('end', () => resolve())
//       .on('error', (err) => {
//         console.error('FFmpeg failed:', err.message);
//         reject(new Error('FFmpeg processing failed'));
//       });
//   });
// }
