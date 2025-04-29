# Automated Video Banner Overlay Script - User Guide

## Overview
This script automates video post-processing by:
- Capturing a screenshot from the first frame of the video
- Normalizing FPS and video format
- Adding an animated bouncing watermark text
- Creating a 5-second outro banner with a logo and promotional text
- Concatenating the processed video with the banner
- Saving outputs and screenshots to separate folders
- Cleaning up temporary files automatically

---

## Prerequisites
### 1. Install FFmpeg
Ensure FFmpeg is installed on your system:
- **Check Installation:**
  ```sh
  ffmpeg -version
  ```
- **Install FFmpeg:**
  - **Ubuntu/Debian:** `sudo apt update && sudo apt install ffmpeg -y`
  - **Mac (Homebrew):** `brew install ffmpeg`
  - **Windows:** Download from [FFmpeg.org](https://ffmpeg.org/download.html)

### 2. Folder Structure
Ensure the following structure exists:
```
├── process_videos.sh      # The script file
├── font.ttf               # Regular font file
├── bold.ttf               # Bold font file
├── assets/                # Contains logo.png
│   └── logo.png           # Transparent PNG logo (recommended)
├── videos/                # Folder containing input videos
│   ├── video1.mp4
│   ├── video2.mov
├── outputs/               # Final processed videos go here
├── screenshots/           # First-frame screenshots go here
```

---

## Running the Script
### 1. Make the Script Executable
```sh
chmod +x process_videos.sh
```

### 2. Run the Script
```sh
./process_videos.sh
```

### 3. What Happens?
- Takes the first frame of each video as a screenshot
- Normalizes video (30 FPS, yuv420p, H.264, AAC)
- Adds a center-placed, bouncing watermark using sine/cosine animation
- Creates a 5-second banner outro using your logo and four lines of text
- Scales the banner to match the original video's resolution
- Merges the processed video with the banner
- Saves the final video to `outputs/`
- Cleans up intermediate files

---

## Customization Options

### 🔤 Change Banner Text
Edit these lines in the script:
```bash
TEXT1="Per altri video (quasi) gratis"
TEXT2="passa a trovarci su:"
TEXT3="www.pornosmezzati.it"
TEXT4="unisciti alla nostra community per risparmiare"
```

### 🎨 Change Banner Background or Text Color
Modify this line:
```bash
BANNER_BG_COLOR="#FFFFFF"
```
- Supports standard color names or hex (e.g., `#000000`, `red`, `black@0.7`)
- The script auto-adjusts text color for readability (black or white)

### 🖋 Change Font Files
Update the font paths:
```bash
FONT_PATH="font.ttf"
FONT_BOLD_PATH="bold.ttf"
```
Use high-quality `.ttf` fonts for better appearance.

### 🖼️ Replace Logo
Replace `assets/logo.png` with your own logo file.
- Transparent `.png` recommended
- Square logos look best for centered layout

### ⚙️ Advanced Tweaks (Optional)
- Change banner duration: edit `-t 5` in the banner section
- Improve quality: lower CRF (e.g., `-crf 18`)
- Change output resolution: edit scale filters (if needed)

---

## Output Examples
- Screenshot (first frame): `screenshots/video1_thumb.jpg`
- Final video: `outputs/video1_final.mp4`

---

## Troubleshooting
### "Command not found: ffmpeg"
Install FFmpeg as shown in **Prerequisites**.

### "No video files found in 'videos/'"
Ensure `.mp4` or `.mov` files are present in the `videos/` folder.

### "drawtext filter not working"
Check if FFmpeg supports `drawtext`:
```sh
ffmpeg -filters | grep drawtext
```

### "Final video not saving"
Make sure the required logo and font files are present and valid.

### "Output is low quality"
Lower the CRF value in the script:
```bash
-crf 23
```
Try `-crf 18` for better quality (larger file size).

---

## Conclusion
After processing, your videos will feature a dynamic bouncing watermark and a professionally styled branded banner at the end. Check the `outputs/` folder for final videos and `screenshots/` for thumbnails. 🎬✨
