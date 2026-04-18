// Reading fingerprint — records font parameter changes over the reading session
// and renders a visual signature as a canvas image.

const COLORS = {
  CASL: '#60a5fa', // blue
  wght: '#f97316', // orange
  slnt: '#a78bfa', // purple
  opacity: '#34d399', // green
};

const AXIS_KEYS = ['CASL', 'wght', 'slnt', 'opacity'];

let recording = [];
let startTime = null;
let maxScrollProgress = 0;
let articleHeight = 0;

export function init() {
  startTime = performance.now();

  document.getElementById('show-fingerprint').addEventListener('click', showOverlay);
  document.getElementById('close-fingerprint').addEventListener('click', hideOverlay);
  document.getElementById('save-fingerprint').addEventListener('click', savePNG);

  buildLegend();
}

export function setArticleHeight(h) {
  articleHeight = h;
}

// Record a snapshot of the current state
export function record(targets) {
  if (!targets || targets.length === 0) return;

  const elapsed = performance.now() - startTime;
  const scrollProgress = articleHeight > window.innerHeight
    ? Math.max(0, Math.min(1, window.scrollY / (articleHeight - window.innerHeight)))
    : 0;

  maxScrollProgress = Math.max(maxScrollProgress, scrollProgress);

  // Average across visible paragraphs (center-weighted)
  const mid = Math.floor(targets.length / 2);
  const sample = targets[mid] || targets[0];

  recording.push({
    time: elapsed,
    progress: scrollProgress,
    CASL: sample.CASL,
    wght: sample.wght,
    slnt: sample.slnt,
    opacity: sample.opacity,
  });

  // Cap recording length (keep last 2000 samples at ~10Hz = ~3 min)
  if (recording.length > 2000) {
    recording = recording.slice(-2000);
  }
}

function buildLegend() {
  const container = document.getElementById('fingerprint-legend');
  AXIS_KEYS.forEach(key => {
    const item = document.createElement('span');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-swatch" style="background:${COLORS[key]}"></span>${key}`;
    container.appendChild(item);
  });
}

// Normalization ranges for rendering
const NORM = {
  CASL: { min: 0, max: 1 },
  wght: { min: 300, max: 650 },
  slnt: { min: -15, max: 0 },
  opacity: { min: 0.3, max: 1 },
};

function normalize(key, value) {
  const { min, max } = NORM[key];
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function render() {
  const canvas = document.getElementById('fingerprint-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const bandH = H / AXIS_KEYS.length;

  // Dark background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  if (recording.length < 2) {
    ctx.fillStyle = '#666';
    ctx.font = '14px Recursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Read the article to generate your fingerprint', W / 2, H / 2);
    return;
  }

  // Draw each axis band
  AXIS_KEYS.forEach((key, bandIdx) => {
    const y0 = bandIdx * bandH;
    const color = COLORS[key];

    // Draw axis label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px Recursive, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(key, 4, y0 + 13);

    // Draw signal as filled area
    ctx.beginPath();
    ctx.moveTo(0, y0 + bandH);

    recording.forEach((sample, i) => {
      const x = (i / (recording.length - 1)) * W;
      const norm = normalize(key, sample[key]);
      const y = y0 + bandH - norm * (bandH - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Close path along bottom
    ctx.lineTo(W, y0 + bandH);
    ctx.lineTo(0, y0 + bandH);
    ctx.closePath();

    // Fill with semi-transparent color
    ctx.fillStyle = color + '55';
    ctx.fill();

    // Stroke the top line
    ctx.beginPath();
    recording.forEach((sample, i) => {
      const x = (i / (recording.length - 1)) * W;
      const norm = normalize(key, sample[key]);
      const y = y0 + bandH - norm * (bandH - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Band separator
    if (bandIdx > 0) {
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(W, y0);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

function showOverlay() {
  render();
  document.getElementById('fingerprint-overlay').classList.remove('hidden');
}

function hideOverlay() {
  document.getElementById('fingerprint-overlay').classList.add('hidden');
}

function savePNG() {
  const canvas = document.getElementById('fingerprint-canvas');
  const link = document.createElement('a');
  link.download = 'reading-fingerprint.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
