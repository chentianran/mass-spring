/**
 * Integrator Comparison Tests
 *
 * Demonstrates that RK4 is more accurate than simple Euler method
 * by comparing both against the analytical solution for SHM
 */

import { describe, it, expect } from 'vitest';
import { rk4Step, eulerStep } from '../src/physics/integrators.js';

describe('RK4 vs Euler Accuracy Comparison', () => {
  it('RK4 should be significantly more accurate than Euler for SHM', () => {
    // System parameters for SHM: m=1, k=1, b=0
    const m = 1.0;
    const k = 1.0;
    const b = 0.0;
    const omega0 = Math.sqrt(k / m);

    // Derivative function for mass-spring system
    const derivativeFn = (state) => {
      const { y, v } = state;
      return {
        dydt: v,
        dvdt: (-b * v - k * y) / m
      };
    };

    // Initial conditions
    const y0 = 1.0;
    const v0 = 0.0;

    // Run both integrators
    const dt = 0.05; // Moderate timestep to show difference
    const numSteps = 200; // 10 seconds

    let stateRK4 = { y: y0, v: v0, t: 0.0 };
    let stateEuler = { y: y0, v: v0, t: 0.0 };

    let maxErrorRK4 = 0;
    let maxErrorEuler = 0;

    for (let i = 0; i < numSteps; i++) {
      // Step both integrators
      stateRK4 = rk4Step(stateRK4, derivativeFn, dt);
      stateEuler = eulerStep(stateEuler, derivativeFn, dt);

      // Analytical solution
      const expected = Math.cos(omega0 * stateRK4.t);

      // Calculate errors
      const errorRK4 = Math.abs(stateRK4.y - expected);
      const errorEuler = Math.abs(stateEuler.y - expected);

      maxErrorRK4 = Math.max(maxErrorRK4, errorRK4);
      maxErrorEuler = Math.max(maxErrorEuler, errorEuler);
    }

    // RK4 should be much more accurate than Euler
    expect(maxErrorRK4).toBeLessThan(maxErrorEuler);

    // RK4 should have very small error
    expect(maxErrorRK4).toBeLessThan(0.01);

    // Euler should have accumulated significant error
    expect(maxErrorEuler).toBeGreaterThan(0.1);

    // Report the improvement factor
    const improvementFactor = maxErrorEuler / maxErrorRK4;
    expect(improvementFactor).toBeGreaterThan(10);
  });

  it('RK4 maintains accuracy over long simulations', () => {
    // Test that RK4 remains accurate over many periods
    const m = 1.0;
    const k = 1.0;
    const omega0 = Math.sqrt(k / m);

    const derivativeFn = (state) => {
      const { y, v } = state;
      return {
        dydt: v,
        dvdt: -k * y / m
      };
    };

    let state = { y: 1.0, v: 0.0, t: 0.0 };
    const dt = 0.01;
    const numPeriods = 100;
    const stepsPerPeriod = Math.ceil((2 * Math.PI / omega0) / dt);
    const numSteps = numPeriods * stepsPerPeriod;

    for (let i = 0; i < numSteps; i++) {
      state = rk4Step(state, derivativeFn, dt);
    }

    // After 100 periods, should still be close to analytical solution
    const expected = Math.cos(omega0 * state.t);
    const error = Math.abs(state.y - expected);

    // Error should still be very small even after 100 periods
    expect(error).toBeLessThan(0.01);
  });

  it('RK4 energy conservation is better than Euler', () => {
    // Compare energy conservation between RK4 and Euler
    const m = 1.0;
    const k = 1.0;

    const derivativeFn = (state) => {
      const { y, v } = state;
      return {
        dydt: v,
        dvdt: -k * y / m
      };
    };

    const initialState = { y: 1.0, v: 0.0, t: 0.0 };
    const initialEnergy = 0.5 * k * 1.0 * 1.0; // PE only

    let stateRK4 = { ...initialState };
    let stateEuler = { ...initialState };

    const dt = 0.02;
    const numSteps = 500; // 10 seconds

    // Run simulations
    for (let i = 0; i < numSteps; i++) {
      stateRK4 = rk4Step(stateRK4, derivativeFn, dt);
      stateEuler = eulerStep(stateEuler, derivativeFn, dt);
    }

    // Calculate final energies
    const energyRK4 = 0.5 * k * stateRK4.y * stateRK4.y + 0.5 * m * stateRK4.v * stateRK4.v;
    const energyEuler = 0.5 * k * stateEuler.y * stateEuler.y + 0.5 * m * stateEuler.v * stateEuler.v;

    const energyErrorRK4 = Math.abs(energyRK4 - initialEnergy) / initialEnergy;
    const energyErrorEuler = Math.abs(energyEuler - initialEnergy) / initialEnergy;

    // RK4 should conserve energy much better than Euler
    expect(energyErrorRK4).toBeLessThan(energyErrorEuler);
    expect(energyErrorRK4).toBeLessThan(0.001); // < 0.1% error
  });
});
