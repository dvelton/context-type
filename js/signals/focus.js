// Focus zone signal — uses IntersectionObserver to track
// which paragraphs are in the viewport and how centered they are.
// Creates a depth-of-field effect: centered paragraphs at full
// typographic fidelity, peripheral ones simplify.

let visibilityMap = new Map(); // paragraphIndex -> ratio (0-1)
let centerMap = new Map();     // paragraphIndex -> closeness to viewport center (0-1)

export function init(paragraphs) {
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: estimate focus from scroll position
    window.addEventListener('scroll', () => updateCenter(paragraphs), { passive: true });
    updateCenter(paragraphs);
    return;
  }

  const thresholds = Array.from({ length: 20 }, (_, i) => i / 19);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = parseInt(entry.target.dataset.index, 10);
      visibilityMap.set(idx, entry.intersectionRatio);
    });
  }, { threshold: thresholds });

  paragraphs.forEach(p => observer.observe(p));

  // Track center proximity on scroll
  window.addEventListener('scroll', () => updateCenter(paragraphs), { passive: true });
  updateCenter(paragraphs);
}

function updateCenter(paragraphs) {
  const viewCenter = window.innerHeight / 2;

  paragraphs.forEach((p, i) => {
    const rect = p.getBoundingClientRect();
    const pCenter = rect.top + rect.height / 2;
    const distance = Math.abs(pCenter - viewCenter);
    const maxDist = window.innerHeight / 2;
    const closeness = Math.max(0, 1 - distance / maxDist);
    centerMap.set(i, closeness);
  });
}

export function getCurrentValue(paragraphIndex) {
  const visibility = visibilityMap.get(paragraphIndex) || 0;
  const center = centerMap.get(paragraphIndex) || 0;

  // Composite: visibility weighted by center proximity
  const value = visibility * (0.3 + 0.7 * center);

  return {
    value,
    confidence: 1,
    meta: { visibility, center }
  };
}

export const name = 'Focus Zone';
export const type = 'per-paragraph';
export const category = 'reader';
