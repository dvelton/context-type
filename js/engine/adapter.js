// Adapter — the brain of the system.
// Maps signal values to font parameter targets per paragraph.
// Each axis has a primary signal owner. Secondary signals can
// contribute within a capped range. This prevents signal conflict.

// Axis ranges (normal mode)
const AXIS_RANGE = {
  CASL: { min: 0, max: 0.45, default: 0 },
  wght: { min: 360, max: 460, default: 400 },
  slnt: { min: -6, max: 0, default: 0 },
  MONO: { min: 0, max: 0, default: 0 }, // disabled for live animation
  lh:   { min: 1.50, max: 1.80, default: 1.65 },
  ls:   { min: -0.005, max: 0.015, default: 0 },
  opacity: { min: 0.55, max: 1.0, default: 1.0 },
};

// Reveal mode multiplier — widens ranges for visibility
const REVEAL_RANGES = {
  CASL: { min: 0, max: 1.0 },
  wght: { min: 300, max: 650 },
  slnt: { min: -15, max: 0 },
  MONO: { min: 0, max: 0.5 },
  lh:   { min: 1.35, max: 2.0 },
  ls:   { min: -0.01, max: 0.03 },
  opacity: { min: 0.35, max: 1.0 },
};

let revealMode = false;

export function setRevealMode(enabled) {
  revealMode = enabled;
}

function getRange(axis) {
  return revealMode ? REVEAL_RANGES[axis] : AXIS_RANGE[axis];
}

function lerp(min, max, t) {
  return min + (max - min) * Math.max(0, Math.min(1, t));
}

// Compute font targets for a single paragraph.
// signals = { scroll, attention, time, focus, history, device, expertise, sentiment }
// Each is { value: 0-1, confidence: 0-1 }
export function computeTargets(paragraphIndex, signals) {
  const r = (axis) => getRange(axis);

  // --- CASL (Casual axis) ---
  // Primary: expertise (low expertise = more casual/friendly)
  // Secondary: sentiment (positive = slightly more casual)
  const expertiseContrib = 1 - signals.expertise.value; // invert: newcomer=high casual
  const sentimentCaslContrib = Math.max(0, (signals.sentiment.value - 0.5) * 0.3);
  const caslT = expertiseContrib * 0.8 + sentimentCaslContrib;
  const CASL = lerp(r('CASL').min, r('CASL').max, caslT);

  // --- wght (Weight) ---
  // Primary: attention + focus zone (attended/in-focus = heavier for emphasis)
  // Secondary: time of day (evening = heavier)
  // Tertiary: sentiment (negative = heavier)
  const attentionWghtContrib = signals.attention.value * 0.35;
  const focusWghtContrib = signals.focus.value * 0.30;
  const timeWghtContrib = signals.time.value * 0.20;
  const sentimentWghtContrib = (1 - signals.sentiment.value) * 0.15;
  const wghtT = attentionWghtContrib + focusWghtContrib + timeWghtContrib + sentimentWghtContrib;
  const wght = lerp(r('wght').min, r('wght').max, wghtT);

  // --- slnt (Slant) ---
  // Primary: reading speed (fast = more slant, like italic for skimming)
  const slntT = signals.scroll.value;
  const slnt = lerp(r('slnt').min, r('slnt').max, slntT);

  // --- MONO (Monospace) ---
  // Static: based on expertise only, not animated live
  const MONO = revealMode ? lerp(r('MONO').min, r('MONO').max, signals.expertise.value * 0.4) : 0;

  // --- line-height ---
  // Primary: device (smaller device = more generous)
  // Secondary: expertise (newcomer = more generous)
  const deviceLhContrib = signals.device.value * 0.5;
  const expertiseLhContrib = (1 - signals.expertise.value) * 0.35;
  const focusLhContrib = (1 - signals.focus.value) * 0.15; // out of focus = slightly more open
  const lhT = deviceLhContrib + expertiseLhContrib + focusLhContrib;
  const lh = lerp(r('lh').min, r('lh').max, lhT);

  // --- letter-spacing ---
  // Primary: expertise (newcomer = more generous)
  // Secondary: device (smaller = more generous)
  const expertiseLsContrib = (1 - signals.expertise.value) * 0.6;
  const deviceLsContrib = signals.device.value * 0.4;
  const lsT = expertiseLsContrib + deviceLsContrib;
  const ls = lerp(r('ls').min, r('ls').max, lsT);

  // --- opacity (paragraph-level) ---
  // Driven by focus zone + history only.
  // Sentence-level attention opacity is applied separately by the renderer.
  const focusOpContrib = signals.focus.value * 0.65;
  const historyOpContrib = signals.history.meta?.read ? -0.05 : 0;
  const opT = focusOpContrib + 0.35; // floor so nothing disappears
  const opacity = lerp(r('opacity').min, r('opacity').max, Math.min(1, opT + historyOpContrib));

  return { CASL, wght, slnt, MONO, lh, ls, opacity };
}

// Compute targets for all paragraphs given global and per-paragraph signal getters.
export function computeAll(paragraphCount, getSignals) {
  const targets = [];
  for (let i = 0; i < paragraphCount; i++) {
    targets.push(computeTargets(i, getSignals(i)));
  }
  return targets;
}
