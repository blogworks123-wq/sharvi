# Sharvi’s 15th Birthday Website

## Host it yourself

1. Extract this ZIP.
2. Upload the contents of this folder to your static web host, keeping `index.html` in the website root and the `vendor` folder alongside it.
3. No build step, installation, account, API key, backend, or ChatGPT hosting is required.

The website also supports hosting inside a subfolder because its local asset paths are relative. Your server must serve `.js` and `.mjs` files with a JavaScript MIME type.

## Preview locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. Use a local server instead of double-clicking `index.html`, because the interactive sections use JavaScript modules.

## Add the soundtrack

Place your authorized MP3 of **Her Way by PARTYNEXTDOOR** next to `index.html` and name it exactly:

```
birthday-music.mp3
```

The audio recording is not included. Music plays only after pressing the music button.

## Files

- `index.html` — all sections and birthday text
- `style.css` — styling and responsive layouts
- `app.js` — opening, countdown reveal, interactions, particles, music
- `scenes.js` — 3D cake, fifteen candles, and gift animation
- `time.mjs` — birthday date and countdown calculations
- `vendor/` — locally included GSAP, ScrollTrigger, Lenis, and Three.js

The birthday starts at **October 3, 2026, 00:00 Asia/Kolkata** (October 2, 18:30 UTC), regardless of the visitor’s timezone. Visits after midnight automatically show the birthday greeting.

Google Fonts supplies DM Sans and Italiana; system font fallbacks are included. No photographs or fabricated memories are used.

Third-party library copyright notices are retained in their original source files.
