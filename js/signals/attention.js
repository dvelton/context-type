// Attention signal — webcam eye tracking via WebGazer.js.
// No mouse fallback. If eye tracking fails, the app stays on setup.

let gazeX = null;
let gazeY = null;
let smoothX = null;
let smoothY = null;
let webgazerReady = false;
let webgazerFailed = false;
let lastStartError = null;
let articleEl = null;
let paragraphs = [];
let sentenceEls = [];
let lastTickTime = -1;

const sentenceAttention = new Map();
const paragraphAttention = new Map();

const DECAY = 0.91;
const BOOST = 0.35;
const GAZE_RADIUS = 350;
const GAZE_SMOOTH = 0.22;
const FIRST_PREDICTION_TIMEOUT = 30000;

// WebGazer needs MediaPipe FaceMesh WASM assets. By default it looks
// for them relative to the page (./mediapipe/face_mesh), which doesn't
// exist on GitHub Pages. Point it at the CDN instead.
const FACE_MESH_CDN =
  'https://cdn.jsdelivr.net/npm/webgazer@3.5.3/dist/mediapipe/face_mesh';

let statusEl = null;

export function init(articleElement, paragraphElements, sentenceElements) {
  articleEl = articleElement;
  paragraphs = Array.from(paragraphElements);
  sentenceEls = Array.from(sentenceElements);
  statusEl = document.getElementById('gaze-status');
  updateStatus();
}

function waitForFirstPrediction(onProgress) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    let notified = false;
    const check = setInterval(() => {
      if (webgazerReady && gazeX !== null) {
        clearInterval(check);
        resolve();
        return;
      }
      const elapsed = performance.now() - start;
      if (!notified && elapsed > 4000 && onProgress) {
        notified = true;
        onProgress('Looking for your face\u2026 This can take a moment on first visit.');
      }
      if (elapsed > FIRST_PREDICTION_TIMEOUT) {
        clearInterval(check);
        reject(new Error(
          'Camera started but no gaze prediction was produced. ' +
          'Make sure your face is visible and well-lit.'
        ));
      }
    }, 150);
  });
}

export async function startWebGazer(onProgress) {
  if (typeof webgazer === 'undefined') {
    throw new Error('WebGazer script did not load.');
  }

  webgazerFailed = false;
  webgazerReady = false;
  lastStartError = null;
  gazeX = null;
  gazeY = null;
  smoothX = null;
  smoothY = null;

  try {
    // Point at CDN for MediaPipe FaceMesh WASM assets — must be
    // set BEFORE begin() so the face detector can find them.
    webgazer.params.faceMeshSolutionPath = FACE_MESH_CDN;
    webgazer.params.saveDataAcrossSessions = false;
    // Do NOT set showVideo/showVideoPreview to false before begin() —
    // WebGazer needs the video element active to process frames.
    // We hide it visually after begin() resolves.
    webgazer.params.showFaceOverlay = false;
    webgazer.params.showFaceFeedbackBox = false;
    webgazer.params.showGazeDot = false;

    webgazer.setRegression('ridge');

    webgazer.setGazeListener((data) => {
      if (!data) return;
      gazeX = data.x;
      gazeY = data.y;
      if (!webgazerReady) {
        webgazerReady = true;
        console.log('[eye-tracking] First gaze prediction received');
        updateStatus();
      }
    });

    console.log('[eye-tracking] Calling begin()...');
    if (onProgress) onProgress('Loading eye tracking model\u2026');
    await webgazer.begin();
    console.log('[eye-tracking] begin() resolved — camera and model ready');
    if (onProgress) onProgress('Camera active. Ready for calibration.');

    // Hide WebGazer's built-in UI AFTER begin() so the video feed
    // was created and is processing, but not visible.
    try { webgazer.showVideoPreview(false); } catch {}
    try { webgazer.showPredictionPoints(false); } catch {}
    try { webgazer.showFaceOverlay(false); } catch {}
    try { webgazer.showFaceFeedbackBox(false); } catch {}
    // Belt-and-suspenders: also hide via CSS in case the API misses it
    const videoEl = document.getElementById('webgazerVideoFeed');
    if (videoEl) videoEl.style.display = 'none';
    const videoContainer = document.getElementById('webgazerVideoContainer');
    if (videoContainer) videoContainer.style.display = 'none';

    // Don't wait for a gaze prediction here — ridge regression needs
    // calibration click data before it can produce coordinates.
    // Predictions will start flowing after the calibration step.
    updateStatus();
    return true;
  } catch (err) {
    lastStartError = err;
    webgazerFailed = true;
    console.error('[eye-tracking] Failed:', err);
    updateStatus();

    // Clean up partial state so retry starts fresh
    try { webgazer.end(); } catch {}
    const video = document.getElementById('webgazerVideoFeed');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
    }

    throw err;
  }
}

function updateStatus() {
  if (!statusEl) return;
  if (webgazerReady) {
    statusEl.textContent = 'Eye tracking active';
    statusEl.className = 'gaze-status mode-gaze';
  } else if (webgazerFailed) {
    statusEl.textContent = 'Eye tracking unavailable';
    statusEl.className = 'gaze-status';
  } else {
    statusEl.textContent = '';
    statusEl.className = 'gaze-status';
  }
}

export function tick() {
  const now = performance.now();
  if (now - lastTickTime < 50) return;
  lastTickTime = now;

  if (!webgazerReady || gazeX === null || !articleEl) return;

  if (smoothX === null) {
    smoothX = gazeX;
    smoothY = gazeY;
  } else {
    smoothX += (gazeX - smoothX) * GAZE_SMOOTH;
    smoothY += (gazeY - smoothY) * GAZE_SMOOTH;
  }

  const x = smoothX;
  const y = smoothY;

  const perParagraph = new Map();

  sentenceEls.forEach((span, i) => {
    const rect = span.getBoundingClientRect();
    const cy = rect.top + rect.height / 2;
    const cx = rect.left + rect.width / 2;
    const dy = Math.abs(y - cy);
    const dx = Math.abs(x - cx);
    const dist = Math.sqrt(dy * dy + dx * dx * 0.15);
    const proximity = Math.max(0, 1 - dist / GAZE_RADIUS);
    const current = sentenceAttention.get(i) || 0;
    const boosted = Math.min(1, current + proximity * BOOST);
    sentenceAttention.set(i, boosted);

    const pIdx = parseInt(span.dataset.paragraph, 10);
    const pMax = perParagraph.get(pIdx) || 0;
    perParagraph.set(pIdx, Math.max(pMax, boosted));
  });

  sentenceAttention.forEach((val, key) => {
    sentenceAttention.set(key, val * DECAY);
  });

  perParagraph.forEach((val, key) => {
    paragraphAttention.set(key, val);
  });
}

export function getGazePosition() {
  if (webgazerReady && smoothX !== null) {
    return { x: smoothX, y: smoothY, source: 'gaze' };
  }
  return null;
}

export function getSentenceAttention(sentenceIndex) {
  return sentenceAttention.get(sentenceIndex) || 0;
}

export function getCurrentValue(paragraphIndex) {
  if (!webgazerReady) {
    return { value: 0, confidence: 0, meta: { mode: 'unavailable' } };
  }
  if (paragraphIndex !== undefined) {
    return {
      value: paragraphAttention.get(paragraphIndex) || 0,
      confidence: 0.8,
      meta: { mode: 'gaze' }
    };
  }
  return { value: 0, confidence: 0 };
}

export function isGazeActive() {
  return webgazerReady;
}

export function getStatus() {
  return {
    mode: webgazerReady ? 'gaze' : 'inactive',
    active: webgazerReady,
    gazeReady: webgazerReady,
    failed: webgazerFailed,
    error: lastStartError ? lastStartError.message : null,
  };
}

export function cleanup() {
  try {
    if (typeof webgazer !== 'undefined') webgazer.end();
  } catch {}
  const video = document.getElementById('webgazerVideoFeed');
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
  webgazerReady = false;
  webgazerFailed = false;
  gazeX = null;
  gazeY = null;
  smoothX = null;
  smoothY = null;
}

export const name = 'Attention';
export const type = 'per-paragraph';
export const category = 'reader';
