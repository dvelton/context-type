// Expertise level signal — user-declared via toggle.
// 0 = newcomer (friendlier, more generous spacing)
// 1 = expert (tighter, more formal)

let value = 0; // default: newcomer

export function init() {
  const toggle = document.getElementById('expertise-switch');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      value = e.target.checked ? 1 : 0;
      updateLabels(e.target.checked);
    });
    updateLabels(toggle.checked);
  }
}

function updateLabels(isExpert) {
  document.querySelectorAll('.expertise-label').forEach(label => {
    const match = (label.dataset.value === 'expert') === isExpert ||
                  (label.dataset.value === 'newcomer') === !isExpert;
    label.classList.toggle('active', match);
  });
}

export function getCurrentValue() {
  return {
    value,
    confidence: 1,
    meta: { level: value === 0 ? 'newcomer' : 'expert' }
  };
}

export const name = 'Expertise';
export const type = 'global';
export const category = 'reader';
