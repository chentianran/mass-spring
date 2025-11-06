/**
 * Mass-Spring-Damper System Physics Engine
 *
 * Solves the second-order ODE:
 *   m*y'' = -b*y' - k*y + f(t)
 *
 * Where:
 *   m = mass (kg)
 *   b = damping coefficient (N·s/m)
 *   k = spring constant (N/m)
 *   y = displacement from equilibrium (m)
 *   f(t) = external forcing function (N)
 *
 * This is converted to a system of first-order ODEs:
 *   dy/dt = v
 *   dv/dt = (-b*v - k*y + f(t)) / m
 */

import { rk4Step } from './integrators.js';
import { presets, defaultParams } from './forcingFunctions.js';

export class MassSpringSystem {
  /**
   * Create a new mass-spring system
   * @param {Object} config - System configuration
   * @param {number} config.m - Mass (kg, must be > 0)
   * @param {number} config.b - Damping coefficient (N·s/m, must be >= 0)
   * @param {number} config.k - Spring constant (N/m, must be >= 0)
   * @param {number} config.y0 - Initial position (m)
   * @param {number} config.v0 - Initial velocity (m/s)
   */
  constructor({ m = 1.0, b = 0.1, k = 1.0, y0 = 1.0, v0 = 0.0 }) {
    // Validate parameters
    if (m <= 0) throw new Error('Mass must be positive');
    if (b < 0) throw new Error('Damping coefficient must be non-negative');
    if (k < 0) throw new Error('Spring constant must be non-negative');

    // System parameters
    this.m = m;
    this.b = b;
    this.k = k;

    // Initial conditions (for reset)
    this.y0 = y0;
    this.v0 = v0;

    // Current state
    this.state = {
      y: y0,  // position (m)
      v: v0,  // velocity (m/s)
      t: 0.0  // time (s)
    };

    // Forcing function
    this.forcingName = 'none';
    this.forcingFn = presets.none;
    this.forcingParams = {};
  }

  /**
   * Compute derivatives for the mass-spring system
   * This defines the system of ODEs to be integrated
   *
   * @param {Object} state - Current state {y, v, t}
   * @returns {Object} Derivatives {dydt, dvdt}
   */
  computeDerivatives(state) {
    const { y, v, t } = state;
    const { m, b, k } = this;

    // External forcing
    const force = this.forcingFn(t, this.forcingParams);

    // dy/dt = v
    const dydt = v;

    // dv/dt = (-b*v - k*y + f(t)) / m
    const dvdt = (-b * v - k * y + force) / m;

    return { dydt, dvdt };
  }

  /**
   * Step the simulation forward by one timestep
   * Uses RK4 integration for high accuracy
   *
   * @param {number} dt - Time step size (seconds)
   * @returns {Object} New state {y, v, t}
   */
  step(dt) {
    // Use RK4 to integrate the ODEs
    this.state = rk4Step(
      this.state,
      (state) => this.computeDerivatives(state),
      dt
    );

    return { ...this.state };
  }

  /**
   * Update system parameters
   * @param {Object} params - New parameters {m, b, k}
   */
  setParameters({ m, b, k }) {
    if (m !== undefined) {
      if (m <= 0) throw new Error('Mass must be positive');
      this.m = m;
    }
    if (b !== undefined) {
      if (b < 0) throw new Error('Damping coefficient must be non-negative');
      this.b = b;
    }
    if (k !== undefined) {
      if (k < 0) throw new Error('Spring constant must be non-negative');
      this.k = k;
    }
  }

  /**
   * Set the external forcing function
   * @param {string} name - Name of forcing function preset
   * @param {Object} params - Parameters for the forcing function
   */
  setForcing(name, params = {}) {
    if (!presets[name]) {
      throw new Error(`Unknown forcing function: ${name}`);
    }

    this.forcingName = name;
    this.forcingFn = presets[name];
    this.forcingParams = { ...defaultParams[name], ...params };
  }

  /**
   * Get current state
   * @returns {Object} Current state {y, v, t}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get current parameters
   * @returns {Object} Current parameters {m, b, k}
   */
  getParameters() {
    return { m: this.m, b: this.b, k: this.k };
  }

  /**
   * Get forcing function info
   * @returns {Object} Forcing function {name, params}
   */
  getForcing() {
    return {
      name: this.forcingName,
      params: { ...this.forcingParams }
    };
  }

  /**
   * Reset to initial conditions
   */
  reset() {
    this.state = {
      y: this.y0,
      v: this.v0,
      t: 0.0
    };
  }

  /**
   * Calculate system properties
   * @returns {Object} System properties
   */
  getSystemProperties() {
    const { m, b, k } = this;

    // Natural frequency: ω₀ = √(k/m)
    const omega0 = Math.sqrt(k / m);
    const f0 = omega0 / (2 * Math.PI);
    const T0 = 1 / f0;

    // Damping ratio: ζ = b / (2√(mk))
    const zeta = b / (2 * Math.sqrt(m * k));

    // Damping regime
    let regime;
    const discriminant = b * b - 4 * m * k;
    if (Math.abs(discriminant) < 1e-10) {
      regime = 'critical';
    } else if (discriminant > 0) {
      regime = 'overdamped';
    } else {
      regime = 'underdamped';
    }

    // Damped natural frequency (for underdamped case)
    const omegaD = regime === 'underdamped' ? omega0 * Math.sqrt(1 - zeta * zeta) : 0;
    const fD = omegaD / (2 * Math.PI);

    // Quality factor
    const Q = Math.sqrt(m * k) / b;

    return {
      omega0,          // Natural frequency (rad/s)
      f0,              // Natural frequency (Hz)
      T0,              // Natural period (s)
      zeta,            // Damping ratio
      regime,          // 'underdamped', 'critical', or 'overdamped'
      omegaD,          // Damped natural frequency (rad/s)
      fD,              // Damped natural frequency (Hz)
      Q                // Quality factor
    };
  }

  /**
   * Calculate total mechanical energy (for analysis)
   * E = (1/2)*k*y² + (1/2)*m*v²
   * Note: This is conserved only when b=0 and f(t)=0
   *
   * @returns {number} Total energy (Joules)
   */
  getEnergy() {
    const { y, v } = this.state;
    const kineticEnergy = 0.5 * this.m * v * v;
    const potentialEnergy = 0.5 * this.k * y * y;
    return kineticEnergy + potentialEnergy;
  }
}
