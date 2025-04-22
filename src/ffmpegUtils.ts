import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const processVideo = (
  inputPath: string,
  logoPath: string,
  textOverlayPath: string,
  outroImagePath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const intermediatePath = `output/intermediate_${id}.mp4`;
    const outroVideo = `output/outro_${id}.mp4`;
    const finalOutput = `output/final_${id}.mp4`;

    // 1. Add both logo and text overlay
    ffmpeg(inputPath)
      .input(logoPath)
      .input(textOverlayPath)
      .complexFilter([
        "[0:v][1:v] overlay=10:10 [v1]",
        "[v1][2:v] overlay=main_w-overlay_w-10:main_h-overlay_h-10"
      ])
      .output(intermediatePath)
      .on('end', () => {
        // 2. Convert outro image to short video
        ffmpeg(outroImagePath)
          .loop(1)
          .outputOptions('-t 3') // 3-second outro
          .save(outroVideo)
          .on('end', () => {
            const listFile = `output/concat_${id}.txt`;
            fs.writeFileSync(listFile, `file '${path.resolve(intermediatePath)}'\nfile '${path.resolve(outroVideo)}'`);

            // 3. Concatenate both
            ffmpeg()
              .input(listFile)
              .inputOptions(['-f', 'concat', '-safe', '0'])
              .outputOptions('-c', 'copy')
              .save(finalOutput)
              .on('end', () => {
                fs.unlinkSync(intermediatePath);
                fs.unlinkSync(outroVideo);
                fs.unlinkSync(listFile);
                resolve(finalOutput);
              })
              .on('error', reject);
          })
          .on('error', reject);
      })
      .on('error', reject)
      .run();
  });
};
