Optional hero image sequence
----------------------------
Put numbered frames here: 001.webp, 002.webp, 003.webp ...
Then open js/main.js and, in SETTINGS.heroSequence, set
  enabled: true
  frameCount: <number of frames>

The frames play as you scroll through the pinned hero. 60 to 150 frames
at around 1600px wide and 40 to 80KB each is a good balance.

To make frames from a video with ffmpeg (free):
  ffmpeg -i clip.mp4 -vf "fps=24,scale=1600:-1" -c:v libwebp -quality 70 %03d.webp
