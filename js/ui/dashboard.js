// Dashboard — real-time visualization of context signals and font axis values.

let container = null;
let readerContainer = null;
let contentContainer = null;
let axisContainer = null;
let visible = false;

const SIGNAL_DEFS = [
  { key: 'scroll',    label: 'Speed',     cat: 'reader' },
  { key: 'attention', label: 'Attention',  cat: 'reader' },
  { key: 'time',      label: 'Time',       cat: 'reader' },
  { key: 'focus',     label: 'Focus',      cat: 'reader' },
  { key: 'history',   label: 'History',    cat: 'reader' },
  { key: 'device',    label: 'Device',     cat: 'reader' },
  { key: 'sentiment', label: 'Sentiment',  cat: 'content' },
];

const AXIS_DEFS = [
  { key: 'CASL', label: 'CASL', fmt: v => v.toFixed(2) },
  { key: 'wght', label: 'wght', fmt: v => v.toFixed(0) },
  { key: 'slnt', label: 'slnt', fmt: v => v.toFixed(1) },
  { key: 'MONO', label: 'MONO', fmt: v => v.toFixed(2) },
  { key: 'lh',   label: 'L/H',  fmt: v => v.toFixed(2) },
  { key: 'ls',   label: 'L/S',  fmt: v => (v * 1000).toFixed(1) + 'mu' },
];

export function init() {
  container = document.getElementById('dashboard');
  readerContainer = document.getElementById('signals-reader');
  contentContainer = document.getElementById('signals-content');
  axisContainer = document.getElementById('axis-values');

  // Build signal rows
  SIGNAL_DEFS.forEach(def => {
    const target = def.cat === 'reader' ? readerContainer : contentContainer;
    target.appendChild(createSignalRow(def));
  });

  // Build axis rows
  AXIS_DEFS.forEach(def => {
    axisContainer.appendChild(createAxisRow(def));
  });

  // Toggle button
  document.getElementById('toggle-dashboard').addEventListener('click', toggle);
  document.getElementById('close-dashboard').addEventListener('click', () => setVisible(false));
}

function createSignalRow(def) {
  const row = document.createElement('div');
  row.className = 'signal-row';
  row.dataset.signal = def.key;
  row.innerHTML = `
    <span class="signal-name">${def.label}</span>
    <div class="signal-bar-track">
      <div class="signal-bar-fill ${def.cat}" style="width: 0%"></div>
    </div>
    <span class="signal-value">0</span>
  `;
  return row;
}

function createAxisRow(def) {
  const row = document.createElement('div');
  row.className = 'axis-row';
  row.dataset.axis = def.key;
  row.innerHTML = `
    <span class="axis-name">${def.label}</span>
    <span class="axis-val">--</span>
  `;
  return row;
}

export function update(signalValues, axisTargets) {
  if (!visible) return;

  // Update signal bars
  SIGNAL_DEFS.forEach(def => {
    const row = container.querySelector(`[data-signal="${def.key}"]`);
    if (!row) return;
    const sig = signalValues[def.key];
    if (!sig) return;

    const fill = row.querySelector('.signal-bar-fill');
    const valEl = row.querySelector('.signal-value');
    const pct = (sig.value * 100).toFixed(0);
    fill.style.width = pct + '%';
    valEl.textContent = pct;
  });

  // Update axis values (use first paragraph as representative, or average)
  if (axisTargets && axisTargets.length > 0) {
    // Use the paragraph closest to viewport center
    const centerIdx = Math.floor(axisTargets.length / 2);
    const representative = axisTargets[centerIdx] || axisTargets[0];

    AXIS_DEFS.forEach(def => {
      const row = container.querySelector(`[data-axis="${def.key}"]`);
      if (!row || representative[def.key] === undefined) return;
      row.querySelector('.axis-val').textContent = def.fmt(representative[def.key]);
    });
  }
}

export function setCenterIndex(idx) {
  // Can be used to update which paragraph's axes are shown
}

function toggle() {
  setVisible(!visible);
}

function setVisible(v) {
  visible = v;
  container.classList.toggle('hidden', !v);
  document.getElementById('toggle-dashboard').classList.toggle('active', v);
}

export function isVisible() {
  return visible;
}
