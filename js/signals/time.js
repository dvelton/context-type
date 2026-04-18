// Time of day signal.
// Maps the current hour to a 0-1 value:
//   0.0 = early morning (light, open typography)
//   1.0 = late night (heavier, tighter, cozier)
// Uses a smooth sinusoidal curve peaking around midnight.

export function init() {
  // No setup needed — reads system clock.
}

export function getCurrentValue() {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const fractionalHour = hour + minute / 60;

  // Sinusoidal mapping: minimum at 10am, maximum at midnight
  // Shift so 10:00 = trough (0), 22:00 = peak (1)
  const radians = ((fractionalHour - 10) / 24) * 2 * Math.PI;
  const value = (1 - Math.cos(radians)) / 2;

  return {
    value,
    confidence: 1,
    meta: { hour: fractionalHour.toFixed(1) }
  };
}

export const name = 'Time of Day';
export const type = 'global';
export const category = 'reader';
