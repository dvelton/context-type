# Context Type

**The text reads you back.**

A proof of concept where typography adapts in real time based on the reader's context. Same article, different readers, different typographic experiences.

**Try the live demo: [dvelton.github.io/context-type](https://dvelton.github.io/context-type/)**

## What it does

Context Type monitors seven signals from your browser and maps them to font parameters that change as you read:

| Signal | What it detects | What it changes |
|--------|----------------|-----------------|
| Attention | Where your eyes rest (via webcam) | Weight emphasis and opacity spotlight |
| Reading speed | How fast you scroll | Slant (italic feel when skimming) |
| Focus zone | Which paragraph is centered in the viewport | Depth-of-field emphasis |
| Reading history | Paragraphs you've already spent time on | Settled vs. anticipatory feel |
| Time of day | Your system clock | Overall weight and warmth |
| Device context | Screen size, touch capability | Spacing and sizing adjustments |
| Content sentiment | Emotional tone of each paragraph | Weight and casualness per section |

Six signals come from the reader. One comes from the content itself. Together they produce a typographic experience unique to each person.

## How to use it

1. Open [dvelton.github.io/context-type](https://dvelton.github.io/context-type/)
2. Click **Begin Reading** — the app requests camera access for eye tracking
3. If camera access is granted, click the five calibration dots that appear
4. Read the article and watch the typography respond to your attention

The controls bar at the bottom provides:

- **Signals** — a real-time dashboard of all signal values and font axis states
- **Fingerprint** — a visual signature of your reading session, exportable as PNG

Camera access is required. If eye tracking can't start, the app stays on the setup screen with a retry button and a description of what went wrong.

## Running locally

No build step required. Serve the files with any static server:

```
cd context-type
npx serve .
```

Then open `http://localhost:3000`.

## How it works

The app uses [Recursive](https://www.recursive.design/), a variable font with four axes (CASL, wght, slnt, MONO). Each signal module outputs a normalized 0-1 value. An adapter maps signals to font axis targets using weighted ownership — each axis has a primary signal that drives it, with secondary signals contributing within a capped range. The renderer applies targets as CSS custom properties, and CSS transitions handle smooth interpolation.

A radial focus lens overlay follows your gaze, creating a spotlight effect where text near your attention is clear and the rest dims.

Eye tracking uses [WebGazer.js](https://webgazer.cs.brown.edu/) for webcam-based gaze estimation. Gaze position is smoothed with an exponential moving average to reduce jitter. All processing runs in the browser — nothing leaves your device.

## Technology

- Vanilla HTML, CSS, and JavaScript (ES modules, no build step)
- Recursive variable font via Google Fonts
- WebGazer.js for eye tracking
- AFINN-165 sentiment lexicon for content analysis
- CSS `font-variation-settings` with transitions
- IntersectionObserver for viewport focus detection

## License

The project's own source code is released under the [MIT License](LICENSE).

This project depends on third-party components with their own licenses:

- **WebGazer.js** — [GPLv3](https://github.com/brownhci/WebGazer/blob/master/LICENSE.md). Loaded at runtime from a CDN; not bundled or redistributed in this repository.
- **Recursive font** — [SIL Open Font License 1.1](https://github.com/arrowtype/recursive/blob/main/OFL.txt). Loaded at runtime from Google Fonts.
- **AFINN-165 lexicon** — The word list used in `js/content/sentiment.js` is derived from the [AFINN](https://github.com/fnielsen/afinn) project (Apache 2.0).
