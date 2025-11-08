/**
 * Physics Validation Tests
 *
 * These tests validate the numerical simulation against known analytical solutions
 * for various configurations of the mass-spring-damper system.
 *
 * Tolerance: < 0.1% error for well-behaved systems
 */

import { describe, it, expect } from 'vitest';
import { MassSpringSystem } from '../src/physics/MassSpringSystem.js';

describe('MassSpringSystem - Physics Validation', () => {
  describe('Simple Harmonic Motion (SHM)', () => {
    it('should match analytical solution for undamped free oscillation', () => {
      // Parameters: m=1kg, k=1N/m, b=0 (no damping)
      // Initial conditions: y0=1m, v0=0
      // Analytical solution: y(t) = cos(ω₀*t) where ω₀ = √(k/m) = 1 rad/s
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.0,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const omega0 = Math.sqrt(1.0 / 1.0); // √(k/m)
      const dt = 0.01; // 10ms timestep
      const numPeriods = 10;
      const numStepsPerPeriod = Math.ceil((2 * Math.PI / omega0) / dt);
      const numSteps = numPeriods * numStepsPerPeriod;

      let maxError = 0;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        const expected = Math.cos(omega0 * state.t);
        const error = Math.abs(state.y - expected);
        maxError = Math.max(maxError, error);

        // Check that error is small at each step
        expect(error).toBeLessThan(0.001); // 0.1% of amplitude
      }

      // Verify maximum error over entire simulation
      expect(maxError).toBeLessThan(0.001);
    });

    it('should match analytical solution with non-zero initial velocity', () => {
      // Parameters: m=1kg, k=4N/m, b=0
      // Initial conditions: y0=0.5m, v0=1m/s
      // Analytical: y(t) = A*cos(ωt + φ) where A = √(y0² + (v0/ω)²)
      const m = 1.0;
      const k = 4.0;
      const b = 0.0;
      const y0 = 0.5;
      const v0 = 1.0;

      const system = new MassSpringSystem({ m, b, k, y0, v0 });

      const omega0 = Math.sqrt(k / m); // 2 rad/s
      const A = Math.sqrt(y0 * y0 + (v0 / omega0) * (v0 / omega0));
      const phi = Math.atan2(-v0 / omega0, y0);

      const dt = 0.01;
      const numSteps = 628; // ~10 seconds

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        const expected = A * Math.cos(omega0 * state.t + phi);
        const error = Math.abs(state.y - expected);
        expect(error).toBeLessThan(0.001);
      }
    });
  });

  describe('Energy Conservation', () => {
    it('should conserve energy for undamped free oscillation', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.0, // No damping
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const initialEnergy = system.getEnergy();
      const dt = 0.01;
      const numSteps = 1000; // 10 seconds

      let maxEnergyError = 0;

      for (let i = 0; i < numSteps; i++) {
        system.step(dt);
        const currentEnergy = system.getEnergy();
        const energyError = Math.abs(currentEnergy - initialEnergy) / initialEnergy;
        maxEnergyError = Math.max(maxEnergyError, energyError);
      }

      // Energy should be conserved to within 0.01% (numerical error only)
      expect(maxEnergyError).toBeLessThan(0.0001);
    });

    it('should lose energy for damped oscillation', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.3, // Moderate damping for faster energy dissipation
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const initialEnergy = system.getEnergy();
      const dt = 0.01;
      const numSteps = 1000;

      for (let i = 0; i < numSteps; i++) {
        system.step(dt);
      }

      const finalEnergy = system.getEnergy();

      // Energy should decrease due to damping
      expect(finalEnergy).toBeLessThan(initialEnergy);
      // Final energy should be significantly reduced after 10 seconds
      expect(finalEnergy).toBeLessThan(0.25 * initialEnergy);
    });
  });

  describe('Damping Regimes', () => {
    it('should identify underdamped regime correctly', () => {
      // b² < 4mk → underdamped
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.5, // b² = 0.25 < 4mk = 4
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const props = system.getSystemProperties();
      expect(props.regime).toBe('underdamped');
      expect(props.zeta).toBeLessThan(1);
    });

    it('should identify critically damped regime correctly', () => {
      // b² = 4mk → critically damped
      const m = 1.0;
      const k = 1.0;
      const b = 2.0 * Math.sqrt(m * k); // b = 2√(mk)

      const system = new MassSpringSystem({ m, b, k, y0: 1.0, v0: 0.0 });

      const props = system.getSystemProperties();
      expect(props.regime).toBe('critical');
      expect(Math.abs(props.zeta - 1.0)).toBeLessThan(0.0001);
    });

    it('should identify overdamped regime correctly', () => {
      // b² > 4mk → overdamped
      const system = new MassSpringSystem({
        m: 1.0,
        b: 5.0, // b² = 25 > 4mk = 4
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const props = system.getSystemProperties();
      expect(props.regime).toBe('overdamped');
      expect(props.zeta).toBeGreaterThan(1);
    });

    it('underdamped: should oscillate with exponential decay', () => {
      const m = 1.0;
      const b = 0.1; // Light damping for more visible oscillations
      const k = 1.0;

      const system = new MassSpringSystem({ m, b, k, y0: 1.0, v0: 0.0 });

      const dt = 0.01;
      const numSteps = 2000; // 20 seconds

      // Track zero crossings (sign changes)
      let zeroCrossings = 0;
      let prevY = system.getState().y;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        if (prevY * state.y < 0) {
          zeroCrossings++;
        }
        prevY = state.y;
      }

      // Should have multiple oscillations (many zero crossings)
      // With light damping, expect at least 5 crossings over 20 seconds
      expect(zeroCrossings).toBeGreaterThan(5);
    });

    it('overdamped: should not oscillate', () => {
      const m = 1.0;
      const b = 5.0; // Heavy damping
      const k = 1.0;

      const system = new MassSpringSystem({ m, b, k, y0: 1.0, v0: 0.0 });

      const dt = 0.01;
      const numSteps = 1000;

      let zeroCrossings = 0;
      let prevY = system.getState().y;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        if (prevY * state.y < 0) {
          zeroCrossings++;
        }
        prevY = state.y;
      }

      // Should have at most 1 zero crossing (no oscillation)
      expect(zeroCrossings).toBeLessThanOrEqual(1);
    });

    it('critically damped: should return to equilibrium fastest without oscillation', () => {
      const m = 1.0;
      const k = 1.0;
      const y0 = 1.0;
      const v0 = 0.0;

      // Critically damped
      const bCritical = 2.0 * Math.sqrt(m * k);
      const systemCritical = new MassSpringSystem({ m, b: bCritical, k, y0, v0 });

      // Overdamped
      const bOver = bCritical * 1.5;
      const systemOver = new MassSpringSystem({ m, b: bOver, k, y0, v0 });

      const dt = 0.01;
      const numSteps = 500; // 5 seconds

      // Run both simulations
      for (let i = 0; i < numSteps; i++) {
        systemCritical.step(dt);
        systemOver.step(dt);
      }

      const yCritical = Math.abs(systemCritical.getState().y);
      const yOver = Math.abs(systemOver.getState().y);

      // Critically damped should be closer to equilibrium
      expect(yCritical).toBeLessThan(yOver);
    });
  });

  describe('Forcing Functions', () => {
    it('should apply sinusoidal forcing correctly', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.0,
        k: 1.0,
        y0: 0.0,
        v0: 0.0
      });

      system.setForcing('sine', { amplitude: 1.0, frequency: 0.5 });

      const dt = 0.01;
      const numSteps = 100;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        // System should start moving due to forcing
        if (i > 50) {
          expect(Math.abs(state.y)).toBeGreaterThan(0.01);
        }
      }
    });

    it('should apply constant forcing correctly', () => {
      // Test constant forcing (like gravity)
      // With constant force, the system should settle to a new equilibrium
      // where the spring force balances the applied force: k*y_eq = F => y_eq = F/k
      const m = 1.0;
      const b = 0.5;  // Some damping to allow settling
      const k = 2.0;
      const force = 4.0;

      const system = new MassSpringSystem({
        m, b, k,
        y0: 0.0,
        v0: 0.0
      });

      system.setForcing('constant', { force });

      const dt = 0.01;
      const numSteps = 2000; // 20 seconds to allow settling

      let finalY = 0;
      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        finalY = state.y;
      }

      // Expected equilibrium position: y_eq = F/k
      const expectedEquilibrium = force / k;

      // After sufficient time with damping, should be close to equilibrium
      expect(Math.abs(finalY - expectedEquilibrium)).toBeLessThan(0.1);

      // Also verify the system is actually displaced (not at origin)
      expect(Math.abs(finalY)).toBeGreaterThan(1.5);
    });

    it('should exhibit resonance at natural frequency', () => {
      const m = 1.0;
      const k = 1.0;
      const b = 0.01; // Minimal damping to allow amplitude growth

      const system = new MassSpringSystem({ m, b, k, y0: 0.0, v0: 0.0 });

      const omega0 = Math.sqrt(k / m);
      const f0 = omega0 / (2 * Math.PI);

      // Drive at natural frequency with sufficient amplitude
      system.setForcing('sine', { amplitude: 0.15, frequency: f0 });

      const dt = 0.01;
      const numSteps = 3000; // 30 seconds for amplitude to build up

      let maxAmplitude = 0;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        maxAmplitude = Math.max(maxAmplitude, Math.abs(state.y));
      }

      // Amplitude should grow significantly due to resonance
      // With minimal damping and resonant driving, expect amplitude > 1.0
      expect(maxAmplitude).toBeGreaterThan(1.0);
    });

    it('should apply step forcing correctly', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 0.0,
        v0: 0.0
      });

      system.setForcing('step', { amplitude: 1.0, stepTime: 0.5 });

      const dt = 0.01;

      // Before step
      for (let i = 0; i < 40; i++) {
        system.step(dt);
      }
      const yBefore = Math.abs(system.getState().y);

      // After step
      for (let i = 0; i < 100; i++) {
        system.step(dt);
      }
      const yAfter = Math.abs(system.getState().y);

      // Position should be much larger after the step
      expect(yAfter).toBeGreaterThan(yBefore + 0.1);
    });
  });

  describe('Parameter Validation', () => {
    it('should throw error for non-positive mass', () => {
      expect(() => {
        new MassSpringSystem({ m: 0, b: 0.1, k: 1.0, y0: 1.0, v0: 0.0 });
      }).toThrow('Mass must be positive');

      expect(() => {
        new MassSpringSystem({ m: -1, b: 0.1, k: 1.0, y0: 1.0, v0: 0.0 });
      }).toThrow('Mass must be positive');
    });

    it('should throw error for negative damping', () => {
      expect(() => {
        new MassSpringSystem({ m: 1.0, b: -0.1, k: 1.0, y0: 1.0, v0: 0.0 });
      }).toThrow('Damping coefficient must be non-negative');
    });

    it('should throw error for negative spring constant', () => {
      expect(() => {
        new MassSpringSystem({ m: 1.0, b: 0.1, k: -1.0, y0: 1.0, v0: 0.0 });
      }).toThrow('Spring constant must be non-negative');
    });

    it('should allow zero damping (SHM)', () => {
      expect(() => {
        new MassSpringSystem({ m: 1.0, b: 0.0, k: 1.0, y0: 1.0, v0: 0.0 });
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should reset to initial conditions', () => {
      const y0 = 1.0;
      const v0 = 0.5;

      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0,
        v0
      });

      // Run simulation
      const dt = 0.01;
      for (let i = 0; i < 100; i++) {
        system.step(dt);
      }

      // State should have changed
      const stateAfter = system.getState();
      expect(stateAfter.y).not.toBeCloseTo(y0);
      expect(stateAfter.v).not.toBeCloseTo(v0);
      expect(stateAfter.t).toBeCloseTo(1.0);

      // Reset
      system.reset();
      const stateReset = system.getState();

      expect(stateReset.y).toBe(y0);
      expect(stateReset.v).toBe(v0);
      expect(stateReset.t).toBe(0.0);
    });

    it('should update parameters mid-simulation', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const initialParams = system.getParameters();
      expect(initialParams.m).toBe(1.0);

      // Change mass
      system.setParameters({ m: 2.0 });

      const newParams = system.getParameters();
      expect(newParams.m).toBe(2.0);
      expect(newParams.b).toBe(0.1); // Other params unchanged
      expect(newParams.k).toBe(1.0);
    });

    it('should calculate system properties correctly', () => {
      const m = 1.0;
      const k = 4.0;
      const b = 0.5;

      const system = new MassSpringSystem({ m, b, k, y0: 1.0, v0: 0.0 });

      const props = system.getSystemProperties();

      // Natural frequency: ω₀ = √(k/m) = √(4/1) = 2 rad/s
      expect(props.omega0).toBeCloseTo(2.0, 5);

      // Natural frequency in Hz: f₀ = ω₀/(2π)
      expect(props.f0).toBeCloseTo(2.0 / (2 * Math.PI), 5);

      // Damping ratio: ζ = b / (2√(mk)) = 0.5 / (2√4) = 0.125
      expect(props.zeta).toBeCloseTo(0.125, 5);

      expect(props.regime).toBe('underdamped');
    });
  });

  describe('Numerical Stability', () => {
    it('should remain stable with small timesteps', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const dt = 0.001; // Very small timestep
      const numSteps = 10000; // 10 seconds

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);

        // Position should remain bounded
        expect(Math.abs(state.y)).toBeLessThan(10.0);
        expect(Math.abs(state.v)).toBeLessThan(10.0);

        // Should not produce NaN
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }
    });

    it('should remain stable with large timesteps', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.5,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const dt = 0.1; // Larger timestep
      const numSteps = 100; // 10 seconds

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);

        expect(Math.abs(state.y)).toBeLessThan(10.0);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }
    });
  });
});
