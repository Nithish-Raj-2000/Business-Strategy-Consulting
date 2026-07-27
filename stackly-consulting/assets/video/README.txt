HOMEPAGE HERO BACKGROUND VIDEO
==============================

The homepage hero (index.html) is already wired to play a looping,
muted background video. Until a file is present it shows the still
WebP photo (hero-home.webp) with a gentle zoom — no broken state.

To enable the video, drop EITHER of these files into this folder:

    hero.webm   (VP9/AV1 — best quality-per-byte, preferred)
    hero.mp4    (H.264 — widest browser support, fallback)

Providing both is ideal (the browser picks the first it supports).

Recommendations for a clean background loop:
  - 1920x1080, ~10-20 seconds, seamless loop
  - Muted (audio is ignored anyway), calm/slow motion
  - Business/strategy theme: office, city, meeting, data, skyline
  - Keep mp4 under ~5-8 MB so the page stays fast

Note: "WebP video" is not a real format — WebP is for images.
Web background video uses .mp4 / .webm, which is what this uses.
No code changes are needed once you add the file(s).
