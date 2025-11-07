/**
 * Forcing Function Presets for Mass-Spring System
 *
 * External forces that can be applied to the system: f(t)
 * These modify the ODE: m*y'' = -b*y' - k*y + f(t)
 */

/**
 * No external force
 * @param {number} t - Current time (seconds)
 * @returns {number} Force value (Newtons)
 */
function none(t) {
  return 0;
}

/**
 * Constant forcing function
 * @param {number} t - Current time (seconds)
 * @param {Object} params - Parameters {force}
 * @param {number} params.force - Constant force value (N)
 * @returns {number} Force value (Newtons)
 */
function constant(t, { force = 1.0 }) {
  return force;
}

/**
 * Sinusoidal forcing function
 * @param {number} t - Current time (seconds)
 * @param {Object} params - Parameters {amplitude, frequency}
 * @param {number} params.amplitude - Force amplitude (N)
 * @param {number} params.frequency - Frequency (Hz)
 * @returns {number} Force value (Newtons)
 */
function sine(t, { amplitude = 1.0, frequency = 1.0 }) {
  const omega = 2 * Math.PI * frequency;
  return amplitude * Math.sin(omega * t);
}

/**
 * Cosinusoidal forcing function
 * @param {number} t - Current time (seconds)
 * @param {Object} params - Parameters {amplitude, frequency}
 * @param {number} params.amplitude - Force amplitude (N)
 * @param {number} params.frequency - Frequency (Hz)
 * @returns {number} Force value (Newtons)
 */
function cosine(t, { amplitude = 1.0, frequency = 1.0 }) {
  const omega = 2 * Math.PI * frequency;
  return amplitude * Math.cos(omega * t);
}

/**
 * Heaviside step function
 * @param {number} t - Current time (seconds)
 * @param {Object} params - Parameters {amplitude, stepTime}
 * @param {number} params.amplitude - Force amplitude (N)
 * @param {number} params.stepTime - Time at which step occurs (s)
 * @returns {number} Force value (Newtons)
 */
function step(t, { amplitude = 1.0, stepTime = 0.0 }) {
  return t >= stepTime ? amplitude : 0;
}

/**
 * Square wave forcing function
 * @param {number} t - Current time (seconds)
 * @param {Object} params - Parameters {amplitude, frequency}
 * @param {number} params.amplitude - Force amplitude (N)
 * @param {number} params.frequency - Frequency (Hz)
 * @returns {number} Force value (Newtons)
 */
function square(t, { amplitude = 1.0, frequency = 1.0 }) {
  const period = 1 / frequency;
  const phase = (t % period) / period;
  return amplitude * (phase < 0.5 ? 1 : -1);
}

/**
 * Impulse (Dirac delta approximation)
 * @param {number} t - Current time (seconds)
 * @param {Object} params - Parameters {amplitude, impulseTime, width}
 * @param {number} params.amplitude - Impulse strength (N·s)
 * @param {number} params.impulseTime - Time at which impulse occurs (s)
 * @param {number} params.width - Duration of impulse (s)
 * @returns {number} Force value (Newtons)
 */
function impulse(t, { amplitude = 1.0, impulseTime = 0.0, width = 0.01 }) {
  const inImpulse = t >= impulseTime && t < impulseTime + width;
  return inImpulse ? amplitude / width : 0;
}

/**
 * Preset forcing functions
 * Maps function names to implementations
 */
export const presets = {
  none,
  constant,
  sine,
  cosine,
  step,
  square,
  impulse
};

/**
 * Default parameters for each forcing function
 */
export const defaultParams = {
  none: {},
  constant: { force: 1.0 },
  sine: { amplitude: 1.0, frequency: 1.0 },
  cosine: { amplitude: 1.0, frequency: 1.0 },
  step: { amplitude: 1.0, stepTime: 1.0 },
  square: { amplitude: 1.0, frequency: 1.0 },
  impulse: { amplitude: 1.0, impulseTime: 1.0, width: 0.01 }
};

/**
 * Get a forcing function by name
 * @param {string} name - Name of the forcing function
 * @returns {Function} The forcing function
 */
export function getForcingFunction(name) {
  if (!presets[name]) {
    throw new Error(`Unknown forcing function: ${name}`);
  }
  return presets[name];
}
