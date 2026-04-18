// Renderer — applies computed font targets to DOM elements
// via CSS custom properties. CSS transitions handle interpolation.

let paragraphs = [];

export function init(paragraphEls) {
  paragraphs = Array.from(paragraphEls);
}

export function apply(targets) {
  targets.forEach((t, i) => {
    const p = paragraphs[i];
    if (!p) return;

    p.style.setProperty('--casl', t.CASL.toFixed(3));
    p.style.setProperty('--wght', t.wght.toFixed(1));
    p.style.setProperty('--slnt', t.slnt.toFixed(2));
    p.style.setProperty('--mono', t.MONO.toFixed(3));
    p.style.setProperty('--lh', t.lh.toFixed(3));
    p.style.setProperty('--ls', t.ls.toFixed(4) + 'em');
    p.style.setProperty('--opacity', t.opacity.toFixed(3));
  });
}

export function reset() {
  paragraphs.forEach(p => {
    p.style.removeProperty('--casl');
    p.style.removeProperty('--wght');
    p.style.removeProperty('--slnt');
    p.style.removeProperty('--mono');
    p.style.removeProperty('--lh');
    p.style.removeProperty('--ls');
    p.style.removeProperty('--opacity');
  });
}
