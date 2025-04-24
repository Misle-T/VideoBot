const { Telegraf } = require('telegraf');
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processVideo } from './ffmpegUtils';
import { Readable } from 'stream';
import dotenv from "dotenv";
import { Context } from 'telegraf';
dotenv.config();


const DESTINATION_ID = process.env.DESTINATION_ID; // Replace with your destination chat ID


const LOGO_PATH = 'assets/logo.png';
const OVERLAY_PATH = 'assets/overlay_text.png';
const OUTRO_PATH = 'assets/logo.png'; // Assuming the outro is the same as the logo

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx:Context) => {
  try {
    await ctx.reply('🎥 Send me a video and I’ll watermark it and add an outro!');
  } catch (err) {
    console.error('Failed to send start reply:', err);
  }
});
bot.on('video', async (ctx:Context) => {
  if (!ctx.message || !('video' in ctx.message)) {
    ctx.reply('❌ No video found in the message.');
    return;
  }
  const fileId = ctx.message.video.file_id;
  const caption = ctx.message.caption || ''; // 🔥 Extract the original caption (if any)
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const inputName = `input_${uuidv4()}.mp4`;
  const inputPath = path.join('vedious', inputName);

  // Ensure vedious/ directory exists
  const vediousDir = path.resolve('vedious');
  if (!fs.existsSync(vediousDir)) {
    fs.mkdirSync(vediousDir, { recursive: true });
  }

  ctx.reply('📥 Downloading video...');

  const res = await fetch(fileLink.href);
  const webStream = res.body;

  if (!webStream) {
    ctx.reply('❌ Could not fetch video.');
    return;
  }

  const nodeStream = Readable.fromWeb(webStream as any);
  const fileStream = fs.createWriteStream(inputPath);

  await new Promise((resolve, reject) => {
    nodeStream.pipe(fileStream);
    nodeStream.on('error', reject);
    fileStream.on('finish', () => resolve(undefined));
  });

  ctx.reply('⚙️ Processing with FFmpeg...');

  try {
    const outputPath = await processVideo(inputPath, LOGO_PATH, OVERLAY_PATH, OUTRO_PATH);

    if (!DESTINATION_ID) {
      ctx.reply('❌ Destination ID is not configured.');
      return;
    }

    await ctx.telegram.sendVideo(DESTINATION_ID, { 
      source: fs.createReadStream(outputPath) 
    }, { 
      caption 
    });

    ctx.reply('✅ Processed and sent!');
    fs.unlinkSync(outputPath);
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Failed to process the video.');
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
  }
});

bot.launch();
console.log('🤖 Bot is running...'); 

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
