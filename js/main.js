// Main orchestrator — initializes signals and runs the adaptation loop.
// Eye tracking is attempted immediately on user click to stay within
// the browser's user-gesture context (required for camera permissions).

import { title, paragraphs as articleContent } from './content/article.js';
import * as scrollSignal from './signals/scroll.js';
import * as attentionSignal from './signals/attention.js';
import * as timeSignal from './signals/time.js';
import * as focusSignal from './signals/focus.js';
import * as historySignal from './signals/history.js';
import * as deviceSignal from './signals/device.js';
import * as sentimentSignal from './content/sentiment.js';
import * as adapter from './engine/adapter.js';
import * as renderer from './engine/renderer.js';
import * as dashboard from './ui/dashboard.js';
import * as fingerprint from './ui/fingerprint.js';

const TICK_INTERVAL = 100;
let lastTick = 0;
let paragraphEls = [];
let sentenceEls = [];
let running = false;
let focusLens = null;
let lensActive = false;

const EXPERTISE_CONST = { value: 0.3, confidence: 1, meta: { level: 'default' } };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function splitSentences(text) {
  const parts = [];
  const re = /([.!?])\s+(?=[A-Z])/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    parts.push(text.slice(last, match.index + 1));
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.filter(s => s.trim());
}

function renderArticle() {
  const body = document.getElementById('article-body');
  const titleEl = document.querySelector('.article-title');
  titleEl.textContent = title;

  let globalSentenceIdx = 0;

  articleContent.forEach((text, pIdx) => {
    const p = document.createElement('p');
    p.dataset.index = pIdx;

    const sentences = splitSentences(text);
    sentences.forEach((s, localIdx) => {
      if (localIdx > 0) p.appendChild(document.createTextNode(' '));
      const span = document.createElement('span');
      span.className = 'sentence';
      span.dataset.sentence = globalSentenceIdx;
      span.dataset.paragraph = pIdx;
      span.textContent = s;
      p.appendChild(span);
      globalSentenceIdx++;
    });

    body.appendChild(p);
  });

  paragraphEls = Array.from(body.querySelectorAll('p'));
  sentenceEls = Array.from(body.querySelectorAll('.sentence'));
}

function getSignals(paragraphIndex) {
  return {
    scroll: scrollSignal.getCurrentValue(),
    attention: attentionSignal.getCurrentValue(paragraphIndex),
    time: timeSignal.getCurrentValue(),
    focus: focusSignal.getCurrentValue(paragraphIndex),
    history: historySignal.getCurrentValue(paragraphIndex),
    device: deviceSignal.getCurrentValue(),
    expertise: EXPERTISE_CONST,
    sentiment: sentimentSignal.getCurrentValue(paragraphIndex),
  };
}

function getGlobalSignals() {
  const mid = Math.floor(paragraphEls.length / 2);
  return getSignals(mid);
}

function applySentenceAttention() {
  sentenceEls.forEach((span, i) => {
    const attn = attentionSignal.getSentenceAttention(i);
    const opacity = 0.40 + 0.60 * attn;
    span.style.opacity = opacity.toFixed(3);
  });
}

function updateFocusLens() {
  if (!focusLens) return;
  const pos = attentionSignal.getGazePosition();
  if (!pos) return;
  focusLens.style.setProperty('--lens-x', pos.x + 'px');
  focusLens.style.setProperty('--lens-y', pos.y + 'px');
  if (!lensActive) {
    lensActive = true;
    focusLens.classList.add('active');
  }
}

function loop(timestamp) {
  if (!running) return;

  if (timestamp - lastTick >= TICK_INTERVAL) {
    attentionSignal.tick();

    const targets = adapter.computeAll(paragraphEls.length, getSignals);
    renderer.apply(targets);
    fingerprint.record(targets);
    applySentenceAttention();
    updateFocusLens();
    dashboard.update(getGlobalSignals(), targets);

    paragraphEls.forEach((_, i) => {
      const focus = focusSignal.getCurrentValue(i);
      historySignal.onFocusUpdate(i, focus.value > 0.4);
    });

    lastTick = timestamp;
  }

  requestAnimationFrame(loop);
}

function runCalibration() {
  return new Promise((resolve) => {
    const overlay = document.getElementById('calibration');
    const dots = overlay.querySelectorAll('.calibration-dot');
    let clicked = 0;

    overlay.classList.remove('hidden');

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        dot.classList.add('clicked');
        clicked++;
        if (clicked >= dots.length) {
          setTimeout(() => {
            overlay.style.transition = 'opacity 0.4s';
            overlay.style.opacity = '0';
            setTimeout(() => {
              overlay.classList.add('hidden');
              overlay.style.opacity = '';
              resolve();
            }, 400);
          }, 300);
        }
      });
    });
  });
}

function setOnboardingStatus(msg) {
  const el = document.querySelector('.onboarding-body');
  if (el) el.textContent = msg;
}

function dismissOnboarding() {
  return new Promise((resolve) => {
    const overlay = document.getElementById('onboarding');
    overlay.style.transition = 'opacity 0.4s ease-out';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.opacity = '';
      document.getElementById('article-container').classList.remove('hidden');
      resolve();
    }, 400);
  });
}

function formatStartError(err) {
  const msg = String(err && err.message || err || '');
  if (/face_mesh|binarypb|wasm|solution/i.test(msg))
    return 'Eye tracking model failed to load. Please refresh and try again.';
  if (/NotAllowedError|Permission|denied/i.test(msg))
    return 'Camera access was blocked. Allow camera permission and try again.';
  if (/no gaze prediction/i.test(msg))
    return 'Camera started but no gaze detected. Make sure your face is visible and well-lit, then try again.';
  if (/script|not loaded/i.test(msg))
    return 'Eye tracking library did not load. Check your connection and refresh.';
  return 'Eye tracking could not start. Please try again.';
}

async function start() {
  if (running) return;

  const btn = document.getElementById('begin-reading');
  btn.disabled = true;
  btn.textContent = 'Starting\u2026';

  focusLens = document.getElementById('focus-lens');

  setOnboardingStatus('Requesting camera access\u2026');
  await attentionSignal.startWebGazer((msg) => setOnboardingStatus(msg));

  setOnboardingStatus('Eye tracking active. Preparing calibration\u2026');
  await sleep(400);

  await dismissOnboarding();

  // Init signals
  scrollSignal.init();
  attentionSignal.init(
    document.getElementById('article'),
    paragraphEls,
    sentenceEls
  );
  timeSignal.init();
  focusSignal.init(paragraphEls);
  historySignal.init(paragraphEls);
  deviceSignal.init();
  sentimentSignal.init(paragraphEls);

  // Init engine + UI
  renderer.init(paragraphEls);
  dashboard.init();
  fingerprint.init();
  fingerprint.setArticleHeight(document.getElementById('article').scrollHeight);

  // Calibration
  await runCalibration();

  running = true;
  requestAnimationFrame(loop);
}

// --- Boot ---
renderArticle();

// Gate Begin button on WebGazer script being loaded so that
// startWebGazer() never hits an async script-wait path, which
// would break the user-gesture context for camera permissions.
const _beginBtn = document.getElementById('begin-reading');
if (typeof webgazer === 'undefined') {
  _beginBtn.disabled = true;
  _beginBtn.textContent = 'Loading\u2026';
  const _wgScript = document.querySelector('script[src*="webgazer"]');
  if (_wgScript) {
    const _enableBtn = () => {
      _beginBtn.disabled = false;
      _beginBtn.textContent = 'Begin Reading';
    };
    _wgScript.addEventListener('load', _enableBtn);
    _wgScript.addEventListener('error', _enableBtn);
    setTimeout(_enableBtn, 12000);
  }
}

let started = false;
function handleBegin() {
  if (started) return;
  started = true;
  start().catch((err) => {
    console.error('Startup failed:', err);
    attentionSignal.cleanup();
    started = false;
    const btn = document.getElementById('begin-reading');
    btn.disabled = false;
    btn.textContent = 'Try Again';
    setOnboardingStatus(formatStartError(err));
  });
}

document.getElementById('begin-reading').addEventListener('click', handleBegin);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !started &&
      !document.getElementById('onboarding').classList.contains('hidden')) {
    handleBegin();
  }
});
