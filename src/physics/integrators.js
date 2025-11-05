/**
 * Runge-Kutta 4th Order (RK4) numerical integrator for ODEs
 *
 * RK4 is a high-accuracy method for solving initial value problems:
 *   dy/dt = f(t, y)
 *
 * The method achieves O(dt^4) local error by taking a weighted average
 * of four slope estimates at different points in the timestep.
 */

/**
 * Performs one RK4 integration step for a system of ODEs
 *
 * @param {Object} state - Current state vector {y, v, t}
 * @param {Function} derivativeFn - Function that computes derivatives
 *   Takes (state) and returns {dydt, dvdt}
 * @param {number} dt - Time step size
 * @returns {Object} New state after one RK4 step {y, v, t}
 */
export function rk4Step(state, derivativeFn, dt) {
  const { y, v, t } = state;

  // k1: slope at the beginning of interval
  const k1 = derivativeFn({ y, v, t });

  // k2: slope at the midpoint, using k1
  const k2 = derivativeFn({
    y: y + 0.5 * k1.dydt * dt,
    v: v + 0.5 * k1.dvdt * dt,
    t: t + 0.5 * dt
  });

  // k3: slope at the midpoint, using k2
  const k3 = derivativeFn({
    y: y + 0.5 * k2.dydt * dt,
    v: v + 0.5 * k2.dvdt * dt,
    t: t + 0.5 * dt
  });

  // k4: slope at the end of interval, using k3
  const k4 = derivativeFn({
    y: y + k3.dydt * dt,
    v: v + k3.dvdt * dt,
    t: t + dt
  });

  // Weighted average: (k1 + 2*k2 + 2*k3 + k4) / 6
  const dydt = (k1.dydt + 2*k2.dydt + 2*k3.dydt + k4.dydt) / 6;
  const dvdt = (k1.dvdt + 2*k2.dvdt + 2*k3.dvdt + k4.dvdt) / 6;

  return {
    y: y + dydt * dt,
    v: v + dvdt * dt,
    t: t + dt
  };
}

/**
 * Simple Euler method (for comparison/debugging, less accurate than RK4)
 *
 * @param {Object} state - Current state vector {y, v, t}
 * @param {Function} derivativeFn - Function that computes derivatives
 * @param {number} dt - Time step size
 * @returns {Object} New state after one Euler step
 */
export function eulerStep(state, derivativeFn, dt) {
  const { y, v, t } = state;
  const derivatives = derivativeFn({ y, v, t });

  return {
    y: y + derivatives.dydt * dt,
    v: v + derivatives.dvdt * dt,
    t: t + dt
  };
}
