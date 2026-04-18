// Reading history signal — tracks which paragraphs have been read
// (scrolled through slowly) and how long ago.
// Already-read paragraphs settle into a calmer typographic state.
// Unread paragraphs ahead have slight anticipatory energy.

const readState = new Map(); // paragraphIndex -> { read: bool, readAt: timestamp, dwellMs: number }
const DWELL_THRESHOLD = 1500; // ms a paragraph must be in focus to count as "read"
let dwellTimers = new Map();

export function init(paragraphs) {
  // Restore from sessionStorage
  try {
    const saved = sessionStorage.getItem('context-type-history');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.forEach(([k, v]) => readState.set(k, v));
    }
  } catch (e) { /* ignore */ }
}

export function onFocusUpdate(paragraphIndex, inFocus) {
  if (inFocus && !readState.has(paragraphIndex)) {
    if (!dwellTimers.has(paragraphIndex)) {
      dwellTimers.set(paragraphIndex, setTimeout(() => {
        readState.set(paragraphIndex, {
          read: true,
          readAt: Date.now(),
          dwellMs: DWELL_THRESHOLD
        });
        persist();
      }, DWELL_THRESHOLD));
    }
  } else if (!inFocus) {
    const timer = dwellTimers.get(paragraphIndex);
    if (timer) {
      clearTimeout(timer);
      dwellTimers.delete(paragraphIndex);
    }
  }
}

function persist() {
  try {
    sessionStorage.setItem('context-type-history',
      JSON.stringify(Array.from(readState.entries()))
    );
  } catch (e) { /* ignore */ }
}

export function getCurrentValue(paragraphIndex) {
  const state = readState.get(paragraphIndex);

  if (state && state.read) {
    // Read paragraphs: settled (value closer to 0)
    const age = (Date.now() - state.readAt) / 1000; // seconds
    const settleFactor = Math.min(age / 30, 1); // fully settled after 30s
    return {
      value: 0.1 + 0.2 * (1 - settleFactor), // 0.3 immediately after read, drifts to 0.1
      confidence: 0.9,
      meta: { read: true, age }
    };
  }

  // Unread: slight anticipatory energy
  return {
    value: 0.6,
    confidence: 0.7,
    meta: { read: false }
  };
}

export function getReadCount() {
  return readState.size;
}

export function getTotalDwell() {
  let total = 0;
  readState.forEach(v => { total += v.dwellMs || 0; });
  return total;
}

export const name = 'History';
export const type = 'per-paragraph';
export const category = 'reader';
