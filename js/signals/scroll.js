// Reading speed signal — derived from scroll velocity and pause detection.
// Outputs 0 (still / close reading) to 1 (fast skim).

const EMA_FACTOR = 0.12;
const MAX_SPEED = 2.5; // px/ms — anything above this is a fast skim
const PAUSE_THRESHOLD = 400; // ms without scroll = pause
const HYSTERESIS = 0.04; // dead zone to prevent micro-twitches

let lastY = 0;
let lastTime = 0;
let smoothed = 0;
let paused = false;
let pauseTimer = null;

function onScroll() {
  const now = performance.now();
  const dy = Math.abs(window.scrollY - lastY);
  const dt = now - lastTime;

  if (dt > 0) {
    const instant = dy / dt;
    smoothed = EMA_FACTOR * instant + (1 - EMA_FACTOR) * smoothed;
  }

  lastY = window.scrollY;
  lastTime = now;
  paused = false;

  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    paused = true;
    smoothed *= 0.5; // decay toward zero on pause
  }, PAUSE_THRESHOLD);
}

export function init() {
  lastY = window.scrollY;
  lastTime = performance.now();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function getCurrentValue() {
  let value = Math.min(smoothed / MAX_SPEED, 1);

  // Apply hysteresis
  if (value < HYSTERESIS) value = 0;

  return {
    value,
    confidence: 1,
    meta: { paused, rawSpeed: smoothed }
  };
}

export const name = 'Reading Speed';
export const type = 'global';
export const category = 'reader';
