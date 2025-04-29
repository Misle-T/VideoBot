#!/bin/bash

# 🔧 Define paths and settings
VIDEOS_FOLDER="videos"
ASSETS_FOLDER="assets"
OUTPUT_BASE="outputs"
SCREENSHOT_FOLDER="/screenshots"
FONT_PATH="/assets/font.ttf"
FONT_BOLD_PATH="/assets/bold.ttf"
LOGO_PATH="/assets/logo.png"
BANNER_BG_COLOR="#FFFFFF"  # change this to any valid color (e.g., "#FFFFFF", "red", "black@0.8")

# 🎨 Auto-set text color based on banner background
if [[ "$BANNER_BG_COLOR" == black* || "$BANNER_BG_COLOR" == "#000000"* || "$BANNER_BG_COLOR" == *"@0."* ]]; then
    TEXT_COLOR="white"
else
    TEXT_COLOR="black"
fi

# 📁 Create output folders if they don't exist
mkdir -p "$OUTPUT_BASE" "$SCREENSHOT_FOLDER"

# 📌 Get absolute paths
VIDEOS_FOLDER_ABS=$(realpath "$VIDEOS_FOLDER")
OUTPUT_BASE_ABS=$(realpath "$OUTPUT_BASE")
SCREENSHOT_FOLDER_ABS=$(realpath "$SCREENSHOT_FOLDER")
LOGO_ABS=$(realpath "$LOGO_PATH")
FONT_ABS=$(realpath "$FONT_PATH")
FONT_BOLD_ABS=$(realpath "$FONT_BOLD_PATH")

# 🎬 Loop through all video files in the videos folder
for FILE in "$VIDEOS_FOLDER_ABS"/*.mp4 "$VIDEOS_FOLDER_ABS"/*.mov; do
    
    [[ -e "$FILE" ]] || continue

    BASENAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
    echo "🚀 Processing: $FILE"

    # 📝 Set dynamic banner text
    TEXT1="Per altri video (quasi) gratis"
    TEXT2="passa a trovarci su:"
    TEXT3="www.pornosmezzati.it"
    TEXT4="unisciti alla nostra community per risparmiare"

    # 📸 Take full-size screenshot of first frame
    SCREENSHOT_PATH="$SCREENSHOT_FOLDER_ABS/${BASENAME}_thumb.jpg"
    ffmpeg -y -i "$FILE" -vf "select=eq(n\,0)" -q:v 2 -frames:v 1 "$SCREENSHOT_PATH"
    echo "🖼️ Screenshot saved: $SCREENSHOT_PATH"

    # 🎞️ Normalize video
    NORMALIZED="$VIDEOS_FOLDER_ABS/${BASENAME}_fixed.mp4"
    ffmpeg -y -err_detect ignore_err -i "$FILE" -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k "$NORMALIZED"
    
    # 📏 Get video resolution
    RES=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$NORMALIZED")
    WIDTH=$(echo $RES | cut -d'x' -f1)
    HEIGHT=$(echo $RES | cut -d'x' -f2)

    echo "📐 Resolution: ${WIDTH}x${HEIGHT}"

    if (( WIDTH > HEIGHT )); then # horizontal video
        FONT_SCALE="w*0.025"
    else # vertical video
        FONT_SCALE="w*0.04"
    fi

    # 🔤 Apply animated text overlay
    PROCESSED="$VIDEOS_FOLDER_ABS/${BASENAME}_processed.mp4"
    ffmpeg -y -err_detect ignore_err -i "$NORMALIZED" -vf "drawtext=fontfile=$FONT_ABS:text='$TEXT3':fontcolor=white:fontsize=$FONT_SCALE:borderw=3:bordercolor=black:box=1:boxcolor=black@0.5:boxborderw=5:x=abs((w-text_w)*0.5*(1+sin(2*PI*t*0.02))):y=abs((h-text_h)*0.5*(1+cos(2*PI*t*0.02)))" -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k "$PROCESSED"

    # 🧩 Create banner with logo + text
    BANNER="$VIDEOS_FOLDER_ABS/${BASENAME}_banner.mp4"
    if (( WIDTH > HEIGHT )); then # horizontal video
        ffmpeg -y -f lavfi -t 5 -i "color=${BANNER_BG_COLOR}:s=${WIDTH}x${HEIGHT}:r=30" -i "$LOGO_ABS" \
            -filter_complex "[1:v][0:v]scale2ref=w=ih*0.8:h=ih/4[logo][base]; \
            [base][logo]overlay=(W-w)/2:H*0.08[video]; \
            [video]drawtext=fontfile=$FONT_ABS:text='$TEXT1':fontcolor=${TEXT_COLOR}:fontsize=H*0.05:x=(w-text_w)/2:y=H*0.35, \
            drawtext=fontfile=$FONT_ABS:text='$TEXT2':fontcolor=${TEXT_COLOR}:fontsize=H*0.05:x=(w-text_w)/2:y=H*0.42, \
            drawtext=fontfile=$FONT_BOLD_ABS:text='$TEXT3':fontcolor=${TEXT_COLOR}:fontsize=H*0.06:x=(w-text_w)/2:y=H*0.55, \
            drawtext=fontfile=$FONT_ABS:text='$TEXT4':fontcolor=${TEXT_COLOR}:fontsize=H*0.04:x=(w-text_w)/2:y=H*0.68" \
            -c:v libx264 -preset slow -crf 18 -an "$BANNER"
    else # vertical video
       ffmpeg -y -f lavfi -t 5 -i "color=${BANNER_BG_COLOR}:s=${WIDTH}x${HEIGHT}:r=30" -i "$LOGO_ABS" -filter_complex \
            "[1:v]scale=w=iw*min(1\,${WIDTH}/iw*0.8):h=-1[logo];[0:v][logo]overlay=x=(main_w-overlay_w)/2:y=main_h*0.15[bg]; \
            [bg]drawtext=fontfile=$FONT_ABS:text='$TEXT1':fontcolor=${TEXT_COLOR}:fontsize=H*0.03:x=(w-text_w)/2:y=h*0.35,\
            drawtext=fontfile=$FONT_ABS:text='$TEXT2':fontcolor=${TEXT_COLOR}:fontsize=H*0.03:x=(w-text_w)/2:y=h*0.40,\
            drawtext=fontfile=$FONT_BOLD_ABS:text='$TEXT3':fontcolor=${TEXT_COLOR}:fontsize=H*0.04:x=(w-text_w)/2:y=h*0.48,\
            drawtext=fontfile=$FONT_ABS:text='$TEXT4':fontcolor=${TEXT_COLOR}:fontsize=H*0.02:x=(w-text_w)/2:y=h*0.58" \
            -c:v libx264 -preset slow -crf 18 -an "$BANNER"
    fi

    # 🔗 Concatenate main video + banner
    CONCAT_LIST="$VIDEOS_FOLDER_ABS/${BASENAME}_concat.txt"
    echo "file '$PROCESSED'" > "$CONCAT_LIST"
    echo "file '$BANNER'" >> "$CONCAT_LIST"

    FINAL="$OUTPUT_BASE_ABS/${BASENAME}_final.mp4"
    ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$FINAL"
    echo "✅ Final video saved: $FINAL"

    # 🧹 Cleanup temp files
    rm -f "$NORMALIZED" "$PROCESSED" "$BANNER" "$CONCAT_LIST"

done

echo "🎉 All videos processed! Check the $OUTPUT_BASE_ABS and $SCREENSHOT_FOLDER_ABS folders."