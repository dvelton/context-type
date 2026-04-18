// Device context signal — captures environmental context from the device.
// Factors: touch vs pointer, viewport width, pixel ratio, reduced motion pref.
// Outputs a composite "device intimacy" score:
//   0 = large desktop with mouse (formal/spacious)
//   1 = small phone with touch (intimate/generous spacing)

let cachedValue = null;

export function init() {
  cachedValue = compute();
  // Re-compute on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { cachedValue = compute(); }, 300);
  });
}

function compute() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const vw = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Viewport contribution: smaller = more intimate
  let vpScore;
  if (vw <= 480) vpScore = 1;
  else if (vw <= 768) vpScore = 0.7;
  else if (vw <= 1200) vpScore = 0.35;
  else vpScore = 0.1;

  // Touch adds intimacy
  const touchScore = isTouch ? 0.3 : 0;

  // High DPR means retina / mobile — slightly more intimate
  const dprScore = dpr >= 2 ? 0.1 : 0;

  const composite = Math.min(1, vpScore + touchScore + dprScore);

  return {
    value: composite,
    confidence: 1,
    meta: { isTouch, vw, dpr, reducedMotion }
  };
}

export function getCurrentValue() {
  return cachedValue || compute();
}

export const name = 'Device';
export const type = 'global';
export const category = 'reader';
