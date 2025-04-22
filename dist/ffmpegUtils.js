"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideo = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const processVideo = (inputPath, logoPath, textOverlayPath, outroImagePath) => {
    return new Promise((resolve, reject) => {
        const id = (0, uuid_1.v4)();
        const intermediatePath = `output/intermediate_${id}.mp4`;
        const outroVideo = `output/outro_${id}.mp4`;
        const finalOutput = `output/final_${id}.mp4`;
        // 1. Add both logo and text overlay
        (0, fluent_ffmpeg_1.default)(inputPath)
            .input(logoPath)
            .input(textOverlayPath)
            .complexFilter([
            "[0:v][1:v] overlay=10:10 [v1]",
            "[v1][2:v] overlay=main_w-overlay_w-10:main_h-overlay_h-10"
        ])
            .output(intermediatePath)
            .on('end', () => {
            // 2. Convert outro image to short video
            (0, fluent_ffmpeg_1.default)(outroImagePath)
                .loop(1)
                .outputOptions('-t 3') // 3-second outro
                .save(outroVideo)
                .on('end', () => {
                const listFile = `output/concat_${id}.txt`;
                fs_1.default.writeFileSync(listFile, `file '${path_1.default.resolve(intermediatePath)}'\nfile '${path_1.default.resolve(outroVideo)}'`);
                // 3. Concatenate both
                (0, fluent_ffmpeg_1.default)()
                    .input(listFile)
                    .inputOptions(['-f', 'concat', '-safe', '0'])
                    .outputOptions('-c', 'copy')
                    .save(finalOutput)
                    .on('end', () => {
                    fs_1.default.unlinkSync(intermediatePath);
                    fs_1.default.unlinkSync(outroVideo);
                    fs_1.default.unlinkSync(listFile);
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
exports.processVideo = processVideo;
