import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { message } from 'telegraf/filters';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN!);
const CHANNEL_ID = process.env.CHANNEL_ID!;

// Ensure directories exist
const VIDEOS_FOLDER = 'videos';
const OUTPUT_BASE = 'outputs';
const SCREENSHOT_FOLDER = 'screenshots';

[VIDEOS_FOLDER, OUTPUT_BASE, SCREENSHOT_FOLDER].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

bot.start((ctx) => {
  ctx.reply('Welcome! Send me a video file and I will process it for the channel.');
});

bot.on(message('video'), async (ctx) => {
  try {
    const message = ctx.update.message;
    const fileId = message.video.file_id;
    const fileName = `${Date.now()}_${message.video.file_name || 'video.mp4'}`;
    const filePath = path.join(VIDEOS_FOLDER, fileName);
    
    // Download the video
    ctx.reply('Downloading video...');
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const response = await fetch(fileLink);
    const fileData = await response.arrayBuffer();
    
    fs.writeFileSync(filePath, Buffer.from(fileData));
    
    ctx.reply('Video received! Processing...');
    
    // Process the video
    exec(`bash process_videos.sh`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        ctx.reply('Error processing video');
        return;
      }
      
      // Find the processed video
      const outputFileName = fileName.replace(/\.[^/.]+$/, '') + '_final.mp4';
      const outputPath = path.join(OUTPUT_BASE, outputFileName);
      
      if (fs.existsSync(outputPath)) {
        // Send to channel
        await ctx.telegram.sendVideo(CHANNEL_ID, { source: fs.createReadStream(outputPath) });
        ctx.reply('Video processed and sent to channel!');
        
        // Clean up
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
      } else {
        ctx.reply('Processing completed but output file not found');
      }
    });
  } catch (error) {
    console.error(error);
    ctx.reply('An error occurred while processing the video');
  }
});

bot.launch().then(() => {
  console.log('Bot is running');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));