/**
 * Edge Cases and Special Scenarios Tests
 *
 * Tests for boundary conditions, extreme parameters, and special cases
 */

import { describe, it, expect } from 'vitest';
import { MassSpringSystem } from '../src/physics/MassSpringSystem.js';

describe('Edge Cases and Special Scenarios', () => {
  describe('Extreme Parameters', () => {
    it('should handle very large mass', () => {
      const system = new MassSpringSystem({
        m: 1000.0, // Very heavy
        b: 1.0,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const dt = 0.01;
      for (let i = 0; i < 100; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }

      // Very heavy mass should oscillate very slowly
      const props = system.getSystemProperties();
      expect(props.omega0).toBeLessThan(0.1);
    });

    it('should handle very stiff spring', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1000.0, // Very stiff
        y0: 1.0,
        v0: 0.0
      });

      const dt = 0.001; // Need smaller timestep for stiff system
      for (let i = 0; i < 100; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }

      // Very stiff spring should oscillate very fast
      const props = system.getSystemProperties();
      expect(props.omega0).toBeGreaterThan(30);
    });

    it('should handle zero spring constant (free particle)', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.0,
        k: 0.0, // No spring force
        y0: 0.0,
        v0: 1.0 // Initial velocity
      });

      const dt = 0.01;
      const numSteps = 100;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);

        // Position should increase linearly: y = v0 * t
        const expectedY = 1.0 * state.t;
        expect(Math.abs(state.y - expectedY)).toBeLessThan(0.001);

        // Velocity should remain constant
        expect(Math.abs(state.v - 1.0)).toBeLessThan(0.001);
      }
    });

    it('should handle very light damping (nearly SHM)', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.001, // Extremely light damping
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const initialEnergy = system.getEnergy();

      const dt = 0.01;
      const numSteps = 1000; // 10 seconds

      for (let i = 0; i < numSteps; i++) {
        system.step(dt);
      }

      const finalEnergy = system.getEnergy();
      const energyLoss = (initialEnergy - finalEnergy) / initialEnergy;

      // Energy loss should be very small with minimal damping
      expect(energyLoss).toBeLessThan(0.05); // < 5% loss
      expect(finalEnergy).toBeLessThan(initialEnergy); // But should still lose some energy
    });

    it('should handle very heavy damping (slow decay)', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 20.0, // Very heavy damping
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const dt = 0.01;
      const numSteps = 100;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);

        // Should remain on same side of equilibrium (overdamped)
        expect(state.y).toBeGreaterThan(0);

        // Should be stable
        expect(isFinite(state.y)).toBe(true);
      }

      // Should still be far from equilibrium after 1 second
      const finalState = system.getState();
      expect(Math.abs(finalState.y)).toBeGreaterThan(0.5);
    });
  });

  describe('Initial Conditions', () => {
    it('should handle zero initial conditions', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 0.0,
        v0: 0.0
      });

      const dt = 0.01;
      for (let i = 0; i < 100; i++) {
        const state = system.step(dt);

        // With no forcing and zero initial conditions, should stay at equilibrium
        expect(Math.abs(state.y)).toBeLessThan(0.0001);
        expect(Math.abs(state.v)).toBeLessThan(0.0001);
      }
    });

    it('should handle large initial displacement', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 100.0, // Very large displacement
        v0: 0.0
      });

      const dt = 0.01;
      for (let i = 0; i < 100; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }

      // Should start returning toward equilibrium
      const finalState = system.getState();
      expect(Math.abs(finalState.y)).toBeLessThan(100.0);
    });

    it('should handle large initial velocity', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 0.0,
        v0: 50.0 // Very large velocity
      });

      const dt = 0.01;
      for (let i = 0; i < 100; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }

      // Position should have changed significantly
      const finalState = system.getState();
      expect(Math.abs(finalState.y)).toBeGreaterThan(1.0);
    });

    it('should handle negative initial conditions', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: -2.0,
        v0: -1.0
      });

      const dt = 0.01;
      for (let i = 0; i < 100; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }
    });
  });

  describe('Forcing Function Edge Cases', () => {
    it('should handle zero amplitude forcing', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      system.setForcing('sine', { amplitude: 0.0, frequency: 1.0 });

      const dt = 0.01;
      const numSteps = 100;

      for (let i = 0; i < numSteps; i++) {
        system.step(dt);
      }

      // Should behave like unforced system (decay)
      const finalState = system.getState();
      expect(Math.abs(finalState.y)).toBeLessThan(1.0);
    });

    it('should handle very high frequency forcing', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 0.0,
        v0: 0.0
      });

      system.setForcing('sine', { amplitude: 1.0, frequency: 100.0 });

      const dt = 0.001; // Need small timestep for high frequency
      const numSteps = 1000;

      for (let i = 0; i < numSteps; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
        expect(isFinite(state.v)).toBe(true);
      }
    });

    it('should handle switching forcing functions mid-simulation', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 0.0,
        v0: 0.0
      });

      // Start with sine forcing
      system.setForcing('sine', { amplitude: 1.0, frequency: 1.0 });

      const dt = 0.01;

      // Run for 5 seconds
      for (let i = 0; i < 500; i++) {
        system.step(dt);
      }

      const yMid = system.getState().y;

      // Switch to step forcing
      system.setForcing('step', { amplitude: 2.0, stepTime: 0.0 });

      // Run for another 5 seconds
      for (let i = 0; i < 500; i++) {
        const state = system.step(dt);
        expect(isFinite(state.y)).toBe(true);
      }

      const yFinal = system.getState().y;

      // Both should be non-zero (forcing had effect)
      expect(Math.abs(yMid)).toBeGreaterThan(0.01);
      expect(Math.abs(yFinal)).toBeGreaterThan(0.01);
    });

    it('should handle impulse forcing correctly', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.0, // No damping for clarity
        k: 1.0,
        y0: 0.0,
        v0: 0.0
      });

      const initialEnergy = system.getEnergy();
      expect(initialEnergy).toBe(0);

      // Apply impulse at t=1s
      system.setForcing('impulse', {
        amplitude: 10.0,
        impulseTime: 1.0,
        width: 0.01
      });

      const dt = 0.001;

      // Run to just before impulse
      for (let i = 0; i < 999; i++) {
        system.step(dt);
      }

      const energyBefore = system.getEnergy();

      // Run through impulse
      for (let i = 0; i < 20; i++) {
        system.step(dt);
      }

      const energyAfter = system.getEnergy();

      // Energy should increase due to impulse
      expect(energyAfter).toBeGreaterThan(energyBefore);
      expect(energyAfter).toBeGreaterThan(0.1);
    });
  });

  describe('System Properties Edge Cases', () => {
    it('should calculate properties for zero damping correctly', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.0,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const props = system.getSystemProperties();

      expect(props.zeta).toBe(0);
      expect(props.regime).toBe('underdamped');
      expect(props.Q).toBe(Infinity);
    });

    it('should handle parameter updates during simulation', () => {
      const system = new MassSpringSystem({
        m: 1.0,
        b: 0.1,
        k: 1.0,
        y0: 1.0,
        v0: 0.0
      });

      const dt = 0.01;

      // Run for 5 seconds
      for (let i = 0; i < 500; i++) {
        system.step(dt);
      }

      const t1 = system.getState().t;
      const y1 = system.getState().y;

      // Double the mass (should slow oscillation)
      system.setParameters({ m: 2.0 });

      // Run for another 5 seconds
      for (let i = 0; i < 500; i++) {
        system.step(dt);
      }

      const t2 = system.getState().t;
      const y2 = system.getState().y;

      // Time should continue from where it left off
      expect(t2).toBeCloseTo(t1 + 5.0, 1);

      // System should still be stable
      expect(isFinite(y2)).toBe(true);
    });
  });
});
