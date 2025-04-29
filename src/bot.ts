import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import fs from 'fs';
import { downloadFile } from './download'; // Adjust the import path as necessary
import path from 'path';
import { exec } from 'child_process';

dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}
const bot = new Telegraf(token); // Replace with real bot token

const VIDEOS_FOLDER = 'videos/';
const OUTPUT_FOLDER = 'outputs/';
const SCREENSHOT_FOLDER = 'screenshots/';

// Ensure the folders exist
[VIDEOS_FOLDER, OUTPUT_FOLDER, SCREENSHOT_FOLDER].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
});

bot.on('video', async (ctx) => {
  const video = ctx.message.video;
  if (!video) return;

  try {
    console.log('📥 Video received from', ctx.from.username || ctx.from.first_name);

    const fileLink = await ctx.telegram.getFileLink(video.file_id);
    console.log('🔗 File link:', fileLink.href);

    const downloadedPath = await downloadFile(fileLink.href);
    console.log('📦 Downloaded to:', downloadedPath);

    // Define paths for processed video and screenshot
    const fileName = path.basename(downloadedPath, path.extname(downloadedPath));
    const processedPath = path.join(OUTPUT_FOLDER, `${fileName}_final.mp4`);
    const screenshotPath = path.join(SCREENSHOT_FOLDER, `${fileName}_thumb.jpg`);

    // Call the shell script to process the video
    const shellScriptPath = '/src/process_videos.sh'; // Adjust the path to your shell script
    exec(`bash ${shellScriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Script STDERR: ${stderr}`);
        return;
      }

      console.log(`Script Output: ${stdout}`);

      // Send the screenshot and the processed video back to the user
      ctx.replyWithPhoto({ source: screenshotPath }, { caption: 'Here is your screenshot!' });
      ctx.replyWithVideo({ source: processedPath }, { caption: '✅ Here is your processed video!' });

      // Optionally delete the processed files after sending them
      fs.unlinkSync(downloadedPath); // Delete the original video
      fs.unlinkSync(processedPath); // Delete the final video
      fs.unlinkSync(screenshotPath); // Delete the screenshot
    });
  } catch (err) {
    console.error('❌ Error processing video:', err);
    await ctx.reply('❌ Failed to process video. Please try again later.');
  }
});

bot.launch();
console.log('🤖 Bot is running...');
