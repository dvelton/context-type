// Onboarding overlay — handles the intro screen and gaze opt-in.

let onBegin = null;
let started = false;

export function init(callback) {
  onBegin = callback;

  const beginBtn = document.getElementById('begin-reading');
  beginBtn.addEventListener('click', handleBegin);

  // Allow Enter key to begin
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !started && !document.getElementById('onboarding').classList.contains('hidden')) {
      handleBegin();
    }
  });
}

function handleBegin() {
  if (started) return;
  started = true;

  const enableGaze = document.getElementById('enable-gaze').checked;

  // Fade out onboarding
  const overlay = document.getElementById('onboarding');
  overlay.style.transition = 'opacity 0.4s ease-out';
  overlay.style.opacity = '0';

  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.style.opacity = '';

    // Show article
    document.getElementById('article-container').classList.remove('hidden');

    if (onBegin) onBegin({ enableGaze });
  }, 400);
}
