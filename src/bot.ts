import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processVideo } from './ffmpegUtils';
import { Readable } from 'stream';
import dotenv from "dotenv";
dotenv.config();


const DESTINATION_ID = '-1001929111153';


const LOGO_PATH = 'assets/logo.png';
const OVERLAY_PATH = 'assets/overlay_text.png';
const OUTRO_PATH = 'assets/logo.png'; // Assuming the outro is the same as the logo

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('🎥 Send me a video and I’ll watermark it and add an outro!');
});

bot.on('video', async (ctx) => {
  try {
    const fileId = ctx.message.video.file_id;
    const caption = ctx.message.caption || '';
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const inputName = `input_${uuidv4()}.mp4`;
    const inputPath = path.join('vedious', inputName);

    // Ensure vedious/ directory exists
    const vediousDir = path.resolve('vedious');
    if (!fs.existsSync(vediousDir)) {
      fs.mkdirSync(vediousDir, { recursive: true });
    }

    await ctx.reply('📥 Downloading video...');

    const res = await fetch(fileLink.href);
    if (!res.ok || !res.body) {
      await ctx.reply('❌ Could not fetch video stream.');
      return;
    }

    const nodeStream = Readable.fromWeb(res.body as any);
    const fileStream = fs.createWriteStream(inputPath);

    await new Promise<void>((resolve, reject) => {
      nodeStream.pipe(fileStream);
      nodeStream.on('error', reject);
      fileStream.on('finish', () => resolve());
    });

    await ctx.reply('⚙️ Processing with FFmpeg...');

    const outputPath = await processVideo(inputPath, LOGO_PATH, OVERLAY_PATH, OUTRO_PATH);

    await ctx.telegram.sendVideo(
      ctx.chat.id, // Send back to user who forwarded or sent the video
      { source: fs.createReadStream(outputPath) },
      { caption }
    );

    await ctx.reply('✅ Processed and sent!');

    fs.unlinkSync(outputPath);
    fs.unlinkSync(inputPath);
  } catch (error) {
    console.error('Video processing failed:', error);
    await ctx.reply('❌ An error occurred during processing.');
  }
});



bot.launch();
console.log('🤖 Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
