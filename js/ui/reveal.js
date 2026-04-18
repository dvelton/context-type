// Reveal mode — exaggerates adaptations to make them visible.
// Compare mode — holds static baseline for A/B comparison.

import { setRevealMode } from '../engine/adapter.js';

let revealActive = false;
let compareActive = false;
let articleBody = null;

export function init() {
  articleBody = document.querySelector('.article-body');

  // Reveal toggle
  const revealBtn = document.getElementById('toggle-reveal');
  revealBtn.addEventListener('click', () => {
    revealActive = !revealActive;
    setRevealMode(revealActive);
    revealBtn.classList.toggle('active', revealActive);
  });

  // Compare: hold button (mousedown/mouseup and touch)
  const compareBtn = document.getElementById('toggle-compare');
  const startCompare = () => {
    compareActive = true;
    articleBody.classList.add('compare-active');
    compareBtn.classList.add('active');
  };
  const endCompare = () => {
    compareActive = false;
    articleBody.classList.remove('compare-active');
    compareBtn.classList.remove('active');
  };

  compareBtn.addEventListener('mousedown', startCompare);
  compareBtn.addEventListener('mouseup', endCompare);
  compareBtn.addEventListener('mouseleave', endCompare);
  compareBtn.addEventListener('touchstart', startCompare, { passive: true });
  compareBtn.addEventListener('touchend', endCompare);
  compareBtn.addEventListener('touchcancel', endCompare);
}

export function isCompareActive() {
  return compareActive;
}

export function isRevealActive() {
  return revealActive;
}
