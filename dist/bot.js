"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const ffmpegUtils_1 = require("./ffmpegUtils");
const stream_1 = require("stream");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const DESTINATION_ID = '-1001929111153';
const LOGO_PATH = 'assets/logo.png';
const OVERLAY_PATH = 'assets/overlay_text.png';
const OUTRO_PATH = 'assets/logo.png'; // Assuming the outro is the same as the logo
if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.start((ctx) => {
    ctx.reply('🎥 Send me a video and I’ll watermark it and add an outro!');
});
bot.on('video', async (ctx) => {
    const fileId = ctx.message.video.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const inputName = `input_${(0, uuid_1.v4)()}.mp4`;
    const inputPath = path_1.default.join('videos', inputName);
    ctx.reply('📥 Downloading video...');
    const res = await fetch(fileLink.href);
    const webStream = res.body;
    if (!webStream) {
        ctx.reply('❌ Could not fetch video.');
        return;
    }
    const nodeStream = stream_1.Readable.fromWeb(webStream); // Convert to Node.js stream
    const fileStream = fs_1.default.createWriteStream(inputPath);
    await new Promise((resolve, reject) => {
        nodeStream.pipe(fileStream);
        nodeStream.on('error', reject);
        fileStream.on('finish', () => resolve(undefined));
    });
    ctx.reply('⚙️ Processing with FFmpeg...');
    try {
        const outputPath = await (0, ffmpegUtils_1.processVideo)(inputPath, LOGO_PATH, OVERLAY_PATH, OUTRO_PATH);
        await ctx.telegram.sendVideo(DESTINATION_ID, { source: outputPath });
        ctx.reply('✅ Processed and sent!');
        fs_1.default.unlinkSync(outputPath);
    }
    catch (err) {
        console.error(err);
        ctx.reply('❌ Failed to process the video.');
    }
    finally {
        if (fs_1.default.existsSync(inputPath))
            fs_1.default.unlinkSync(inputPath);
    }
});
bot.launch();
console.log('🤖 Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
